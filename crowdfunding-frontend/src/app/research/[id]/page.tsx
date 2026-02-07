"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/SiteShell";

type Article = {
  id: string;
  title: string;
  summary: string;
  contentHtml: string;
  tags: string[];
  coverUrl: string | null;
  galleryUrls: string[];
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = params?.id;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  const parseTags = (value: unknown) => {
    if (Array.isArray(value)) return value as string[];
    try {
      const parsed = JSON.parse(String(value || "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!articleId) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/articles?id=${articleId}`);
        const result = await response.json();
        const data = result?.data;
        if (!data) {
          setArticle(null);
          return;
        }
        const mapped = {
          ...data,
          tags: parseTags(data.tags),
          galleryUrls: parseTags(data.galleryUrls),
        };
        setArticle(mapped);
      } catch {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [articleId]);

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-3 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Research Article
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="heading-serif text-3xl text-[#1c1914]">
              {article?.title ?? "Research Article"}
            </h1>
            <Link
              href="/research"
              className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Back to Library
            </Link>
          </div>
          {loading && (
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Loading article…
            </p>
          )}
        </header>

        {!article ? (
          <div className="glass-panel animate-fade p-6 text-sm text-[#5e5242]">
            Article not found.
          </div>
        ) : (
          <section className="stagger grid gap-6">
            <div className="glass-panel animate-fade grid gap-4 p-6 text-sm text-[#5e5242]">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                {article.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid gap-2 text-xs">
                <span>Article ID: {article.id}</span>
                <span>
                  Published: {new Date(article.createdAt).toLocaleString()}
                </span>
              </div>
              {article.coverUrl && (
                <Image
                  src={article.coverUrl}
                  alt={article.title}
                  width={500}
                  height={500}
                  className="h-100 w-full rounded-2xl object-cover"
                />
              )}
              {article.summary &&
                (!article.tags.includes("publication") ||
                  !article.contentHtml?.includes(article.summary)) && (
                  <>
                    <h3 className="mt-2 text-2xl font-bold text-[#1c1914]">
                      Abstract
                    </h3>
                    <p className="text-base text-[#1c1914]">
                      {article.summary}
                    </p>
                  </>
                )}
              {article.galleryUrls.length > 0 && (
                <div className="grid gap-3">
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
                    Image Gallery
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {article.galleryUrls.map((url) => (
                      <Image
                        key={url}
                        src={url}
                        alt="Research gallery"
                        width={500}
                        height={500}
                        className="h-60 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div
                className="article-content grid gap-3 text-sm text-[#1c1914]"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />
              {article.fileUrl && (
                <div className="grid gap-3">
                  {article.fileUrl.toLowerCase().includes(".pdf") ? (
                    <iframe
                      title="Research attachment preview"
                      src={article.fileUrl}
                      className="h-130 w-full rounded-2xl border border-[#eadfcf] bg-white"
                    />
                  ) : (
                    <a
                      href={article.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    >
                      Open Source Link
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
