export type LearnEntry = {
  id: string;
  title: string;
  description: string;
};

export const LEARN_CATALOG: LearnEntry[] = [
  {
    id: "governance-101",
    title: "Governance 101",
    description:
      "Understand how proposals, voting power, and delegation shape capital allocation.",
  },
  {
    id: "vaults-how",
    title: "How Research Vaults Work",
    description:
      "Learn the mechanics of vault deposits, share issuance, and milestone releases.",
  },
  {
    id: "risk-disclosure",
    title: "Risk Disclosure",
    description:
      "Review liquidity buffers, timelocks, and protocol safeguards before allocating capital.",
  },
  {
    id: "dao-legal",
    title: "DAO Legal Structures",
    description:
      "Explore the legal frameworks and compliance practices behind institutional DAOs.",
  },
  {
    id: "voting-best-practices",
    title: "Voting Best Practices",
    description:
      "Level up on proposal review, delegation ethics, and decision transparency.",
  },
];
