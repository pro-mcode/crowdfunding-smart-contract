import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createContribution,
  listContributions,
  listContributionsByAddressAndStatus,
  listContributionsByStatus,
  updateContributionStatus,
} from "@/lib/governanceDb";
import {
  CONTRIBUTION_RUBRIC,
  computeContributionPoints,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") ?? "").trim();
  const address = String(url.searchParams.get("address") ?? "").trim();
  let data;
  if (address && status) {
    data = listContributionsByAddressAndStatus(address, status);
  } else if (status) {
    data = listContributionsByStatus(status);
  } else {
    data = listContributions();
  }
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const walletAddress = String(payload.walletAddress ?? "").trim().toLowerCase();
  const type = String(payload.type ?? "").trim();
  const quantity =
    payload.quantity === null || payload.quantity === undefined
      ? null
      : Number(payload.quantity);
  const pointsOverride =
    payload.points === null || payload.points === undefined
      ? null
      : Number(payload.points);
  const evidence = String(payload.evidence ?? "").trim();
  const occurredAtRaw = String(payload.occurredAt ?? "").trim();

  if (!walletAddress || !type) {
    return NextResponse.json(
      { ok: false, error: "Wallet and contribution type are required." },
      { status: 400 }
    );
  }
  if (!CONTRIBUTION_RUBRIC[type]) {
    return NextResponse.json(
      { ok: false, error: "Unsupported contribution type." },
      { status: 400 }
    );
  }
  const occurredAt = occurredAtRaw
    ? new Date(occurredAtRaw).toISOString()
    : new Date().toISOString();
  if (Number.isNaN(new Date(occurredAt).getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid occurred date." },
      { status: 400 }
    );
  }
  const points = Number.isFinite(pointsOverride)
    ? Number(pointsOverride)
    : computeContributionPoints(type, quantity ?? undefined);
  const source = type.split(".")[0] ?? "unknown";
  const category = getContributionCategory(type);
  const metadata = JSON.stringify({
    category,
    rubricType: type,
  });
  createContribution({
    id: crypto.randomUUID(),
    walletAddress,
    source,
    type,
    quantity: Number.isFinite(quantity) ? Number(quantity) : null,
    points,
    evidence: evidence || null,
    occurredAt,
    createdAt: new Date().toISOString(),
    metadata,
    status: "verified",
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const id = String(body?.id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  const points =
    body?.points === null || body?.points === undefined
      ? undefined
      : Number(body.points);
  if (!id || !status) {
    return NextResponse.json(
      { ok: false, error: "Missing id or status." },
      { status: 400 }
    );
  }
  updateContributionStatus(id, status, points);
  return NextResponse.json({ ok: true });
}
