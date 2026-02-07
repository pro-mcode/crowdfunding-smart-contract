import SiteShell from "@/components/SiteShell";

export default function TransparencyPage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Transparency Portal
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Institutional-grade visibility into treasury, impact, and audits.
          </h1>
          <p className="text-sm text-[#5e5242]">
            Every allocation, milestone, and deliverable is logged for review so
            contributors can follow the capital lifecycle end-to-end.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Treasury Dashboard
            </p>
            <div className="grid gap-3 text-sm text-[#5e5242]">
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Total Assets</span>
                <span className="font-mono text-[#1c1914]">9,400 ETH</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Allocation per Vault</span>
                <span className="font-mono text-[#1c1914]">4 vaults</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Runway</span>
                <span className="font-mono text-[#1c1914]">22 months</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Historical Spend</span>
                <span className="font-mono text-[#1c1914]">2,180 ETH</span>
              </div>
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Research Impact Tracker
            </p>
            <div className="grid gap-3 text-sm text-[#5e5242]">
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Reports Published</span>
                <span className="font-mono text-[#1c1914]">48</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Startups Evaluated</span>
                <span className="font-mono text-[#1c1914]">71</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Grants Deployed</span>
                <span className="font-mono text-[#1c1914]">32</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
                <span>Outcomes Achieved</span>
                <span className="font-mono text-[#1c1914]">19</span>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Audit & Proof
          </p>
          <div className="grid gap-3 text-sm text-[#5e5242] lg:grid-cols-3">
            {[
              "Smart contract audits and formal verification summaries.",
              "Financial attestations and treasury reconciliation.",
              "IP ownership disclosures and licensing commitments.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
