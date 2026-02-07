import { useState } from "react";
import type { LearnEntry } from "@/lib/learnCatalog";

type LearnRegistryPanelProps = {
  entries: LearnEntry[];
  onCreate: (payload: LearnEntry) => Promise<void>;
  onUpdate: (id: string, payload: Partial<LearnEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const emptyForm: LearnEntry = {
  id: "",
  title: "",
  description: "",
};

export default function LearnRegistryPanel({
  entries,
  onCreate,
  onUpdate,
  onDelete,
}: LearnRegistryPanelProps) {
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setStatus(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    if (!formState.title.trim() || !formState.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formState);
        setStatus("Entry updated.");
      } else {
        await onCreate(formState);
        setStatus("Entry added.");
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save learn entry."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Learn Registry
        </p>
        <p className="text-sm text-[#5e5242]">
          Maintain the Learn hub content directly from the council console.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <input
          value={formState.id}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, id: event.target.value }))
          }
          placeholder="Entry ID (optional slug)"
          className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />
        <input
          value={formState.title}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, title: event.target.value }))
          }
          placeholder="Learn topic title"
          className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />
        <textarea
          value={formState.description}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              description: event.target.value,
            }))
          }
          placeholder="Short description"
          className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving" : editingId ? "Update Entry" : "Add Entry"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
          >
            Clear Form
          </button>
          {status && <span className="text-xs text-[#1c1914]">{status}</span>}
          {error && <span className="text-xs text-[#9a2c20]">{error}</span>}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Learn Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {entries.length} entries
          </span>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-[#5e5242]">No learn entries yet.</p>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#eadfcf] bg-white/70 p-4 text-sm text-[#5e5242]"
              >
                <span className="text-base font-semibold text-[#1c1914]">
                  {entry.title}
                </span>
                <span className="text-xs">{entry.description}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(entry.id);
                      setFormState(entry);
                    }}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
