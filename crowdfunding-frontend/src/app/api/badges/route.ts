import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createBadge,
  deleteBadge,
  listBadges,
  listBadgeRegistry,
} from "@/lib/governanceDb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get("address") ?? "").toLowerCase();
  const status = String(url.searchParams.get("status") ?? "").toLowerCase();
  let data = listBadges();
  if (address) {
    data = data.filter(
      (badge) => badge.recipient.toLowerCase() === address
    );
  }
  if (status === "active") {
    const now = Date.now();
    data = data.filter((badge) => {
      if (!badge.expiresAt) return true;
      const parsed = Date.parse(badge.expiresAt);
      if (Number.isNaN(parsed)) return true;
      return parsed > now;
    });
  }
  return NextResponse.json({ ok: true, data });
}

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
    if (
      recovered !== address ||
      recovered !== adminAddress.toLowerCase()
    ) {
      return { ok: false, error: "Unauthorized admin signature." };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, error: "Invalid admin signature." };
  }
};

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const rawExpires = String(payload.expiresAt ?? "").trim();
  let expiresAt: string | null = null;
  if (rawExpires) {
    const parsed = new Date(rawExpires);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid expiration date." },
        { status: 400 }
      );
    }
    expiresAt = parsed.toISOString();
  }
  const badge = {
    id: crypto.randomUUID(),
    recipient: String(payload.recipient ?? "").trim(),
    badge: String(payload.badge ?? "").trim(),
    tokenId: String(payload.tokenId ?? "").trim(),
    issuedAt: new Date().toISOString(),
    expiresAt,
  };
  const registry = listBadgeRegistry();
  if (registry.length > 0) {
    const allowed = registry.some(
      (entry) => entry.title.toLowerCase() === badge.badge.toLowerCase()
    );
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Badge title must match the registry." },
        { status: 400 }
      );
    }
  }
  if (!badge.recipient || !badge.badge || !badge.tokenId) {
    return NextResponse.json(
      { ok: false, error: "Missing badge fields." },
      { status: 400 }
    );
  }
  createBadge(badge);
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
      { ok: false, error: "Missing badge id." },
      { status: 400 }
    );
  }
  deleteBadge(body.id);
  return NextResponse.json({ ok: true });
}
