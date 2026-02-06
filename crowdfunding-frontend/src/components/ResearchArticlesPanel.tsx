"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

export type ResearchArticle = {
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

type ArticleVersion = {
  id: string;
  articleId: string;
  title: string;
  summary: string;
  contentHtml: string;
  tags: string;
  coverUrl: string | null;
  galleryUrls: string | null;
  fileUrl: string | null;
  versionedAt: string;
};

type ResearchArticlesPanelProps = {
  articles: ResearchArticle[];
  onCreate: (payload: {
    title: string;
    summary: string;
    contentHtml: string;
    tags: string[];
    coverUrl: string | null;
    galleryUrls: string[];
    fileUrl: string | null;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    payload: {
      title: string;
      summary: string;
      contentHtml: string;
      tags: string[];
      coverUrl: string | null;
      galleryUrls: string[];
      fileUrl: string | null;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpload: (file: File, folder: string) => Promise<string>;
};

const emptyForm = {
  title: "",
  summary: "",
  tagsInput: "",
  contentHtml: "",
  coverUrl: "",
  galleryUrls: [] as string[],
  fileUrl: "",
};

export default function ResearchArticlesPanel({
  articles,
  onCreate,
  onUpdate,
  onDelete,
  onUpload,
}: ResearchArticlesPanelProps) {
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [history, setHistory] = useState<ArticleVersion[]>([]);
  const [historyStatus, setHistoryStatus] = useState<string | null>(null);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setHistory([]);
    setHistoryStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    const tags = formState.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title: formState.title.trim(),
      summary: formState.summary.trim(),
      contentHtml: formState.contentHtml.trim(),
      tags,
      coverUrl: formState.coverUrl || null,
      galleryUrls: formState.galleryUrls,
      fileUrl: formState.fileUrl || null,
    };

    if (!payload.title || !payload.summary || !payload.contentHtml) {
      setError("Title, summary, and article body are required.");
      return;
    }

    try {
      if (editingId) {
        await onUpdate(editingId, payload);
        setStatus("Article updated.");
      } else {
        await onCreate(payload);
        setStatus("Article published.");
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the research article."
      );
    }
  };

  const handleEdit = (article: ResearchArticle) => {
    setEditingId(article.id);
    setFormState({
      title: article.title,
      summary: article.summary,
      tagsInput: article.tags.join(", "),
      contentHtml: article.contentHtml,
      coverUrl: article.coverUrl ?? "",
      galleryUrls: article.galleryUrls ?? [],
      fileUrl: article.fileUrl ?? "",
    });
    void loadHistory(article.id);
  };

  const loadHistory = async (id: string) => {
    setHistoryStatus(null);
    try {
      const response = await fetch(`/api/articles/versions?id=${id}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setHistory(data);
    } catch {
      setHistory([]);
      setHistoryStatus("Unable to load history.");
    }
  };

  const handleUpload = async (file: File, kind: "cover" | "file") => {
    setStatus(null);
    setError(null);
    if (kind === "cover") {
      setUploadingCover(true);
    } else {
      setUploadingFile(true);
    }

    try {
      const folder = kind === "cover" ? "phercons-vault/covers" : "phercons-vault/files";
      const url = await onUpload(file, folder);
      setFormState((prev) =>
        kind === "cover"
          ? { ...prev, coverUrl: url }
          : { ...prev, fileUrl: url }
      );
      setStatus(
        kind === "cover" ? "Cover image uploaded." : "Attachment uploaded."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again."
      );
    } finally {
      if (kind === "cover") {
        setUploadingCover(false);
      } else {
        setUploadingFile(false);
      }
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    setStatus(null);
    setError(null);
    setUploadingCover(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map((file) =>
          onUpload(file, "phercons-vault/gallery")
        )
      );
      setFormState((prev) => ({
        ...prev,
        galleryUrls: [...prev.galleryUrls, ...uploads.filter(Boolean)],
      }));
      setStatus("Gallery images uploaded.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gallery upload failed."
      );
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Research Articles
        </p>
        <p className="text-sm text-[#5e5242]">
          Publish long-form research notes, attach datasets, and store
          reproducible findings in the vault archive.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 lg:grid-cols-2">
          <input
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Article title"
            className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.tagsInput}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                tagsInput: event.target.value,
              }))
            }
            placeholder="Tags (comma separated)"
            className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
        </div>
        <textarea
          value={formState.summary}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, summary: event.target.value }))
          }
          placeholder="Executive summary"
          className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />

        <div className="grid gap-3">
          <RichTextEditor
            value={formState.contentHtml}
            onChange={(value) =>
              setFormState((prev) => ({ ...prev, contentHtml: value }))
            }
          />
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242] lg:grid-cols-2">
          <div className="grid gap-2">
            <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
              Cover Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file, "cover");
              }}
              className="text-xs"
            />
            {formState.coverUrl && (
              <span className="break-all text-[11px]">
                {formState.coverUrl}
              </span>
            )}
            <span className="text-[11px] text-[#6b5b45]">
              {uploadingCover ? "Uploading..." : "Optional cover for the article."}
            </span>
          </div>
          <div className="grid gap-2">
            <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
              Attachment
            </span>
            <input
              type="file"
              accept="application/pdf,application/zip,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file, "file");
              }}
              className="text-xs"
            />
            {formState.fileUrl && (
              <span className="break-all text-[11px]">{formState.fileUrl}</span>
            )}
            <span className="text-[11px] text-[#6b5b45]">
              {uploadingFile
                ? "Uploading..."
                : "Optional dataset, PDF, or appendix."}
            </span>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
          <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
            Gallery Images
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) void handleGalleryUpload(files);
            }}
            className="text-xs"
          />
          {formState.galleryUrls.length > 0 && (
            <div className="grid gap-2">
              {formState.galleryUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center justify-between rounded-xl border border-[#eadfcf] bg-white/70 px-3 py-2 text-[11px]"
                >
                  <span className="break-all">{url}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        galleryUrls: prev.galleryUrls.filter(
                          (item) => item !== url
                        ),
                      }))
                    }
                    className="text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
          >
            {editingId ? "Update Article" : "Publish Article"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
          >
            Clear Form
          </button>
          {status && <span className="text-xs text-[#1c1914]">{status}</span>}
          {error && <span className="text-xs text-[#9a2c20]">{error}</span>}
        </div>
      </form>

      {editingId && (
        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
              Version History
            </span>
            <button
              type="button"
              onClick={() => loadHistory(editingId)}
              className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Refresh
            </button>
          </div>
          {historyStatus && (
            <span className="text-[11px] text-[#9a2c20]">{historyStatus}</span>
          )}
          {history.length === 0 ? (
            <span className="text-[11px] text-[#5e5242]">
              No prior revisions stored yet.
            </span>
          ) : (
            <div className="grid gap-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#1c1914]">
                      {entry.title}
                    </span>
                    <span>{new Date(entry.versionedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1">{entry.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Article Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {articles.length} entries
          </span>
        </div>
        <div className="grid gap-3">
          {articles.length === 0 ? (
            <p className="text-sm text-[#5e5242]">No articles published yet.</p>
          ) : (
            articles.map((article) => (
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
                    {new Date(article.createdAt).toLocaleDateString()}
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
                  <button
                    type="button"
                    onClick={() => handleEdit(article)}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(article.id)}
                    className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
