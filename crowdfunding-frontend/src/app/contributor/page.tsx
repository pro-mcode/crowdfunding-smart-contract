"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrowserProvider } from "ethers";
import SiteShell from "@/components/SiteShell";
import {
  CONTRIBUTION_RUBRIC,
  DEFAULT_ROLE_THRESHOLDS,
} from "@/lib/contributionRubric";

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
};

type LeaderboardEntry = {
  rank: number;
  wallet: string;
  totalPoints: number;
  categoryPoints: {
    supporter: number;
    developer: number;
    researcher: number;
  };
};

type LeaderboardPeriod = {
  periodStart: string;
  periodEnd: string;
  totalContributors: number;
  top: LeaderboardEntry[];
};

type LeaderboardData = Record<string, LeaderboardPeriod>;

const buildContributionMessage = (payload: {
  address: string;
  type: string;
  evidence: string;
  occurredAt: string;
  quantity: number | null;
  timestamp: number;
}) =>
  `PherconsVault Contribution Submission\nAddress: ${payload.address}\nType: ${payload.type}\nEvidence: ${payload.evidence}\nOccurredAt: ${payload.occurredAt}\nQuantity: ${payload.quantity ?? 1}\nTimestamp: ${payload.timestamp}`;

const buildGithubLinkMessage = (
  handle: string,
  address: string,
  timestamp: number
) => {
  return `PherconsVault GitHub Link\nHandle: ${handle}\nAddress: ${address}\nTimestamp: ${timestamp}`;
};

