import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createLearnRegistry,
  deleteLearnRegistry,
  getLearnRegistryById,
  listLearnRegistry,
  updateLearnRegistry,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const item = getLearnRegistryById(id);
    return NextResponse.json({ ok: true, data: item ?? null });
  }
  const data = listLearnRegistry();
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
  const title = String(payload.title ?? "").trim();
  const description = String(payload.description ?? "").trim();
  if (!title || !description) {
    return NextResponse.json(
      { ok: false, error: "Missing title or description." },
      { status: 400 }
    );
  }
  const now = new Date().toISOString();
  const id = String(payload.id ?? "").trim() || slugify(title);
  createLearnRegistry({
    id,
    title,
    description,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "Missing learn entry id." },
      { status: 400 }
    );
  }
  const payload = body?.payload ?? {};
  updateLearnRegistry(body.id, {
    title: payload.title,
    description: payload.description,
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
      { ok: false, error: "Missing learn entry id." },
      { status: 400 }
    );
  }
  deleteLearnRegistry(body.id);
  return NextResponse.json({ ok: true });
}
