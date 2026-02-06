"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Image from "next/image";

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

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);

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
    const load = async () => {
      try {
        const response = await fetch("/api/articles");
        const result = await response.json();
        const data = Array.isArray(result?.data) ? result.data : [];
        const mapped = data.map((article: Article) => ({
          ...article,
          tags: parseTags(article.tags),
          galleryUrls: parseTags(article.galleryUrls),
        }));
        setArticles(mapped);
      } catch {
        setArticles([]);
      }
    };
    load();
  }, []);

  const filtered = articles.filter((article) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.tags.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-shell min-h-screen bg-[#f5f0e6] text-[#1c1914]">
      <div className="page-transition relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16">
        <NavBar />

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Research Articles
          </p>
          <h1 className="font-spectral text-3xl text-[#1c1914]">
            Phercons Research Library
          </h1>
          <p className="text-sm text-[#5e5242]">
            Curated research outputs, benchmarking reports, and archived
            experiments for stakeholders.
          </p>
        </div>

        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Library Index
            </p>
            <span className="text-xs text-[#6b5b45]">
              {filtered.length} articles
            </span>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, tags, or summary"
            className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-4 py-3 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-[#5e5242]">No research articles yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((article) => (
                <a
                  key={article.id}
                  href={`/research/${article.id}`}
                  className="glass-panel animate-fade flex h-full flex-col gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {article.coverUrl && (
                    <Image
                      src={article.coverUrl}
                      alt={article.title}
                      width={500}
                      height={500}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    {article.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-spectral text-lg text-[#1c1914]">
                    {article.title}
                  </h2>
                  <p>{article.summary}</p>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#1c1914]">
                    Open article
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
