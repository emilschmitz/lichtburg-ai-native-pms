/**
 * Streaming AI alternatives endpoint. POST a JSON body of `{ desired, context }`
 * and receive newline-delimited JSON events:
 *   { "type": "delta", "text": "..." }
 *   { "type": "done", "result": AISuggestionsResponse }
 */

import { createFileRoute } from "@tanstack/react-router";
import type {
  AISuggestionsResponse,
  DesiredStayInput,
  OccupationContext,
} from "@/lib/ai/types";
import { deterministicProvider } from "@/lib/ai/deterministic-provider";

interface Input {
  desired: DesiredStayInput;
  context: OccupationContext;
}

const SYSTEM_PROMPT = `You are the booking assistant for a small Berlin hostel PMS. Be FAST.

Inputs you receive:
  - desired: the operator's request (often natural language).
  - context.rooms: every room with its beds, class, capacity, price/night.
  - context.bookings: every booking overlapping the requested window. A bed is
    free on a night iff no booking covers that night on that bedId.
  - context.candidateAlternatives: deterministic seed sequences. Use as a hint,
    not gospel — feel free to discard, re-rank, or replace them.

CRITICAL RULES for any "suggestion" you return:
  1. Each suggestion is a list of "legs". Each leg = one bed for a contiguous
     date range. The legs together must cover the full requested date range
     with NO gap and NO overlap (leg[i].to === leg[i+1].from).
  2. Different legs CAN AND SHOULD be in DIFFERENT ROOMS when that's what it
     takes to fit the guest in. The guest physically moves between rooms.
     Combining beds across multiple rooms is normal and expected — do not
     restrict yourself to single-room or single-class solutions.
  3. Every leg's bedId MUST exist in context.rooms and MUST NOT overlap any
     existing booking on that bedId.
  4. WHOLE-ROOM RULE for private rooms (class single_private, double_private,
     private_ensuite): these are sold as a unit, never shared with strangers.
     If ANY bed in a private room is occupied during the leg's date range,
     NO bed in that room is bookable to a different party for that range —
     skip the entire room. Dorms (shared_mixed, shared_female) remain
     bed-level: different parties can occupy different beds.
  5. Keep totals consistent: totalNights = sum(leg.nights);
     totalPrice = sum(leg.nights * leg.pricePerNight);
     switches = legs.length - 1.
  6. tradeoffs are concrete and operator-facing.

Return 2–4 suggestions, best-first. Be quick: minimal reasoning, short
rationales. Don't over-deliberate.`;

const JSON_SCHEMA = {
  name: "alternatives_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      resolvedStay: {
        type: "object",
        additionalProperties: false,
        properties: {
          checkIn: { type: "string" },
          checkOut: { type: "string" },
          guests: { type: "integer", minimum: 1 },
          preferredClass: {
            type: ["string", "null"],
            enum: [
              "shared_mixed",
              "shared_female",
              "double_private",
              "single_private",
              "private_ensuite",
              null,
            ],
          },
          notes: { type: ["string", "null"] },
        },
        required: ["checkIn", "checkOut", "guests", "preferredClass", "notes"],
      },
      summary: { type: "string" },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            rationale: { type: "string" },
            legs: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  bedId: { type: "string" },
                  roomNumber: { type: "string" },
                  roomName: { type: "string" },
                  roomClass: {
                    type: "string",
                    enum: [
                      "shared_mixed",
                      "shared_female",
                      "double_private",
                      "single_private",
                      "private_ensuite",
                    ],
                  },
                  bedLabel: { type: "string" },
                  from: { type: "string" },
                  to: { type: "string" },
                  nights: { type: "integer", minimum: 1 },
                  pricePerNight: { type: "number", minimum: 0 },
                },
                required: [
                  "bedId",
                  "roomNumber",
                  "roomName",
                  "roomClass",
                  "bedLabel",
                  "from",
                  "to",
                  "nights",
                  "pricePerNight",
                ],
              },
            },
            totalNights: { type: "integer", minimum: 1 },
            totalPrice: { type: "number", minimum: 0 },
            switches: { type: "integer", minimum: 0 },
            tradeoffs: { type: "array", items: { type: "string" } },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: [
            "id",
            "title",
            "rationale",
            "legs",
            "totalNights",
            "totalPrice",
            "switches",
            "tradeoffs",
            "confidence",
          ],
        },
      },
    },
    required: ["resolvedStay", "summary", "suggestions"],
  },
} as const;

const enc = new TextEncoder();
const ndjson = (obj: unknown) => enc.encode(JSON.stringify(obj) + "\n");

async function deterministicFallback(
  data: Input,
  reason: string,
): Promise<AISuggestionsResponse> {
  const fallback = await deterministicProvider.suggestAlternatives(data);
  return {
    ...fallback,
    summary: `${reason} — showing local algorithmic alternatives instead. ${fallback.summary}`,
    provider: "openai-fallback-deterministic",
  };
}

export const Route = createFileRoute("/api/ai/alternatives")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let data: Input;
        try {
          data = (await request.json()) as Input;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!data?.desired || !data?.context) {
          return new Response("Missing desired or context", { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        const stream = new ReadableStream({
          async start(controller) {
            const finishWithFallback = async (reason: string) => {
              const result = await deterministicFallback(data, reason);
              controller.enqueue(ndjson({ type: "done", result }));
              controller.close();
            };

            if (!apiKey) {
              await finishWithFallback("AI provider not configured");
              return;
            }

            const userMessage = JSON.stringify({
              desired: data.desired,
              context: {
                windowStart: data.context.windowStart,
                windowEnd: data.context.windowEnd,
                rooms: data.context.rooms,
                bookings: data.context.bookings,
                candidateAlternatives: data.context.candidateAlternatives,
              },
            });

            let resp: Response;
            try {
              resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "gpt-5.5",
                  stream: true,
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                  ],
                  response_format: {
                    type: "json_schema",
                    json_schema: JSON_SCHEMA,
                  },
                }),
              });
            } catch (err) {
              console.error("[ai] fetch failed:", err);
              await finishWithFallback("AI request failed");
              return;
            }

            if (!resp.ok || !resp.body) {
              const text = await resp.text().catch(() => "");
              console.error("[ai] OpenAI error", resp.status, text);
              await finishWithFallback(`AI provider error (${resp.status})`);
              return;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let sseBuffer = "";
            let fullText = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                sseBuffer += decoder.decode(value, { stream: true });
                const events = sseBuffer.split("\n\n");
                sseBuffer = events.pop() ?? "";
                for (const evt of events) {
                  for (const line of evt.split("\n")) {
                    if (!line.startsWith("data:")) continue;
                    const payload = line.slice(5).trim();
                    if (!payload || payload === "[DONE]") continue;
                    try {
                      const json = JSON.parse(payload);
                      const delta: string | undefined =
                        json.choices?.[0]?.delta?.content;
                      if (delta) {
                        fullText += delta;
                        controller.enqueue(
                          ndjson({ type: "delta", text: delta }),
                        );
                      }
                    } catch {
                      /* ignore */
                    }
                  }
                }
              }
            } catch (err) {
              console.error("[ai] stream read failed:", err);
              await finishWithFallback("AI stream interrupted");
              return;
            }

            try {
              const parsed = JSON.parse(fullText);
              const result: AISuggestionsResponse = {
                ...parsed,
                provider: "openai",
              };
              controller.enqueue(ndjson({ type: "done", result }));
              controller.close();
            } catch (err) {
              console.error(
                "[ai] parse failed:",
                err,
                fullText.slice(0, 500),
              );
              await finishWithFallback("AI returned malformed JSON");
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
