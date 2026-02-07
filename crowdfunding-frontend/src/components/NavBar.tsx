"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavBarProps = {
  showAdmin?: boolean;
  variant?: "top" | "rail";
};

export default function NavBar({ showAdmin = false, variant = "top" }: NavBarProps) {
  const pathname = usePathname();
  const isRail = variant === "rail";
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));
  const publicItems = [
    { label: "Home", href: "/" },
    { label: "Vaults", href: "/vaults" },
    { label: "Governance", href: "/governance" },
    { label: "Transparency", href: "/transparency" },
    { label: "Learn", href: "/learn" },
    { label: "About", href: "/about" },
  ];
  const memberItems = [{ label: "Dashboard", href: "/contributor" }];
  const councilItems = showAdmin ? [{ label: "Council", href: "/admin" }] : [];
  const flatItems = [...publicItems, ...memberItems, ...councilItems];
  return (
    <nav
      className={`nav-shell glass-panel animate-rise ${
        isRail
          ? "flex flex-col items-start gap-6 rounded-3xl px-5 py-6"
          : "flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4 sm:px-6"
      }`}
    >
      <div className={`flex flex-col ${isRail ? "gap-2" : ""}`}>
        <span className="text-[10px] uppercase tracking-[0.45em] text-[#6b5b45]">
          Phercons Vault
        </span>
        <span className="font-spectral text-lg text-[#1c1914]">
          Research Treasury
        </span>
        <span className="text-xs text-[#5e5242]">
          Capital allocation for deep research, governed by contributors.
        </span>
      </div>
      {isRail ? (
        <div className="flex w-full flex-col gap-4">
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#6b5b45]">
              Public Layer
            </span>
            <div className="flex flex-col gap-2">
              {publicItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full rounded-2xl border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                    isActive(item.href)
                      ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                      : "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#6b5b45]">
              Member Layer
            </span>
            <div className="flex flex-col gap-2">
              {memberItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full rounded-2xl border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                    isActive(item.href)
                      ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                      : "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {councilItems.length > 0 && (
            <div className="grid gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#6b5b45]">
                Council Layer
              </span>
              <div className="flex flex-col gap-2">
                {councilItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full rounded-2xl border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                      isActive(item.href)
                        ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                        : "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {flatItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                isActive(item.href)
                  ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                  : "border-[#1c1914] text-[#1c1914] hover:bg-[#1c1914] hover:text-[#fff7ea]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
