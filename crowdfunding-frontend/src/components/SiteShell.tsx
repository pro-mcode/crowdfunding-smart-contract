import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

type SiteShellProps = {
  children: ReactNode;
  showAdmin?: boolean;
  showFooter?: boolean;
};

export default function SiteShell({
  children,
  showAdmin = false,
  showFooter = true,
}: SiteShellProps) {
  return (
    <div className="page-shell min-h-screen bg-[#f5f0e6] text-[#1c1914]">
      <div className="page-transition relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <NavBar showAdmin={showAdmin} variant="rail" />
          </div>
          <div className="flex flex-col gap-8">
            {children}
            {showFooter && <Footer />}
          </div>
        </div>
      </div>
    </div>
  );
}
