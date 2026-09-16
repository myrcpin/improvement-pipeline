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

/** Plain-language definitions shown in the form's "?" help. */
export const FIELD_HELP: Record<"area" | "effort" | "risk" | "role", { title: string; items: [string, string][] }> = {
  area: {
    title: "Process affected",
    items: [
      ["Cash Processing", "Payments, cash movements and liquidity handling."],
      ["Client Reporting", "Statements, valuations and reports sent to clients."],
      ["Reconciliation", "Matching internal records to custodians, banks or ledgers."],
      ["Client Onboarding", "Account opening, KYC/AML and client documentation."],
      ["Other", "Anything outside the four areas above."],
    ],
  },
  effort: {
    title: "Effort to implement",
    items: [
      ["Low", "Under 1 week of build or configuration work."],
      ["Medium", "1 to 4 weeks of work."],
      ["High", "Over 4 weeks, or needs cross-team dependencies."],
    ],
  },
  risk: {
    title: "Risk / control impact",
    items: [
      ["Low", "No change to controls, approvals or client money movement."],
      ["Medium", "Changes a control step, report or client-facing output."],
      ["High", "Touches payments, reconciliations or regulatory controls."],
    ],
  },
  role: {
    title: "Role / pay grade affected",
    items: [
      ["Analyst", `Entry-level processing staff (about £${HOURLY_RATES["Analyst"]}/hr).`],
      ["Senior Analyst", `Experienced processors and checkers (about £${HOURLY_RATES["Senior Analyst"]}/hr).`],
      ["AVP", `Team leads and subject experts (about £${HOURLY_RATES["AVP"]}/hr).`],
      ["VP", `Managers of a function (about £${HOURLY_RATES["VP"]}/hr).`],
      ["SVP", `Senior leadership (about £${HOURLY_RATES["SVP"]}/hr).`],
    ],
  },
};

export const EFFORT_WEIGHT: Record<Effort, number> = { Low: 1, Medium: 3, High: 6 };

/** Raw score at which an idea reaches a 10/10 impact score (roughly 6 hrs/week at Low effort). */
export const SCORE_CEILING = 300;

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
  /** Lifecycle: active on the board, archived (reversible), or soft-deleted (purged after retention). */
  status: IdeaStatus;
  archivedAt: string | null;
  deletedAt: string | null;
  /** Where the Effort / Risk values came from: AI suggestion, human override of it, or not tracked. */
  effortSource?: FieldSource;
  riskSource?: FieldSource;
};

export type FieldSource = "ai" | "overridden" | null;

export type IdeaStatus = "active" | "archived" | "deleted";

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

/* ---------- retention (soft delete + purge) ---------- */

/** Deleted ideas are kept this long before permanent removal. */
export const RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;

/** Timestamp at which a deleted idea becomes eligible for permanent removal. */
export const purgeAt = (i: Pick<Idea, "deletedAt">) =>
  i.deletedAt ? new Date(i.deletedAt).getTime() + RETENTION_DAYS * DAY_MS : null;

/** Whole days left before permanent removal (0 means due today). */
export const daysUntilPurge = (i: Pick<Idea, "deletedAt">, now = Date.now()) => {
  const at = purgeAt(i);
  return at == null ? null : Math.max(0, Math.ceil((at - now) / DAY_MS));
};

/**
 * Removes deleted ideas whose retention window has passed.
 *
 * In this demo it runs in the browser on load and then hourly. In production the same rule
 * belongs in a scheduled backend job (for example a daily cron / Supabase pg_cron task):
 *   DELETE FROM ideas WHERE status = 'deleted' AND deleted_at < now() - interval '30 days';
 * so records are purged even when nobody has the app open, and the purge is audit-logged.
 */
export function purgeExpired(ideas: Idea[], now = Date.now()): Idea[] {
  return ideas.filter((i) => {
    if (i.status !== "deleted") return true;
    const at = purgeAt(i);
    return at == null || at > now;
  });
}

/* ---------- seed data ---------- */

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysAhead = (n: number) => daysAgo(-n);
/** Full timestamp n days ago, used for archive / delete events. */
const tsAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
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
    status: "archived",
    archivedAt: tsAgo(20),
    deletedAt: null,
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
    status: "active",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "IP-111",
    title: "Manual FX rate upload for month-end revaluation",
    description:
      "Scripted upload of month-end FX rates into the revaluation tool. Parked while treasury evaluates a direct market data feed.",
    area: "Reconciliation",
    hoursSaved: 2.5,
    effort: "Low",
    risk: "Medium",
    role: "Senior Analyst",
    headcount: 4,
    stage: "Pending Approval",
    submittedBy: "O. Brennan",
    submittedAt: daysAgo(48),
    stageSince: daysAgo(41),
    approverName: null,
    approverRole: null,
    costToImplement: null,
    priority: null,
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    status: "archived",
    archivedAt: tsAgo(5),
    deletedAt: null,
  },
  {
    id: "IP-112",
    title: "Fax-to-email bridge for legacy client instructions",
    description:
      "Convert incoming fax instructions to email automatically. Dropped because the last fax-dependent clients moved to the portal.",
    area: "Cash Processing",
    hoursSaved: 1.5,
    effort: "Medium",
    risk: "High",
    role: "Analyst",
    headcount: 6,
    stage: "Submitted",
    submittedBy: "H. Qureshi",
    submittedAt: daysAgo(64),
    stageSince: daysAgo(64),
    approverName: null,
    approverRole: null,
    costToImplement: null,
    priority: null,
    owner: null,
    targetDate: null,
    actualHoursSaved: null,
    implementedAt: null,
    status: "deleted",
    archivedAt: null,
    deletedAt: tsAgo(18),
  },
];