export default function ContributorPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activeBadges, setActiveBadges] = useState<BadgeEntry[]>([]);
  const [expiredBadges, setExpiredBadges] = useState<BadgeEntry[]>([]);

  const [githubHandle, setGithubHandle] = useState("");
  const [gistUrl, setGistUrl] = useState("");
  const [linkPayload, setLinkPayload] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [leaderboardRole, setLeaderboardRole] = useState("overall");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [submissionType, setSubmissionType] = useState("publication.doi");
  const [submissionEvidence, setSubmissionEvidence] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [submissionQuantity, setSubmissionQuantity] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  const connectWallet = async () => {
    setError(null);
    setStatus(null);
    if (!provider) {
      setError("No wallet found. Install MetaMask or another provider.");
      return;
    }
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts?.[0] ?? null);
    } catch {
      setError("Wallet connection rejected.");
    }
  };

  const loadSummary = async (address: string) => {
    const response = await fetch(
      `/api/contributions/summary?address=${address}`
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to load summary.");
    }
    setSummary(payload?.data ?? null);
  };

  const loadBadges = async (address: string) => {
    const response = await fetch(`/api/badges?address=${address}&status=active`);
    const payload = await response.json().catch(() => null);
    const list = Array.isArray(payload?.data) ? payload.data : [];
    setActiveBadges(list);
    const expiredRes = await fetch("/api/badges/archive");
    const expiredPayload = await expiredRes.json().catch(() => null);
    const expiredList = Array.isArray(expiredPayload?.data)
      ? expiredPayload.data
      : [];
    setExpiredBadges(
      expiredList.filter(
        (badge: BadgeEntry & { recipient?: string }) =>
          badge.recipient?.toLowerCase?.() === address.toLowerCase()
      )
    );
  };

  useEffect(() => {
    if (!walletAddress) return;
    setStatus("Loading your contribution snapshot...");
    Promise.all([loadSummary(walletAddress), loadBadges(walletAddress)])
      .then(() => setStatus(null))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load data.")
      );
  }, [walletAddress]);

  useEffect(() => {
    setLeaderboardStatus("Loading leaderboard...");
    setLeaderboardError(null);
    fetch(`/api/leaderboard?role=${leaderboardRole}`)
      .then((res) => res.json())
      .then((payload) => {
        setLeaderboardData(payload?.data ?? null);
        setLeaderboardStatus(null);
      })
      .catch(() => {
        setLeaderboardError("Unable to load leaderboard.");
        setLeaderboardStatus(null);
      });
  }, [leaderboardRole]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setSubmissionDate(today);
  }, []);

  const signGithubLink = async () => {
    if (!provider || !walletAddress) {
      setLinkError("Connect your wallet first.");
      return;
    }
    if (!githubHandle.trim()) {
      setLinkError("Enter your GitHub handle.");
      return;
    }
    setLinkError(null);
    setLinkStatus(null);
    try {
      const signer = await provider.getSigner();
      const timestamp = Date.now();
      const message = buildGithubLinkMessage(
        githubHandle.trim(),
        walletAddress,
        timestamp
      );
      const signature = await signer.signMessage(message);
      const payload = {
        handle: githubHandle.trim(),
        address: walletAddress,
        timestamp,
        signature,
        message,
      };
      setLinkPayload(JSON.stringify(payload, null, 2));
      setLinkStatus("Signature created. Paste into a public GitHub Gist.");
    } catch {
      setLinkError("Signature request rejected.");
    }
  };

  const verifyGist = async () => {
    if (!githubHandle.trim() || !gistUrl.trim()) {
      setLinkError("Provide your handle and Gist URL.");
      return;
    }
    setLinkError(null);
    setLinkStatus(null);
    try {
      const response = await fetch("/api/identity-links/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: { handle: githubHandle.trim(), gistUrl: gistUrl.trim() },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to verify Gist.");
      }
      setLinkStatus(
        payload?.alreadyLinked
          ? "GitHub identity already verified."
          : "GitHub identity verified."
      );
      setGistUrl("");
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Unable to verify Gist.");
    }
  };

  const copyPayload = async () => {
    if (!linkPayload) return;
    try {
      await navigator.clipboard.writeText(linkPayload);
      setLinkStatus("Gist JSON copied to clipboard.");
    } catch {
      setLinkError("Unable to copy. Please select and copy manually.");
    }
  };

  const submitPublicContribution = async () => {
    if (!provider || !walletAddress) {
      setSubmissionError("Connect your wallet first.");
      return;
    }
    if (!submissionEvidence.trim()) {
      setSubmissionError("Evidence URL or hash is required.");
      return;
    }
    setSubmissionStatus(null);
    setSubmissionError(null);
    try {
      const signer = await provider.getSigner();
      const timestamp = Date.now();
      const occurredAt = submissionDate
        ? new Date(submissionDate).toISOString()
        : new Date().toISOString();
      const quantity =
        submissionQuantity.trim() === ""
          ? null
          : Number(submissionQuantity);
      const message = buildContributionMessage({
        address: walletAddress,
        type: submissionType,
        evidence: submissionEvidence.trim(),
        occurredAt,
        quantity,
        timestamp,
      });
      const signature = await signer.signMessage(message);
      const response = await fetch("/api/contributions/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            address: walletAddress,
            type: submissionType,
            evidence: submissionEvidence.trim(),
            occurredAt,
            quantity,
            timestamp,
            signature,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit contribution.");
      }
      setSubmissionStatus(
        payload?.alreadyLogged
          ? "Contribution already logged."
          : "Contribution submitted."
      );
      setSubmissionEvidence("");
      setSubmissionQuantity("");
      await loadSummary(walletAddress);
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "Unable to submit contribution."
      );
    }
  };

  const renderPeriodCard = (label: string, data?: SummaryPeriod) => {
    if (!data) return null;
    return (
      <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
            {label}
          </span>
          <span className="text-[10px] text-[#6b5b45]">
            {data.periodStart.slice(0, 10)} → {data.periodEnd.slice(0, 10)}
          </span>
        </div>
        <div className="grid gap-1 text-sm text-[#1c1914]">
          <span>Total points: {data.totalPoints}</span>
          <span>
            Rank:{" "}
            {data.rank ? `#${data.rank}` : "Unranked"} of{" "}
            {data.totalContributors}
          </span>
        </div>
        <div className="grid gap-1 text-[11px]">
          <span>
            Supporter: {data.categoryPoints.supporter}/
            {data.thresholds.supporter}
          </span>
          <span>
            Developer: {data.categoryPoints.developer}/
            {data.thresholds.developer}
          </span>
          <span>
            Researcher: {data.categoryPoints.researcher}/
            {data.thresholds.researcher}
          </span>
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
  };

  const renderProgressBar = (value: number, max: number) => {
    const safeMax = max > 0 ? max : 1;
    const percent = Math.min(100, Math.round((value / safeMax) * 100));
    return (
      <div className="h-2 w-full rounded-full bg-[#eadfcf]">
        <div
          className="h-2 rounded-full bg-[#1c1914]"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  const renderLeaderboardRow = (entry: LeaderboardEntry) => (
    <div
      key={`${entry.wallet}-${entry.rank}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eadfcf] bg-white/70 px-3 py-2 text-[11px] text-[#5e5242]"
    >
      <span className="text-xs text-[#1c1914]">#{entry.rank}</span>
      <Link
        href={`/contributors/${entry.wallet}`}
        className="break-all text-[#1c1914] underline"
      >
        {entry.wallet.slice(0, 6)}…{entry.wallet.slice(-4)}
      </Link>
      <span>
        {leaderboardRole === "overall"
          ? entry.totalPoints
          : leaderboardRole === "supporter"
          ? entry.categoryPoints.supporter
          : leaderboardRole === "developer"
          ? entry.categoryPoints.developer
          : entry.categoryPoints.researcher}{" "}
        pts
      </span>
    </div>
  );

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Contributor Portal
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Contributions & Badges
          </h1>
          <p className="text-sm text-[#5e5242]">
            Link your GitHub, preview badge eligibility, and track your
            contribution score before each snapshot.
          </p>
          {!walletAddress && (
            <button
              onClick={connectWallet}
              className="w-full rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] sm:w-auto"
            >
              Connect Wallet
            </button>
          )}
          {walletAddress && (
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
              Connected wallet:{" "}
              <span className="text-[#1c1914]">{walletAddress}</span>
              <div className="mt-2">
                <Link
                  href={`/contributors/${walletAddress}`}
                  className="text-[10px] uppercase tracking-[0.2em] text-[#1c1914] underline"
                >
                  View public profile
                </Link>
              </div>
            </div>
          )}
          {status && <p className="text-xs text-[#1c1914]">{status}</p>}
          {error && <p className="text-xs text-[#9a2c20]">{error}</p>}
        </header>

        <section className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Interaction Flow
          </p>
          <div className="grid gap-3 text-sm text-[#5e5242] lg:grid-cols-4">
            {[
              "Connect your wallet to establish identity.",
              "Link GitHub via signed message + Gist.",
              "Submit on-chain, GitHub, publication, or research evidence.",
              "Snapshots award off-chain badges to top contributors.",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Step {index + 1}
                </span>
                <p className="mt-2 text-sm text-[#1c1914]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Link GitHub
            </p>
            <p className="text-sm text-[#5e5242]">
              Sign the message, paste the JSON into a public Gist, and verify
              the link.
            </p>
            <input
              value={githubHandle}
              onChange={(event) => setGithubHandle(event.target.value)}
              placeholder="GitHub handle"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button
              type="button"
              onClick={signGithubLink}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Sign Link Message
            </button>
            {linkPayload && (
              <div className="grid gap-2 rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-3 text-[11px]">
                <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                  Gist JSON
                </span>
                <pre className="whitespace-pre-wrap text-[10px] text-[#5e5242]">
                  {linkPayload}
                </pre>
                <button
                  type="button"
                  onClick={copyPayload}
                  className="w-fit rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                >
                  Copy JSON
                </button>
              </div>
            )}
            <input
              value={gistUrl}
              onChange={(event) => setGistUrl(event.target.value)}
              placeholder="Paste your Gist URL"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button
              type="button"
              onClick={verifyGist}
              className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Verify GitHub Link
            </button>
            {linkStatus && <span className="text-xs text-[#1c1914]">{linkStatus}</span>}
            {linkError && <span className="text-xs text-[#9a2c20]">{linkError}</span>}
          </div>

          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Snapshot Preview
            </p>
            <p className="text-sm text-[#5e5242]">
              If a snapshot ran today, these are the badges you would earn.
            </p>
            <div className="grid gap-3">
              {renderPeriodCard("Weekly", summary?.periods?.weekly)}
              {renderPeriodCard("Monthly", summary?.periods?.monthly)}
              {renderPeriodCard("Quarterly", summary?.periods?.quarterly)}
            </div>
          </div>
        </div>

        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Progress Tracker
          </p>
          <p className="text-sm text-[#5e5242]">
            See how close you are to each badge threshold across the snapshot
            windows.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {["weekly", "monthly", "quarterly"].map((periodKey) => {
              const data = summary?.periods?.[periodKey] as SummaryPeriod | undefined;
              if (!data) return null;
              return (
                <div
                  key={periodKey}
                  className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]"
                >
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                      {periodKey}
                    </span>
                    <span className="text-[10px] text-[#6b5b45]">
                      Rank {data.rank ? `#${data.rank}` : "—"}
                    </span>
                  </div>
                  <div className="grid gap-2">
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
        </div>

        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                Leaderboard
              </p>
              <p className="text-sm text-[#5e5242]">
                Top 3 contributors by period. Filter by role to spotlight
                supporters, developers, or researchers.
              </p>
            </div>
            <select
              value={leaderboardRole}
              onChange={(event) => setLeaderboardRole(event.target.value)}
              className="rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="overall">Overall</option>
              <option value="supporter">Supporter</option>
              <option value="developer">Developer</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
          {leaderboardStatus && (
            <span className="text-xs text-[#1c1914]">{leaderboardStatus}</span>
          )}
          {leaderboardError && (
            <span className="text-xs text-[#9a2c20]">{leaderboardError}</span>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            {(["weekly", "monthly", "quarterly"] as const).map((periodKey) => {
              const period = leaderboardData?.[periodKey];
              return (
                <div
                  key={periodKey}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]"
                >
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                      {periodKey}
                    </span>
                    {period && (
                      <span className="text-[10px] text-[#6b5b45]">
                        {period.totalContributors} contributors
                      </span>
                    )}
                  </div>
                  {period ? (
                    <div className="grid gap-2">
                      {period.top.length === 0 ? (
                        <span className="text-sm text-[#5e5242]">
                          No contributions yet.
                        </span>
                      ) : (
                        period.top.map(renderLeaderboardRow)
                      )}
                      <div className="text-[10px] text-[#6b5b45]">
                        {period.periodStart.slice(0, 10)} →{" "}
                        {period.periodEnd.slice(0, 10)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-[#5e5242]">Loading…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Submit Publication or Research
          </p>
          <p className="text-sm text-[#5e5242]">
            Add a DOI/IPFS link or dataset hash and we will log the contribution
            automatically.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="grid gap-2">
              <select
                value={submissionType}
                onChange={(event) => setSubmissionType(event.target.value)}
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              >
                <option value="publication.doi">Publication (DOI/IPFS)</option>
                <option value="research.report">Research Report</option>
                <option value="research.dataset">Dataset Release</option>
                <option value="research.audit">Security Audit</option>
              </select>
              <input
                value={submissionEvidence}
                onChange={(event) => setSubmissionEvidence(event.target.value)}
                placeholder="Evidence URL, DOI, or hash"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={submissionDate}
                  onChange={(event) => setSubmissionDate(event.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <input
                  value={submissionQuantity}
                  onChange={(event) => setSubmissionQuantity(event.target.value)}
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Quantity (optional)"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
              </div>
              <button
                type="button"
                onClick={submitPublicContribution}
                className="w-fit rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                Sign & Submit Contribution
              </button>
              {submissionStatus && (
                <span className="text-xs text-[#1c1914]">
                  {submissionStatus}
                </span>
              )}
              {submissionError && (
                <span className="text-xs text-[#9a2c20]">
                  {submissionError}
                </span>
              )}
            </div>
            <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
              <span className="uppercase tracking-[0.3em] text-[#6b5b45]">
                Scoring Preview
              </span>
              <div>
                Type: {CONTRIBUTION_RUBRIC[submissionType]?.label ?? submissionType}
              </div>
              <div>
                Points:{" "}
                {CONTRIBUTION_RUBRIC[submissionType]?.points ??
                  `${CONTRIBUTION_RUBRIC[submissionType]?.pointsPerUnit ?? 0} / ${CONTRIBUTION_RUBRIC[submissionType]?.unit ?? "unit"}`}
              </div>
              <div className="text-[11px]">
                Your submission will be scored in the next snapshot.
              </div>
            </div>
          </div>
        </div>

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
              <p className="text-sm text-[#5e5242]">
                No contributions logged yet.
              </p>
            )}
          </div>

          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Your Badges
            </p>
            <div className="grid gap-2">
              {activeBadges.length === 0 ? (
                <p className="text-sm text-[#5e5242]">
                  No active badges yet.
                </p>
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

        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Scoring Rubric
          </p>
          <p className="text-sm text-[#5e5242]">
            Contribution scores are calculated from the rubric below each
            snapshot.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-[11px] text-[#5e5242]">
            {Object.entries(CONTRIBUTION_RUBRIC).map(([type, entry]) => (
              <div
                key={type}
                className="rounded-xl border border-[#eadfcf] bg-white/70 p-3"
              >
                <div className="text-xs text-[#1c1914]">{entry.label}</div>
                <div>Type: {type}</div>
                <div>
                  Points:{" "}
                  {entry.points !== undefined
                    ? entry.points
                    : `${entry.pointsPerUnit ?? 0} / ${entry.unit ?? "unit"}`}
                </div>
                {entry.cap !== undefined && <div>Cap: {entry.cap}</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </SiteShell>
  );
}
