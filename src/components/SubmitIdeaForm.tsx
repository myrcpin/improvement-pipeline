import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Sparkles, UserPen } from "lucide-react";
import { FieldHelp } from "@/components/FieldHelp";
import { suggestEffortRisk } from "@/lib/ai-suggest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EFFORTS,
  PROCESS_AREAS,
  RISK_LEVELS,
  ROLES,
  type Effort,
  type FieldSource,
  type ProcessArea,
  type RiskLevel,
  type Role,
} from "@/lib/ideas";

export type NewIdea = {
  title: string;
  description: string;
  area: ProcessArea;
  hoursSaved: number;
  effort: Effort;
  risk: RiskLevel;
  role: Role;
  headcount: number;
  submittedBy: string;
  effortSource: FieldSource;
  riskSource: FieldSource;
};

/** idle: no AI yet · loading · ai: value came from AI · overridden: human changed it · unavailable: AI failed */
type AiState = "idle" | "loading" | "ai" | "overridden" | "unavailable";

const AI_DEBOUNCE_MS = 900;

function AiNote({ state }: { state: AiState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<AiState, "idle">, { icon: ReactNode; text: string }> = {
    loading: { icon: <Loader2 className="size-3 animate-spin" />, text: "Getting AI suggestion…" },
    ai: { icon: <Sparkles className="size-3" />, text: "AI suggested, tap to change" },
    overridden: { icon: <UserPen className="size-3" />, text: "Manually overridden" },
    unavailable: { icon: null, text: "AI suggestion unavailable, please choose" },
  };
  const { icon, text } = map[state];
  return (
    <p
      data-testid="ai-note"
      className="flex items-center gap-1 text-[11px] text-muted-foreground"
      aria-live="polite"
    >
      {icon}
      {text}
    </p>
  );
}

function HelpLabel({
  field,
  children,
}: {
  field: "area" | "effort" | "risk" | "role";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{children}</Label>
      <FieldHelp field={field} />
    </div>
  );
}

export function SubmitIdeaForm({ onSubmit }: { onSubmit: (idea: NewIdea) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<ProcessArea>("Cash Processing");
  const [hoursSaved, setHoursSaved] = useState("2");
  const [effort, setEffort] = useState<Effort>("Medium");
  const [risk, setRisk] = useState<RiskLevel>("Medium");
  const [role, setRole] = useState<Role>("Analyst");
  const [headcount, setHeadcount] = useState("5");
  const [submittedBy, setSubmittedBy] = useState("");
  const [effortAi, setEffortAi] = useState<AiState>("idle");
  const [riskAi, setRiskAi] = useState<AiState>("idle");
  const requestId = useRef(0);
  // Latest override flags, read inside the async callback without re-triggering the effect.
  const overridden = useRef({ effort: false, risk: false });
  overridden.current = { effort: effortAi === "overridden", risk: riskAi === "overridden" };

  // Ask the AI once both title and description are filled in (debounced while typing).
  useEffect(() => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      if (!overridden.current.effort) setEffortAi("loading");
      if (!overridden.current.risk) setRiskAi("loading");
      const res = await suggestEffortRisk({ data: { title: t, description: d } }).catch(() => ({
        ok: false as const,
        error: "request failed",
      }));
      if (id !== requestId.current) return; // a newer request superseded this one
      if (!overridden.current.effort) {
        if (res.ok) setEffort(res.effort);
        setEffortAi(res.ok ? "ai" : "unavailable");
      }
      if (!overridden.current.risk) {
        if (res.ok) setRisk(res.risk);
        setRiskAi(res.ok ? "ai" : "unavailable");
      }
    }, AI_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, description]);

  const source = (s: AiState): FieldSource =>
    s === "ai" ? "ai" : s === "overridden" ? "overridden" : null;

  const reset = () => {
    requestId.current++;
    setTitle("");
    setDescription("");
    setHoursSaved("2");
    setSubmittedBy("");
    setEffort("Medium");
    setRisk("Medium");
    setEffortAi("idle");
    setRiskAi("idle");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          description: description.trim(),
          area,
          hoursSaved: Math.max(0, Number(hoursSaved) || 0),
          effort,
          risk,
          role,
          headcount: Math.max(1, Math.round(Number(headcount) || 1)),
          submittedBy: submittedBy.trim() || "Anonymous",
          effortSource: source(effortAi),
          riskSource: source(riskAi),
        });
        reset();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Idea title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Automate intraday break escalation"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What is done manually today, and what would change?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <HelpLabel field="area">Process affected</HelpLabel>
          <Select value={area} onValueChange={(v) => setArea(v as ProcessArea)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROCESS_AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <HelpLabel field="effort">Effort to implement</HelpLabel>
          <Select
            value={effort}
            onValueChange={(v) => {
              setEffort(v as Effort);
              // A human pick always wins over the AI (also stops a pending suggestion replacing it).
              if (effortAi !== "unavailable") setEffortAi("overridden");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EFFORTS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AiNote state={effortAi} />
        </div>

        <div className="space-y-2">
          <HelpLabel field="risk">Risk / control impact</HelpLabel>
          <Select
            value={risk}
            onValueChange={(v) => {
              setRisk(v as RiskLevel);
              if (riskAi !== "unavailable") setRiskAi("overridden");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AiNote state={riskAi} />
        </div>

        <div className="space-y-2">
          <HelpLabel field="role">Role / pay grade affected</HelpLabel>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Estimated hours saved per week</Label>
          <Input
            id="hours"
            type="number"
            min={0}
            step={0.5}
            value={hoursSaved}
            onChange={(e) => setHoursSaved(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="headcount">Headcount in this role</Label>
          <Input
            id="headcount"
            type="number"
            min={1}
            step={1}
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="by">Your name</Label>
          <Input
            id="by"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="A. Whitfield"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Submit idea
      </Button>
    </form>
  );
}
