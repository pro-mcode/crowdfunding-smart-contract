import SiteShell from "@/components/SiteShell";

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            About
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Capital allocation for deep research, governed by contributors.
          </h1>
          <p className="text-sm text-[#5e5242]">
            Phercons Vault is a governance-first crowdfunding vault for funding
            independent startup research with full transparency, accountability,
            and on-chain execution.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Mission
            </p>
            <p className="text-sm text-[#5e5242]">
              Create a credible, research-first funding engine where
              contributors control capital allocation through transparent
              governance and verified impact.
            </p>
            <div className="grid gap-2 text-sm text-[#5e5242]">
              <span>Credible decision-making for institutional partners.</span>
              <span>Transparent, auditable research outcomes.</span>
              <span>Contributor-aligned governance incentives.</span>
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              One-Line Summary
            </p>
            <p className="text-lg text-[#1c1914]">
              A governance-first crowdfunding vault for funding independent
              startup research with full transparency and on-chain execution.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
              <span className="chip">DAO Meets Venture Lab</span>
              <span className="chip">Research-First</span>
              <span className="chip">Institutional Trust</span>
            </div>
          </div>
        </section>

        <section className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Power Balance
          </p>
          <div className="grid gap-3 text-sm text-[#5e5242] lg:grid-cols-2">
            {[
              { role: "Capital contributors", power: "Vote on proposals" },
              { role: "Researchers", power: "Submit proposals" },
              { role: "Delegates", power: "Represent voting power" },
              { role: "Council", power: "Safeguard with transparent vetoes" },
            ].map((item) => (
              <div
                key={item.role}
                className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4"
              >
                <span>{item.role}</span>
                <span className="font-mono text-[#1c1914]">{item.power}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
