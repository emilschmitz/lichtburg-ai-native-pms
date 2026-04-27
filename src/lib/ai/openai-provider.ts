/**
 * OpenAI provider — calls a TanStack Start server function so the API key
 * never leaves the server. Uses Responses API style structured outputs via
 * `response_format: json_schema` with `strict: true` for reliable parsing.
 */

import type { AISuggestionsResponse, AlternativesProvider } from "./types";
import { suggestAlternativesServerFn } from "./server-fn";

export const openAIProvider: AlternativesProvider = {
  id: "openai",
  label: "OpenAI (gpt-4o-mini)",
  async suggestAlternatives({ desired, context }) {
    const result = (await suggestAlternativesServerFn({
      data: { desired, context },
    })) as AISuggestionsResponse;
    return result;
  },
};
