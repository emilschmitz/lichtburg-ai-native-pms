/**
 * OpenAI provider — talks to /api/ai/alternatives, which streams NDJSON
 * back. We forward `delta` events to an optional `onDelta` callback so the
 * UI can render the model's progressive output instead of just spinning.
 */

import type {
  AISuggestionsResponse,
  AlternativesProvider,
  DesiredStayInput,
  OccupationContext,
} from "./types";

export interface SuggestStreamingOptions {
  desired: DesiredStayInput;
  context: OccupationContext;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

export async function suggestAlternativesStreaming(
  opts: SuggestStreamingOptions,
): Promise<AISuggestionsResponse> {
  const resp = await fetch("/api/ai/alternatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ desired: opts.desired, context: opts.context }),
    signal: opts.signal,
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`AI request failed: ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: AISuggestionsResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const evt = JSON.parse(trimmed) as
          | { type: "delta"; text: string }
          | { type: "done"; result: AISuggestionsResponse }
          | { type: "error"; message: string };
        if (evt.type === "delta") {
          opts.onDelta?.(evt.text);
        } else if (evt.type === "done") {
          result = evt.result;
        } else if (evt.type === "error") {
          throw new Error(evt.message);
        }
      } catch {
        // ignore malformed line
      }
    }
  }
  if (!result) throw new Error("AI stream ended without a result");
  return result;
}

export const openAIProvider: AlternativesProvider = {
  id: "openai",
  label: "OpenAI",
  async suggestAlternatives({ desired, context }) {
    return suggestAlternativesStreaming({ desired, context });
  },
};
