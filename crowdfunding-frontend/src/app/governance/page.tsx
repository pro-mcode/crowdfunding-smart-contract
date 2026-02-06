"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GovernancePanel from "@/components/GovernancePanel";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

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
    title.length > 20 ? `${title.slice(0, 20)}…` : title;

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

  return (
    <div className="page-shell min-h-screen bg-[#f5f0e6] text-[#1c1914]">
      <div className="page-transition relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16">
        <NavBar />

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Governance Console
          </p>
          <h1 className="font-spectral text-3xl text-[#1c1914]">
            Governance & Accountability
          </h1>
          <p className="mt-2 text-sm text-[#5e5242]">
            Proposals, votes, and milestone unlocks for the Phercons Vault.
          </p>
          {isLoading && (
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Syncing ledger…
            </p>
          )}
        </div>

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

        <section className="stagger grid gap-4 lg:grid-cols-3">
          <div className="glass-panel animate-fade flex flex-col gap-3 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Proposal Ledger
            </p>
            <div className="grid gap-2 text-xs text-[#5e5242]">
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
            {proposals.length === 0 ? (
              <p className="text-sm text-[#5e5242]">
                No proposals submitted yet.
              </p>
            ) : (
              <div className="grid gap-2 text-xs text-[#5e5242]">
                {proposalPageItems.length === 0 ? (
                  <p className="text-sm text-[#5e5242]">No matches found.</p>
                ) : (
                  proposalPageItems.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/governance/${proposal.id}`}
                      className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <p className="text-sm font-semibold text-[#1c1914]">
                        {truncateTitle(capitalizeFirst(proposal.title))}
                      </p>
                      <p>Track: {proposal.track}</p>
                      <p>Status: {proposal.status}</p>
                      <p>Requested: {proposal.requestedEth} ETH</p>
                      <p className="text-[11px] text-[#6b5b45]">
                        {proposal.submittedAt}
                      </p>
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

          <div className="glass-panel animate-fade flex flex-col gap-3 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Vote Ledger
            </p>
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
              <p className="text-sm text-[#5e5242]">No votes cast yet.</p>
            ) : (
              <div className="grid gap-2 text-xs text-[#5e5242]">
                {votePageItems.length === 0 ? (
                  <p className="text-sm text-[#5e5242]">No matches found.</p>
                ) : (
                  votePageItems.map((vote) => (
                    <div
                      key={vote.id}
                      className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                    >
                      <p className="text-sm font-semibold text-[#1c1914]">
                        {vote.choice} · Weight {vote.weight}
                      </p>
                      <p>
                        Proposal:{" "}
                        {truncateTitle(
                          proposalTitleById.get(vote.proposalId) ??
                            vote.proposalId
                        )}
                      </p>
                      <p>Voter: {vote.voter}</p>
                      <p className="text-[11px] text-[#6b5b45]">
                        {vote.timestamp}
                      </p>
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

          <div className="glass-panel animate-fade flex flex-col gap-3 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Milestone Unlocks
            </p>
            <div className="grid gap-2 text-xs text-[#5e5242]">
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
            {unlocks.length === 0 ? (
              <p className="text-sm text-[#5e5242]">
                No milestone unlocks yet.
              </p>
            ) : (
              <div className="grid gap-2 text-xs text-[#5e5242]">
                {unlockPageItems.length === 0 ? (
                  <p className="text-sm text-[#5e5242]">No matches found.</p>
                ) : (
                  unlockPageItems.map((unlock) => (
                    <Link
                      key={unlock.id}
                      href={`/governance/milestone/${unlock.id}`}
                      className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <p className="text-sm font-semibold text-[#1c1914]">
                        {capitalizeFirst(unlock.milestoneTitle)}
                      </p>
                      <p>Amount: {unlock.amountEth} ETH</p>
                      <p>Status: {unlock.status}</p>
                      <p>Due: {unlock.dueDate || "—"}</p>
                      {unlock.releasedAt && (
                        <p className="text-[11px] text-[#6b5b45]">
                          Released: {unlock.releasedAt}
                        </p>
                      )}
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

        <Footer />
      </div>
    </div>
  );
}
