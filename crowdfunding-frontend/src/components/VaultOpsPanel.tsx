import { useMemo } from "react";

type BudgetBucket = {
  id: string;
  label: string;
  percent: number;
};

type Milestone = {
  id: string;
  title: string;
  status: "Planned" | "In Progress" | "Complete";
  targetDate: string;
};

type Publication = {
  id: string;
  title: string;
  url: string;
  summary: string;
  createdAt?: string;
};

type VaultOpsPanelProps = {
  buckets: BudgetBucket[];
  milestones: Milestone[];
  publications: Publication[];
  canEditPublications?: boolean;
  onAddBucket: (bucket: Omit<BudgetBucket, "id">) => void;
  onRemoveBucket: (id: string) => void;
  onAddMilestone: (milestone: Omit<Milestone, "id">) => void;
  onRemoveMilestone: (id: string) => void;
  onAddPublication: (publication: Omit<Publication, "id">) => void;
  onRemovePublication: (id: string) => void;
};

export default function VaultOpsPanel({
  buckets,
  milestones,
  publications,
  canEditPublications = true,
  onAddBucket,
  onRemoveBucket,
  onAddMilestone,
  onRemoveMilestone,
  onAddPublication,
  onRemovePublication,
}: VaultOpsPanelProps) {
  const totalPercent = buckets.reduce((acc, item) => acc + item.percent, 0);
  const completedMilestones = milestones.filter(
    (milestone) => milestone.status === "Complete"
  ).length;
  const recentPublications = useMemo(() => {
    const sorted = [...publications].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeB - safeA;
    });
    return sorted.slice(0, 3);
  }, [publications]);

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          R&D Vault Ops
        </p>
        <p className="text-sm text-[#5e5242]">
          Organize budgets, milestones, and publications to track research
          output and treasury intent.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45] sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="uppercase tracking-[0.3em]">Tracks</span>
          <span className="text-lg font-semibold text-[#1c1914]">
            {buckets.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="uppercase tracking-[0.3em]">Milestones</span>
          <span className="text-lg font-semibold text-[#1c1914]">
            {completedMilestones}/{milestones.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="uppercase tracking-[0.3em]">Publications</span>
          <span className="text-lg font-semibold text-[#1c1914]">
            {publications.length}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <div className="flex items-center justify-between">
            <p className="uppercase tracking-[0.35em]">Budget Buckets</p>
            <span className="text-[10px] text-[#6b5b45]">
              Total: {totalPercent}%
            </span>
          </div>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const label = String(data.get("bucket-label") || "").trim();
              const percent = Number(data.get("bucket-percent"));
              if (!label || !Number.isFinite(percent)) return;
              onAddBucket({ label, percent });
              form.reset();
            }}
          >
            <input
              name="bucket-label"
              placeholder="Research track (e.g., ZK, Security)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              name="bucket-percent"
              placeholder="Allocation %"
              type="number"
              min="0"
              max="100"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Bucket
            </button>
          </form>
          <div className="grid gap-2">
            {buckets.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No budget buckets defined.
              </p>
            ) : (
              buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center justify-between rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">{bucket.label}</span>
                  <div className="flex items-center gap-2">
                    <span>{bucket.percent}%</span>
                    <button
                      type="button"
                      onClick={() => onRemoveBucket(bucket.id)}
                      className="text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Milestones</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const title = String(data.get("milestone-title") || "").trim();
              const status = String(
                data.get("milestone-status") || "Planned"
              ) as "Planned" | "In Progress" | "Complete";
              const targetDate = String(
                data.get("milestone-date") || ""
              ).trim();
              if (!title) return;
              onAddMilestone({ title, status, targetDate });
              form.reset();
            }}
          >
            <input
              name="milestone-title"
              placeholder="Milestone goal"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="milestone-status"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              >
                <option>Planned</option>
                <option>In Progress</option>
                <option>Complete</option>
              </select>
              <input
                name="milestone-date"
                type="date"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Milestone
            </button>
          </form>
          <div className="grid gap-2">
            {milestones.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No milestones tracked yet.
              </p>
            ) : (
              milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {milestone.title}
                  </span>
                  <span>Status: {milestone.status}</span>
                  <span>Target: {milestone.targetDate || "—"}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveMilestone(milestone.id)}
                    className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-full grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Publication Registry</p>
          {canEditPublications ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget as HTMLFormElement;
                const data = new FormData(form);
                const title = String(data.get("pub-title") || "").trim();
                const url = String(data.get("pub-url") || "").trim();
                const summary = String(data.get("pub-summary") || "").trim();
                if (!title || !url) return;
                onAddPublication({ title, url, summary });
                form.reset();
              }}
            >
              <input
                name="pub-title"
                placeholder="Paper / report title"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="pub-url"
                placeholder="URL or IPFS link"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <textarea
                name="pub-summary"
                placeholder="Short summary or abstract"
                className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
                Add Publication
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-[#5e5242]">
              Publication registry updates are managed by the admin dashboard.
            </p>
          )}
          <div className="grid gap-2">
            {publications.length > 3 && (
              <p className="text-[11px] text-[#6b5b45]">
                Showing the latest 3 of {publications.length} publications.
              </p>
            )}
            {publications.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No publications linked yet.
              </p>
            ) : (
              recentPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="flex flex-col gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">{pub.title}</span>
                  {pub.summary && <span>{pub.summary}</span>}
                  <span className="break-all">{pub.url}</span>
                  {canEditPublications && (
                    <button
                      type="button"
                      onClick={() => onRemovePublication(pub.id)}
                      className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
