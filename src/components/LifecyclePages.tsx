import { useState, type DragEvent, type ReactNode } from "react";
import { ArchiveRestore, Clock, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RETENTION_DAYS,
  daysUntilPurge,
  enterpriseValue,
  gbp,
  impactScore,
  type Idea,
} from "@/lib/ideas";

const ago = (iso: string | null) => {
  if (!iso) return "unknown";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

function CompactCard({
  idea,
  meta,
  badge,
  actions,
  draggable,
  onDragStart,
  onDragEnd,
}: {
  idea: Idea;
  meta: string;
  badge?: ReactNode;
  actions: ReactNode;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <article
      data-testid={`compact-${idea.id}`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", idea.id);
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      className={`flex flex-col rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">{idea.id}</span>
        {badge}
      </div>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{idea.title}</h3>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-navy px-2.5 py-1.5 text-navy-foreground">
          <p className="text-navy-foreground/70">Enterprise annual value</p>
          <p className="text-sm font-semibold">{gbp(enterpriseValue(idea))}</p>
        </div>
        <div className="rounded-md border border-border/70 bg-surface-subtle px-2.5 py-1.5">
          <p className="text-muted-foreground">Impact score</p>
          <p className="text-sm font-semibold text-foreground">{impactScore(idea)}/10</p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="size-3" /> {meta}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{actions}</div>
    </article>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-12 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

const grid = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

/* ---------------- Archived ---------------- */

export function ArchivedPage({
  ideas,
  onRestore,
  onDelete,
}: {
  ideas: Idea[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [pending, setPending] = useState<Idea | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  const sorted = [...ideas].sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));

  const confirmDelete = () => {
    if (pending) onDelete(pending.id);
    setPending(null);
  };

  return (
    <div className="space-y-4 pb-36">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0" />
        Archived ideas are out of the active pipeline but fully recoverable. Restoring returns an
        idea to Submitted.
      </p>

      {sorted.length === 0 ? (
        <Empty>
          No archived ideas. Drag a card onto “Drag here to archive” on the Active board.
        </Empty>
      ) : (
        <div className={grid}>
          {sorted.map((idea) => (
            <CompactCard
              key={idea.id}
              idea={idea}
              meta={`Archived ${ago(idea.archivedAt)} · from ${idea.stage}`}
              draggable
              onDragStart={() => setTimeout(() => setDragging(idea.id), 0)}
              onDragEnd={() => {
                setDragging(null);
                setHover(false);
              }}
              actions={
                <>
                  <Button size="sm" onClick={() => onRestore(idea.id)}>
                    <ArchiveRestore className="size-4" /> Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setPending(idea)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Drag-to-delete also works here, but always asks first. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 transition-all duration-200 ${
          dragging ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={(e: DragEvent<HTMLDivElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false);
          }}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain") || dragging;
            setPending(ideas.find((i) => i.id === id) ?? null);
            setDragging(null);
            setHover(false);
          }}
          className={`flex h-24 w-full max-w-md items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-semibold shadow-lg transition-all duration-150 ${
            hover
              ? "scale-105 border-red-500 bg-red-200 text-red-800 shadow-xl"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          <Trash2 className="size-5" /> Drag here to delete
        </div>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move {pending?.id} to Deleted?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pending?.title}” will be moved to Deleted and permanently removed after{" "}
              {RETENTION_DAYS} days unless it is restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              Move to Deleted
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Deleted ---------------- */

export function DeletedPage({
  ideas,
  onRestore,
}: {
  ideas: Idea[];
  onRestore: (id: string) => void;
}) {
  const sorted = [...ideas].sort((a, b) => (daysUntilPurge(a) ?? 0) - (daysUntilPurge(b) ?? 0));

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 text-navy" />
        Deleted ideas are kept for {RETENTION_DAYS} days before permanent removal, in line with data
        retention practice.
      </p>

      {sorted.length === 0 ? (
        <Empty>Nothing in Deleted.</Empty>
      ) : (
        <div className={grid}>
          {sorted.map((idea) => {
            const left = daysUntilPurge(idea) ?? RETENTION_DAYS;
            const urgent = left <= 7;
            return (
              <CompactCard
                key={idea.id}
                idea={idea}
                meta={`Deleted ${ago(idea.deletedAt)}`}
                badge={
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      urgent ? "bg-destructive/10 text-destructive" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {left === 0
                      ? "Permanently deleted today"
                      : `Permanently deleted in ${left} day${left === 1 ? "" : "s"}`}
                  </span>
                }
                actions={
                  <Button size="sm" onClick={() => onRestore(idea.id)}>
                    <ArchiveRestore className="size-4" /> Restore
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
