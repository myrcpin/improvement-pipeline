import { IdeaCard } from "@/components/IdeaCard";
import type { Idea } from "@/lib/ideas";

export function ArchivePanel({
  ideas,
  onEdit,
  onRestore,
  onDelete,
}: {
  ideas: Idea[];
  onEdit: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (ideas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-12 text-center text-sm text-muted-foreground">
        No archived ideas. Archiving removes an idea from the active pipeline without deleting it.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          draggable={false}
          onEdit={onEdit}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
