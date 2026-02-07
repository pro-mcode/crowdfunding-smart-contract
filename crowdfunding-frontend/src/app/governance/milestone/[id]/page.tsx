"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteShell from "@/components/SiteShell";

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

type Proposal = {
  id: string;
  title: string;
  track: string;
  summary: string;
  status: string;
  submittedAt: string;
};

export default function MilestoneDetailPage() {
  const params = useParams<{ id: string }>();
  const milestoneId = params?.id;
  const [milestone, setMilestone] = useState<MilestoneUnlock | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const isAdmin =
    Boolean(walletAddress) &&
    walletAddress.toLowerCase() ===
      process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase();

  const statusBadge = useMemo(() => {
    if (!milestone) return "";
    return milestone.status;
  }, [milestone]);
  const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  useEffect(() => {
    if (!milestoneId) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/governance");
        const result = await response.json();
        const unlocks = result?.data?.unlocks ?? [];
        const proposals = result?.data?.proposals ?? [];
        const selected =
          unlocks.find((item: MilestoneUnlock) => item.id === milestoneId) ??
          null;
        setMilestone(selected);
        if (selected?.proposalId) {
          setProposal(
            proposals.find((item: Proposal) => item.id === selected.proposalId) ??
              null
          );
        } else {
          setProposal(null);
        }
      } catch {
        setMilestone(null);
        setProposal(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [milestoneId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.ethereum
      ?.request?.({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) setWalletAddress(String(accounts[0]));
      })
      .catch(() => undefined);
  }, []);

  return (
    <SiteShell showAdmin={isAdmin}>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-3 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Milestone Detail
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="heading-serif text-3xl text-[#1c1914]">
              {milestone?.milestoneTitle
                ? capitalizeFirst(milestone.milestoneTitle)
                : "Milestone"}
            </h1>
            <Link
              href="/governance"
              className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Back to Governance
            </Link>
          </div>
          {loading && (
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Loading milestone…
            </p>
          )}
        </header>

        {!milestone ? (
          <div className="glass-panel animate-fade p-6 text-sm text-[#5e5242]">
            Milestone not found.
          </div>
        ) : (
          <section className="stagger grid gap-6">
            <div className="glass-panel animate-fade grid gap-4 p-6 text-sm text-[#5e5242]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b5b45]">
                <span className="chip">Status: {statusBadge}</span>
                <span className="chip">Amount: {milestone.amountEth} ETH</span>
                {milestone.proposalId && (
                  <span className="chip">Linked proposal</span>
                )}
              </div>
              <div className="grid gap-2 text-xs">
                <span>Due date: {milestone.dueDate || "—"}</span>
                <span>Proof hash: {milestone.proofHash || "—"}</span>
                {milestone.releasedAt && (
                  <span>Released at: {milestone.releasedAt}</span>
                )}
                <span>Milestone ID: {milestone.id}</span>
              </div>
              {milestone.status !== "Released" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isAdmin) {
                        setNotice("Not authorized to release unlocks.");
                        window.setTimeout(() => setNotice(null), 1600);
                        return;
                      }
                      if (!window.ethereum) return;
                      const timestamp = new Date().toISOString();
                      const action = "unlock-release";
                      const message = `Phercons Governance ${action} ${milestone.id} ${timestamp}`;
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
                          id: milestone.id,
                          actor,
                          signature,
                          message,
                          timestamp,
                        }),
                      });
                      setNotice("Milestone released.");
                      window.setTimeout(() => setNotice(null), 1600);
                      const response = await fetch("/api/governance");
                      const result = await response.json();
                      const unlocks = result?.data?.unlocks ?? [];
                      const updated =
                        unlocks.find(
                          (item: MilestoneUnlock) => item.id === milestone.id
                        ) ?? null;
                      setMilestone(updated);
                    }}
                    className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                      isAdmin
                        ? "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
                        : "border-[#9a2c20] text-[#9a2c20]"
                    }`}
                  >
                    Mark Released
                  </button>
                  <span className="chip">Admin only</span>
                  {notice && (
                    <span className="rounded-full border border-[#9a2c20] bg-white px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]">
                      {notice}
                    </span>
                  )}
                </div>
              )}
            </div>

            {proposal && (
              <div className="glass-panel animate-fade grid gap-4 p-6 text-sm text-[#5e5242]">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b5b45]">
                  <span className="chip">Proposal</span>
                  <span className="chip">Status: {proposal.status}</span>
                </div>
                <h2 className="font-spectral text-xl text-[#1c1914]">
                  {capitalizeFirst(proposal.title)}
                </h2>
                <p>{proposal.summary}</p>
                <Link
                  href={`/governance/${proposal.id}`}
                  className="text-xs uppercase tracking-[0.2em] text-[#1c1914] underline decoration-transparent transition hover:decoration-[#1c1914]"
                >
                  View proposal
                </Link>
              </div>
            )}
          </section>
        )}

      </div>
    </SiteShell>
  );
}
