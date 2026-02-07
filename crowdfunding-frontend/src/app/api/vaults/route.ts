import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createVaultRegistry,
  deleteVaultRegistry,
  getVaultRegistryById,
  listVaultRegistry,
  updateVaultRegistry,
} from "@/lib/governanceDb";

export const runtime = "nodejs";

const requireAdmin = async (request: Request) => {
  const adminAddress = process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN;
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

const parseJsonArray = (value: string | null | undefined) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapVault = (row: ReturnType<typeof getVaultRegistryById>) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    focus: row.focus,
    tvl: row.tvl,
    activeProposals: row.activeProposals,
    riskRating: row.riskRating,
    participation: row.participation,
    horizon: row.horizon,
    overview: row.overview,
    thesis: row.thesis,
    expectedOutcomes: parseJsonArray(row.expectedOutcomes),
    fundingStructure: parseJsonArray(row.fundingStructure),
    withdrawalConditions: parseJsonArray(row.withdrawalConditions),
    governanceModel: parseJsonArray(row.governanceModel),
    deliverables: parseJsonArray(row.deliverables),
    reports: parseJsonArray(row.reports),
    datasets: parseJsonArray(row.datasets),
    ipRights: row.ipRights,
    activity: parseJsonArray(row.activity),
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const item = getVaultRegistryById(id);
    return NextResponse.json({ ok: true, data: mapVault(item) });
  }
  const data = listVaultRegistry().map((row) => mapVault(row));
  return NextResponse.json({ ok: true, data });
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const now = new Date().toISOString();
  const name = String(payload.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Missing vault name." },
      { status: 400 }
    );
  }
  const id = String(payload.id ?? "").trim() || slugify(name);
  const entry = {
    id,
    name,
    focus: String(payload.focus ?? "").trim(),
    tvl: String(payload.tvl ?? "").trim(),
    activeProposals: Number(payload.activeProposals ?? 0),
    riskRating: String(payload.riskRating ?? "Moderate").trim(),
    participation: String(payload.participation ?? "").trim(),
    horizon: String(payload.horizon ?? "").trim(),
    overview: String(payload.overview ?? "").trim(),
    thesis: String(payload.thesis ?? "").trim(),
    expectedOutcomes: JSON.stringify(payload.expectedOutcomes ?? []),
    fundingStructure: JSON.stringify(payload.fundingStructure ?? []),
    withdrawalConditions: JSON.stringify(payload.withdrawalConditions ?? []),
    governanceModel: JSON.stringify(payload.governanceModel ?? []),
    deliverables: JSON.stringify(payload.deliverables ?? []),
    reports: JSON.stringify(payload.reports ?? []),
    datasets: JSON.stringify(payload.datasets ?? []),
    ipRights: String(payload.ipRights ?? "").trim(),
    activity: JSON.stringify(payload.activity ?? []),
    createdAt: now,
    updatedAt: now,
  };
  createVaultRegistry(entry);
  return NextResponse.json({ ok: true, id: entry.id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "Missing vault id." },
      { status: 400 }
    );
  }
  const payload = body?.payload ?? {};
  updateVaultRegistry(body.id, {
    name: payload.name,
    focus: payload.focus,
    tvl: payload.tvl,
    activeProposals:
      payload.activeProposals !== undefined
        ? Number(payload.activeProposals)
        : undefined,
    riskRating: payload.riskRating,
    participation: payload.participation,
    horizon: payload.horizon,
    overview: payload.overview,
    thesis: payload.thesis,
    expectedOutcomes: payload.expectedOutcomes
      ? JSON.stringify(payload.expectedOutcomes)
      : undefined,
    fundingStructure: payload.fundingStructure
      ? JSON.stringify(payload.fundingStructure)
      : undefined,
    withdrawalConditions: payload.withdrawalConditions
      ? JSON.stringify(payload.withdrawalConditions)
      : undefined,
    governanceModel: payload.governanceModel
      ? JSON.stringify(payload.governanceModel)
      : undefined,
    deliverables: payload.deliverables
      ? JSON.stringify(payload.deliverables)
      : undefined,
    reports: payload.reports ? JSON.stringify(payload.reports) : undefined,
    datasets: payload.datasets ? JSON.stringify(payload.datasets) : undefined,
    ipRights: payload.ipRights,
    activity: payload.activity ? JSON.stringify(payload.activity) : undefined,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "Missing vault id." },
      { status: 400 }
    );
  }
  deleteVaultRegistry(body.id);
  return NextResponse.json({ ok: true });
}
