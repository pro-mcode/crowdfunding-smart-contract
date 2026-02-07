export type ContributionCategory = "supporter" | "developer" | "researcher";

export type RubricEntry = {
  label: string;
  category: ContributionCategory;
  points?: number;
  pointsPerUnit?: number;
  unit?: string;
  cap?: number;
};

export const RUBRIC_VERSION = "v1";

export const CONTRIBUTION_RUBRIC: Record<string, RubricEntry> = {
  "onchain.vote": {
    label: "Governance vote",
    category: "supporter",
    points: 5,
  },
  "onchain.donation": {
    label: "Donation (ETH)",
    category: "supporter",
    pointsPerUnit: 10,
    unit: "ETH",
    cap: 50,
  },
  "onchain.proposal": {
    label: "Governance proposal",
    category: "supporter",
    points: 25,
  },
  "github.merged_pr": {
    label: "Merged pull request",
    category: "developer",
    points: 20,
  },
  "github.commit": {
    label: "Commit",
    category: "developer",
    points: 5,
    cap: 40,
  },
  "github.issue": {
    label: "Issue / review",
    category: "developer",
    points: 10,
    cap: 40,
  },
  "publication.doi": {
    label: "Publication (DOI/IPFS)",
    category: "researcher",
    points: 40,
  },
  "research.dataset": {
    label: "Dataset release",
    category: "researcher",
    points: 20,
  },
  "research.audit": {
    label: "Security audit",
    category: "researcher",
    points: 50,
  },
  "research.report": {
    label: "Research report",
    category: "researcher",
    points: 30,
  },
};

export const CONTRIBUTION_TYPES = Object.keys(CONTRIBUTION_RUBRIC);

export const DEFAULT_ROLE_THRESHOLDS = {
  supporter: 30,
  developer: 50,
  researcher: 50,
};

export const getContributionCategory = (
  type: string
): ContributionCategory | null => {
  return CONTRIBUTION_RUBRIC[type]?.category ?? null;
};

export const computeContributionPoints = (
  type: string,
  quantity?: number | null
) => {
  const entry = CONTRIBUTION_RUBRIC[type];
  if (!entry) return 0;
  const qty = Number.isFinite(quantity) && Number(quantity) > 0 ? Number(quantity) : 1;
  let points = entry.points ?? (entry.pointsPerUnit ?? 0) * qty;
  if (entry.cap !== undefined) {
    points = Math.min(points, entry.cap);
  }
  return Number.isFinite(points) ? points : 0;
};
