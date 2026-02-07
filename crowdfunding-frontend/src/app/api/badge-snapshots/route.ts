import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import { createHash } from "crypto";
import {
  createBadge,
  createBadgeAwards,
  createBadgeRegistry,
  createBadgeSnapshot,
  findActiveBadge,
  getNextBadgeTokenId,
  listBadgeRegistry,
  listBadgeSnapshots,
  listContributionsByPeriod,
} from "@/lib/governanceDb";
import {
  DEFAULT_ROLE_THRESHOLDS,
  RUBRIC_VERSION,
  getContributionCategory,
} from "@/lib/contributionRubric";

export const runtime = "nodejs";

const requireAdmin = async (request: Request) => {
  const adminAddress =
    process.env.GOVERNANCE_ADMIN ?? process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN;
  if (!adminAddress) {
    return { ok: false, error: "Admin address not configured." };
  }
  const body = await request.json().catch(() => ({}));
  const address = String(body?.address || "").toLowerCase();
  const signature = String(body?.signature || "");
  const timestamp = Number(body?.timestamp);
  if (!address || !signature || !Number.isFinite(timestamp)) {
    return { ok: false, error: "Missing admin signature payload." };
  }
  const now = Date.now();
  if (Math.abs(now - timestamp) > 10 * 60 * 1000) {
    return { ok: false, error: "Signature expired." };
  }
  const message = `PherconsVault Admin Access ${timestamp}`;
  try {
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== address || recovered !== adminAddress.toLowerCase()) {
      return { ok: false, error: "Unauthorized admin signature." };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, error: "Invalid admin signature." };
  }
};

const PERIOD_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

const BADGE_DEFINITIONS = {
  "Top Contributor": { code: "TOP", weight: 5 },
  Researcher: { code: "RSR", weight: 3 },
  Developer: { code: "DEV", weight: 3 },
  Supporter: { code: "SUP", weight: 2 },
};

export async function GET() {
  const data = listBadgeSnapshots();
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const period = String(payload.period ?? "").toLowerCase();
  const days = PERIOD_DAYS[period];
  if (!days) {
    return NextResponse.json(
      { ok: false, error: "Invalid snapshot period." },
      { status: 400 }
    );
  }
  const asOf = payload.asOf ? new Date(String(payload.asOf)) : new Date();
  if (Number.isNaN(asOf.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid snapshot date." },
      { status: 400 }
    );
  }
  const periodEnd = new Date(asOf);
  const periodStart = new Date(asOf);
  periodStart.setDate(periodStart.getDate() - days);

  const thresholds = {
    supporter: Number(payload?.thresholds?.supporter ?? DEFAULT_ROLE_THRESHOLDS.supporter),
    developer: Number(payload?.thresholds?.developer ?? DEFAULT_ROLE_THRESHOLDS.developer),
    researcher: Number(payload?.thresholds?.researcher ?? DEFAULT_ROLE_THRESHOLDS.researcher),
  };

  const contributions = listContributionsByPeriod(
    periodStart.toISOString(),
    periodEnd.toISOString()
  );

  if (contributions.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No contributions found for the selected period." },
      { status: 400 }
    );
  }

  const totals = new Map<
    string,
    { total: number; supporter: number; developer: number; researcher: number }
  >();

  contributions.forEach((entry) => {
    const wallet = entry.walletAddress.toLowerCase();
    const current =
      totals.get(wallet) ?? {
        total: 0,
        supporter: 0,
        developer: 0,
        researcher: 0,
      };
    const points = Number(entry.points) || 0;
    current.total += points;
    const category = getContributionCategory(entry.type);
    if (category === "supporter") current.supporter += points;
    if (category === "developer") current.developer += points;
    if (category === "researcher") current.researcher += points;
    totals.set(wallet, current);
  });

  const ranked = Array.from(totals.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );
  const topN = Math.max(1, Number(payload.topN ?? 3));
  const topWinners = ranked.slice(0, topN);

  const awards: { wallet: string; badgeTitle: string; points: number }[] = [];
  topWinners.forEach(([wallet, data]) => {
    awards.push({ wallet, badgeTitle: "Top Contributor", points: data.total });
  });

  ranked.forEach(([wallet, data]) => {
    if (data.researcher >= thresholds.researcher) {
      awards.push({ wallet, badgeTitle: "Researcher", points: data.researcher });
    }
    if (data.developer >= thresholds.developer) {
      awards.push({ wallet, badgeTitle: "Developer", points: data.developer });
    }
    if (data.supporter >= thresholds.supporter) {
      awards.push({ wallet, badgeTitle: "Supporter", points: data.supporter });
    }
  });

  const snapshotPayload = {
    period,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    topN,
    thresholds,
    awards,
  };
  const snapshotHash = createHash("sha256")
    .update(JSON.stringify(snapshotPayload))
    .digest("hex");

  const snapshotId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  createBadgeSnapshot({
    id: snapshotId,
    period,
    periodStart: snapshotPayload.periodStart,
    periodEnd: snapshotPayload.periodEnd,
    rubricVersion: RUBRIC_VERSION,
    thresholds: JSON.stringify(thresholds),
    generatedAt,
    snapshotHash,
    totalContributors: totals.size,
  });

  const registry = listBadgeRegistry();
  const ensureRegistry = (title: string) => {
    const existing = registry.find(
      (entry) => entry.title.toLowerCase() === title.toLowerCase()
    );
    if (existing) return existing;
    const def = BADGE_DEFINITIONS[title as keyof typeof BADGE_DEFINITIONS];
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      title,
      code: def?.code ?? title.replace(/[^A-Z]/gi, "").slice(0, 4).toUpperCase(),
      weight: def?.weight ?? 1,
      renewDays: null,
      createdAt: now,
    };
    createBadgeRegistry(entry);
    registry.unshift(entry);
    return entry;
  };

  let issuedCount = 0;
  const awardRows = awards.map((award) => {
    const registryEntry = ensureRegistry(award.badgeTitle);
    const existing = findActiveBadge(award.wallet, award.badgeTitle);
    if (!existing) {
      const tokenId = getNextBadgeTokenId(
        award.badgeTitle,
        registryEntry.code
      );
      const expires = new Date(asOf);
      expires.setDate(expires.getDate() + days);
      const badgeId = crypto.randomUUID();
      createBadge({
        id: badgeId,
        recipient: award.wallet,
        badge: award.badgeTitle,
        tokenId,
        issuedAt: generatedAt,
        expiresAt: expires.toISOString(),
        meta: JSON.stringify({
          snapshotId,
          snapshotHash,
          period,
          periodStart: snapshotPayload.periodStart,
          periodEnd: snapshotPayload.periodEnd,
        }),
      });
      issuedCount += 1;
      return {
        id: crypto.randomUUID(),
        snapshotId,
        walletAddress: award.wallet,
        badgeTitle: award.badgeTitle,
        points: award.points,
        issued: 1,
        issuedAt: generatedAt,
        badgeId,
      };
    }
    return {
      id: crypto.randomUUID(),
      snapshotId,
      walletAddress: award.wallet,
      badgeTitle: award.badgeTitle,
      points: award.points,
      issued: 0,
      issuedAt: null,
      badgeId: null,
    };
  });

  createBadgeAwards(awardRows);

  return NextResponse.json({
    ok: true,
    snapshotId,
    snapshotHash,
    awards: awards.length,
    issued: issuedCount,
    skipped: awards.length - issuedCount,
  });
}
