export const PROCESS_AREAS = [
  "Cash Processing",
  "Client Reporting",
  "Reconciliation",
  "Client Onboarding",
  "Other",
] as const;

export type ProcessArea = (typeof PROCESS_AREAS)[number];

export const EFFORTS = ["Low", "Medium", "High"] as const;
export type Effort = (typeof EFFORTS)[number];

export const STAGES = ["Submitted", "Under Review", "In Progress", "Implemented"] as const;
export type Stage = (typeof STAGES)[number];

export type Idea = {
  id: string;
  title: string;
  description: string;
  area: ProcessArea;
  hoursSaved: number;
  effort: Effort;
  stage: Stage;
  submittedBy: string;
  impactScore: number | null;
  rationale: string | null;
  scoring?: boolean;
};

export const SEED_IDEAS: Idea[] = [
  {
    id: "IP-101",
    title: "Automate daily cash reconciliation exception flagging",
    description:
      "Replace the manual review of the overnight cash break report with a rules engine that flags only breaks above tolerance and routes them to the owning operator.",
    area: "Reconciliation",
    hoursSaved: 12,
    effort: "Medium",
    stage: "In Progress",
    submittedBy: "A. Whitfield",
    impactScore: 9,
    rationale:
      "High weekly time saving in a control-critical area for a moderate build effort.",
  },
  {
    id: "IP-102",
    title: "Standardise client onboarding document checklist",
    description:
      "Single templated KYC/AML document checklist per client type, replacing the four regional spreadsheets currently in use.",
    area: "Client Onboarding",
    hoursSaved: 6,
    effort: "Low",
    stage: "Implemented",
    submittedBy: "R. Okafor",
    impactScore: 8,
    rationale: "Low-effort standardisation that removes rework across all onboarding regions.",
  },
  {
    id: "IP-103",
    title: "Straight-through processing for repetitive SWIFT MT103 payments",
    description:
      "Auto-release recurring low-value client payments below a set threshold where beneficiary details match a prior settled instruction.",
    area: "Cash Processing",
    hoursSaved: 15,
    effort: "High",
    stage: "Under Review",
    submittedBy: "M. Delacroix",
    impactScore: 7,
    rationale: "Large saving but significant build and payment-controls approval required.",
  },
  {
    id: "IP-104",
    title: "Self-service monthly client valuation report portal",
    description:
      "Publish month-end valuation packs to the client portal instead of emailing individually prepared PDFs from the reporting mailbox.",
    area: "Client Reporting",
    hoursSaved: 9,
    effort: "Medium",
    stage: "In Progress",
    submittedBy: "S. Lindqvist",
    impactScore: 8,
    rationale: "Removes a recurring manual distribution task and improves client experience.",
  },
  {
    id: "IP-105",
    title: "Auto-match custodian statements to internal ledger positions",
    description:
      "Nightly tolerance-based matching of custodian holdings files against the internal book of record, leaving only true breaks for analysts.",
    area: "Reconciliation",
    hoursSaved: 18,
    effort: "High",
    stage: "Submitted",
    submittedBy: "T. Nakamura",
    impactScore: 8,
    rationale: "Very high time saving, tempered by integration effort across custodian feeds.",
  },
  {
    id: "IP-106",
    title: "Template library for ad-hoc client performance queries",
    description:
      "Pre-approved query templates for the ten most requested ad-hoc performance cuts so analysts stop rebuilding them each time.",
    area: "Client Reporting",
    hoursSaved: 4,
    effort: "Low",
    stage: "Implemented",
    submittedBy: "J. Bramwell",
    impactScore: 7,
    rationale: "Quick win that eliminates repeated rework with almost no build cost.",
  },
  {
    id: "IP-107",
    title: "Digital signature capture for account opening forms",
    description:
      "Adopt e-signature for account opening packs to remove wet-signature courier delays and manual scanning into the client file.",
    area: "Client Onboarding",
    hoursSaved: 7,
    effort: "Medium",
    stage: "Under Review",
    submittedBy: "P. Ferreira",
    impactScore: 7,
    rationale: "Solid cycle-time and effort saving with standard vendor integration effort.",
  },
  {
    id: "IP-108",
    title: "Consolidate intraday liquidity dashboards into one view",
    description:
      "Merge the three regional intraday cash position dashboards into a single funding view refreshed every fifteen minutes.",
    area: "Cash Processing",
    hoursSaved: 5,
    effort: "Medium",
    stage: "Submitted",
    submittedBy: "K. Osei",
    impactScore: 6,
    rationale: "Moderate saving; main value is faster funding decisions rather than pure hours.",
  },
];
