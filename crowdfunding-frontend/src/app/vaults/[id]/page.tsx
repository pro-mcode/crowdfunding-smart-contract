"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { getVaultById, type VaultCatalogEntry } from "@/lib/vaultCatalog";

export default function VaultDetailPage() {
  const params = useParams<{ id: string }>();
  const vaultId = params?.id;
  const [vault, setVault] = useState<VaultCatalogEntry | null>(
    vaultId ? getVaultById(String(vaultId)) ?? null : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vaultId) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/vaults?id=${vaultId}`);
        const result = await response.json();
        if (result?.data) {
          setVault(result.data);
        }
      } catch {
        // fallback stays in place
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vaultId]);

  if (!vault) {
    return (
      <SiteShell>
        <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Vault Not Found
          </p>
          <p className="text-sm text-[#5e5242]">
            The vault you are looking for does not exist. Browse all vaults to
            continue.
          </p>
          <Link
            href="/vaults"
            className="w-fit rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
          >
            Back to Vaults
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                {vault.name}
              </p>
              <h1 className="heading-serif text-3xl text-[#1c1914]">
                {vault.focus}
              </h1>
            </div>
            <span className="chip">{vault.riskRating}</span>
          </div>
          {loading && (
            <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              Syncing vault data...
            </span>
          )}
          <p className="text-sm text-[#5e5242]">{vault.overview}</p>
          <div className="grid gap-3 text-xs text-[#5e5242] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                TVL
              </span>
              <p className="font-mono text-[#1c1914]">{vault.tvl}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Active Proposals
              </span>
              <p className="font-mono text-[#1c1914]">
                {vault.activeProposals}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Participation
              </span>
              <p className="font-mono text-[#1c1914]">
                {vault.participation}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Time Horizon
              </span>
              <p className="font-mono text-[#1c1914]">{vault.horizon}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Thesis & Outcomes
            </p>
            <p className="text-sm text-[#5e5242]">{vault.thesis}</p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.expectedOutcomes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Governance Model
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.governanceModel.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/governance"
              className="mt-auto w-fit rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Explore Governance Hub
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Funding Structure
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.fundingStructure.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Withdrawal Conditions
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.withdrawalConditions.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Research Deliverables
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.deliverables.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Deliverable Registry
            </p>
            <div className="grid gap-3 text-xs text-[#5e5242]">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Reports
                </span>
                {vault.reports.map((item) => (
                  <p key={item} className="text-sm text-[#1c1914]">
                    {item}
                  </p>
                ))}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  Datasets
                </span>
                {vault.datasets.map((item) => (
                  <p key={item} className="text-sm text-[#1c1914]">
                    {item}
                  </p>
                ))}
              </div>
              <div className="rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-3 text-sm text-[#5e5242]">
                {vault.ipRights}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Vault Activity
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              {vault.activity.map((item) => (
                <div
                  key={`${item.label}-${item.timestamp}`}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4"
                >
                  <div className="flex items-center justify-between text-xs text-[#6b5b45]">
                    <span className="uppercase tracking-[0.2em]">{item.label}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#1c1914]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Contribute
            </p>
            <p className="text-sm text-[#5e5242]">
              Participate in this vault by depositing into the shared treasury.
              Deposits grant governance power and reputation credits.
            </p>
            <Link
              href="/#contribute"
              className="w-fit rounded-full border border-[#1c1914] bg-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
            >
              Open Contribution Console
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
