import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EFFORTS,
  PRIORITIES,
  PROCESS_AREAS,
  RISK_LEVELS,
  ROLES,
  STAGES,
  validateMove,
  type Idea,
} from "@/lib/ideas";

/** Every editable field is held as a string while the form is open. */
type FormState = {
  title: string;
  description: string;
  area: string;
  hoursSaved: string;
  effort: string;
  risk: string;
  role: string;
  headcount: string;
  submittedBy: string;
  stage: string;
  approverName: string;
  approverRole: string;
  costToImplement: string;
  priority: string;
  owner: string;
  targetDate: string;
  actualHoursSaved: string;
};

const NONE = "__none__";
const str = (v: string | number | null) => (v == null ? "" : String(v));

const fromIdea = (i: Idea): FormState => ({
  title: i.title,
  description: i.description,
  area: i.area,
  hoursSaved: str(i.hoursSaved),
  effort: i.effort,
  risk: i.risk,
  role: i.role,
  headcount: str(i.headcount),
  submittedBy: i.submittedBy,
  stage: i.stage,
  approverName: str(i.approverName),
  approverRole: str(i.approverRole),
  costToImplement: str(i.costToImplement),
  priority: i.priority ?? NONE,
  owner: str(i.owner),
  targetDate: str(i.targetDate),
  actualHoursSaved: str(i.actualHoursSaved),
});

const optNum = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v) || 0));
const optText = (v: string) => v.trim() || null;

function Field({
  label,
  htmlFor,
  children,
  wide,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface-subtle p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function IdeaDialog({
  idea,
  open,
  onOpenChange,
  onSave,
}: {
  idea: Idea | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (id: string, patch: Partial<Idea>) => void;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Re-fill the form from the card each time the dialog opens for an idea.
  useEffect(() => {
    if (open && idea) {
      setForm(fromIdea(idea));
      setError(null);
    }
  }, [open, idea?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!idea || !form) return null;

  const set =
    <K extends keyof FormState>(k: K) =>
    (v: string) =>
      setForm((f) => (f ? { ...f, [k]: v } : f));
  const text = (k: keyof FormState) => ({
    id: `edit-${k}`,
    value: form[k],
    onChange: (e: { target: { value: string } }) => set(k)(e.target.value),
  });
  const pick = (k: keyof FormState, options: readonly string[], placeholder?: string) => (
    <Select value={form[k]} onValueChange={set(k)}>
      <SelectTrigger id={`edit-${k}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {placeholder && <SelectItem value={NONE}>{placeholder}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const submit = () => {
    if (!form.title.trim()) return setError("Title is required.");
    const changes: Partial<Idea> = {
      title: form.title.trim(),
      description: form.description.trim(),
      area: form.area as Idea["area"],
      hoursSaved: Math.max(0, Number(form.hoursSaved) || 0),
      effort: form.effort as Idea["effort"],
      risk: form.risk as Idea["risk"],
      role: form.role as Idea["role"],
      headcount: Math.max(1, Math.round(Number(form.headcount) || 1)),
      submittedBy: form.submittedBy.trim() || "Anonymous",
      stage: form.stage as Idea["stage"],
      approverName: optText(form.approverName),
      approverRole: optText(form.approverRole),
      costToImplement: optNum(form.costToImplement),
      priority: form.priority === NONE ? null : (form.priority as Idea["priority"]),
      owner: optText(form.owner),
      targetDate: form.targetDate || null,
      actualHoursSaved: optNum(form.actualHoursSaved),
    };
    const next = { ...idea, ...changes };
    if (next.stage !== idea.stage) {
      const problem = validateMove(next, next.stage);
      if (problem) return setError(problem);
      const today = new Date().toISOString().slice(0, 10);
      changes.stageSince = today;
      if (next.stage === "Implemented" && !idea.implementedAt) changes.implementedAt = today;
    }
    onSave(idea.id, changes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Edit {idea.id}</DialogTitle>
          <DialogDescription>
            Update any field. Impact score and enterprise value recalculate on save.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Section title="Idea">
            <Field label="Title" htmlFor="edit-title" wide>
              <Input {...text("title")} required />
            </Field>
            <Field label="Description" htmlFor="edit-description" wide>
              <Textarea {...text("description")} rows={3} />
            </Field>
            <Field label="Process affected" htmlFor="edit-area">
              {pick("area", PROCESS_AREAS)}
            </Field>
            <Field label="Stage" htmlFor="edit-stage">
              {pick("stage", STAGES)}
            </Field>
            <Field label="Effort to implement" htmlFor="edit-effort">
              {pick("effort", EFFORTS)}
            </Field>
            <Field label="Risk / control impact" htmlFor="edit-risk">
              {pick("risk", RISK_LEVELS)}
            </Field>
            <Field label="Role / pay grade affected" htmlFor="edit-role">
              {pick("role", ROLES)}
            </Field>
            <Field label="Headcount in this role" htmlFor="edit-headcount">
              <Input {...text("headcount")} type="number" min={1} step={1} />
            </Field>
            <Field label="Estimated hours saved per week" htmlFor="edit-hoursSaved">
              <Input {...text("hoursSaved")} type="number" min={0} step={0.5} />
            </Field>
            <Field label="Submitted by" htmlFor="edit-submittedBy">
              <Input {...text("submittedBy")} />
            </Field>
          </Section>

          <Section title="Approval">
            <Field label="Approver name" htmlFor="edit-approverName">
              <Input {...text("approverName")} placeholder="H. Marsden" />
            </Field>
            <Field label="Approver role" htmlFor="edit-approverRole">
              <Input {...text("approverRole")} placeholder="VP, Payments Operations" />
            </Field>
            <Field label="Cost to implement (£, one-off)" htmlFor="edit-costToImplement">
              <Input
                {...text("costToImplement")}
                type="number"
                min={0}
                step={1000}
                placeholder="50000"
              />
            </Field>
            <Field label="Priority (set by approver)" htmlFor="edit-priority">
              {pick("priority", PRIORITIES, "Not set")}
            </Field>
          </Section>

          <Section title="Delegation and delivery">
            <Field label="Owner" htmlFor="edit-owner">
              <Input {...text("owner")} placeholder="D. Achebe" />
            </Field>
            <Field label="Target date" htmlFor="edit-targetDate">
              <Input {...text("targetDate")} type="date" />
            </Field>
            <Field label="Actual hours saved per week" htmlFor="edit-actualHoursSaved">
              <Input
                {...text("actualHoursSaved")}
                type="number"
                min={0}
                step={0.5}
                placeholder={`Estimated ${form.hoursSaved || 0}`}
              />
            </Field>
          </Section>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
