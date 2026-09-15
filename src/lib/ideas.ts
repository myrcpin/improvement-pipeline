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

export const RISK_LEVELS = ["Low", "Medium", "High"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ROLES = ["Analyst", "Senior Analyst", "AVP", "VP", "SVP"] as const;
export type Role = (typeof ROLES)[number];

export const HOURLY_RATES: Record<Role, number> = {
  Analyst: 22,
  "Senior Analyst": 28,
  AVP: 35,
  VP: 45,
  SVP: 58,
};

export const EFFORT_WEIGHT: Record<Effort, number> = { Low: 1, Medium: 3, High: 6 };

/** Raw score at which an idea reaches a 10/10 impact score (10 hrs/week at Low effort). */
export const SCORE_CEILING = 520;

export const STAGES = [
  "Submitted",
  "Pending Approval",
  "Under Review",
  "Backlog",
  "In Progress",
  "Implemented",
] as const;
export type Stage = (typeof STAGES)[number];

export type Idea = {
  id: string;
  title: string;
  description: string;
  area: ProcessArea;
  hoursSaved: number;
  effort: Effort;
  risk: RiskLevel;
  role: Role;
  headcount: number;
  stage: Stage;
  submittedBy: string;
  submittedAt: string;
  stageSince: string;
  approverName: string | null;
  approverRole: string | null;
  costToImplement: number | null;
  priority: Priority | null;
  owner: string | null;
  targetDate: string | null;
  actualHoursSaved: number | null;
  implementedAt: string | null;
  archived: boolean;
};

/* ---------- calculations ---------- */

export const annualHours = (i: Pick<Idea, "hoursSaved">) => Math.round(i.hoursSaved * 52);

export const impactScore = (i: Pick<Idea, "hoursSaved" | "effort">) => {
  const raw = (i.hoursSaved * 52) / EFFORT_WEIGHT[i.effort];
  return Math.max(1, Math.min(10, Math.round((raw / SCORE_CEILING) * 10)));
};

export const perPersonValue = (i: Pick<Idea, "hoursSaved" | "role">) =>
  Math.round(i.hoursSaved * 52 * HOURLY_RATES[i.role]);

export const enterpriseValue = (i: Pick<Idea, "hoursSaved" | "role" | "headcount">) =>
  perPersonValue(i) * Math.max(0, i.headcount);

export const roiRatio = (i: Idea) =>
  i.costToImplement && i.costToImplement > 0 ? enterpriseValue(i) / i.costToImplement : null;

export const daysBetween = (from: string, to: string | Date = new Date()) =>
  Math.max(
    0,
    Math.round(
      (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
    ),
  );

export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

/** Returns an error message if the move is not allowed yet, otherwise null. */
export function validateMove(idea: Idea, stage: Stage): string | null {
  const order = (s: Stage) => STAGES.indexOf(s);
  if (order(stage) > order("Pending Approval") && !idea.approverName)
    return "An approver (name and role) is required before this idea can leave Pending Approval.";
  if (stage === "In Progress" && (!idea.owner || !idea.targetDate))
    return "An owner and a target date are required before work can start.";
  return null;
}

export const stageRank = (s: Stage) => STAGES.indexOf(s);

/* ---------- seed data ---------- */

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysAhead = (n: number) => daysAgo(-n);

export const SEED_IDEAS: Idea[] = [
  {
    id: "IP-101",
    title: "Automate daily cash reconciliation exception flagging",
    description:
      "Replace the manual review of the overnight cash break report with a rules engine that flags only breaks above tolerance and routes them to the owning operator.",
    area: "Reconciliation",
    hoursSaved: 12,
    effort: "Medium",
    risk: "High",
    role: "Senior Analyst",
    headcount: 14,
    stage: "In Progress",
    submittedBy: "A. Whitfield",
    submittedAt: daysAgo(62),
    stageSince: daysAgo(9),
    approverName: "H. Marsden",
    approverRole: "Head of Reconciliation Utility",
    costToImplement: 85000,
    priority: "High",
    owner: "D. Achebe",
    targetDate: daysAhead(45),
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-102",
    title: "Standardise client onboarding document checklist",
    description:
      "Single templated KYC/AML document checklist per client type, replacing the four regional spreadsheets currently in use.",
    area: "Client Onboarding",
    hoursSaved: 6,
    effort: "Low",
    risk: "Medium",
    role: "Analyst",
    headcount: 22,
    stage: "Implemented",
    submittedBy: "R. Okafor",
    submittedAt: daysAgo(150),
    stageSince: daysAgo(24),
    approverName: "H. Marsden",
    approverRole: "Head of Reconciliation Utility",
    costToImplement: 18000,
    priority: "Medium",
    owner: "L. Petrova",
    targetDate: daysAgo(30),
    actualHoursSaved: 7,
    implementedAt: daysAgo(24),
    archived: false,
  },
  {
    id: "IP-103",
    title: "Straight-through processing for repetitive SWIFT MT103 payments",
    description:
      "Auto-release recurring low-value client payments below a set threshold where beneficiary details match a prior settled instruction.",
    area: "Cash Processing",
    hoursSaved: 15,
    effort: "High",
    risk: "High",
    role: "AVP",
    headcount: 6,
    stage: "Under Review",
    submittedBy: "M. Delacroix",
    submittedAt: daysAgo(40),
    stageSince: daysAgo(18),
    approverName: "C. Bellamy",
    approverRole: "VP, Payments Operations",
    costToImplement: 240000,
    priority: "High",
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-104",
    title: "Self-service monthly client valuation report portal",
    description:
      "Publish month-end valuation packs to the client portal instead of emailing individually prepared PDFs from the reporting mailbox.",
    area: "Client Reporting",
    hoursSaved: 9,
    effort: "Medium",
    risk: "Low",
    role: "Senior Analyst",
    headcount: 11,
    stage: "In Progress",
    submittedBy: "S. Lindqvist",
    submittedAt: daysAgo(88),
    stageSince: daysAgo(21),
    approverName: "C. Bellamy",
    approverRole: "VP, Payments Operations",
    costToImplement: 64000,
    priority: "Medium",
    owner: "N. Farrow",
    targetDate: daysAhead(20),
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-105",
    title: "Auto-match custodian statements to internal ledger positions",
    description:
      "Nightly tolerance-based matching of custodian holdings files against the internal book of record, leaving only true breaks for analysts.",
    area: "Reconciliation",
    hoursSaved: 18,
    effort: "High",
    risk: "High",
    role: "Senior Analyst",
    headcount: 19,
    stage: "Backlog",
    submittedBy: "T. Nakamura",
    submittedAt: daysAgo(70),
    stageSince: daysAgo(16),
    approverName: "H. Marsden",
    approverRole: "Head of Reconciliation Utility",
    costToImplement: 310000,
    priority: "High",
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-106",
    title: "Template library for ad-hoc client performance queries",
    description:
      "Pre-approved query templates for the ten most requested ad-hoc performance cuts so analysts stop rebuilding them each time.",
    area: "Client Reporting",
    hoursSaved: 4,
    effort: "Low",
    risk: "Low",
    role: "Analyst",
    headcount: 16,
    stage: "Implemented",
    submittedBy: "J. Bramwell",
    submittedAt: daysAgo(120),
    stageSince: daysAgo(35),
    approverName: "G. Iyer",
    approverRole: "SVP, Client Service Delivery",
    costToImplement: 9000,
    priority: "Low",
    owner: "J. Bramwell",
    targetDate: daysAgo(40),
    actualHoursSaved: 3,
    implementedAt: daysAgo(35),
    archived: false,
  },
  {
    id: "IP-107",
    title: "Digital signature capture for account opening forms",
    description:
      "Adopt e-signature for account opening packs to remove wet-signature courier delays and manual scanning into the client file.",
    area: "Client Onboarding",
    hoursSaved: 7,
    effort: "Medium",
    risk: "Medium",
    role: "AVP",
    headcount: 5,
    stage: "Backlog",
    submittedBy: "P. Ferreira",
    submittedAt: daysAgo(55),
    stageSince: daysAgo(11),
    approverName: "G. Iyer",
    approverRole: "SVP, Client Service Delivery",
    costToImplement: 46000,
    priority: "Medium",
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-108",
    title: "Consolidate intraday liquidity dashboards into one view",
    description:
      "Merge the three regional intraday cash position dashboards into a single funding view refreshed every fifteen minutes.",
    area: "Cash Processing",
    hoursSaved: 5,
    effort: "Medium",
    risk: "Medium",
    role: "VP",
    headcount: 4,
    stage: "Pending Approval",
    submittedBy: "K. Osei",
    submittedAt: daysAgo(19),
    stageSince: daysAgo(19),
    approverName: null,
    approverRole: null,
    costToImplement: null,
    priority: null,
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
  {
    id: "IP-109",
    title: "Weekly manual fee accrual spreadsheet refresh",
    description:
      "Superseded by the strategic billing platform migration, so the tactical spreadsheet automation is no longer required.",
    area: "Other",
    hoursSaved: 3,
    effort: "Low",
    risk: "Low",
    role: "Analyst",
    headcount: 3,
    stage: "Submitted",
    submittedBy: "E. Vasquez",
    submittedAt: daysAgo(95),
    stageSince: daysAgo(95),
    approverName: null,
    approverRole: null,
    costToImplement: null,
    priority: null,
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: true,
  },
  {
    id: "IP-110",
    title: "Auto-chase outstanding client tax documentation",
    description:
      "Scheduled reminder workflow for missing W-8/W-9 and CRS self-certifications instead of manual mailbox chasing.",
    area: "Client Onboarding",
    hoursSaved: 4,
    effort: "Low",
    risk: "Medium",
    role: "Analyst",
    headcount: 9,
    stage: "Submitted",
    submittedBy: "F. Adeyemi",
    submittedAt: daysAgo(6),
    stageSince: daysAgo(6),
    approverName: null,
    approverRole: null,
    costToImplement: null,
    priority: null,
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    archived: false,
  },
];
