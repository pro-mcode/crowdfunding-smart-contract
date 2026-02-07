"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONTRIBUTION_RUBRIC,
  CONTRIBUTION_TYPES,
  DEFAULT_ROLE_THRESHOLDS,
  computeContributionPoints,
} from "@/lib/contributionRubric";

type BadgeAutomationPanelProps = {
  getAdminAuth: () => Promise<{
    address: string;
    signature: string;
    timestamp: number;
  }>;
};

type IdentityLink = {
  id: string;
  walletAddress: string;
  githubHandle: string;
  gistUrl: string;
  verifiedAt: string;
};

type ContributionEntry = {
  id: string;
  walletAddress: string;
  type: string;
  points: number;
  quantity: number | null;
  evidence: string | null;
  occurredAt: string;
  status?: string;
};

type SnapshotEntry = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  snapshotHash: string;
  awardsCount?: number;
  totalContributors: number;
};

type SnapshotAward = {
  id: string;
  snapshotId: string;
  walletAddress: string;
  badgeTitle: string;
  points: number;
  issued: number;
  issuedAt: string | null;
  badgeId: string | null;
};

type SnapshotDetail = {
  snapshot: SnapshotEntry;
  awards: SnapshotAward[];
};

const buildLinkMessage = (handle: string, address: string, timestamp: number) =>
  `PherconsVault GitHub Link\nHandle: ${handle}\nAddress: ${address}\nTimestamp: ${timestamp}`;

