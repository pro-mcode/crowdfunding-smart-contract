import { NextResponse } from "next/server";
import {
  getBadgeSnapshotById,
  listBadgeAwardsBySnapshot,
} from "@/lib/governanceDb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const snapshotId = (await params)?.id;
  if (!snapshotId) {
    return NextResponse.json(
      { ok: false, error: "Snapshot id required." },
      { status: 400 }
    );
  }
  const snapshot = getBadgeSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json(
      { ok: false, error: "Snapshot not found." },
      { status: 404 }
    );
  }
  const awards = listBadgeAwardsBySnapshot(snapshotId);
  return NextResponse.json({ ok: true, data: { snapshot, awards } });
}
