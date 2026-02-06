import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyMessage } from "ethers";

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
  const folder = String(body?.folder || "phercons-vault").trim();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary env not configured." },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign)
    .digest("hex");

  return NextResponse.json({
    ok: true,
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
  });
}
