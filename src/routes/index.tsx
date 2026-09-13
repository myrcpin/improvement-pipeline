import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { DashboardPanel } from "@/components/DashboardPanel";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SubmitIdeaForm, type NewIdea } from "@/components/SubmitIdeaForm";
import { SEED_IDEAS, type Idea, type Stage } from "@/lib/ideas";
import { scoreIdea } from "@/lib/scoring.functions";

const TITLE = "Improvement Pipeline — Financial Operations";
const DESCRIPTION =
  "Submit, AI-score and track process improvement ideas across cash processing, reconciliation, client reporting and onboarding.";

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

function Index() {
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [open, setOpen] = useState(false);
  const runScore = useServerFn(scoreIdea);

  const moveIdea = (id: string, stage: Stage) =>
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, stage } : i)));

  const addIdea = async (input: NewIdea) => {
    const id = `IP-${101 + ideas.length}`;
    const idea: Idea = {
      id,
      ...input,
      stage: "Submitted",
      impactScore: null,
      rationale: null,
      scoring: true,
    };
    setIdeas((prev) => [idea, ...prev]);
    setOpen(false);
    toast.success("Idea submitted", { description: "Generating its impact score…" });

    try {
      const result = await runScore({
        data: {
          title: input.title,
          description: input.description,
          area: input.area,
          hoursSaved: input.hoursSaved,
          effort: input.effort,
        },
      });
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, scoring: false, impactScore: result.impactScore, rationale: result.rationale }
            : i,
        ),
      );
    } catch (error) {
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, scoring: false } : i)));
      toast.error("Could not score this idea", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
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
                  Your idea is scored for impact automatically once submitted.
                </DialogDescription>
              </DialogHeader>
              <SubmitIdeaForm onSubmit={addIdea} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="pipeline">
            <KanbanBoard ideas={ideas} onMove={moveIdea} />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardPanel ideas={ideas} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
