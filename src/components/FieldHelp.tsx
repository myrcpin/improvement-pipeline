import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FIELD_HELP } from "@/lib/ideas";

/** "?" icon that shows plain-language definitions on hover (desktop) or tap (touch). */
export function FieldHelp({ field }: { field: keyof typeof FIELD_HELP }) {
  const [open, setOpen] = useState(false);
  const help = FIELD_HELP[field];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label={`What do the ${help.title} options mean?`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-navy focus-visible:text-navy focus-visible:outline-none"
      >
        <HelpCircle className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="mb-2 text-xs font-semibold text-foreground">{help.title}</p>
        <dl className="space-y-1.5 text-xs">
          {help.items.map(([term, def]) => (
            <div key={term}>
              <dt className="inline font-medium text-foreground">{term}: </dt>
              <dd className="inline text-muted-foreground">{def}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
