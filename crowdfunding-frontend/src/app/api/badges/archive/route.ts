import { NextResponse } from "next/server";
import { archiveExpiredBadges, listBadgeArchive } from "@/lib/governanceDb";

export const runtime = "nodejs";

export async function GET() {
  const data = listBadgeArchive();
  return NextResponse.json({ ok: true, data });
}

export async function POST() {
  const result = archiveExpiredBadges();
  return NextResponse.json({ ok: true, ...result });
}
