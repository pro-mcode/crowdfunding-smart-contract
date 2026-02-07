import { NextResponse } from "next/server";
import {
  listContributionsByPeriod,
  listContributionsByAddress,
} from "@/lib/governanceDb";
import {
  DEFAULT_ROLE_THRESHOLDS,
  getContributionCategory,
} from "@/lib/contributionRubric";

export const runtime = "nodejs";

const PERIODS = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

const buildPeriodTotals = (
  startIso: string,
  endIso: string
) => {
  const contributions = listContributionsByPeriod(startIso, endIso);
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
  return { totals, ranked, contributionsCount: contributions.length };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get("address") ?? "").toLowerCase();
  if (!address) {
    return NextResponse.json(
      { ok: false, error: "Address is required." },
      { status: 400 }
    );
  }
  const now = new Date();
  const periods: Record<string, unknown> = {};

  Object.entries(PERIODS).forEach(([label, days]) => {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    const { totals, ranked } = buildPeriodTotals(
      start.toISOString(),
      end.toISOString()
    );
    const target =
      totals.get(address) ?? {
        total: 0,
        supporter: 0,
        developer: 0,
        researcher: 0,
      };
    const rankIndex = ranked.findIndex(
      ([wallet]) => wallet.toLowerCase() === address
    );
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const eligible = {
      supporter: target.supporter >= DEFAULT_ROLE_THRESHOLDS.supporter,
      developer: target.developer >= DEFAULT_ROLE_THRESHOLDS.developer,
      researcher: target.researcher >= DEFAULT_ROLE_THRESHOLDS.researcher,
      topContributor: rank !== null && rank <= 3 && target.total > 0,
    };
    const previewBadges = [
      ...(eligible.topContributor ? ["Top Contributor"] : []),
      ...(eligible.researcher ? ["Researcher"] : []),
      ...(eligible.developer ? ["Developer"] : []),
      ...(eligible.supporter ? ["Supporter"] : []),
    ];
    periods[label] = {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      totalPoints: target.total,
      categoryPoints: {
        supporter: target.supporter,
        developer: target.developer,
        researcher: target.researcher,
      },
      rank,
      totalContributors: totals.size,
      eligible,
      previewBadges,
      thresholds: DEFAULT_ROLE_THRESHOLDS,
    };
  });

  const recentContributions = listContributionsByAddress(address, 10).map(
    (entry) => ({
      id: entry.id,
      type: entry.type,
      points: entry.points,
      evidence: entry.evidence,
      occurredAt: entry.occurredAt,
    })
  );

  return NextResponse.json({
    ok: true,
    data: {
      address,
      periods,
      recentContributions,
    },
  });
}
