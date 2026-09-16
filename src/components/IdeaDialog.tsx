import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PRIORITIES, type Idea, type Priority } from "@/lib/ideas";

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
  const [approverName, setApproverName] = useState("");
  const [approverRole, setApproverRole] = useState("");
  const [cost, setCost] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [owner, setOwner] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [actual, setActual] = useState("");

  useEffect(() => {
    if (!idea) return;
    setApproverName(idea.approverName ?? "");
    setApproverRole(idea.approverRole ?? "");
    setCost(idea.costToImplement != null ? String(idea.costToImplement) : "");
    setPriority(idea.priority ?? "");
    setOwner(idea.owner ?? "");
    setTargetDate(idea.targetDate ?? "");
    setActual(idea.actualHoursSaved != null ? String(idea.actualHoursSaved) : "");
  }, [idea]);

  if (!idea) return null;

  const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{idea.title}</DialogTitle>
          <DialogDescription>
            {idea.id} · {idea.stage} · approval, delegation and delivery details.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(idea.id, {
              approverName: approverName.trim() || null,
              approverRole: approverRole.trim() || null,
              costToImplement: num(cost),
              priority: priority === "" ? null : priority,
              owner: owner.trim() || null,
              targetDate: targetDate || null,
              actualHoursSaved: num(actual),
            });
            onOpenChange(false);
          }}
        >
          <section className="space-y-3 rounded-lg border border-border bg-surface-subtle p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approval
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="approverName">Approver name</Label>
                <Input
                  id="approverName"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="H. Marsden"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approverRole">Approver role</Label>
                <Input
                  id="approverRole"
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                  placeholder="VP, Payments Operations"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost to implement (£, one-off)</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step={1000}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority (set by approver)</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-surface-subtle p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delegation
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="D. Achebe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target date</Label>
                <Input
                  id="target"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-surface-subtle p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivered benefit
            </h3>
            <div className="space-y-2">
              <Label htmlFor="actual">Actual hours saved per week</Label>
              <Input
                id="actual"
                type="number"
                min={0}
                step={0.5}
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder={`Estimated ${idea.hoursSaved}`}
              />
            </div>
          </section>

          <DialogFooter>
            <Button type="submit" className="w-full">
              Save details
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
