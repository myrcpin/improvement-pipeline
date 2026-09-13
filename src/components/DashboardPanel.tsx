import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Clock4, Lightbulb } from "lucide-react";
import { PROCESS_AREAS, type Idea } from "@/lib/ideas";

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
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function DashboardPanel({ ideas }: { ideas: Idea[] }) {
  const implemented = ideas.filter((i) => i.stage === "Implemented");
  const hoursSaved = implemented.reduce((sum, i) => sum + i.hoursSaved, 0);
  const data = PROCESS_AREAS.map((area) => ({
    area: area.replace("Client ", "Client\n"),
    ideas: ideas.filter((i) => i.area === area).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          label="Ideas submitted"
          value={String(ideas.length)}
          hint="Across all pipeline stages"
          icon={Lightbulb}
        />
        <Stat
          label="Hours saved / week"
          value={`${hoursSaved}`}
          hint={`From ${implemented.length} implemented ideas`}
          icon={Clock4}
        />
        <Stat
          label="Implemented"
          value={`${implemented.length}`}
          hint={`${ideas.length ? Math.round((implemented.length / ideas.length) * 100) : 0}% of the pipeline delivered`}
          icon={CheckCircle2}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Ideas by process area
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
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
      </div>
    </div>
  );
}
