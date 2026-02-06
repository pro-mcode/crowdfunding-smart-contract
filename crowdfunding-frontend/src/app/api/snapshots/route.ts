import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const root = process.cwd();
    const dataDir = path.join(root, "data");
    const snapshotsFile = path.join(dataDir, "snapshots.json");

    await mkdir(dataDir, { recursive: true });

    let existing: unknown[] = [];
    try {
      const raw = await readFile(snapshotsFile, "utf-8");
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) {
        existing = [];
      }
    } catch {
      existing = [];
    }

    const next = [
      ...existing,
      {
        ...payload,
        savedAt: new Date().toISOString(),
      },
    ];

    await writeFile(snapshotsFile, `${JSON.stringify(next, null, 2)}\n`);
    return NextResponse.json({ ok: true, count: next.length });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const root = process.cwd();
    const dataDir = path.join(root, "data");
    const snapshotsFile = path.join(dataDir, "snapshots.json");
    const raw = await readFile(snapshotsFile, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: true, data: [] });
  }
}

export async function DELETE() {
  try {
    const root = process.cwd();
    const dataDir = path.join(root, "data");
    const snapshotsFile = path.join(dataDir, "snapshots.json");
    await mkdir(dataDir, { recursive: true });
    await writeFile(snapshotsFile, `${JSON.stringify([], null, 2)}\n`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
