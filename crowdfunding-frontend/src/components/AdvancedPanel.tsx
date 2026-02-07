import { useMemo, useState } from "react";

type ExperimentEntry = {
  id: string;
  title: string;
  summary: string;
  datasetUrl: string;
  hash: string;
  createdAt: string;
};

type ReputationBadge = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt?: string | null;
};

type TokenomicsScenario = {
  id: string;
  label: string;
  rewardRate: number;
  lockupDays: number;
  inflationRate: number;
  notes: string;
  projectedAnnualEmissions: number;
};

type BadgeRegistry = {
  id: string;
  title: string;
  code: string;
  weight: number;
  renewDays?: number | null;
  createdAt: string;
};

type AdvancedPanelProps = {
  experiments: ExperimentEntry[];
  badges: ReputationBadge[];
  expiredBadges?: ReputationBadge[];
  badgeRegistry?: BadgeRegistry[];
  tokenomics: TokenomicsScenario[];
  onAddExperiment: (
    entry: Omit<ExperimentEntry, "id" | "createdAt">
  ) => void | Promise<void>;
  onRemoveExperiment: (id: string) => void;
  onAddBadge: (badge: Omit<ReputationBadge, "id" | "issuedAt">) => void;
  onRemoveBadge: (id: string) => void;
  onAddBadgeRegistry?: (
    entry: Omit<BadgeRegistry, "id" | "createdAt">
  ) => void;
  onRemoveBadgeRegistry?: (id: string) => void;
  onRunBadgeCleanup?: () => void;
  badgeCleanupStatus?: string | null;
  onAddTokenomics: (
    scenario: Omit<TokenomicsScenario, "id" | "projectedAnnualEmissions">
  ) => void;
  onRemoveTokenomics: (id: string) => void;
  canIssueBadges?: boolean;
};

