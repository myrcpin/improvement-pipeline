import { createServerFn } from "@tanstack/react-start";
import type { Effort, RiskLevel } from "@/lib/ideas";

export type AiSuggestion =
  { ok: true; effort: Effort; risk: RiskLevel; reason: string } | { ok: false; error: string };

const LEVELS = ["Low", "Medium", "High"] as const;
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You assess process improvement ideas for a financial operations team at a bank.
Given an idea title and description, estimate:
- effort: Low = under 1 week of build/config work; Medium = 1 to 4 weeks; High = over 4 weeks or needs cross-team dependencies (IT change, vendors, new platforms).
- risk: the risk / control impact of the change. Low = no change to controls, approvals or client money movement; Medium = changes a control step, report or client-facing output; High = affects payments, reconciliations, regulatory or client-money controls.
Reply with JSON only, no prose: {"effort":"Low|Medium|High","risk":"Low|Medium|High","reason":"one short sentence"}`;

const pick = (v: unknown) =>
  (LEVELS as readonly string[]).includes(v as string) ? (v as Effort) : null;

/**
 * Runs on the server so the Anthropic API key never reaches the browser.
 * Needs the ANTHROPIC_API_KEY secret (and optionally ANTHROPIC_MODEL) in the project settings.
 */
export const suggestEffortRisk = createServerFn({ method: "POST" })
  .inputValidator((input: { title: string; description: string }) => ({
    title: String(input?.title ?? "").slice(0, 300),
    description: String(input?.description ?? "").slice(0, 4000),
  }))
  .handler(async ({ data }): Promise<AiSuggestion> => {
    const key = process.env["ANTHROPIC_API_KEY"];
    if (!key)
      return { ok: false, error: "AI suggestions are not configured (missing ANTHROPIC_API_KEY)." };
    if (!data.title.trim() || !data.description.trim())
      return { ok: false, error: "Title and description are required." };

    try {
      const res = await fetch(
        `${process.env["ANTHROPIC_BASE_URL"] || "https://api.anthropic.com"}/v1/messages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env["ANTHROPIC_MODEL"] || DEFAULT_MODEL,
            max_tokens: 200,
            system: SYSTEM,
            messages: [
              {
                role: "user",
                content: `Title: ${data.title}\n\nDescription: ${data.description}`,
              },
            ],
          }),
        },
      );
      if (!res.ok) {
        console.error("Anthropic API error", res.status, await res.text());
        return { ok: false, error: `AI service returned ${res.status}.` };
      }
      const body = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = body.content?.find((c) => c.type === "text")?.text ?? "";
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<
        string,
        unknown
      >;
      const effort = pick(json["effort"]);
      const risk = pick(json["risk"]) as RiskLevel | null;
      if (!effort || !risk) return { ok: false, error: "AI response was not understood." };
      return { ok: true, effort, risk, reason: String(json["reason"] ?? "").slice(0, 200) };
    } catch (err) {
      console.error("AI suggestion failed", err);
      return { ok: false, error: "AI suggestion failed." };
    }
  });
