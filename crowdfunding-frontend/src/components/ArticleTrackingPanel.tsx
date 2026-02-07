import { useMemo, useState } from "react";
import type { ResearchArticle } from "@/components/ResearchArticlesPanel";

type ArticleTrackingPanelProps = {
  articles: ResearchArticle[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function ArticleTrackingPanel({
  articles,
  onEdit,
  onDelete,
}: ArticleTrackingPanelProps) {
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let filtered = articles;
    if (needle) {
      filtered = filtered.filter((article) =>
        article.title.toLowerCase().includes(needle)
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return sortOrder === "latest" ? safeB - safeA : safeA - safeB;
    });
    return sorted;
  }, [articles, query, sortOrder]);

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Article Tracker
        </p>
        <p className="text-sm text-[#5e5242]">
          Browse all research articles with quick sorting and title filters.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Sort
            </span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "latest" | "oldest")
              }
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Title
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Article Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {filteredArticles.length} of {articles.length} entries
          </span>
        </div>
        {filteredArticles.length === 0 ? (
          <p className="text-sm text-[#5e5242]">No articles match this filter.</p>
        ) : (
          <div className="grid gap-3">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#eadfcf] bg-white/70 p-4 text-sm text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    {article.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#6b5b45]">
                    {formatDate(article.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-[#1c1914]">
                    {article.title}
                  </span>
                  <span className="text-xs">{article.summary}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <a
                    href={`/research/${article.id}`}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    View
                  </a>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(article.id)}
                      className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(article.id)}
                      className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                    >
                      Delete
                    </button>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Updated {formatDate(article.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
