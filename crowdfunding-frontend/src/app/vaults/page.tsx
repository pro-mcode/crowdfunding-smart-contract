"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { VAULT_CATALOG, type VaultCatalogEntry } from "@/lib/vaultCatalog";

export default function VaultsPage() {
  const [vaults, setVaults] = useState<VaultCatalogEntry[]>(VAULT_CATALOG);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/vaults");
        const result = await response.json();
        const data = Array.isArray(result?.data) ? result.data : [];
        if (data.length > 0) {
          setVaults(data);
        }
      } catch {
        // fallback to local catalog
      }
    };
    load();
  }, []);

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Research Vaults
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Dedicated capital pools with clear mandates and governance
            transparency.
          </h1>
          <p className="text-sm text-[#5e5242]">
            Each vault is purpose-built around a research thesis, risk profile,
            and deliverable schedule. Governance participation and treasury
            activity are visible in real time.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
            {["Low", "Moderate", "High"].map((risk) => (
              <span key={risk} className="chip">
                {risk} Risk
              </span>
            ))}
            <span className="chip">Active Governance</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className="glass-panel animate-fade flex h-full flex-col gap-4 p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  {vault.name}
                </span>
                <span className="chip">{vault.riskRating}</span>
              </div>
              <p className="text-sm text-[#1c1914]">{vault.focus}</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-[#5e5242]">
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
                    Horizon
                  </span>
                  <p className="font-mono text-[#1c1914]">
                    {vault.horizon}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#5e5242]">{vault.overview}</p>
              <Link
                href={`/vaults/${vault.id}`}
                className="mt-auto w-fit rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                View Vault Detail
              </Link>
            </div>
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
