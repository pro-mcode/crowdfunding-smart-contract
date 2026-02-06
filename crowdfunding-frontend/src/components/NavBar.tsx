"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const navItems = [
    { label: "Vault", href: "/" },
    { label: "Research", href: "/research" },
    { label: "Governance", href: "/governance" },
    ...(showAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];
  return (
    <nav className="nav-shell glass-panel animate-rise flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#6b5b45]">
          Phercons Vault
        </span>
        <span className="font-spectral text-lg text-[#1c1914]">
          Research Treasury
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
              pathname === item.href
                ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                : "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
