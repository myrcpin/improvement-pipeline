import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  Archive,
  AlarmClock,
  CheckCircle2,
  Clock4,
  Lightbulb,
  PoundSterling,
  TrendingUp,
} from "lucide-react";
import {
  PROCESS_AREAS,
  ROLES,
  daysBetween,
  enterpriseValue,
  gbp,
  impactScore,
  type Idea,
} from "@/lib/ideas";

const RISK_VALUE: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DashboardPanel({
  ideas,
  archived,
  onViewArchive,
}: {
  ideas: Idea[];
  archived: Idea[];
  onViewArchive: () => void;
}) {
  const implemented = ideas.filter((i) => i.stage === "Implemented");
  const hoursSaved = implemented.reduce((s, i) => s + (i.actualHoursSaved ?? i.hoursSaved), 0);
  const totalValue = ideas.reduce((s, i) => s + enterpriseValue(i), 0);

  const backlog = ideas.filter((i) => i.stage === "Backlog");
  const backlogValue = backlog.reduce((s, i) => s + enterpriseValue(i), 0);
  const backlogCost = backlog.reduce((s, i) => s + (i.costToImplement ?? 0), 0);
  const backlogRoi = backlogCost > 0 ? backlogValue / backlogCost : null;

  const cycleTimes = implemented
    .filter((i) => i.implementedAt)
    .map((i) => daysBetween(i.submittedAt, i.implementedAt!));
  const avgCycle = cycleTimes.length
    ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
    : null;

  const stuck = ideas
    .filter((i) => i.stage !== "Implemented" && daysBetween(i.stageSince) > 14)
    .sort((a, b) => daysBetween(b.stageSince) - daysBetween(a.stageSince));

  const areaData = PROCESS_AREAS.map((area) => ({
    area: area.replace("Client ", "Client\n"),
    ideas: ideas.filter((i) => i.area === area).length,
  }));

  const roleData = ROLES.map((role) => ({
    role,
    value: ideas.filter((i) => i.role === role).reduce((s, i) => s + enterpriseValue(i), 0),
  })).filter((r) => r.value > 0);

  const scatterData = ideas.map((i) => ({
    x: impactScore(i),
    y: RISK_VALUE[i.risk],
    z: Math.max(1, enterpriseValue(i) / 1000),
    id: i.id,
    title: i.title,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Enterprise annual value"
          value={gbp(totalValue)}
          hint="Across all active ideas"
          icon={PoundSterling}
        />
        <Stat
          label="Backlog ROI"
          value={backlogRoi ? `${backlogRoi.toFixed(1)}×` : "—"}
          hint={`${gbp(backlogValue)} value vs ${gbp(backlogCost)} cost`}
          icon={TrendingUp}
        />
        <Stat
          label="Ideas submitted"
          value={String(ideas.length)}
          hint="Active pipeline, excluding archive"
          icon={Lightbulb}
        />
        <Stat
          label="Hours saved / week"
          value={String(hoursSaved)}
          hint={`From ${implemented.length} implemented ideas`}
          icon={Clock4}
        />
        <Stat
          label="Average cycle time"
          value={avgCycle == null ? "—" : `${avgCycle} days`}
          hint="Submitted to implemented"
          icon={CheckCircle2}
        />
        <Stat
          label="Stuck ideas"
          value={String(stuck.length)}
          hint="More than 14 days in one column"
          icon={AlarmClock}
        />
        <Stat
          label="Implemented"
          value={String(implemented.length)}
          hint={`${ideas.length ? Math.round((implemented.length / ideas.length) * 100) : 0}% of the pipeline delivered`}
          icon={CheckCircle2}
        />
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Archived</span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {archived.length}
          </p>
          <button
            type="button"
            onClick={onViewArchive}
            className="mt-1 text-xs font-medium text-accent underline-offset-2 hover:underline"
          >
            View archived ideas
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Impact score vs risk / control impact">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Impact"
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Risk"
                  domain={[0, 4]}
                  ticks={[1, 2, 3]}
                  tickFormatter={(v: number) => ["", "Low", "Medium", "High"][v] ?? ""}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <ReferenceLine x={5} stroke="var(--border)" />
                <ReferenceLine y={2} stroke="var(--border)" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                  formatter={(_v, _n, item: { payload?: { title?: string } }) => [
                    item?.payload?.title ?? "",
                    "",
                  ]}
                />
                <Scatter data={scatterData} fill="var(--chart-3)">
                  {scatterData.map((d) => (
                    <Cell key={d.id} fill="var(--chart-3)" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Bubble size reflects enterprise annual value. Top-right is high impact, high control
            benefit.
          </p>
        </Panel>

        <Panel title="Ideas by process area">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="area"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-subtle)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="ideas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Enterprise annual value by role / pay grade">
          <ul className="space-y-3">
            {roleData.map((r) => {
              const max = Math.max(...roleData.map((x) => x.value));
              return (
                <li key={r.role}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{r.role}</span>
                    <span className="text-muted-foreground">{gbp(r.value)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface-subtle">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${max ? (r.value / max) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {roleData.length === 0 && (
              <li className="text-xs text-muted-foreground">No ideas in the pipeline yet.</li>
            )}
          </ul>
        </Panel>

        <Panel title="Stuck ideas (more than 14 days in one column)">
          <ul className="divide-y divide-border">
            {stuck.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {i.id} · {i.stage}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-warning/15 px-2 py-1 text-[11px] font-medium text-warning">
                  {daysBetween(i.stageSince)} days
                </span>
              </li>
            ))}
            {stuck.length === 0 && (
              <li className="py-2 text-xs text-muted-foreground">
                Nothing is stalled — every idea has moved within the last two weeks.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
