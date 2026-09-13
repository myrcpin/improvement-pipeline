import { useState } from "react";
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
import { EFFORTS, PROCESS_AREAS, type Effort, type ProcessArea } from "@/lib/ideas";

export type NewIdea = {
  title: string;
  description: string;
  area: ProcessArea;
  hoursSaved: number;
  effort: Effort;
  submittedBy: string;
};

export function SubmitIdeaForm({ onSubmit }: { onSubmit: (idea: NewIdea) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<ProcessArea>("Cash Processing");
  const [hoursSaved, setHoursSaved] = useState("2");
  const [effort, setEffort] = useState<Effort>("Medium");
  const [submittedBy, setSubmittedBy] = useState("");

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
          submittedBy: submittedBy.trim() || "Anonymous",
        });
        setTitle("");
        setDescription("");
        setHoursSaved("2");
        setSubmittedBy("");
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
          <Label>Process affected</Label>
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
          <Label>Effort to implement</Label>
          <Select value={effort} onValueChange={(v) => setEffort(v as Effort)}>
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
        Submit idea for scoring
      </Button>
    </form>
  );
}
