import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, KanbanSquare, Plus, Trash2, TrendingUp } from "lucide-react";
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
import { ArchivedPage, DeletedPage } from "@/components/LifecyclePages";
import { DashboardPanel } from "@/components/DashboardPanel";
import { IdeaDialog } from "@/components/IdeaDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SubmitIdeaForm, type NewIdea } from "@/components/SubmitIdeaForm";
import { SEED_IDEAS, purgeExpired, validateMove, type Idea, type Stage } from "@/lib/ideas";

const TITLE = "Improvement Pipeline — Financial Operations";
const DESCRIPTION =
  "Submit, score and prioritise process improvement ideas with impact scoring, enterprise value, ROI and approval workflow across financial operations.";

const VIEWS = ["active", "archived", "deleted"] as const;
type View = (typeof VIEWS)[number];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { view?: View } => {
    const v = search["view"];
    return VIEWS.includes(v as View) && v !== "active" ? { view: v as View } : {};
  },
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

const PURGE_CHECK_MS = 60 * 60 * 1000;

function Index() {
  const { view = "active" } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const goTo = (v: View) => navigate({ search: v === "active" ? {} : { view: v } });

  const [ideas, setIdeas] = useState<Idea[]>(() => purgeExpired(SEED_IDEAS));
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("pipeline");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Retention: drop soft-deleted ideas past 30 days (see purgeExpired for the production equivalent).
  useEffect(() => {
    const run = () => setIdeas((prev) => purgeExpired(prev));
    run();
    const t = setInterval(run, PURGE_CHECK_MS);
    return () => clearInterval(t);
  }, []);

  const active = ideas.filter((i) => i.status === "active");
  const archived = ideas.filter((i) => i.status === "archived");
  const deleted = ideas.filter((i) => i.status === "deleted");
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
    const n = Math.max(100, ...ideas.map((i) => Number(i.id.replace(/\D/g, "")) || 0)) + 1;
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
        status: "active",
        archivedAt: null,
        deletedAt: null,
      },
      ...prev,
    ]);
    setOpen(false);
    toast.success("Idea submitted", { description: "Impact score and value calculated." });
  };

  const archiveIdea = (id: string) => {
    patch(id, { status: "archived", archivedAt: new Date().toISOString(), deletedAt: null });
    toast.success(`${id} archived`, {
      action: { label: "View", onClick: () => goTo("archived") },
    });
  };

  const restoreIdea = (id: string) => {
    patch(id, {
      status: "active",
      stage: "Submitted",
      stageSince: today(),
      archivedAt: null,
      deletedAt: null,
    });
    toast.success(`${id} restored to Submitted`);
  };

  /** Soft delete: kept on the Deleted page for the retention window. */
  const deleteIdea = (id: string) => {
    patch(id, { status: "deleted", deletedAt: new Date().toISOString(), archivedAt: null });
    toast.success(`${id} moved to Deleted`, {
      description: "Restorable for 30 days.",
      action: { label: "Undo", onClick: () => restoreIdea(id) },
    });
  };

  const nav: { view: View; label: string; icon: typeof Archive; count?: number }[] = [
    { view: "active", label: "Active", icon: KanbanSquare },
    { view: "archived", label: "Archived", icon: Archive, count: archived.length },
    { view: "deleted", label: "Deleted", icon: Trash2, count: deleted.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-6">
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
        <nav aria-label="Pipeline views" className="mx-auto max-w-[110rem] px-6">
          <ul className="flex gap-1">
            {nav.map(({ view: v, label, icon: Icon, count }) => {
              const current = view === v;
              return (
                <li key={v}>
                  <Link
                    to="/"
                    search={v === "active" ? {} : { view: v }}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      current
                        ? "bg-background text-foreground"
                        : "text-navy-foreground/75 hover:bg-white/10 hover:text-navy-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                    {count !== undefined && (
                      <span
                        className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
                          current
                            ? "bg-navy text-navy-foreground"
                            : "bg-white/15 text-navy-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-[110rem] px-6 py-8">
        {view === "active" && (
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                onViewArchive={() => goTo("archived")}
              />
            </TabsContent>
          </Tabs>
        )}
        {view === "archived" && (
          <ArchivedPage ideas={archived} onRestore={restoreIdea} onDelete={deleteIdea} />
        )}
        {view === "deleted" && <DeletedPage ideas={deleted} onRestore={restoreIdea} />}
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
