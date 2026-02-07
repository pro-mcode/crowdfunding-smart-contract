"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CONTRIBUTION_RUBRIC, DEFAULT_ROLE_THRESHOLDS } from "@/lib/contributionRubric";
import SiteShell from "@/components/SiteShell";

type SummaryPeriod = {
  periodStart: string;
  periodEnd: string;
  totalPoints: number;
  categoryPoints: {
    supporter: number;
    developer: number;
    researcher: number;
  };
  rank: number | null;
  totalContributors: number;
  eligible: {
    supporter: boolean;
    developer: boolean;
    researcher: boolean;
    topContributor: boolean;
  };
  previewBadges: string[];
  thresholds: typeof DEFAULT_ROLE_THRESHOLDS;
};

type SummaryData = {
  address: string;
  periods: Record<string, SummaryPeriod>;
  recentContributions: Array<{
    id: string;
    type: string;
    points: number;
    evidence: string | null;
    occurredAt: string;
  }>;
};

type BadgeEntry = {
  id: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt?: string | null;
  recipient?: string;
};

const renderProgressBar = (value: number, max: number) => {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.round((value / safeMax) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-[#eadfcf]">
      <div className="h-2 rounded-full bg-[#1c1914]" style={{ width: `${percent}%` }} />
    </div>
  );
};

export default function ContributorProfilePage() {
  const params = useParams<{ address: string }>();
  const address = String(params?.address ?? "").toLowerCase();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activeBadges, setActiveBadges] = useState<BadgeEntry[]>([]);
  const [expiredBadges, setExpiredBadges] = useState<BadgeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isLoading = Boolean(address) && !summary && !error;

  const loadSummary = async (addr: string) => {
    const response = await fetch(`/api/contributions/summary?address=${addr}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to load summary.");
    }
    setSummary(payload?.data ?? null);
  };

  const loadBadges = async (addr: string) => {
    const response = await fetch(`/api/badges?address=${addr}&status=active`);
    const payload = await response.json().catch(() => null);
    setActiveBadges(Array.isArray(payload?.data) ? payload.data : []);
    const expiredRes = await fetch("/api/badges/archive");
    const expiredPayload = await expiredRes.json().catch(() => null);
    const expiredList = Array.isArray(expiredPayload?.data)
      ? expiredPayload.data
      : [];
    setExpiredBadges(
      expiredList.filter(
        (badge: BadgeEntry) => badge.recipient?.toLowerCase?.() === addr
      )
    );
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!address) return;
    Promise.all([loadSummary(address), loadBadges(address)])
      .then(() => setError(null))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load profile.")
      );
  }, [address]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Contributor Profile
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Wallet {address.slice(0, 6)}…{address.slice(-4)}
          </h1>
          <p className="text-sm text-[#5e5242] break-all">{address}</p>
          {isLoading && (
            <span className="text-xs text-[#1c1914]">
              Loading contributor profile...
            </span>
          )}
          {error && <span className="text-xs text-[#9a2c20]">{error}</span>}
        </header>

        {summary && (
          <div className="grid gap-6 lg:grid-cols-3">
            {(["weekly", "monthly", "quarterly"] as const).map((periodKey) => {
              const data = summary.periods?.[periodKey] as SummaryPeriod | undefined;
              if (!data) return null;
              return (
                <div
                  key={periodKey}
                  className="glass-panel animate-fade flex flex-col gap-4 p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                      {periodKey}
                    </span>
                    <span className="text-[10px] text-[#6b5b45]">
                      Rank {data.rank ? `#${data.rank}` : "—"}
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs text-[#5e5242]">
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Supporter</span>
                        <span>
                          {data.categoryPoints.supporter}/{data.thresholds.supporter}
                        </span>
                      </div>
                      {renderProgressBar(
                        data.categoryPoints.supporter,
                        data.thresholds.supporter
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Developer</span>
                        <span>
                          {data.categoryPoints.developer}/{data.thresholds.developer}
                        </span>
                      </div>
                      {renderProgressBar(
                        data.categoryPoints.developer,
                        data.thresholds.developer
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Researcher</span>
                        <span>
                          {data.categoryPoints.researcher}/{data.thresholds.researcher}
                        </span>
                      </div>
                      {renderProgressBar(
                        data.categoryPoints.researcher,
                        data.thresholds.researcher
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    {data.previewBadges.length === 0 ? (
                      <span className="chip">No badges yet</span>
                    ) : (
                      data.previewBadges.map((badge) => (
                        <span key={badge} className="chip">
                          {badge}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Recent Contributions
            </p>
            {summary?.recentContributions?.length ? (
              <div className="grid gap-2">
                {summary.recentContributions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#1c1914]">
                        {CONTRIBUTION_RUBRIC[entry.type]?.label ?? entry.type}
                      </span>
                      <span>{new Date(entry.occurredAt).toLocaleDateString()}</span>
                    </div>
                    <div>{entry.points} pts</div>
                    {entry.evidence && (
                      <div className="break-all text-[10px]">{entry.evidence}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5e5242]">No contributions logged yet.</p>
            )}
          </div>

          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Badges
            </p>
            <div className="grid gap-2">
              {activeBadges.length === 0 ? (
                <p className="text-sm text-[#5e5242]">No active badges yet.</p>
              ) : (
                activeBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                  >
                    <div className="text-xs text-[#1c1914]">{badge.badge}</div>
                    <div>Token ID: {badge.tokenId}</div>
                    <div>Issued: {new Date(badge.issuedAt).toLocaleDateString()}</div>
                    <div>
                      Expires:{" "}
                      {badge.expiresAt
                        ? new Date(badge.expiresAt).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                ))
              )}
            </div>
            {expiredBadges.length > 0 && (
              <div className="grid gap-2 rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-3 text-[11px] text-[#5e5242]">
                <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                  Expired Badges
                </span>
                {expiredBadges.map((badge) => (
                  <div key={badge.id}>
                    {badge.badge} · {badge.tokenId}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </SiteShell>
  );
}
