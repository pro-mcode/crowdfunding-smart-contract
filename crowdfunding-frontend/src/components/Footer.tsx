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
            A governance-first vault for funding labs, experiments, and
            institutional-grade research programs.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
            <span className="chip">Crowdfunding</span>
            <span className="chip">Audit Trails</span>
            <span className="chip">Open Governance</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Navigate
          </span>
          <Link href="/" className="hover:text-[#1c1914]">
            Vault Overview
          </Link>
          <Link href="/research" className="hover:text-[#1c1914]">
            Research Library
          </Link>
          <Link href="/governance" className="hover:text-[#1c1914]">
            Governance Hub
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Programs
          </span>
          <span>Milestone‑based unlocks</span>
          <span>Publication registry</span>
          <span>Experiment ledger</span>
          <span>Security & compliance exports</span>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
            Contact
          </span>
          <span>hello@phercons.xyz</span>
          <span>Board & investor updates</span>
          <span>Governance support desk</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#eadfcf] px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45] sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Phercons Vault</span>
        <div className="flex flex-wrap gap-4">
          <span>Built for R&D governance</span>
          <span>Sepolia‑ready</span>
          <span>On‑chain transparency</span>
        </div>
      </div>
    </footer>
  );
}
