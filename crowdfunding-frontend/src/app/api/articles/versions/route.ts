import { NextResponse } from "next/server";
import { listArticleVersions } from "@/lib/governanceDb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing article id." },
      { status: 400 }
    );
  }
  const data = listArticleVersions(id);
  return NextResponse.json({ ok: true, data });
}
