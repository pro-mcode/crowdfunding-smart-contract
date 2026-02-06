"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { makeHandle } from "@/lib/handle";

type Proposal = {
  id: string;
  title: string;
  track: string;
  summary: string;
  proposer?: string | null;
  proposerAddress?: string | null;
  proposerHandle?: string | null;
  requestedEth: number;
  status: "Draft" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
};

type Vote = {
  id: string;
  proposalId: string;
  voter: string;
  choice: "For" | "Against" | "Abstain";
  weight: number;
  timestamp: string;
};

type Badge = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt?: string | null;
};

type BadgeRegistry = {
  id: string;
  title: string;
  code: string;
  weight: number;
  createdAt: string;
};

type MilestoneUnlock = {
  id: string;
  proposalId?: string;
  milestoneTitle: string;
  amountEth: number;
  proofHash: string;
  dueDate: string;
  status: "Pending" | "Unlocked" | "Released";
  releasedAt: string | null;
};

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const proposalId = params?.id;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [unlocks, setUnlocks] = useState<MilestoneUnlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [voteQuery, setVoteQuery] = useState("");
  const [voteSort, setVoteSort] = useState<"newest" | "oldest" | "weight">(
    "newest"
  );
  const [votePage, setVotePage] = useState(1);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [identity, setIdentity] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeRegistry, setBadgeRegistry] = useState<BadgeRegistry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTrack, setEditTrack] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editRequestedEth, setEditRequestedEth] = useState("");
  const [editStatus, setEditStatus] = useState<Proposal["status"]>("Draft");
  const pageSize = 4;
  const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  const weightForBadge = (badgeLabel: string) => {
    const label = badgeLabel.trim().toLowerCase();
    const registryMatch = badgeRegistry.find(
      (entry) => entry.title.toLowerCase() === label
    );
    if (registryMatch) return Number(registryMatch.weight || 0);
    if (label.includes("core")) return 5;
    if (label.includes("lead")) return 4;
    if (label.includes("reviewer")) return 3;
    if (label.includes("advisor")) return 2;
    if (label.includes("contributor")) return 1;
    if (label.includes("supporter")) return 1;
    return 1;
  };
  const shortenAddress = (value: string) => {
    if (!value) return "—";
    return value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
  };

  const tally = useMemo(() => {
    return votes.reduce(
      (acc, vote) => {
        if (vote.choice === "For") acc.for += vote.weight;
        if (vote.choice === "Against") acc.against += vote.weight;
        if (vote.choice === "Abstain") acc.abstain += vote.weight;
        return acc;
      },
      { for: 0, against: 0, abstain: 0, total: votes.length }
    );
  }, [votes]);

  const filteredVotes = votes.filter((vote) => {
    const query = voteQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      vote.voter.toLowerCase().includes(query) ||
      vote.choice.toLowerCase().includes(query) ||
      vote.proposalId.toLowerCase().includes(query)
    );
  });

  const sortedVotes = [...filteredVotes].sort((a, b) => {
    if (voteSort === "weight") return b.weight - a.weight;
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return voteSort === "newest" ? bTime - aTime : aTime - bTime;
  });

  const votePageCount = Math.max(1, Math.ceil(sortedVotes.length / pageSize));
  const votePageItems = sortedVotes.slice(
    (votePage - 1) * pageSize,
    votePage * pageSize
  );

  const relatedUnlocks = unlocks.filter(
    (unlock) =>
      unlock.proposalId === proposalId ||
      unlock.milestoneTitle
        .toLowerCase()
        .includes(proposal?.title.toLowerCase() ?? "")
  );

  const normalizedIdentity = identity.trim().toLowerCase();
  const adminAddress = process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase();
  const proposerHandle = (
    proposal?.proposerHandle ||
    makeHandle(proposal?.proposerAddress ?? proposal?.proposer)
  )
    .trim()
    .toLowerCase();
  const canManage =
    Boolean(normalizedIdentity) &&
    (normalizedIdentity === proposerHandle ||
      (adminAddress && normalizedIdentity === adminAddress));

  const matchedBadges = useMemo(() => {
    if (!walletAddress) return [];
    const now = Date.now();
    return badges.filter(
      (badge) => {
        if (badge.recipient.toLowerCase() !== walletAddress.toLowerCase()) {
          return false;
        }
        if (!badge.expiresAt) return true;
        const parsed = Date.parse(badge.expiresAt);
        if (Number.isNaN(parsed)) return true;
        return parsed > now;
      }
    );
  }, [badges, walletAddress]);

  const expiryCountdown = useMemo(() => {
    const active = matchedBadges
      .map((badge) => badge.expiresAt)
      .filter(Boolean) as string[];
    if (active.length === 0) return "No expiration";
    const soonest = active
      .map((value) => Date.parse(value))
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => a - b)[0];
    if (!soonest) return "No expiration";
    const diffMs = Math.max(soonest - Date.now(), 0);
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    return `Expires in ${days} day${days === 1 ? "" : "s"}`;
  }, [matchedBadges]);

  const badgeWeight = useMemo(() => {
    return matchedBadges.reduce(
      (sum, badge) => sum + weightForBadge(badge.badge),
      0
    );
  }, [matchedBadges]);

  useEffect(() => {
    if (!proposalId) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/governance");
        const result = await response.json();
        const proposals = result?.data?.proposals ?? [];
        const allVotes = result?.data?.votes ?? [];
        const allUnlocks = result?.data?.unlocks ?? [];
        const selected = proposals.find((item: Proposal) => item.id === proposalId) ?? null;
        setProposal(selected);
        setVotes(allVotes.filter((vote: Vote) => vote.proposalId === proposalId));
        setUnlocks(allUnlocks);
        if (selected) {
          setEditTitle(selected.title);
          setEditTrack(selected.track);
          setEditSummary(selected.summary);
          setEditRequestedEth(String(selected.requestedEth));
          setEditStatus(selected.status);
        }
      } catch {
        setProposal(null);
        setVotes([]);
        setUnlocks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposalId]);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const response = await fetch("/api/badges");
        const result = await response.json();
        setBadges(Array.isArray(result?.data) ? result.data : []);
      } catch {
        setBadges([]);
      }
    };
    loadBadges();
  }, []);

  useEffect(() => {
    const loadRegistry = async () => {
      try {
        const response = await fetch("/api/badge-registry");
        const result = await response.json();
        setBadgeRegistry(Array.isArray(result?.data) ? result.data : []);
      } catch {
        setBadgeRegistry([]);
      }
    };
    loadRegistry();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("governance:identity");
    if (stored) setIdentity(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (identity) return;
    window.ethereum
      ?.request?.({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) {
          setIdentity(makeHandle(String(accounts[0])));
          setWalletAddress(String(accounts[0]));
        }
      })
      .catch(() => undefined);
  }, [identity]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("governance:identity", identity);
  }, [identity]);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (accounts?.[0]) {
      setWalletAddress(String(accounts[0]));
      if (!identity) {
        setIdentity(makeHandle(String(accounts[0])));
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus("Failed");
      window.setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  const handleUpdate = async () => {
    if (!proposal) return;
    if (!window.ethereum) return;
    const timestamp = new Date().toISOString();
    const action = "proposal-update";
    const message = `Phercons Governance ${action} ${proposal.id} ${timestamp}`;
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const actor = String(accounts?.[0] ?? "");
    if (!actor) return;
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, actor],
    });
    await fetch("/api/governance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "proposal-update",
        id: proposal.id,
        actor,
        signature,
        message,
        timestamp,
        payload: {
          title: editTitle,
          track: editTrack,
          summary: editSummary,
          requestedEth: Number(editRequestedEth || 0),
          status: editStatus,
        },
      }),
    });
    setIsEditing(false);
    const response = await fetch("/api/governance");
    const result = await response.json();
    const updated = result?.data?.proposals?.find(
      (item: Proposal) => item.id === proposal.id
    );
    if (updated) setProposal(updated);
  };

  const handleRemove = async () => {
    if (!proposal) return;
    if (!window.ethereum) return;
    const timestamp = new Date().toISOString();
    const action = "proposal-delete";
    const message = `Phercons Governance ${action} ${proposal.id} ${timestamp}`;
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const actor = String(accounts?.[0] ?? "");
    if (!actor) return;
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, actor],
    });
    await fetch("/api/governance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "proposal",
        id: proposal.id,
        actor,
        signature,
        message,
        timestamp,
      }),
    });
    window.location.href = "/governance";
  };

  return (
    <div className="page-shell min-h-screen bg-[#f5f0e6] text-[#1c1914]">
      <div className="page-transition relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16">
        <NavBar
          showAdmin={
            Boolean(normalizedIdentity) &&
            normalizedIdentity ===
              process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase()
          }
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Proposal Detail
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-spectral text-3xl text-[#1c1914]">
              {proposal?.title ? capitalizeFirst(proposal.title) : "Proposal"}
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                {copyStatus ?? "Copy Link"}
              </button>
              <Link
                href="/governance"
                className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                Back to Governance
              </Link>
            </div>
          </div>
          {loading && (
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Loading proposal…
            </p>
          )}
        </div>

        {!proposal ? (
          <div className="glass-panel animate-fade p-6 text-sm text-[#5e5242]">
            Proposal not found.
          </div>
        ) : (
          <section className="stagger grid gap-6">
            <div className="glass-panel animate-fade grid gap-4 p-6 text-sm text-[#5e5242]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b5b45]">
                <span className="chip">{capitalizeFirst(proposal.track)}</span>
                <span className="chip">Status: {proposal.status}</span>
                <span className="chip">Requested: {proposal.requestedEth} ETH</span>
              </div>
              <p className="text-base text-[#1c1914]">{proposal.summary}</p>
              <div className="grid gap-2 text-xs">
                <span>Submitted: {proposal.submittedAt}</span>
                <span>
                  Proposer address:{" "}
                  {proposal.proposerAddress ?? proposal.proposer ?? "Unknown"}
                </span>
                <span>Proposal ID: {proposal.id}</span>
              </div>
              <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
                <p className="text-[10px] uppercase tracking-[0.2em]">
                  Voting Eligibility
                </p>
                {!walletAddress ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#9a2c20]">
                      Connect a wallet to check eligibility.
                    </span>
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="uppercase tracking-[0.2em] text-[#6b5b45]">
                        Address
                      </span>
                      <span className="text-[11px] text-[#1c1914]">
                        {shortenAddress(walletAddress)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          badgeWeight > 0
                            ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                            : "border-[#d3c2a6] text-[#6b5b45]"
                        }`}
                      >
                        {badgeWeight > 0 ? "Eligible" : "Not eligible"}
                      </span>
                      <span className="text-[11px]">Weight {badgeWeight}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        {expiryCountdown}
                      </span>
                    </div>
                    {matchedBadges.length > 0 ? (
                      <p className="text-[11px] text-[#5e5242]">
                        Eligible badges:{" "}
                        {matchedBadges.map((badge) => badge.badge).join(", ")}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#5e5242]">
                        No badge on record for this wallet.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
                <label className="text-[10px] uppercase tracking-[0.2em]">
                  Your handle
                </label>
                <input
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  placeholder="Enter the proposer handle"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                {canManage ? (
                  <span className="text-[11px] text-[#5e5242]">
                    You can update or remove this proposal.
                  </span>
                ) : (
                  <span className="text-[11px] text-[#5e5242]">
                    Updates and removal are restricted to the proposer or admin.
                  </span>
                )}
                {canManage && (
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em]">
                    <span className="chip">Access Granted</span>
                    {normalizedIdentity === proposerHandle && (
                      <span className="chip">Proposer</span>
                    )}
                    {adminAddress && normalizedIdentity === adminAddress && (
                      <span className="chip">Admin</span>
                    )}
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    {isEditing ? "Cancel" : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="rounded-full border border-[#9a2c20] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
              {canManage && isEditing && (
                <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
                  <input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={260}
                    placeholder="Proposal title"
                    className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                  />
                  <input
                    value={editTrack}
                    onChange={(event) => setEditTrack(event.target.value)}
                    placeholder="Research track"
                    className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                  />
                  <textarea
                    value={editSummary}
                    onChange={(event) => setEditSummary(event.target.value)}
                    placeholder="Summary"
                    className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={editRequestedEth}
                      onChange={(event) =>
                        setEditRequestedEth(event.target.value)
                      }
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="Requested ETH"
                      className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                    />
                    <select
                      value={editStatus}
                      onChange={(event) =>
                        setEditStatus(
                          event.target.value as Proposal["status"]
                        )
                      }
                      className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                    >
                      <option>Draft</option>
                      <option>In Review</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="rounded-full border border-[#1c1914] bg-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
                  >
                    Save Updates
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel animate-fade grid gap-3 p-5 text-xs text-[#6b5b45]">
                <p className="uppercase tracking-[0.35em]">Vote Tally</p>
                <div className="grid gap-2 text-sm text-[#1c1914]">
                  <span>For: {tally.for}</span>
                  <span>Against: {tally.against}</span>
                  <span>Abstain: {tally.abstain}</span>
                  <span>Total votes: {tally.total}</span>
                </div>
              </div>
              <div className="glass-panel animate-fade grid gap-3 p-5 text-xs text-[#6b5b45]">
                <p className="uppercase tracking-[0.35em]">Related Unlocks</p>
                {relatedUnlocks.length === 0 ? (
                  <p className="text-sm text-[#5e5242]">
                    No milestone unlocks available.
                  </p>
                ) : (
                  <div className="grid gap-2 text-sm text-[#1c1914]">
                    {relatedUnlocks.slice(0, 4).map((unlock) => (
                      <Link
                        key={unlock.id}
                        href={`/governance/milestone/${unlock.id}`}
                        className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3 text-xs text-[#5e5242] transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <p className="text-sm font-semibold text-[#1c1914]">
                          {capitalizeFirst(unlock.milestoneTitle)}
                        </p>
                        <p>Status: {unlock.status}</p>
                        <p>Amount: {unlock.amountEth} ETH</p>
                        <p>Due: {unlock.dueDate || "—"}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel animate-fade grid gap-3 p-5 text-xs text-[#6b5b45]">
              <p className="uppercase tracking-[0.35em]">Votes</p>
              <div className="grid gap-2 text-xs text-[#5e5242]">
                <input
                  value={voteQuery}
                  onChange={(event) => {
                    setVoteQuery(event.target.value);
                    setVotePage(1);
                  }}
                  placeholder="Search votes"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <select
                  value={voteSort}
                  onChange={(event) =>
                    setVoteSort(event.target.value as typeof voteSort)
                  }
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="weight">Highest weight</option>
                </select>
              </div>
              {votes.length === 0 ? (
                <p className="text-sm text-[#5e5242]">No votes yet.</p>
              ) : votePageItems.length === 0 ? (
                <p className="text-sm text-[#5e5242]">No matches found.</p>
              ) : (
                <div className="grid gap-2">
                  {votePageItems.map((vote) => (
                    <div
                      key={vote.id}
                      className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3 text-xs text-[#5e5242]"
                    >
                      <p className="text-sm font-semibold text-[#1c1914]">
                        {vote.choice} · Weight {vote.weight}
                      </p>
                      <p>Voter: {vote.voter}</p>
                      <p>Timestamp: {vote.timestamp}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[11px] text-[#6b5b45]">
                    <button
                      type="button"
                      onClick={() =>
                        setVotePage((prev) => Math.max(1, prev - 1))
                      }
                      className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                      disabled={votePage === 1}
                    >
                      Prev
                    </button>
                    <span>
                      Page {votePage} of {votePageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setVotePage((prev) =>
                          Math.min(votePageCount, prev + 1)
                        )
                      }
                      className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                      disabled={votePage === votePageCount}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
