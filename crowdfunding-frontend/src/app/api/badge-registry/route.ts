import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createBadgeRegistry,
  deleteBadgeRegistry,
  listBadgeRegistry,
} from "@/lib/governanceDb";

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

export async function GET() {
  const data = listBadgeRegistry();
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const title = String(payload.title ?? "").trim();
  const code = String(payload.code ?? "").trim();
  const weight = Number(payload.weight ?? 0);
  const renewDaysRaw = payload.renewDays;
  const renewDays =
    renewDaysRaw === null || renewDaysRaw === undefined || renewDaysRaw === ""
      ? null
      : Number(renewDaysRaw);
  if (!title || !code || !Number.isFinite(weight)) {
    return NextResponse.json(
      { ok: false, error: "Missing badge registry fields." },
      { status: 400 }
    );
  }
  if (renewDays !== null && !Number.isFinite(renewDays)) {
    return NextResponse.json(
      { ok: false, error: "Invalid renew days." },
      { status: 400 }
    );
  }
  createBadgeRegistry({
    id: crypto.randomUUID(),
    title,
    code,
    weight,
    renewDays,
    createdAt: new Date().toISOString(),
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
      { ok: false, error: "Missing badge registry id." },
      { status: 400 }
    );
  }
  deleteBadgeRegistry(body.id);
  return NextResponse.json({ ok: true });
}
