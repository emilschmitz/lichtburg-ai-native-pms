/**
 * AI module entry point. Swap the active provider in ONE place.
 *
 * Usage:
 *   import { getAlternativesProvider, buildOccupationContext } from "@/lib/ai";
 *   const provider = getAlternativesProvider();
 *   const result = await provider.suggestAlternatives({ desired, context });
 */

import { deterministicProvider } from "./deterministic-provider";
import { openAIProvider } from "./openai-provider";
import type { AlternativesProvider } from "./types";

export type ProviderId = "openai" | "deterministic";

const REGISTRY: Record<ProviderId, AlternativesProvider> = {
  openai: openAIProvider,
  deterministic: deterministicProvider,
};

let activeId: ProviderId = "openai";

export function setActiveProvider(id: ProviderId) {
  activeId = id;
}

export function getAlternativesProvider(id?: ProviderId): AlternativesProvider {
  return REGISTRY[id ?? activeId];
}

export function listProviders(): AlternativesProvider[] {
  return Object.values(REGISTRY);
}

export { buildOccupationContext } from "./context";
export type * from "./types";
