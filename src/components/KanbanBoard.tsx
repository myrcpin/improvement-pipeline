import { useState } from "react";
import { IdeaCard } from "@/components/IdeaCard";
import { STAGES, type Idea, type Stage } from "@/lib/ideas";

export function KanbanBoard({
  ideas,
  onMove,
}: {
  ideas: Idea[];
  onMove: (id: string, stage: Stage) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {STAGES.map((stage) => {
        const items = ideas.filter((i) => i.stage === stage);
        return (
          <section
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragging;
              if (id) onMove(id, stage);
              setDragging(null);
              setOver(null);
            }}
            className={`flex min-h-[320px] flex-col rounded-xl border p-3 transition-colors ${
              over === stage ? "border-accent bg-accent/5" : "border-border bg-surface-subtle"
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{stage}</h2>
              <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {items.length}
              </span>
            </header>
            <div className="flex flex-col gap-3">
              {items.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onDragStart={setDragging} />
              ))}
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Drag an idea here
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
