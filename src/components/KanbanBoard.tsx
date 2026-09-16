import { useState, type DragEvent } from "react";
import { Archive, Trash2 } from "lucide-react";
import { IdeaCard } from "@/components/IdeaCard";
import { PRIORITIES, STAGES, roiRatio, type Idea, type Stage } from "@/lib/ideas";

type Sort = "priority" | "roi";
type Zone = "archive" | "delete";

/** True when the pointer genuinely left the element (not just moved onto a child). */
const leftElement = (e: DragEvent<HTMLElement>) =>
  !e.currentTarget.contains(e.relatedTarget as Node | null);

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
  const [overZone, setOverZone] = useState<Zone | null>(null);
  const [backlogSort, setBacklogSort] = useState<Sort>("priority");

  const endDrag = () => {
    setDragging(null);
    setOver(null);
    setOverZone(null);
  };

  const draggedId = (e: DragEvent) => e.dataTransfer.getData("text/plain") || dragging;

  const zoneProps = (zone: Zone, action: (id: string) => void) => ({
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overZone !== zone) setOverZone(zone);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (leftElement(e)) setOverZone((z) => (z === zone ? null : z));
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const id = draggedId(e);
      if (id) action(id);
      endDrag();
    },
  });

  return (
    <>
      <div className="grid gap-4 pb-40 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
                if (over !== stage) setOver(stage);
              }}
              onDragLeave={(e) => {
                if (leftElement(e)) setOver((s) => (s === stage ? null : s));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = draggedId(e);
                if (id) onMove(id, stage);
                endDrag();
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
                    isDragging={dragging === idea.id}
                    // defer so the drag image is captured before React re-renders
                    onDragStart={(id) => setTimeout(() => setDragging(id), 0)}
                    onDragEnd={endDrag}
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

      {/* Drop zones: fixed to the bottom of the viewport, shown while a card is dragged. */}
      <div
        aria-hidden={!dragging}
        className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 transition-all duration-200 ${
          dragging ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
          <div
            {...zoneProps("delete", onDelete)}
            data-testid="drop-delete"
            className={`flex h-24 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-semibold shadow-lg transition-all duration-150 ${
              overZone === "delete"
                ? "scale-105 border-red-500 bg-red-200 text-red-800 shadow-xl"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            <Trash2 className="size-5" /> Drag here to delete
          </div>
          <div
            {...zoneProps("archive", onArchive)}
            data-testid="drop-archive"
            className={`flex h-24 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-semibold shadow-lg transition-all duration-150 ${
              overZone === "archive"
                ? "scale-105 border-amber-500 bg-amber-200 text-amber-900 shadow-xl"
                : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
          >
            <Archive className="size-5" /> Drag here to archive
          </div>
        </div>
      </div>
    </>
  );
}
