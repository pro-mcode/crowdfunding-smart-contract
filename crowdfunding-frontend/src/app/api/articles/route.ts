import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createArticle,
  createArticleVersion,
  deleteArticle,
  getArticleById,
  listArticles,
  updateArticle,
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
    const item = getArticleById(id);
    return NextResponse.json({ ok: true, data: item ?? null });
  }
  const data = listArticles();
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const now = new Date().toISOString();
  const article = {
    id: crypto.randomUUID(),
    title: String(payload.title ?? "").trim(),
    summary: String(payload.summary ?? "").trim(),
    contentHtml: String(payload.contentHtml ?? ""),
    tags: JSON.stringify(payload.tags ?? []),
    coverUrl: payload.coverUrl ?? null,
    galleryUrls: JSON.stringify(payload.galleryUrls ?? []),
    fileUrl: payload.fileUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };
  if (!article.title || !article.summary || !article.contentHtml) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 }
    );
  }
  createArticle(article);
  return NextResponse.json({ ok: true, id: article.id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "Missing article id." },
      { status: 400 }
    );
  }
  const current = getArticleById(body.id);
  if (current) {
    createArticleVersion({
      id: crypto.randomUUID(),
      articleId: current.id,
      title: current.title,
      summary: current.summary,
      contentHtml: current.contentHtml,
      tags: current.tags,
      coverUrl: current.coverUrl ?? null,
      galleryUrls: current.galleryUrls ?? null,
      fileUrl: current.fileUrl ?? null,
      versionedAt: new Date().toISOString(),
    });
  }
  const payload = body?.payload ?? {};
  updateArticle(body.id, {
    title: payload.title,
    summary: payload.summary,
    contentHtml: payload.contentHtml,
    tags: payload.tags ? JSON.stringify(payload.tags) : undefined,
    coverUrl: payload.coverUrl,
    galleryUrls: payload.galleryUrls
      ? JSON.stringify(payload.galleryUrls)
      : undefined,
    fileUrl: payload.fileUrl,
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
      { ok: false, error: "Missing article id." },
      { status: 400 }
    );
  }
  deleteArticle(body.id);
  return NextResponse.json({ ok: true });
}
