import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchivePanel } from "@/components/ArchivePanel";
import { DashboardPanel } from "@/components/DashboardPanel";
import { IdeaDialog } from "@/components/IdeaDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SubmitIdeaForm, type NewIdea } from "@/components/SubmitIdeaForm";
import { SEED_IDEAS, validateMove, type Idea, type Stage } from "@/lib/ideas";

const TITLE = "Improvement Pipeline — Financial Operations";
const DESCRIPTION =
  "Submit, score and prioritise process improvement ideas with impact scoring, enterprise value, ROI and approval workflow across financial operations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const today = () => new Date().toISOString().slice(0, 10);

function Index() {
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("pipeline");
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = ideas.filter((i) => !i.archived);
  const archived = ideas.filter((i) => i.archived);
  const editing = ideas.find((i) => i.id === editingId) ?? null;

  const patch = (id: string, changes: Partial<Idea>) =>
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));

  const moveIdea = (id: string, stage: Stage) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea || idea.stage === stage) return;
    const problem = validateMove(idea, stage);
    if (problem) {
      toast.error("Details needed first", { description: problem });
      setEditingId(id);
      return;
    }
    patch(id, {
      stage,
      stageSince: today(),
      implementedAt: stage === "Implemented" ? today() : idea.implementedAt,
    });
  };

  const addIdea = (input: NewIdea) => {
    const n = ideas.length + 101;
    setIdeas((prev) => [
      {
        id: `IP-${n}`,
        ...input,
        stage: "Submitted",
        submittedAt: today(),
        stageSince: today(),
        approverName: null,
        approverRole: null,
        costToImplement: null,
        priority: null,
        owner: null,
        targetDate: null,
        actualHoursSaved: null,
        implementedAt: null,
        archived: false,
      },
      ...prev,
    ]);
    setOpen(false);
    toast.success("Idea submitted", { description: "Impact score and value calculated." });
  };

  const archiveIdea = (id: string) => {
    patch(id, { archived: true });
    toast.success("Idea archived", { description: "You can restore it from the Archive tab." });
  };

  const restoreIdea = (id: string) => {
    patch(id, { archived: false, stage: "Submitted", stageSince: today() });
    toast.success("Idea restored to Submitted");
  };

  const deleteIdea = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast.success(`${id} deleted`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <TrendingUp className="size-5 text-accent-foreground" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Improvement Pipeline</h1>
              <p className="text-xs text-navy-foreground/70">
                Financial Operations · Continuous Improvement
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="size-4" /> Submit an idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit a process improvement idea</DialogTitle>
                <DialogDescription>
                  Impact score, annualised hours and enterprise value are calculated automatically.
                </DialogDescription>
              </DialogHeader>
              <SubmitIdeaForm onSubmit={addIdea} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-[110rem] px-6 py-8">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="archive">Archive ({archived.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pipeline">
            <KanbanBoard
              ideas={active}
              onMove={moveIdea}
              onEdit={setEditingId}
              onArchive={archiveIdea}
              onDelete={deleteIdea}
            />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardPanel
              ideas={active}
              archived={archived}
              onViewArchive={() => setTab("archive")}
            />
          </TabsContent>
          <TabsContent value="archive">
            <ArchivePanel
              ideas={archived}
              onEdit={setEditingId}
              onRestore={restoreIdea}
              onDelete={deleteIdea}
            />
          </TabsContent>
        </Tabs>
      </main>

      <IdeaDialog
        idea={editing}
        open={editingId !== null}
        onOpenChange={(v) => !v && setEditingId(null)}
        onSave={patch}
      />
    </div>
  );
}
