import Link from "next/link";

type HeroHeaderProps = {
  stats: Array<{
    label: string;
    value: string;
    note?: string;
  }>;
};

export default function HeroHeader({ stats }: HeroHeaderProps) {
  return (
    <header className="glass-panel animate-rise flex flex-col gap-6 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-[#6b5b45]">
            Brand Positioning
          </p>
          <h1 className="heading-serif text-3xl font-semibold tracking-tight sm:text-4xl md:text-[42px]">
            Funding Independent Research Through Collective Governance
          </h1>
          <p className="max-w-2xl text-sm text-[#5e5242]">
            Allocate capital to vetted startup research via transparent vaults
            governed by contributors. Built for credible, research-first
            decision-making.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] text-[#6b5b45]">
            <span className="chip">Institutional Web3</span>
            <span className="chip">Transparent Treasury</span>
            <span className="chip">Research-First</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vaults"
              className="rounded-full border border-[#1c1914] bg-[#1c1914] px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
            >
              Explore Vaults
            </Link>
            <Link
              href="/governance"
              className="rounded-full border border-[#1c1914] px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              View Governance
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#5e5242]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Governance Model
            </p>
            <p className="mt-2 text-sm text-[#1c1914]">
              Token-weighted voting with reputation modifiers, delegation, and
              transparent timelocks.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Quorum</span>
              <span className="font-mono text-[#1c1914]">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pass Threshold</span>
              <span className="font-mono text-[#1c1914]">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timelock</span>
              <span className="font-mono text-[#1c1914]">48-96h</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-t border-[#eadfcf] pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
              {stat.label}
            </span>
            <span className="text-2xl font-semibold text-[#1c1914]">
              {stat.value}
            </span>
            {stat.note && (
              <span className="text-xs text-[#5e5242]">{stat.note}</span>
            )}
          </div>
        ))}
      </div>
    </header>
  );
}
