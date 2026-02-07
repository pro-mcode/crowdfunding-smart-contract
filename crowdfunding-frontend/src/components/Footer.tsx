import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass-panel animate-fade mt-8 w-full">
      <div className="grid gap-8 px-6 py-8 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#6b5b45]">
              Phercons Vault
            </span>
            <span className="font-spectral text-xl text-[#1c1914]">
              Research Treasury
            </span>
          </div>
          <p className="text-xs text-[#5e5242]">
            Capital allocation for deep research, governed by contributors.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
            <span className="chip">Governance First</span>
            <span className="chip">Research Vaults</span>
            <span className="chip">Institutional Web3</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Public Layer
          </span>
          <Link href="/" className="hover:text-[#1c1914]">Home</Link>
          <Link href="/vaults" className="hover:text-[#1c1914]">Research Vaults</Link>
          <Link href="/research" className="hover:text-[#1c1914]">Research Library</Link>
          <Link href="/governance" className="hover:text-[#1c1914]">Governance</Link>
          <Link href="/transparency" className="hover:text-[#1c1914]">Transparency</Link>
          <Link href="/learn" className="hover:text-[#1c1914]">Learn</Link>
          <Link href="/about" className="hover:text-[#1c1914]">About</Link>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Member Layer
          </span>
          <Link href="/contributor" className="hover:text-[#1c1914]">
            Dashboard
          </Link>
          <span>My Contributions</span>
          <span>Voting & Delegation</span>
          <span>Rewards & Reputation</span>
          <span>Profile</span>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Council Layer
          </span>
          <Link href="/admin" className="hover:text-[#1c1914]">
            Proposal Studio
          </Link>
          <span>Fund Allocation</span>
          <span>Treasury Ops</span>
          <span>Compliance & Risk</span>
          <span>Analytics</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#eadfcf] px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45] sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Phercons Vault</span>
        <div className="flex flex-wrap gap-4">
          <span>Funding Independent Research</span>
          <span>Transparent Treasury</span>
          <span>Contributor‑governed</span>
        </div>
      </div>
    </footer>
  );
}
