import { useEffect, useState } from "react";

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

type GovernancePanelProps = {
  proposals: Proposal[];
  votes: Vote[];
  badges: Badge[];
  badgeRegistry?: BadgeRegistry[];
  onAddProposal: (proposal: Omit<Proposal, "id" | "submittedAt">) => void;
  onAddVote: (vote: Omit<Vote, "id" | "timestamp">) => void;
  onAddUnlock: (
    unlock: Omit<MilestoneUnlock, "id" | "status" | "releasedAt">
  ) => void;
  isAdmin?: boolean;
  voteError?: string | null;
  defaultVoter?: string;
  onConnectWallet?: () => void;
};

export default function GovernancePanel({
  proposals,
  votes,
  badges,
  badgeRegistry = [],
  onAddProposal,
  onAddVote,
  onAddUnlock,
  isAdmin = false,
  voteError = null,
  defaultVoter,
  onConnectWallet,
}: GovernancePanelProps) {
  const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  const [voterInput, setVoterInput] = useState("");
  const [computedWeight, setComputedWeight] = useState(0);
  const [matchedBadges, setMatchedBadges] = useState<Badge[]>([]);
  const [expiryCountdown, setExpiryCountdown] = useState("No expiration");
  const canVote = Boolean(defaultVoter) && computedWeight > 0;

  const normalize = (value: string) => value.trim().toLowerCase();
  const weightForBadge = (badgeLabel: string) => {
    const label = normalize(badgeLabel);
    const registryMatch = badgeRegistry.find(
      (entry) => normalize(entry.title) === label
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
  const weightTooltip =
    badgeRegistry.length > 0
      ? `Weights are summed per badge: ${badgeRegistry
          .map((entry) => `${entry.title} (${entry.weight})`)
          .join(", ")}.`
      : "Weights are summed per badge: Core (5), Lead (4), Reviewer (3), Advisor (2), Contributor/Supporter (1).";
  const computeExpiryCountdown = (badgesToCheck: Badge[]) => {
    const active = badgesToCheck
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
  };
  const recalcWeight = (input: string) => {
    const normalizedInput = normalize(input);
    if (!normalizedInput) {
      setComputedWeight(0);
      setMatchedBadges([]);
      setExpiryCountdown("No expiration");
      return;
    }
    const now = Date.now();
    const matches = badges.filter((badge) => {
      const recipient = normalize(badge.recipient);
      if (recipient !== normalizedInput) return false;
      if (!badge.expiresAt) return true;
      const parsed = Date.parse(badge.expiresAt);
      if (Number.isNaN(parsed)) return true;
      return parsed > now;
    });
    const weight = matches.reduce(
      (sum, badge) => sum + weightForBadge(badge.badge),
      0
    );
    setMatchedBadges(matches);
    setComputedWeight(weight);
    setExpiryCountdown(computeExpiryCountdown(matches));
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const normalizedDefault = defaultVoter?.trim() ?? "";
    if (!normalizedDefault) {
      setVoterInput("");
      setComputedWeight(0);
      setMatchedBadges([]);
      return;
    }
    setVoterInput(normalizedDefault);
    recalcWeight(normalizedDefault);
  }, [defaultVoter, badges, badgeRegistry]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Governance & Accountability
        </p>
        <p className="text-sm text-[#5e5242]">
          Coordinate grants, voting, and milestone-based unlocks with
          transparent tracking for stakeholders.
        </p>
        <p className="text-xs text-[#6b5b45]">
          Proposals are open. Voting is badge-gated and weighted by credentials.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Grant Proposals</p>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const title = String(data.get("proposal-title") || "").trim();
              const track = String(data.get("proposal-track") || "").trim();
              const summary = String(data.get("proposal-summary") || "").trim();
              const requestedEth = Number(data.get("proposal-amount"));
              const status = String(
                data.get("proposal-status") || "Draft"
              ) as Proposal["status"];
              if (
                !title ||
                !track ||
                !summary ||
                !Number.isFinite(requestedEth)
              )
                return;
              let proposerAddress = "";
              if (typeof window !== "undefined") {
                try {
                  const accounts = await window.ethereum?.request?.({
                    method: "eth_requestAccounts",
                  });
                  if (accounts?.[0]) {
                    proposerAddress = String(accounts[0]);
                  }
                } catch {
                  // ignore
                }
              }
              if (!proposerAddress) return;
              onAddProposal({
                title,
                track,
                summary,
                requestedEth,
                status,
                proposerAddress,
              });
              form.reset();
            }}
          >
            <input
              name="proposal-title"
              placeholder="Proposal title"
              maxLength={260}
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <input
              name="proposal-track"
              placeholder="Research track (e.g., ZK, Security)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <textarea
              name="proposal-summary"
              placeholder="Proposal summary"
              className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="proposal-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="Requested ETH"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <select
                name="proposal-status"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              >
                <option>Draft</option>
                <option>In Review</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Proposal
            </button>
          </form>
          <p className="text-[11px] text-[#5e5242]">
            Proposals appear in the ledger below for review and voting.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Voting System</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const proposalId = String(data.get("vote-proposal") || "");
              const voter = String(data.get("vote-voter") || "").trim();
              const choice = String(
                data.get("vote-choice") || "For"
              ) as Vote["choice"];
              if (!proposalId || !defaultVoter || computedWeight <= 0) return;
              onAddVote({ proposalId, voter, choice, weight: computedWeight });
              form.reset();
              setVoterInput("");
              setComputedWeight(0);
              setMatchedBadges([]);
            }}
          >
            <select
              name="vote-proposal"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="">Select proposal</option>
              {proposals.map((proposal) => (
                <option key={proposal.id} value={proposal.id}>
                  {capitalizeFirst(proposal.title)}
                </option>
              ))}
            </select>
            <input
              name="vote-voter"
              placeholder="Connect wallet to vote"
              value={voterInput}
              onChange={(event) => {
                setVoterInput(event.target.value);
                recalcWeight(event.target.value);
              }}
              readOnly
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="vote-choice"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              >
                <option>For</option>
                <option>Against</option>
                <option>Abstain</option>
              </select>
              <div className="rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914]">
                Weight: {computedWeight}
              </div>
            </div>
            {!defaultVoter && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] text-[#9a2c20]">
                  Connect a wallet to cast votes.
                </p>
                {onConnectWallet && (
                  <button
                    type="button"
                    onClick={onConnectWallet}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            )}
            {defaultVoter && computedWeight === 0 && (
              <p className="text-[11px] text-[#9a2c20]">
                No badge match found. Voting weight is 0.
              </p>
            )}
            {defaultVoter && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5e5242]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="uppercase tracking-[0.2em] text-[#6b5b45]">
                    Eligibility
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 uppercase tracking-[0.2em] ${
                      canVote
                        ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                        : "border-[#d3c2a6] text-[#6b5b45]"
                    }`}
                  >
                    {canVote ? "Eligible" : "Not eligible"}
                  </span>
                  <span
                    className="cursor-help rounded-full border border-[#d3c2a6] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]"
                    title={weightTooltip}
                  >
                    Weighting
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Weight {computedWeight}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    {expiryCountdown}
                  </span>
                </div>
              </div>
            )}
            {defaultVoter && matchedBadges.length > 0 && (
              <p className="text-[11px] text-[#5e5242]">
                Eligible badges:{" "}
                {matchedBadges.map((badge) => badge.badge).join(", ")}
              </p>
            )}
            {voteError && (
              <p className="text-[11px] text-[#9a2c20]">{voteError}</p>
            )}
            <button
              disabled={!canVote}
              className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cast Vote
            </button>
          </form>
          <p className="text-[11px] text-[#5e5242]">
            Vote activity and tallies are displayed in the ledger below.
          </p>
        </div>

        <div className="col-span-full grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Milestone-Based Unlocks</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const milestoneTitle = String(
                data.get("unlock-title") || ""
              ).trim();
              const proposalId = String(
                data.get("unlock-proposal") || ""
              ).trim();
              const amountEth = Number(data.get("unlock-amount"));
              const proofHash = String(data.get("unlock-hash") || "").trim();
              const dueDate = String(data.get("unlock-date") || "").trim();
              if (!milestoneTitle || !Number.isFinite(amountEth)) return;
              if (!proposalId && !isAdmin) return;
              onAddUnlock({
                milestoneTitle,
                amountEth,
                proofHash,
                dueDate,
                proposalId: proposalId || null,
              });
              form.reset();
            }}
          >
            <select
              name="unlock-proposal"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            >
              <option value="">
                {isAdmin
                  ? "Link to proposal (optional for admin)"
                  : "Link to proposal (required)"}
              </option>
              {proposals.map((proposal) => (
                <option key={proposal.id} value={proposal.id}>
                  {capitalizeFirst(proposal.title)}
                </option>
              ))}
            </select>
            <input
              name="unlock-title"
              placeholder="Milestone / deliverable"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="unlock-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="Release amount (ETH)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="unlock-date"
                type="date"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <input
              name="unlock-hash"
              placeholder="Deliverable hash (optional)"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Unlock
            </button>
          </form>
          <p className="text-[11px] text-[#5e5242]">
            Unlock activity is tracked in the milestone ledger below.
          </p>
        </div>
      </div>
    </div>
  );
}
