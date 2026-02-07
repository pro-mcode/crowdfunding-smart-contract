"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GovernancePanel from "@/components/GovernancePanel";
import SiteShell from "@/components/SiteShell";

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
  proposalId?: string | null;
  milestoneTitle: string;
  amountEth: number;
  proofHash: string;
  dueDate: string;
  status: "Pending" | "Unlocked" | "Released";
  releasedAt: string | null;
};

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [unlocks, setUnlocks] = useState<MilestoneUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeRegistry, setBadgeRegistry] = useState<BadgeRegistry[]>([]);
  const [proposalQuery, setProposalQuery] = useState("");
  const [proposalSort, setProposalSort] = useState<
    "newest" | "oldest" | "amount"
  >("newest");
  const [proposalPage, setProposalPage] = useState(1);
  const [voteQuery, setVoteQuery] = useState("");
  const [voteSort, setVoteSort] = useState<"newest" | "oldest" | "weight">(
    "newest"
  );
  const [votePage, setVotePage] = useState(1);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [unlockQuery, setUnlockQuery] = useState("");
  const [unlockSort, setUnlockSort] = useState<"newest" | "oldest" | "amount">(
    "newest"
  );
  const [unlockPage, setUnlockPage] = useState(1);
  const pageSize = 4;
  const isAdmin =
    Boolean(walletAddress) &&
    walletAddress.toLowerCase() ===
      process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase();
  const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  const loadGovernance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/governance");
      const result = await response.json();
      setProposals(result?.data?.proposals ?? []);
      setVotes(result?.data?.votes ?? []);
      setUnlocks(result?.data?.unlocks ?? []);
    } catch {
      setProposals([]);
      setVotes([]);
      setUnlocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGovernance();
  }, []);

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
    window.ethereum
      ?.request?.({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) setWalletAddress(String(accounts[0]));
      })
      .catch(() => undefined);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setVoteError("Wallet provider not found.");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (accounts?.[0]) {
      setWalletAddress(String(accounts[0]));
      setVoteError(null);
    }
  };

  const addProposal = async (
    proposal: Omit<Proposal, "id" | "submittedAt">
  ) => {
    await fetch("/api/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "proposal", payload: proposal }),
    });
    await loadGovernance();
  };

  const addVote = async (vote: Omit<Vote, "id" | "timestamp">) => {
    setVoteError(null);
    if (!window.ethereum) {
      setVoteError("Connect a wallet to cast votes.");
      return;
    }
    const timestamp = new Date().toISOString();
    const action = "vote-cast";
    const message = `Phercons Governance ${action} ${vote.proposalId} ${timestamp}`;
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const actor = String(accounts?.[0] ?? "");
    if (!actor) {
      setVoteError("Connect a wallet to cast votes.");
      return;
    }
    setWalletAddress(actor);
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, actor],
    });
    const response = await fetch("/api/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "vote",
        payload: {
          proposalId: vote.proposalId,
          choice: vote.choice,
        },
        actor,
        signature,
        message,
        timestamp,
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setVoteError(result?.error ?? "Unable to cast vote.");
      return;
    }
    await loadGovernance();
  };

  const addUnlock = async (
    unlock: Omit<MilestoneUnlock, "id" | "status" | "releasedAt">
  ) => {
    if (!window.ethereum) return;
    const timestamp = new Date().toISOString();
    const action = "unlock-create";
    const message = `Phercons Governance ${action} ${
      unlock.proposalId ?? ""
    } ${timestamp}`;
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "unlock",
        payload: unlock,
        actor,
        signature,
        message,
        timestamp,
      }),
    });
    await loadGovernance();
  };

  const releaseUnlock = async (id: string) => {
    if (!window.ethereum) return;
    const timestamp = new Date().toISOString();
    const action = "unlock-release";
    const message = `Phercons Governance ${action} ${id} ${timestamp}`;
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
        type: "unlock-release",
        id,
        actor,
        signature,
        message,
        timestamp,
      }),
    });
    await loadGovernance();
  };

  const toLower = (value: string) => value.toLowerCase();

  const filteredProposals = proposals.filter((proposal) => {
    const query = toLower(proposalQuery.trim());
    if (!query) return true;
    return (
      toLower(proposal.title).includes(query) ||
      toLower(proposal.track).includes(query) ||
      toLower(proposal.status).includes(query) ||
      toLower(proposal.summary).includes(query)
    );
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (proposalSort === "amount") {
      return b.requestedEth - a.requestedEth;
    }
    const aTime = new Date(a.submittedAt).getTime();
    const bTime = new Date(b.submittedAt).getTime();
    return proposalSort === "newest" ? bTime - aTime : aTime - bTime;
  });

  const proposalPageCount = Math.max(
    1,
    Math.ceil(sortedProposals.length / pageSize)
  );
  const proposalPageItems = sortedProposals.slice(
    (proposalPage - 1) * pageSize,
    proposalPage * pageSize
  );
  const truncateTitle = (title: string) =>
    title.length > 50 ? `${title.slice(0, 50)}...` : title;

  const filteredVotes = votes.filter((vote) => {
    const query = toLower(voteQuery.trim());
    if (!query) return true;
    return (
      toLower(vote.voter).includes(query) ||
      toLower(vote.choice).includes(query) ||
      toLower(vote.proposalId).includes(query)
    );
  });

  const sortedVotes = [...filteredVotes].sort((a, b) => {
    if (voteSort === "weight") {
      return b.weight - a.weight;
    }
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return voteSort === "newest" ? bTime - aTime : aTime - bTime;
  });

  const votePageCount = Math.max(1, Math.ceil(sortedVotes.length / pageSize));
  const votePageItems = sortedVotes.slice(
    (votePage - 1) * pageSize,
    votePage * pageSize
  );

  const filteredUnlocks = unlocks.filter((unlock) => {
    const query = toLower(unlockQuery.trim());
    if (!query) return true;
    return (
      toLower(unlock.milestoneTitle).includes(query) ||
      toLower(unlock.status).includes(query) ||
      toLower(unlock.dueDate ?? "").includes(query)
    );
  });

  const sortedUnlocks = [...filteredUnlocks].sort((a, b) => {
    if (unlockSort === "amount") {
      return b.amountEth - a.amountEth;
    }
    const aTime = new Date(a.releasedAt ?? a.dueDate ?? 0).getTime();
    const bTime = new Date(b.releasedAt ?? b.dueDate ?? 0).getTime();
    return unlockSort === "newest" ? bTime - aTime : aTime - bTime;
  });

  const unlockPageCount = Math.max(
    1,
    Math.ceil(sortedUnlocks.length / pageSize)
  );
  const unlockPageItems = sortedUnlocks.slice(
    (unlockPage - 1) * pageSize,
    unlockPage * pageSize
  );
  const proposalTitleById = new Map(
    proposals.map((proposal) => [proposal.id, proposal.title])
  );
  const activeProposals = proposals.filter((proposal) =>
    ["Draft", "In Review"].includes(proposal.status)
  ).length;
  const uniqueVoters = new Set(votes.map((vote) => vote.voter.toLowerCase())).size;
  const participationRate = proposals.length
    ? Math.min(100, Math.round((uniqueVoters / proposals.length) * 100))
    : 0;
  const avgVoteDuration = votes.length ? "5.2 days" : "—";
  const latestProposalAt = proposals[0]?.submittedAt ?? "—";
  const latestVoteAt = votes[0]?.timestamp ?? "—";
  const latestUnlockAt = unlocks[0]?.dueDate ?? "—";
  const pendingUnlocks = unlocks.filter(
    (item) => item.status === "Pending"
  ).length;
  const formatShort = (value: string) =>
    value && value.length > 18 ? `${value.slice(0, 18)}...` : value;
  const proposalTone = (status: Proposal["status"]) => {
    if (status === "Approved") return "border-l-[#2f7d4f] bg-[#f1f7f2]";
    if (status === "Rejected") return "border-l-[#9a2c20] bg-[#fff2f0]";
    if (status === "In Review") return "border-l-[#d9742f] bg-[#fff7ea]";
    return "border-l-[#1c1914] bg-[#fffdf8]";
  };
  const voteTone = (choice: Vote["choice"]) => {
    if (choice === "For") return "border-l-[#2f7d4f] bg-[#f1f7f2]";
    if (choice === "Against") return "border-l-[#9a2c20] bg-[#fff2f0]";
    return "border-l-[#9c7b4f] bg-[#fff7ea]";
  };
  const unlockTone = (status: MilestoneUnlock["status"]) => {
    if (status === "Released") return "border-l-[#2f7d4f] bg-[#f1f7f2]";
    if (status === "Unlocked") return "border-l-[#d9742f] bg-[#fff7ea]";
    return "border-l-[#1c1914] bg-[#fffdf8]";
  };

  return (
    <SiteShell showAdmin={isAdmin}>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Governance Hub
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Governance & Accountability
          </h1>
          <p className="text-sm text-[#5e5242]">
            Proposals, votes, and milestone unlocks for the Phercons Vault.
          </p>
          {isLoading && (
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Syncing ledger…
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
            <span className="chip">Draft</span>
            <span className="chip">Discussion</span>
            <span className="chip">Voting</span>
            <span className="chip">Timelock</span>
            <span className="chip">Execution</span>
          </div>
          <div className="grid gap-3 text-xs text-[#5e5242] sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Active Proposals
              </span>
              <p className="mt-1 font-mono text-[#1c1914]">{activeProposals}</p>
            </div>
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Participation Rate
              </span>
              <p className="mt-1 font-mono text-[#1c1914]">
                {participationRate}%
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Avg Vote Duration
              </span>
              <p className="mt-1 font-mono text-[#1c1914]">{avgVoteDuration}</p>
            </div>
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Treasury Controlled
              </span>
              <p className="mt-1 font-mono text-[#1c1914]">9,400 ETH</p>
            </div>
          </div>
        </header>

        <section className="stagger grid gap-6">
          <GovernancePanel
            proposals={proposals}
            votes={votes}
            badges={badges}
            badgeRegistry={badgeRegistry}
            onAddProposal={addProposal}
            onAddVote={addVote}
            onAddUnlock={addUnlock}
            isAdmin={isAdmin}
            voteError={voteError}
            defaultVoter={walletAddress}
            onConnectWallet={connectWallet}
          />
        </section>

        <section className="stagger grid gap-6">
          <div className="glass-panel animate-fade flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Proposal Ledger
                </p>
                <p className="mt-2 text-lg font-semibold text-[#1c1914]">
                  Governance Requests
                </p>
                <p className="text-[11px] text-[#5e5242]">
                  Last update: {latestProposalAt}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="chip">Total {proposals.length}</span>
                <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Active {activeProposals}
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-gradient-to-br from-[#fff7ea] via-[#fffdf8] to-[#f6efe4] p-4">
              <div className="grid grid-cols-3 gap-2 text-xs text-[#5e5242]">
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Active
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {activeProposals}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Total
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {proposals.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Pages
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {proposalPageCount}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                <input
                  value={proposalQuery}
                  onChange={(event) => {
                    setProposalQuery(event.target.value);
                    setProposalPage(1);
                  }}
                  placeholder="Search proposals"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <select
                  value={proposalSort}
                  onChange={(event) =>
                    setProposalSort(event.target.value as typeof proposalSort)
                  }
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount">Highest amount</option>
                </select>
              </div>
            </div>

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                No proposals submitted yet.
              </div>
            ) : (
              <div className="grid gap-3 text-xs text-[#5e5242]">
                {proposalPageItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                    No matches found.
                  </div>
                ) : (
                  proposalPageItems.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/governance/${proposal.id}`}
                      className={`group rounded-2xl border border-[#eadfcf] border-l-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${proposalTone(
                        proposal.status
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1c1914]">
                            {truncateTitle(capitalizeFirst(proposal.title))}
                          </p>
                          <p className="mt-1 text-[11px] text-[#5e5242]">
                            {proposal.summary}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                          {proposal.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Track {capitalizeFirst(proposal.track)}
                        </span>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Ask {proposal.requestedEth} ETH
                        </span>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Submitted {proposal.submittedAt}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
                <div className="flex items-center justify-between text-[11px] text-[#6b5b45]">
                  <button
                    type="button"
                    onClick={() =>
                      setProposalPage((prev) => Math.max(1, prev - 1))
                    }
                    className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    disabled={proposalPage === 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {proposalPage} of {proposalPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setProposalPage((prev) =>
                        Math.min(proposalPageCount, prev + 1)
                      )
                    }
                    className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    disabled={proposalPage === proposalPageCount}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel animate-fade flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Vote Ledger
                </p>
                <p className="mt-2 text-lg font-semibold text-[#1c1914]">
                  Verified Ballots
                </p>
                <p className="text-[11px] text-[#5e5242]">
                  Latest vote: {latestVoteAt}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="chip">Total {votes.length}</span>
                <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Voters {uniqueVoters}
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-gradient-to-br from-[#fff7ea] via-[#fffdf8] to-[#f6efe4] p-4">
              <div className="grid grid-cols-3 gap-2 text-xs text-[#5e5242]">
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Total
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {votes.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Voters
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {uniqueVoters}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Participation
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {participationRate}%
                  </p>
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
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
            </div>

            {votes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                No votes cast yet.
              </div>
            ) : (
              <div className="grid gap-3 text-xs text-[#5e5242]">
                {votePageItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                    No matches found.
                  </div>
                ) : (
                  votePageItems.map((vote) => (
                    <div
                      key={vote.id}
                      className={`rounded-2xl border border-[#eadfcf] border-l-4 p-4 ${voteTone(
                        vote.choice
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1c1914]">
                            {vote.choice} Vote
                          </p>
                          <p className="mt-1 text-[11px] text-[#5e5242]">
                            Proposal:{" "}
                            {truncateTitle(
                              proposalTitleById.get(vote.proposalId) ??
                                vote.proposalId
                            )}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                          Weight {vote.weight}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Voter {formatShort(vote.voter)}
                        </span>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Cast {vote.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between text-[11px] text-[#6b5b45]">
                  <button
                    type="button"
                    onClick={() => setVotePage((prev) => Math.max(1, prev - 1))}
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
                      setVotePage((prev) => Math.min(votePageCount, prev + 1))
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

          <div className="glass-panel animate-fade flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Milestone Unlocks
                </p>
                <p className="mt-2 text-lg font-semibold text-[#1c1914]">
                  Funding Releases
                </p>
                <p className="text-[11px] text-[#5e5242]">
                  Next due: {latestUnlockAt}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="chip">Total {unlocks.length}</span>
                <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Pending {pendingUnlocks}
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-gradient-to-br from-[#fff7ea] via-[#fffdf8] to-[#f6efe4] p-4">
              <div className="grid grid-cols-3 gap-2 text-xs text-[#5e5242]">
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Pending
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {pendingUnlocks}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Total
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {unlocks.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Pages
                  </p>
                  <p className="mt-1 font-mono text-[#1c1914]">
                    {unlockPageCount}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                <input
                  value={unlockQuery}
                  onChange={(event) => {
                    setUnlockQuery(event.target.value);
                    setUnlockPage(1);
                  }}
                  placeholder="Search unlocks"
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                />
                <select
                  value={unlockSort}
                  onChange={(event) =>
                    setUnlockSort(event.target.value as typeof unlockSort)
                  }
                  className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount">Highest amount</option>
                </select>
              </div>
            </div>

            {unlocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                No milestone unlocks yet.
              </div>
            ) : (
              <div className="grid gap-3 text-xs text-[#5e5242]">
                {unlockPageItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]">
                    No matches found.
                  </div>
                ) : (
                  unlockPageItems.map((unlock) => (
                    <Link
                      key={unlock.id}
                      href={`/governance/milestone/${unlock.id}`}
                      className={`group rounded-2xl border border-[#eadfcf] border-l-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${unlockTone(
                        unlock.status
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1c1914]">
                            {capitalizeFirst(unlock.milestoneTitle)}
                          </p>
                          <p className="mt-1 text-[11px] text-[#5e5242]">
                            Proof {formatShort(unlock.proofHash)}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                          {unlock.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Amount {unlock.amountEth} ETH
                        </span>
                        <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                          Due {unlock.dueDate || "—"}
                        </span>
                        {unlock.releasedAt && (
                          <span className="rounded-full border border-[#eadfcf] bg-[#fffdf8] px-2 py-1">
                            Released {unlock.releasedAt}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
                <div className="flex items-center justify-between text-[11px] text-[#6b5b45]">
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockPage((prev) => Math.max(1, prev - 1))
                    }
                    className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    disabled={unlockPage === 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {unlockPage} of {unlockPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockPage((prev) =>
                        Math.min(unlockPageCount, prev + 1)
                      )
                    }
                    className="rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    disabled={unlockPage === unlockPageCount}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </SiteShell>
  );
}
