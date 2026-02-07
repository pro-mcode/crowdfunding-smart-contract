export type VaultActivity = {
  label: string;
  detail: string;
  timestamp: string;
};

export type VaultCatalogEntry = {
  id: string;
  name: string;
  focus: string;
  tvl: string;
  activeProposals: number;
  riskRating: string;
  participation: string;
  horizon: string;
  overview: string;
  thesis: string;
  expectedOutcomes: string[];
  fundingStructure: string[];
  withdrawalConditions: string[];
  governanceModel: string[];
  deliverables: string[];
  reports: string[];
  datasets: string[];
  ipRights: string;
  activity: VaultActivity[];
};

export const VAULT_CATALOG: VaultCatalogEntry[] = [
  {
    id: "ai-infra",
    name: "AI Infra Research Vault",
    focus: "Compute efficiency, model safety, and infrastructure resilience.",
    tvl: "3,240 ETH",
    activeProposals: 6,
    riskRating: "Moderate",
    participation: "71%",
    horizon: "12-18 mo",
    overview:
      "Capital allocation for research teams advancing open AI infrastructure and safety tooling.",
    thesis:
      "Prioritize reproducible systems research that unlocks scalable, secure AI deployment without compromising governance transparency.",
    expectedOutcomes: [
      "Open benchmarks for inference efficiency",
      "Safety validation frameworks",
      "Public datasets for infra performance",
    ],
    fundingStructure: [
      "Milestone-based releases tied to reproducibility",
      "Liquidity buffer maintained for withdrawals",
      "Quarterly performance reviews",
    ],
    withdrawalConditions: [
      "14-day cooldown window",
      "Emergency pause via council multisig",
      "Milestone-based unlock approvals",
    ],
    governanceModel: [
      "Quorum: 15%",
      "Pass threshold: 60%",
      "Timelock: 72h",
      "Reputation modifiers for reviewers",
    ],
    deliverables: [
      "Benchmark reports",
      "Open-source tooling",
      "Security attestations",
    ],
    reports: ["Inference Cost Report v3", "Safety Ops Memo Q2"],
    datasets: ["Open Infer Bench 2025", "Inference Latency Atlas"],
    ipRights: "Open IP with attribution clauses for vault contributors.",
    activity: [
      {
        label: "Deposit",
        detail: "34 ETH by 0x82A...D3f",
        timestamp: "2h ago",
      },
      {
        label: "Proposal",
        detail: "Milestone 2 budget release",
        timestamp: "1d ago",
      },
      {
        label: "Report",
        detail: "Inference efficiency benchmark published",
        timestamp: "4d ago",
      },
    ],
  },
  {
    id: "biosecurity",
    name: "Biosecurity & Health Vault",
    focus: "Pandemic response tooling and rapid diagnostics.",
    tvl: "1,980 ETH",
    activeProposals: 4,
    riskRating: "High",
    participation: "64%",
    horizon: "18-24 mo",
    overview:
      "Backs clinical and systems research focused on rapid diagnostics and biosurveillance networks.",
    thesis:
      "Fund evidence-based interventions that shorten detection-to-response timelines in global health systems.",
    expectedOutcomes: [
      "Rapid testing protocols",
      "Global partner network mapping",
      "Open access response playbooks",
    ],
    fundingStructure: [
      "Stage-gated grants",
      "Independent peer review for releases",
      "Dedicated compliance reporting",
    ],
    withdrawalConditions: [
      "21-day cooldown window",
      "Emergency pause for safety events",
      "Multi-sig approval for large withdrawals",
    ],
    governanceModel: [
      "Quorum: 18%",
      "Pass threshold: 65%",
      "Timelock: 96h",
      "External reviewer attestations",
    ],
    deliverables: [
      "Surveillance network reports",
      "Diagnostic validation results",
      "Policy impact memos",
    ],
    reports: ["Response Readiness Review", "Diagnostics Pilot Summary"],
    datasets: ["Global Pathogen Signals", "Rapid Test Efficacy"],
    ipRights: "Shared IP with public-interest licensing.",
    activity: [
      {
        label: "Vote",
        detail: "Proposal 12 reached quorum",
        timestamp: "6h ago",
      },
      {
        label: "Grant",
        detail: "Milestone 1 released (210 ETH)",
        timestamp: "3d ago",
      },
      {
        label: "Deposit",
        detail: "18 ETH by 0x55B...9C2",
        timestamp: "6d ago",
      },
    ],
  },
  {
    id: "climate",
    name: "Climate Systems Vault",
    focus: "Climate modeling, mitigation tooling, and carbon accounting.",
    tvl: "2,760 ETH",
    activeProposals: 5,
    riskRating: "Moderate",
    participation: "69%",
    horizon: "12-20 mo",
    overview:
      "Invests in modeling research that improves the transparency of climate risk and mitigation strategies.",
    thesis:
      "Prioritize open, verifiable climate datasets and dashboards for policy makers and institutional investors.",
    expectedOutcomes: [
      "Climate risk models",
      "Carbon accounting datasets",
      "Mitigation scenario dashboards",
    ],
    fundingStructure: [
      "Quarterly milestone reviews",
      "Spend caps per project",
      "Public dashboards for transparency",
    ],
    withdrawalConditions: [
      "10-day cooldown window",
      "Milestone validation required",
      "Treasury guardrails enforced",
    ],
    governanceModel: [
      "Quorum: 15%",
      "Pass threshold: 60%",
      "Timelock: 72h",
      "Reputation-weighted review votes",
    ],
    deliverables: [
      "Risk models",
      "Scenario projections",
      "Open data releases",
    ],
    reports: ["Carbon Exposure Index", "Mitigation Pathways Q1"],
    datasets: ["Climate Risk Atlas", "Net Zero Scenario Bank"],
    ipRights: "Open data with commercial attribution.",
    activity: [
      {
        label: "Snapshot",
        detail: "Quarterly impact report published",
        timestamp: "1d ago",
      },
      {
        label: "Vote",
        detail: "Proposal 7 passed",
        timestamp: "5d ago",
      },
      {
        label: "Deposit",
        detail: "44 ETH by 0x71F...A2C",
        timestamp: "1w ago",
      },
    ],
  },
  {
    id: "governance",
    name: "Governance Tooling Vault",
    focus: "DAO operations, security tooling, and governance analytics.",
    tvl: "1,420 ETH",
    activeProposals: 3,
    riskRating: "Low",
    participation: "78%",
    horizon: "6-12 mo",
    overview:
      "Funds governance primitives, auditing frameworks, and analytics that strengthen institutional DAO ops.",
    thesis:
      "Advance governance tooling that improves transparency, accountability, and execution reliability.",
    expectedOutcomes: [
      "Governance analytics suite",
      "Audit-ready reporting",
      "Delegation tooling",
    ],
    fundingStructure: [
      "Short-cycle grants",
      "Weekly milestone check-ins",
      "Mandatory audit trail",
    ],
    withdrawalConditions: [
      "7-day cooldown window",
      "Timelock enforced actions",
      "Multi-sig guardrails",
    ],
    governanceModel: [
      "Quorum: 12%",
      "Pass threshold: 55%",
      "Timelock: 48h",
      "Emergency veto for security events",
    ],
    deliverables: [
      "Governance dashboards",
      "Security playbooks",
      "Delegation flows",
    ],
    reports: ["Governance Ops Review", "Security Tooling Update"],
    datasets: ["Delegation Graph", "Vote Participation Audit"],
    ipRights: "Open source with public governance license.",
    activity: [
      {
        label: "Audit",
        detail: "Ops security review published",
        timestamp: "2d ago",
      },
      {
        label: "Deposit",
        detail: "22 ETH by 0x9B4...F1A",
        timestamp: "5d ago",
      },
      {
        label: "Proposal",
        detail: "Delegation analytics v2",
        timestamp: "1w ago",
      },
    ],
  },
];

export const getVaultById = (id: string) =>
  VAULT_CATALOG.find((vault) => vault.id === id);
