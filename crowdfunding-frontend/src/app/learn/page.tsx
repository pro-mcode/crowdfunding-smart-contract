"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { LEARN_CATALOG, type LearnEntry } from "@/lib/learnCatalog";

export default function LearnPage() {
  const [learnSections, setLearnSections] = useState<LearnEntry[]>(
    LEARN_CATALOG
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/learn");
        const result = await response.json();
        const data = Array.isArray(result?.data) ? result.data : [];
        if (data.length > 0) {
          setLearnSections(
            data.map((entry: LearnEntry) => ({
              id: entry.id,
              title: entry.title,
              description: entry.description,
            }))
          );
        }
      } catch {
        // keep fallback
      }
    };
    load();
  }, []);

  return (
    <SiteShell>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Learn
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Education for contributors, researchers, and institutional partners.
          </h1>
          <p className="text-sm text-[#5e5242]">
            We translate governance mechanics into clear playbooks for
            researchers and funders entering web3 research finance.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {learnSections.map((section) => (
            <div
              key={section.id}
              className="glass-panel animate-fade flex flex-col gap-3 p-6"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                {section.title}
              </p>
              <p className="text-sm text-[#5e5242]">{section.description}</p>
              <span className="mt-auto text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                Read Guide
              </span>
            </div>
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