export default function AdvancedPanel({
  experiments,
  badges,
  expiredBadges = [],
  badgeRegistry = [],
  tokenomics,
  onAddExperiment,
  onRemoveExperiment,
  onAddBadge,
  onRemoveBadge,
  onAddBadgeRegistry,
  onRemoveBadgeRegistry,
  onRunBadgeCleanup,
  badgeCleanupStatus = null,
  onAddTokenomics,
  onRemoveTokenomics,
  canIssueBadges = false,
}: AdvancedPanelProps) {
  const [badgeRecipient, setBadgeRecipient] = useState("");
  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeTokenId, setBadgeTokenId] = useState("");
  const [badgeExpiresAt, setBadgeExpiresAt] = useState("");
  const [expiryPreset, setExpiryPreset] = useState("never");
  const [registryTitle, setRegistryTitle] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [registryWeight, setRegistryWeight] = useState("");
  const [registryRenewDays, setRegistryRenewDays] = useState("");

  const recentBadges = useMemo(() => {
    const sorted = [...badges].sort((a, b) => {
      const aTime = new Date(a.issuedAt).getTime();
      const bTime = new Date(b.issuedAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeB - safeA;
    });
    return sorted.slice(0, 3);
  }, [badges]);

  const computeNextTokenId = (title: string) => {
    if (!title.trim()) return "";
    const registryEntry = badgeRegistry.find(
      (entry) => entry.title.toLowerCase() === title.toLowerCase()
    );
    const code =
      registryEntry?.code?.trim() ||
      title
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase();
    const count = badges.filter(
      (badge) => badge.badge.toLowerCase() === title.toLowerCase()
    ).length;
    const next = String(count + 1).padStart(3, "0");
    return `${code}-${next}`;
  };

  const handleExpiryPresetChange = (value: string) => {
    setExpiryPreset(value);
    if (value === "custom") return;
    if (value === "never") {
      setBadgeExpiresAt("");
      return;
    }
    const days = Number(value);
    if (!Number.isFinite(days)) return;
    const future = new Date();
    future.setDate(future.getDate() + days);
    setBadgeExpiresAt(future.toISOString().slice(0, 10));
  };

  const handleBadgeTitleChange = (value: string) => {
    setBadgeTitle(value);
    setBadgeTokenId(value ? computeNextTokenId(value) : "");
    setExpiryPreset("never");
    setBadgeExpiresAt("");

    if (!value.trim()) return;
    const registryEntry = badgeRegistry.find(
      (entry) => entry.title.toLowerCase() === value.toLowerCase()
    );
    const renewDays = Number(registryEntry?.renewDays ?? 0);
    if (!Number.isFinite(renewDays) || renewDays <= 0) return;

    const future = new Date();
    future.setDate(future.getDate() + renewDays);
    const presetOptions = new Set(["7", "30", "90", "180", "365"]);
    if (presetOptions.has(String(renewDays))) {
      setExpiryPreset(String(renewDays));
      setBadgeExpiresAt(future.toISOString().slice(0, 10));
      return;
    }
    setExpiryPreset("custom");
    setBadgeExpiresAt(future.toISOString().slice(0, 10));
  };
  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Advanced R&D Layer
        </p>
        <p className="text-sm text-[#5e5242]">
          Archive experiments, recognize contributors, and model incentive
          systems before they hit the chain.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="col-span-full grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Experiment Ledger</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const title = String(data.get("exp-title") || "").trim();
              const summary = String(data.get("exp-summary") || "").trim();
              const datasetUrl = String(
                data.get("exp-dataset") || ""
              ).trim();
              const hash = String(data.get("exp-hash") || "").trim();
              if (!title || !summary) return;
              onAddExperiment({ title, summary, datasetUrl, hash });
              form.reset();
            }}
          >
            <input
              name="exp-title"
              placeholder="Experiment title"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <textarea
              name="exp-summary"
              placeholder="Inputs, results, or hypothesis"
              className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              name="exp-dataset"
              placeholder="Dataset / repo link"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              name="exp-hash"
              placeholder="Evidence hash (auto if blank)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Log Experiment
            </button>
          </form>
          <div className="grid gap-2">
            {experiments.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No experiments logged yet.
              </p>
            ) : (
              experiments.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {entry.title}
                  </span>
                  <span>{entry.summary}</span>
                  {entry.datasetUrl && <span>{entry.datasetUrl}</span>}
                  <span>Hash: {entry.hash}</span>
                  <span>Logged: {entry.createdAt}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveExperiment(entry.id)}
                    className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid h-fit gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Badge Registry</p>
          {canIssueBadges ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!onAddBadgeRegistry) return;
                const title = registryTitle.trim();
                const code = registryCode.trim().toUpperCase();
                const weight = Number(registryWeight);
                const renewDays =
                  registryRenewDays.trim() === ""
                    ? null
                    : Number(registryRenewDays);
                if (!title || !code || !Number.isFinite(weight)) return;
                if (renewDays !== null && !Number.isFinite(renewDays)) return;
                onAddBadgeRegistry({ title, code, weight, renewDays });
                setRegistryTitle("");
                setRegistryCode("");
                setRegistryWeight("");
                setRegistryRenewDays("");
              }}
            >
              <input
                value={registryTitle}
                onChange={(event) => setRegistryTitle(event.target.value)}
                placeholder="Badge title (e.g., Core Researcher)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={registryCode}
                  onChange={(event) => setRegistryCode(event.target.value)}
                  placeholder="Token prefix (e.g., CORE)"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <input
                  value={registryWeight}
                  onChange={(event) => setRegistryWeight(event.target.value)}
                  placeholder="Voting weight"
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <input
                  value={registryRenewDays}
                  onChange={(event) => setRegistryRenewDays(event.target.value)}
                  placeholder="Auto-renew days (optional)"
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
              </div>
              <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
                Add Badge Type
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-[#5e5242]">
              Badge registry updates are restricted to the admin wallet.
            </p>
          )}
          <div className="grid gap-2">
            {badgeRegistry.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No badge types registered yet.
              </p>
            ) : (
              badgeRegistry.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eadfcf] bg-white/70 px-3 py-2 text-[11px] text-[#5e5242]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#1c1914]">
                      {entry.title}
                    </span>
                    <span>Prefix: {entry.code}</span>
                    <span>Weight: {entry.weight}</span>
                    <span>
                      Auto-renew:{" "}
                      {entry.renewDays && entry.renewDays > 0
                        ? `${entry.renewDays} days`
                        : "Off"}
                    </span>
                  </div>
                  {canIssueBadges && onRemoveBadgeRegistry && (
                    <button
                      type="button"
                      onClick={() => onRemoveBadgeRegistry(entry.id)}
                      className="text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid h-fit gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Reputation Badges</p>
          {canIssueBadges ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!badgeRecipient || !badgeTitle || !badgeTokenId) return;
                onAddBadge({
                  recipient: badgeRecipient,
                  badge: badgeTitle,
                  tokenId: badgeTokenId,
                  expiresAt: badgeExpiresAt || null,
                });
                setBadgeRecipient("");
                setBadgeTitle("");
                setBadgeTokenId("");
                setBadgeExpiresAt("");
                setExpiryPreset("never");
              }}
            >
              <input
                value={badgeRecipient}
                onChange={(event) => setBadgeRecipient(event.target.value)}
                placeholder="Recipient wallet"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              {badgeRegistry.length > 0 ? (
                <select
                  value={badgeTitle}
                  onChange={(event) => handleBadgeTitleChange(event.target.value)}
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                >
                  <option value="">Select badge type</option>
                  {badgeRegistry.map((entry) => (
                    <option key={entry.id} value={entry.title}>
                      {entry.title} (weight {entry.weight})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={badgeTitle}
                  onChange={(event) => handleBadgeTitleChange(event.target.value)}
                  placeholder="Badge type (e.g., Core Researcher)"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
              )}
              <input
                value={badgeTokenId}
                onChange={(event) => setBadgeTokenId(event.target.value)}
                placeholder="Token ID (auto-generated)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={badgeExpiresAt}
                  onChange={(event) => {
                    setBadgeExpiresAt(event.target.value);
                    setExpiryPreset("custom");
                  }}
                  type="date"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <select
                  value={expiryPreset}
                  onChange={(event) => handleExpiryPresetChange(event.target.value)}
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                >
                  <option value="never">No expiration</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>
              <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
                Issue Badge
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-[#5e5242]">
              Badge issuance is restricted to the admin wallet.
            </p>
          )}
          <div className="grid gap-2">
            {badges.length > 3 && (
              <p className="text-[10px] text-[#6b5b45]">
                Showing the latest 3 of {badges.length} active badges.
              </p>
            )}
            {badges.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No active badges issued yet.
              </p>
            ) : (
              recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {badge.badge}
                  </span>
                  <span>Recipient: {badge.recipient}</span>
                  <span>Token ID: {badge.tokenId}</span>
                  <span>Issued: {badge.issuedAt}</span>
                  <span>
                    Expires:{" "}
                    {badge.expiresAt
                      ? new Date(badge.expiresAt).toLocaleDateString()
                      : "Never"}
                  </span>
                  {canIssueBadges && (
                    <button
                      type="button"
                      onClick={() => onRemoveBadge(badge.id)}
                      className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="grid gap-2 rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Expired Badges
            </p>
            {onRunBadgeCleanup && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onRunBadgeCleanup}
                  className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                >
                  Run Cleanup
                </button>
                {badgeCleanupStatus && (
                  <span className="text-[11px] text-[#5e5242]">
                    {badgeCleanupStatus}
                  </span>
                )}
              </div>
            )}
            {expiredBadges.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No expired badges archived yet.
              </p>
            ) : (
              expiredBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/60 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {badge.badge}
                  </span>
                  <span>Recipient: {badge.recipient}</span>
                  <span>Token ID: {badge.tokenId}</span>
                  <span>Issued: {badge.issuedAt}</span>
                  <span>
                    Expired:{" "}
                    {badge.expiresAt
                      ? new Date(badge.expiresAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-full grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Tokenomics Sandbox</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const label = String(data.get("token-label") || "").trim();
              const rewardRate = Number(data.get("token-reward"));
              const lockupDays = Number(data.get("token-lockup"));
              const inflationRate = Number(data.get("token-inflation"));
              const notes = String(data.get("token-notes") || "").trim();
              if (!label || !Number.isFinite(rewardRate)) return;
              onAddTokenomics({ label, rewardRate, lockupDays, inflationRate, notes });
              form.reset();
            }}
          >
            <input
              name="token-label"
              placeholder="Scenario label"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="token-reward"
                type="number"
                min="0"
                step="0.01"
                placeholder="Reward / day"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="token-lockup"
                type="number"
                min="0"
                step="1"
                placeholder="Lockup days"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="token-inflation"
                type="number"
                min="0"
                step="0.1"
                placeholder="Inflation %"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <textarea
              name="token-notes"
              placeholder="Notes / assumptions"
              className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Scenario
            </button>
          </form>
          <div className="grid gap-2">
            {tokenomics.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No tokenomics scenarios defined.
              </p>
            ) : (
              tokenomics.map((scenario) => (
                <div
                  key={scenario.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {scenario.label}
                  </span>
                  <span>Reward/day: {scenario.rewardRate}</span>
                  <span>Lockup: {scenario.lockupDays} days</span>
                  <span>Inflation: {scenario.inflationRate}%</span>
                  <span>
                    Projected annual emissions: {scenario.projectedAnnualEmissions.toFixed(2)}
                  </span>
                  {scenario.notes && <span>{scenario.notes}</span>}
                  <button
                    type="button"
                    onClick={() => onRemoveTokenomics(scenario.id)}
                    className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
