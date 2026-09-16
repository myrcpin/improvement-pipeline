import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Clock,
  Gauge,
  MoreVertical,
  Pencil,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  annualHours,
  daysBetween,
  enterpriseValue,
  gbp,
  impactScore,
  perPersonValue,
  roiRatio,
  type Idea,
} from "@/lib/ideas";

const tone: Record<string, string> = {
  Low: "bg-success/10 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/10 text-destructive",
};

const priorityTone: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-secondary text-secondary-foreground",
};

export function IdeaCard({
  idea,
  onDragStart,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  draggable = true,
}: {
  idea: Idea;
  onDragStart?: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const score = impactScore(idea);
  const hours = annualHours(idea);
  const roi = roiRatio(idea);
  const daysInColumn = daysBetween(idea.stageSince);
  const variance =
    idea.actualHoursSaved == null ? null : idea.actualHoursSaved - idea.hoursSaved;

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", idea.id);
        onDragStart?.(idea.id);
      }}
      className={`group rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">{idea.id}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {idea.area}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Idea actions"
              className="rounded-md p-1 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(idea.id)}>
                <Pencil className="size-4" /> Edit details
              </DropdownMenuItem>
              {onArchive && (
                <DropdownMenuItem onSelect={() => onArchive(idea.id)}>
                  <Archive className="size-4" /> Archive
                </DropdownMenuItem>
              )}
              {onRestore && (
                <DropdownMenuItem onSelect={() => onRestore(idea.id)}>
                  <ArchiveRestore className="size-4" /> Restore to Submitted
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm(true)}>
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">{idea.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {idea.description}
      </p>

      <div className="mt-3 rounded-md bg-navy px-3 py-2.5 text-navy-foreground">
        <p className="text-[10px] font-medium uppercase tracking-wider text-navy-foreground/70">
          Enterprise annual value
        </p>
        <p className="text-xl font-semibold tracking-tight">{gbp(enterpriseValue(idea))}</p>
        <p className="mt-0.5 text-[11px] text-navy-foreground/70">
          {gbp(perPersonValue(idea))} per person × {idea.headcount} {idea.role}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border border-border/70 bg-surface-subtle px-2 py-1.5">
          <p className="text-muted-foreground">Impact score</p>
          <p className="text-sm font-semibold text-foreground">{score}/10</p>
        </div>
        <div className="rounded-md border border-border/70 bg-surface-subtle px-2 py-1.5">
          <p className="text-muted-foreground">Annualised hours</p>
          <p className="text-sm font-semibold text-foreground">{hours} hrs</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-1 text-muted-foreground">
          <Clock className="size-3" /> {idea.hoursSaved} hrs/wk
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${tone[idea.effort]}`}
        >
          <Gauge className="size-3" /> {idea.effort} effort
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${tone[idea.risk]}`}
        >
          <ShieldAlert className="size-3" /> {idea.risk} risk
        </span>
        {idea.priority && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${priorityTone[idea.priority]}`}
          >
            {idea.priority} priority
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-1 text-muted-foreground">
          <Users className="size-3" /> {idea.headcount} × {idea.role}
        </span>
      </div>

      {(idea.costToImplement != null || idea.approverName) && (
        <div className="mt-3 space-y-1 rounded-md border border-border/70 bg-surface-subtle p-2.5 text-[11px] text-muted-foreground">
          {idea.approverName && (
            <p>
              Approved by <span className="font-medium text-foreground">{idea.approverName}</span>
              {idea.approverRole ? ` · ${idea.approverRole}` : ""}
            </p>
          )}
          {idea.costToImplement != null && (
            <p>
              Cost to implement{" "}
              <span className="font-medium text-foreground">{gbp(idea.costToImplement)}</span>
              {roi != null && (
                <>
                  {" · ROI ratio "}
                  <span className="font-semibold text-accent">{roi.toFixed(1)}×</span>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {idea.owner && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3" />
          <span className="font-medium text-foreground">{idea.owner}</span>
          {idea.approverName ? ` — delegated by ${idea.approverName}` : ""}
          {idea.targetDate ? ` · target ${idea.targetDate}` : ""}
        </p>
      )}

      {variance != null && (
        <p
          className={`mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${
            variance >= 0 ? "bg-success/10 text-success" : "bg-warning/15 text-warning"
          }`}
        >
          Actual {idea.actualHoursSaved} hrs/wk vs estimated {idea.hoursSaved} (
          {variance >= 0 ? "+" : ""}
          {variance})
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Submitted by {idea.submittedBy} · {daysInColumn}d in this column
      </p>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {idea.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{idea.title}” from the pipeline. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(idea.id)}>Delete idea</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
