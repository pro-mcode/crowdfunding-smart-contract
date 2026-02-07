import { useMemo, useState } from "react";

type ReputationBadge = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt?: string | null;
  archivedAt?: string | null;
};

type BadgeRegistry = {
  id: string;
  title: string;
  code: string;
  weight: number;
  renewDays?: number | null;
  createdAt: string;
};

type BadgeTrackingPanelProps = {
  badges: ReputationBadge[];
  expiredBadges: ReputationBadge[];
  badgeRegistry: BadgeRegistry[];
  onRemoveBadge?: (id: string) => void;
};

type BadgeLedgerRow = ReputationBadge & {
  status: "Active" | "Expired";
  weight: number | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function BadgeTrackingPanel({
  badges,
  expiredBadges,
  badgeRegistry,
  onRemoveBadge,
}: BadgeTrackingPanelProps) {
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired"
  >("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");

  const registryMap = useMemo(() => {
    const map = new Map<string, number>();
    badgeRegistry.forEach((entry) => {
      map.set(entry.title.toLowerCase(), entry.weight);
    });
    return map;
  }, [badgeRegistry]);

  const allBadges = useMemo(() => {
    const active = badges.map<BadgeLedgerRow>((badge) => ({
      ...badge,
      status: "Active",
      weight: registryMap.get(badge.badge.toLowerCase()) ?? null,
    }));
    const expired = expiredBadges.map<BadgeLedgerRow>((badge) => ({
      ...badge,
      status: "Expired",
      weight: registryMap.get(badge.badge.toLowerCase()) ?? null,
    }));
    return [...active, ...expired];
  }, [badges, expiredBadges, registryMap]);

  const titleOptions = useMemo(() => {
    const titles = new Set(allBadges.map((badge) => badge.badge));
    return Array.from(titles).sort((a, b) => a.localeCompare(b));
  }, [allBadges]);

  const weightOptions = useMemo(() => {
    const weights = new Set<number>();
    allBadges.forEach((badge) => {
      if (badge.weight !== null && Number.isFinite(badge.weight)) {
        weights.add(badge.weight);
      }
    });
    return Array.from(weights).sort((a, b) => a - b);
  }, [allBadges]);

  const filteredBadges = useMemo(() => {
    let filtered = allBadges;
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (badge) =>
          badge.status === (statusFilter === "active" ? "Active" : "Expired")
      );
    }
    if (titleFilter !== "all") {
      filtered = filtered.filter((badge) => badge.badge === titleFilter);
    }
    if (weightFilter !== "all") {
      if (weightFilter === "unknown") {
        filtered = filtered.filter((badge) => badge.weight === null);
      } else {
        const weightValue = Number(weightFilter);
        filtered = filtered.filter((badge) => badge.weight === weightValue);
      }
    }
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.issuedAt).getTime();
      const bTime = new Date(b.issuedAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return sortOrder === "latest" ? safeB - safeA : safeA - safeB;
    });
    return sorted;
  }, [allBadges, sortOrder, statusFilter, titleFilter, weightFilter]);

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Badge Tracker
        </p>
        <p className="text-sm text-[#5e5242]">
          Review all issued badges with status, weight, and issuance history.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "expired"
                )
              }
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Badge Title
            </span>
            <select
              value={titleFilter}
              onChange={(event) => setTitleFilter(event.target.value)}
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="all">All</option>
              {titleOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Weight
            </span>
            <select
              value={weightFilter}
              onChange={(event) => setWeightFilter(event.target.value)}
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="all">All</option>
              {weightOptions.map((weight) => (
                <option key={weight} value={String(weight)}>
                  {weight}
                </option>
              ))}
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Badge Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {filteredBadges.length} of {allBadges.length} entries
          </span>
        </div>
        {filteredBadges.length === 0 ? (
          <p className="text-sm text-[#5e5242]">No badges match this filter.</p>
        ) : (
          <div className="grid gap-3">
            {filteredBadges.map((badge) => (
              <div
                key={`${badge.status}-${badge.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-[#eadfcf] bg-white/70 p-4 text-sm text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-[#1c1914]">
                    {badge.badge}
                  </span>
                  <span className="text-[11px] text-[#6b5b45]">
                    Issued {formatDate(badge.issuedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  <span className="chip">{badge.status}</span>
                  <span className="chip">
                    Weight {badge.weight ?? "—"}
                  </span>
                </div>
                <div className="grid gap-1 text-[11px]">
                  <span>Recipient: {badge.recipient}</span>
                  <span>Token ID: {badge.tokenId}</span>
                  <span>
                    Expires:{" "}
                    {badge.expiresAt ? formatDate(badge.expiresAt) : "Never"}
                  </span>
                  {badge.status === "Expired" && (
                    <span>
                      Archived: {formatDate(badge.archivedAt ?? null)}
                    </span>
                  )}
                </div>
                {badge.status === "Active" && onRemoveBadge && (
                  <button
                    type="button"
                    onClick={() => onRemoveBadge(badge.id)}
                    className="mt-1 w-fit rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
