import { useState } from "react";
import { IdeaCard } from "@/components/IdeaCard";
import { PRIORITIES, STAGES, roiRatio, type Idea, type Stage } from "@/lib/ideas";

type Sort = "priority" | "roi";

export function KanbanBoard({
  ideas,
  onMove,
  onEdit,
  onArchive,
  onDelete,
}: {
  ideas: Idea[];
  onMove: (id: string, stage: Stage) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [backlogSort, setBacklogSort] = useState<Sort>("priority");

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {STAGES.map((stage) => {
        let items = ideas.filter((i) => i.stage === stage);
        if (stage === "Backlog") {
          items = [...items].sort((a, b) =>
            backlogSort === "priority"
              ? PRIORITIES.indexOf(a.priority ?? "Low") - PRIORITIES.indexOf(b.priority ?? "Low")
              : (roiRatio(b) ?? 0) - (roiRatio(a) ?? 0),
          );
        }
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
            <header className="mb-3 space-y-2 px-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">{stage}</h2>
                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {stage === "Backlog" && (
                <div className="flex items-center gap-1 text-[11px]">
                  {(["priority", "roi"] as Sort[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBacklogSort(s)}
                      className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                        backlogSort === s
                          ? "bg-navy text-navy-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s === "priority" ? "Priority" : "ROI"}
                    </button>
                  ))}
                </div>
              )}
            </header>
            <div className="flex flex-col gap-3">
              {items.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onDragStart={setDragging}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
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
