import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ScoreInput = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  area: z.string().min(1),
  hoursSaved: z.number().nonnegative(),
  effort: z.string().min(1),
});

export type ScoreResult = { impactScore: number; rationale: string };

export const scoreIdea = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScoreInput.parse(input))
  .handler(async ({ data }): Promise<ScoreResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI scoring is not configured.");

    const prompt = [
      "You score process improvement ideas for a financial operations team.",
      "Weigh estimated weekly hours saved against implementation effort, and consider risk/control value of the process area.",
      "",
      `Title: ${data.title}`,
      `Description: ${data.description}`,
      `Process area: ${data.area}`,
      `Estimated hours saved per week: ${data.hoursSaved}`,
      `Estimated effort: ${data.effort}`,
      "",
      "Return an integer impact score from 1 to 10 and one concise sentence of rationale.",
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        text: {
          format: {
            type: "json_schema",
            name: "idea_score",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                impactScore: { type: "integer", minimum: 1, maximum: 10 },
                rationale: { type: "string" },
              },
              required: ["impactScore", "rationale"],
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI scoring is busy right now. Please retry shortly.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted. Add credits to continue scoring ideas.");
      throw new Error(`AI scoring failed (${res.status}). ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && evt.response?.output_text) {
            text = evt.response.output_text;
          }
        } catch {
          /* ignore partial frames */
        }
      }
    }

    try {
      const parsed = JSON.parse(text.trim());
      const score = Math.max(1, Math.min(10, Math.round(Number(parsed.impactScore))));
      return {
        impactScore: Number.isFinite(score) ? score : 5,
        rationale: String(parsed.rationale ?? "").trim() || "No rationale returned.",
      };
    } catch {
      throw new Error("AI scoring returned an unreadable result.");
    }
  });
