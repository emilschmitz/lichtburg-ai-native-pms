/**
 * Server function that calls OpenAI with strict JSON-schema structured output.
 *
 * Runs on the server only. The OPENAI_API_KEY secret is read via
 * `process.env.OPENAI_API_KEY`.
 */

import { createServerFn } from "@tanstack/react-start";
import type {
  AISuggestionsResponse,
  DesiredStayInput,
  OccupationContext,
} from "./types";
import { deterministicProvider } from "./deterministic-provider";

interface Input {
  desired: DesiredStayInput;
  context: OccupationContext;
}

const SYSTEM_PROMPT = `You are the booking assistant for a small Berlin hostel PMS.
The operator gives you (a) a desired stay (possibly described in natural language)
and (b) a snapshot of the rooms, beds, and current bookings overlapping the desired window.

You also receive a list of "candidate alternatives" produced by a deterministic
graph search. These are GUARANTEED to be valid (no overlaps, fully cover the
requested range). Your job is to:

  1. Parse the desired stay into structured fields (resolvedStay).
  2. Re-rank, refine, and explain the candidates as suggestions.
  3. Optionally synthesize 1-2 NEW suggestions if you can find a better
     combination using the rooms/bookings snapshot. Any leg you propose MUST
     reference a real bedId from the rooms snapshot, must not overlap any
     existing booking on that bed, and the legs of a suggestion must be
     contiguous and cover the full requested range with no gap.
  4. Make the trade-offs concrete and operator-facing (e.g. "Pay €78 more for
     a private en-suite for the second half" rather than vague language).
  5. Keep totals consistent: totalNights = sum of leg nights;
     totalPrice = sum(leg.nights * leg.pricePerNight); switches = legs.length - 1.

Return at most 4 suggestions. Sort them best-first.`;

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
          checkIn: { type: "string", description: "ISO date YYYY-MM-DD" },
          checkOut: { type: "string", description: "ISO date YYYY-MM-DD, exclusive" },
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

export const suggestAlternativesServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: Input) => {
    if (!data || typeof data !== "object") throw new Error("Invalid input");
    if (!data.context || !data.desired) throw new Error("Missing context or desired");
    return data;
  })
  .handler(async ({ data }): Promise<AISuggestionsResponse> => {
    const apiKey = process.env.OPENAI_API_KEY;

    // Graceful fallback — if no key, just use deterministic so the UI still works.
    if (!apiKey) {
      console.warn("[ai] OPENAI_API_KEY not set; falling back to deterministic provider");
      return deterministicProvider.suggestAlternatives(data);
    }

    const userMessage = JSON.stringify(
      {
        desired: data.desired,
        context: {
          windowStart: data.context.windowStart,
          windowEnd: data.context.windowEnd,
          rooms: data.context.rooms,
          bookings: data.context.bookings,
          candidateAlternatives: data.context.candidateAlternatives,
        },
      },
      null,
      2,
    );

    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
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

      if (!resp.ok) {
        const text = await resp.text();
        console.error("[ai] OpenAI error", resp.status, text);
        // Fall back to deterministic so the operator still sees something.
        const fallback = await deterministicProvider.suggestAlternatives(data);
        return {
          ...fallback,
          summary:
            "AI provider unavailable — showing local algorithmic alternatives instead. " +
            fallback.summary,
          provider: "openai-fallback-deterministic",
        };
      }

      const json = await resp.json();
      const content: string = json.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(content);
      return { ...parsed, provider: "openai" } as AISuggestionsResponse;
    } catch (err) {
      console.error("[ai] OpenAI call failed:", err);
      const fallback = await deterministicProvider.suggestAlternatives(data);
      return {
        ...fallback,
        summary:
          "AI request failed — showing local algorithmic alternatives instead. " +
          fallback.summary,
        provider: "openai-fallback-deterministic",
      };
    }
  });
