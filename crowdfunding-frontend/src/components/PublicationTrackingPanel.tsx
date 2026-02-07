import { useMemo, useState } from "react";

type Publication = {
  id: string;
  title: string;
  url: string;
  summary: string;
  createdAt?: string;
};

type PublicationTrackingPanelProps = {
  publications: Publication[];
  onUpdate?: (id: string, payload: { title: string; url: string; summary: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function PublicationTrackingPanel({
  publications,
  onUpdate,
  onDelete,
}: PublicationTrackingPanelProps) {
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ title: "", url: "", summary: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredPublications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let filtered = publications;
    if (needle) {
      filtered = filtered.filter((pub) =>
        pub.title.toLowerCase().includes(needle)
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return sortOrder === "latest" ? safeB - safeA : safeA - safeB;
    });
    return sorted;
  }, [publications, query, sortOrder]);

  const startEdit = (pub: Publication) => {
    setEditingId(pub.id);
    setFormState({
      title: pub.title,
      url: pub.url,
      summary: pub.summary ?? "",
    });
    setStatus(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setStatus(null);
    setError(null);
  };

  const submitEdit = async () => {
    if (!editingId || !onUpdate) return;
    const title = formState.title.trim();
    const url = formState.url.trim();
    const summary = formState.summary.trim();
    if (!title || !url) {
      setError("Title and URL are required.");
      return;
    }
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await onUpdate(editingId, { title, url, summary });
      setStatus("Publication updated.");
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update publication.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Publication Tracker
        </p>
        <p className="text-sm text-[#5e5242]">
          Monitor all registered publications and link status in one place.
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
      {status && <span className="text-xs text-[#1c1914]">{status}</span>}
      {error && <span className="text-xs text-[#9a2c20]">{error}</span>}

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Publication Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {filteredPublications.length} of {publications.length} entries
          </span>
        </div>
        {filteredPublications.length === 0 ? (
          <p className="text-sm text-[#5e5242]">
            No publications match this filter.
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredPublications.map((pub) => (
              <div
                key={pub.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#eadfcf] bg-white/70 p-4 text-sm text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-[#1c1914]">
                    {pub.title}
                  </span>
                  <span className="text-[11px] text-[#6b5b45]">
                    {formatDate(pub.createdAt ?? null)}
                  </span>
                </div>
                {editingId === pub.id ? (
                  <div className="grid gap-2 text-xs">
                    <input
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Publication title"
                      className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                    />
                    <input
                      value={formState.url}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          url: event.target.value,
                        }))
                      }
                      placeholder="URL"
                      className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                    />
                    <textarea
                      value={formState.summary}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          summary: event.target.value,
                        }))
                      }
                      placeholder="Summary"
                      className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={submitEdit}
                        disabled={saving}
                        className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                      >
                        Cancel
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(pub.id);
                            cancelEdit();
                          }}
                          className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {pub.summary && <span className="text-xs">{pub.summary}</span>}
                    <a
                      href={pub.url}
                      className="break-all text-[11px] text-[#1c1914] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {pub.url}
                    </a>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {onUpdate && (
                        <button
                          type="button"
                          onClick={() => startEdit(pub)}
                          className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(pub.id)}
                          className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
