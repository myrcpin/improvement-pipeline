import { Clock, Gauge, Loader2, Sparkles } from "lucide-react";
import type { Idea } from "@/lib/ideas";

const effortTone: Record<string, string> = {
  Low: "bg-success/10 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/10 text-destructive",
};

export function IdeaCard({
  idea,
  onDragStart,
}: {
  idea: Idea;
  onDragStart: (id: string) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", idea.id);
        onDragStart(idea.id);
      }}
      className="group cursor-grab rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">{idea.id}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {idea.area}
        </span>
      </div>

      <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">{idea.title}</h3>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {idea.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-1 text-muted-foreground">
          <Clock className="size-3" /> {idea.hoursSaved} hrs/week
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${effortTone[idea.effort]}`}
        >
          <Gauge className="size-3" /> {idea.effort} effort
        </span>
      </div>

      <div className="mt-3 rounded-md border border-border/70 bg-surface-subtle p-2.5">
        {idea.scoring ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Scoring impact…
          </p>
        ) : idea.impactScore == null ? (
          <p className="text-xs text-muted-foreground">Impact score unavailable.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-accent" />
              <span className="text-xs font-semibold text-foreground">Impact score</span>
              <span className="ml-auto rounded-md bg-navy px-2 py-0.5 text-xs font-bold text-navy-foreground">
                {idea.impactScore}/10
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {idea.rationale}
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">Submitted by {idea.submittedBy}</p>
    </article>
  );
}