export default function BadgeAutomationPanel({
  getAdminAuth,
}: BadgeAutomationPanelProps) {
  const [links, setLinks] = useState<IdentityLink[]>([]);
  const [contributions, setContributions] = useState<ContributionEntry[]>([]);
  const [pendingContributions, setPendingContributions] = useState<ContributionEntry[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewPoints, setReviewPoints] = useState<Record<string, string>>({});

  const [linkHandle, setLinkHandle] = useState("");
  const [linkGist, setLinkGist] = useState("");

  const [walletAddress, setWalletAddress] = useState("");
  const [contribType, setContribType] = useState(CONTRIBUTION_TYPES[0] ?? "");
  const [contribQuantity, setContribQuantity] = useState("");
  const [contribPoints, setContribPoints] = useState("");
  const [contribEvidence, setContribEvidence] = useState("");
  const [contribDate, setContribDate] = useState("");

  const [period, setPeriod] = useState("weekly");
  const [asOf, setAsOf] = useState("");
  const [thresholds, setThresholds] = useState({
    supporter: DEFAULT_ROLE_THRESHOLDS.supporter,
    developer: DEFAULT_ROLE_THRESHOLDS.developer,
    researcher: DEFAULT_ROLE_THRESHOLDS.researcher,
  });

  const [githubRepos, setGithubRepos] = useState("");
  const [githubHandles, setGithubHandles] = useState("");
  const [githubStart, setGithubStart] = useState("");
  const [githubEnd, setGithubEnd] = useState("");
  const [githubStatus, setGithubStatus] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const [chainId, setChainId] = useState("");
  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");
  const [onchainStatus, setOnchainStatus] = useState<string | null>(null);
  const [onchainError, setOnchainError] = useState<string | null>(null);
  const [onchainLoading, setOnchainLoading] = useState(false);

  const [snapshotDetail, setSnapshotDetail] = useState<SnapshotDetail | null>(
    null
  );
  const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const computedPoints = useMemo(() => {
    const quantity = contribQuantity ? Number(contribQuantity) : undefined;
    return computeContributionPoints(contribType, quantity);
  }, [contribType, contribQuantity]);

  const loadLinks = async () => {
    const res = await fetch("/api/identity-links");
    const payload = await res.json().catch(() => null);
    setLinks(Array.isArray(payload?.data) ? payload.data : []);
  };

  const loadContributions = async () => {
    const res = await fetch("/api/contributions");
    const payload = await res.json().catch(() => null);
    setContributions(Array.isArray(payload?.data) ? payload.data : []);
  };

  const loadSnapshots = async () => {
    const res = await fetch("/api/badge-snapshots");
    const payload = await res.json().catch(() => null);
    setSnapshots(Array.isArray(payload?.data) ? payload.data : []);
  };

  const loadPendingContributions = async () => {
    const res = await fetch("/api/contributions?status=pending");
    const payload = await res.json().catch(() => null);
    setPendingContributions(Array.isArray(payload?.data) ? payload.data : []);
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startIso = startDate.toISOString().slice(0, 10);
    setAsOf(today);
    setContribDate(today);
    setGithubStart(startIso);
    setGithubEnd(today);
    loadLinks();
    loadContributions();
    loadPendingContributions();
    loadSnapshots();
  }, []);

  const submitIdentityLink = async () => {
    setStatus(null);
    setError(null);
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/identity-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: { handle: linkHandle.trim(), gistUrl: linkGist.trim() },
          ...auth,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to verify identity link.");
      }
      setStatus("Identity link verified.");
      setLinkHandle("");
      setLinkGist("");
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify link.");
    }
  };

  const submitContribution = async () => {
    setStatus(null);
    setError(null);
    try {
      const auth = await getAdminAuth();
      const points =
        contribPoints.trim() !== ""
          ? Number(contribPoints)
          : computedPoints;
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            walletAddress: walletAddress.trim(),
            type: contribType,
            quantity: contribQuantity ? Number(contribQuantity) : null,
            points,
            evidence: contribEvidence.trim(),
            occurredAt: contribDate,
          },
          ...auth,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to add contribution.");
      }
      setStatus("Contribution added.");
      setWalletAddress("");
      setContribEvidence("");
      setContribQuantity("");
      setContribPoints("");
      setContribDate("");
      await loadContributions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add contribution.");
    }
  };

  const reviewContribution = async (
    id: string,
    status: "verified" | "rejected"
  ) => {
    setReviewStatus(null);
    setReviewError(null);
    try {
      const pointsOverride = reviewPoints[id];
      const points =
        pointsOverride && pointsOverride.trim() !== ""
          ? Number(pointsOverride)
          : undefined;
      const auth = await getAdminAuth();
      const response = await fetch("/api/contributions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, points, ...auth }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to update contribution.");
      }
      setReviewStatus(
        status === "verified" ? "Contribution approved." : "Contribution rejected."
      );
      await loadPendingContributions();
      await loadContributions();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Unable to update contribution."
      );
    }
  };

  const submitSnapshot = async () => {
    setStatus(null);
    setError(null);
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/badge-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            period,
            asOf: asOf || null,
            topN: 3,
            thresholds,
          },
          ...auth,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Snapshot generation failed.");
      }
      setStatus(
        `Snapshot generated. Awards: ${payload.awards}, issued: ${payload.issued}, skipped: ${payload.skipped}.`
      );
      await loadSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot generation failed.");
    }
  };

  const submitGithubIngest = async () => {
    setGithubStatus(null);
    setGithubError(null);
    setGithubLoading(true);
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/github-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            repos: githubRepos,
            handles: githubHandles,
            start: githubStart,
            end: githubEnd,
          },
          ...auth,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "GitHub ingestion failed.");
      }
      setGithubStatus(
        `GitHub sync complete. Added ${payload.created}, skipped ${payload.skipped}.`
      );
      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        setGithubError(payload.errors.join(" | "));
      }
      await loadContributions();
    } catch (err) {
      setGithubError(
        err instanceof Error ? err.message : "GitHub ingestion failed."
      );
    } finally {
      setGithubLoading(false);
    }
  };

  const submitOnchainIngest = async () => {
    setOnchainStatus(null);
    setOnchainError(null);
    setOnchainLoading(true);
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/onchain-contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            chainId: chainId ? Number(chainId) : undefined,
            fromBlock: fromBlock ? Number(fromBlock) : undefined,
            toBlock: toBlock ? Number(toBlock) : undefined,
          },
          ...auth,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "On-chain sync failed.");
      }
      setOnchainStatus(
        `On-chain sync complete. Added ${payload.created}, skipped ${payload.skipped}.`
      );
      await loadContributions();
    } catch (err) {
      setOnchainError(
        err instanceof Error ? err.message : "On-chain sync failed."
      );
    } finally {
      setOnchainLoading(false);
    }
  };

  const loadSnapshotDetail = async (id: string) => {
    setSnapshotStatus(null);
    setSnapshotError(null);
    try {
      const res = await fetch(`/api/badge-snapshots/${id}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? "Unable to load snapshot.");
      }
      setSnapshotDetail(payload.data ?? null);
      setSnapshotStatus("Snapshot details loaded.");
    } catch (err) {
      setSnapshotError(
        err instanceof Error ? err.message : "Unable to load snapshot."
      );
    }
  };

  const exportSnapshotCsv = () => {
    if (!snapshotDetail) return;
    const { snapshot, awards } = snapshotDetail;
    const header = [
      "snapshotId",
      "snapshotHash",
      "period",
      "periodStart",
      "periodEnd",
      "walletAddress",
      "badgeTitle",
      "points",
      "issued",
      "issuedAt",
      "badgeId",
    ];
    const rows = awards.map((award) =>
      [
        snapshot.id,
        snapshot.snapshotHash,
        snapshot.period,
        snapshot.periodStart,
        snapshot.periodEnd,
        award.walletAddress,
        award.badgeTitle,
        award.points,
        award.issued,
        award.issuedAt ?? "",
        award.badgeId ?? "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `badge-snapshot-${snapshot.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const linkMessagePreview = useMemo(() => {
    if (!linkHandle.trim()) return null;
    return buildLinkMessage(linkHandle.trim(), "0xYOUR_WALLET", Date.now());
  }, [linkHandle]);

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Contribution & Badge Automation
        </p>
        <p className="text-sm text-[#5e5242]">
          Verify GitHub identities, log contributions, and issue snapshot-based
          badges across on-chain, GitHub, publication, and research sources.
        </p>
      </div>
      <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
          Configuration
        </p>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span>Issuance Method</span>
            <span className="font-mono text-[#1c1914]">
              Off-chain badges (Recommended)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Top Contributor Rule</span>
            <span className="font-mono text-[#1c1914]">
              Top 3 overall (Recommended)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>GitHub Verification</span>
            <span className="font-mono text-[#1c1914]">
              Signed message + Gist (Recommended)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Snapshot Cadence</span>
            <span className="font-mono text-[#1c1914]">
              Weekly / Monthly / Quarterly
            </span>
          </div>
        </div>
      </div>

      {status && <p className="text-xs text-[#1c1914]">{status}</p>}
      {error && <p className="text-xs text-[#9a2c20]">{error}</p>}

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <p className="uppercase tracking-[0.35em] text-[#6b5b45]">
            GitHub Identity Links
          </p>
          <span className="text-[10px] text-[#6b5b45]">
            {links.length} verified
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-2">
            <input
              value={linkHandle}
              onChange={(event) => setLinkHandle(event.target.value)}
              placeholder="GitHub handle"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              value={linkGist}
              onChange={(event) => setLinkGist(event.target.value)}
              placeholder="Gist URL with signature JSON"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button
              type="button"
              onClick={submitIdentityLink}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Verify Link
            </button>
          </div>
          <div className="grid gap-2 rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-3 text-[11px]">
            <p className="uppercase tracking-[0.3em] text-[#6b5b45]">
              Gist Template
            </p>
            <p>
              Contributors sign the message below and paste the JSON into a
              public Gist.
            </p>
            <pre className="whitespace-pre-wrap rounded-xl border border-[#eadfcf] bg-white/80 p-2 text-[10px] text-[#5e5242]">
{JSON.stringify(
  {
    handle: linkHandle || "octocat",
    address: "0xYOUR_WALLET",
    timestamp: 1700000000000,
    signature: "0xSIGNATURE",
    message: linkMessagePreview ?? "",
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      <div className="grid gap-2">
          {links.length === 0 ? (
            <p>No GitHub identities linked yet.</p>
          ) : (
            links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eadfcf] bg-white/70 px-3 py-2 text-[11px]"
              >
                <span className="text-xs text-[#1c1914]">
                  @{link.githubHandle}
                </span>
                <span className="break-all">{link.walletAddress}</span>
                <span>{new Date(link.verifiedAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <p className="uppercase tracking-[0.35em] text-[#6b5b45]">
            Automatic Ingestion
          </p>
          <span className="text-[10px] text-[#6b5b45]">
            GitHub + On-chain
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                GitHub Sync
              </span>
            </div>
            <input
              value={githubRepos}
              onChange={(event) => setGithubRepos(event.target.value)}
              placeholder="Repos (owner/name, comma separated)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              value={githubHandles}
              onChange={(event) => setGithubHandles(event.target.value)}
              placeholder="Only these GitHub handles (optional)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={githubStart}
                onChange={(event) => setGithubStart(event.target.value)}
                type="date"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                value={githubEnd}
                onChange={(event) => setGithubEnd(event.target.value)}
                type="date"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button
              type="button"
              onClick={submitGithubIngest}
              disabled={githubLoading}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {githubLoading ? "Syncing..." : "Sync GitHub"}
            </button>
            {githubStatus && (
              <span className="text-[11px] text-[#1c1914]">
                {githubStatus}
              </span>
            )}
            {githubError && (
              <span className="text-[11px] text-[#9a2c20]">{githubError}</span>
            )}
          </div>

          <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                On-chain Sync
              </span>
            </div>
            <input
              value={chainId}
              onChange={(event) => setChainId(event.target.value)}
              type="number"
              min="0"
              placeholder="Chain ID (optional)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={fromBlock}
                onChange={(event) => setFromBlock(event.target.value)}
                type="number"
                min="0"
                placeholder="From block (optional)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                value={toBlock}
                onChange={(event) => setToBlock(event.target.value)}
                type="number"
                min="0"
                placeholder="To block (optional)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button
              type="button"
              onClick={submitOnchainIngest}
              disabled={onchainLoading}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {onchainLoading ? "Syncing..." : "Sync On-chain Funded"}
            </button>
            {onchainStatus && (
              <span className="text-[11px] text-[#1c1914]">
                {onchainStatus}
              </span>
            )}
            {onchainError && (
              <span className="text-[11px] text-[#9a2c20]">
                {onchainError}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <p className="uppercase tracking-[0.35em] text-[#6b5b45]">
            Log Contribution
          </p>
          <span className="text-[10px] text-[#6b5b45]">
            {contributions.length} entries
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-2">
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              list="wallet-addresses"
              placeholder="Wallet address"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <datalist id="wallet-addresses">
              {links.map((link) => (
                <option key={link.id} value={link.walletAddress}>
                  {link.githubHandle}
                </option>
              ))}
            </datalist>
            <select
              value={contribType}
              onChange={(event) => setContribType(event.target.value)}
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              {CONTRIBUTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTRIBUTION_RUBRIC[type]?.label ?? type}
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={contribQuantity}
                onChange={(event) => setContribQuantity(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                placeholder={`Quantity (${CONTRIBUTION_RUBRIC[contribType]?.unit ?? "count"})`}
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                value={contribPoints}
                onChange={(event) => setContribPoints(event.target.value)}
                type="number"
                min="0"
                step="1"
                placeholder={`Points (auto ${computedPoints})`}
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <input
              value={contribEvidence}
              onChange={(event) => setContribEvidence(event.target.value)}
              placeholder="Evidence URL or hash"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              value={contribDate}
              onChange={(event) => setContribDate(event.target.value)}
              type="date"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button
              type="button"
              onClick={submitContribution}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Add Contribution
            </button>
          </div>
          <div className="grid gap-2">
            {contributions.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#1c1914]">
                    {entry.walletAddress}
                  </span>
                  <span>{new Date(entry.occurredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  {CONTRIBUTION_RUBRIC[entry.type]?.label ?? entry.type} ·{" "}
                  {entry.points} pts
                </div>
                {entry.evidence && (
                  <div className="break-all text-[10px]">{entry.evidence}</div>
                )}
              </div>
            ))}
            {contributions.length === 0 && (
              <p>No contributions logged yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <p className="uppercase tracking-[0.35em] text-[#6b5b45]">
            Submission Review
          </p>
          <span className="text-[10px] text-[#6b5b45]">
            {pendingContributions.length} pending
          </span>
        </div>
        {reviewStatus && (
          <span className="text-[11px] text-[#1c1914]">{reviewStatus}</span>
        )}
        {reviewError && (
          <span className="text-[11px] text-[#9a2c20]">{reviewError}</span>
        )}
        {pendingContributions.length === 0 ? (
          <p>No pending submissions right now.</p>
        ) : (
          <div className="grid gap-2">
            {pendingContributions.map((entry) => (
              <div
                key={entry.id}
                className="grid gap-2 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#1c1914]">
                    {entry.walletAddress}
                  </span>
                  <span>{new Date(entry.occurredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  {CONTRIBUTION_RUBRIC[entry.type]?.label ?? entry.type} ·{" "}
                  {entry.points} pts
                </div>
                {entry.evidence && (
                  <a
                    href={entry.evidence}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-[10px] text-[#1c1914] underline"
                  >
                    {entry.evidence}
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={
                      reviewPoints[entry.id] ?? String(entry.points ?? "")
                    }
                    onChange={(event) =>
                      setReviewPoints((prev) => ({
                        ...prev,
                        [entry.id]: event.target.value,
                      }))
                    }
                    type="number"
                    min="0"
                    step="1"
                    className="w-28 rounded-xl border border-[#d3c2a6] bg-white px-2 py-1 text-[11px] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                  />
                  <button
                    type="button"
                    onClick={() => reviewContribution(entry.id, "verified")}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewContribution(entry.id, "rejected")}
                    className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <p className="uppercase tracking-[0.35em] text-[#6b5b45]">
            Snapshot Generator
          </p>
          <span className="text-[10px] text-[#6b5b45]">
            Top 3 overall
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-2">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <input
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
              type="date"
              className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={thresholds.supporter}
                onChange={(event) =>
                  setThresholds((prev) => ({
                    ...prev,
                    supporter: Number(event.target.value),
                  }))
                }
                type="number"
                min="0"
                step="1"
                placeholder="Supporter"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                value={thresholds.developer}
                onChange={(event) =>
                  setThresholds((prev) => ({
                    ...prev,
                    developer: Number(event.target.value),
                  }))
                }
                type="number"
                min="0"
                step="1"
                placeholder="Developer"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                value={thresholds.researcher}
                onChange={(event) =>
                  setThresholds((prev) => ({
                    ...prev,
                    researcher: Number(event.target.value),
                  }))
                }
                type="number"
                min="0"
                step="1"
                placeholder="Researcher"
                className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button
              type="button"
              onClick={submitSnapshot}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Generate Snapshot & Issue Badges
            </button>
          </div>
          <div className="grid gap-2">
            {snapshots.slice(0, 5).map((snapshot) => (
              <div
                key={snapshot.id}
                className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#1c1914]">
                  <span className="uppercase tracking-[0.2em] text-[10px]">
                    {snapshot.period}
                  </span>
                  <span>{new Date(snapshot.generatedAt).toLocaleDateString()}</span>
                </div>
                <div className="text-[10px] text-[#5e5242]">
                  {snapshot.awardsCount ?? 0} awards · {snapshot.totalContributors} contributors
                </div>
                <div className="break-all text-[10px] text-[#5e5242]">
                  Hash: {snapshot.snapshotHash.slice(0, 18)}…
                </div>
                <button
                  type="button"
                  onClick={() => loadSnapshotDetail(snapshot.id)}
                  className="mt-2 w-fit rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                >
                  View Details
                </button>
              </div>
            ))}
            {snapshots.length === 0 && (
              <p>No snapshots generated yet.</p>
            )}
          </div>
        </div>
        {snapshotStatus && (
          <span className="text-[11px] text-[#1c1914]">{snapshotStatus}</span>
        )}
        {snapshotError && (
          <span className="text-[11px] text-[#9a2c20]">{snapshotError}</span>
        )}
        {snapshotDetail && (
          <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3 text-[11px] text-[#5e5242]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                Snapshot Details
              </span>
              <button
                type="button"
                onClick={exportSnapshotCsv}
                className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                Export CSV
              </button>
            </div>
            <div className="text-[10px] text-[#6b5b45]">
              Period {snapshotDetail.snapshot.period} · {snapshotDetail.snapshot.periodStart} → {snapshotDetail.snapshot.periodEnd}
            </div>
            <div className="grid gap-2">
              {snapshotDetail.awards.map((award) => (
                <div
                  key={award.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eadfcf] bg-white/70 px-3 py-2"
                >
                  <span className="text-xs text-[#1c1914]">
                    {award.walletAddress}
                  </span>
                  <span>{award.badgeTitle}</span>
                  <span>{award.points} pts</span>
                  <span>{award.issued ? "Issued" : "Skipped"}</span>
                </div>
              ))}
              {snapshotDetail.awards.length === 0 && (
                <span>No awards recorded for this snapshot.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
