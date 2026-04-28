/**
 * AI module — public interface and types.
 *
 * The point of this module is that the rest of the app NEVER imports a
 * specific provider (OpenAI, Lovable AI, mock, etc.). It only imports
 * `getAlternativesProvider()` from `@/lib/ai`, calls
 * `provider.suggestAlternatives(input)`, and renders the result.
 *
 * Swapping providers = changing one line in `index.ts`. Adding a new
 * provider (e.g. Anthropic, Lovable AI Gateway, a multi-agent setup)
 * = create a new file implementing `AlternativesProvider` and return it
 * from `getAlternativesProvider()`.
 */

import type { Booking, RoomClass } from "@/data/hostel/types";
import type { Alternative } from "@/lib/pms/alternatives";

export interface OccupationContext {
  /** ISO date for the start of the window the operator is asking about. */
  windowStart: string;
  /** Exclusive end date. */
  windowEnd: string;
  /** Snapshot of bookings overlapping the window — kept compact for token cost. */
  bookings: CompactBooking[];
  /** Snapshot of rooms + bed inventory. */
  rooms: CompactRoom[];
  /** Pre-computed deterministic alternatives — given to the AI as candidate seeds. */
  candidateAlternatives: Alternative[];
}

export interface CompactRoom {
  id: string;
  number: string;
  name: string;
  class: RoomClass;
  capacity: number;
  pricePerNight: number;
  bedIds: string[];
  bedLabels: Record<string, string>;
}

export interface CompactBooking {
  id: string;
  bedId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: Booking["status"];
}

export interface DesiredStayInput {
  /** Free-text request from the operator (preferred). */
  naturalLanguage?: string;
  /** Structured fields (filled either by the form or parsed from naturalLanguage). */
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  preferredClass?: RoomClass;
  budgetPerNight?: number;
  notes?: string;
}

export interface AISuggestionLeg {
  bedId: string;
  roomNumber: string;
  roomName: string;
  roomClass: RoomClass;
  bedLabel: string;
  from: string;
  to: string;
  nights: number;
  pricePerNight: number;
}

export interface AISuggestion {
  /** Stable id, e.g. "ai-1" or echoed from candidate. */
  id: string;
  /** Short headline shown as the card title. */
  title: string;
  /** One-paragraph explanation of why this option is worth considering. */
  rationale: string;
  /** The bed-by-bed plan. */
  legs: AISuggestionLeg[];
  totalNights: number;
  totalPrice: number;
  switches: number;
  /** Concrete, operator-facing trade-offs (used as bullets under the card). */
  tradeoffs: string[];
  /** 0..1 — model's own confidence that this option fits the request. */
  confidence: number;
  /** True if this is a nicer/pricier upsell alternative worth highlighting. */
  upsell?: boolean;
}

export interface AISuggestionsResponse {
  /** The structured stay the AI inferred from the input. */
  resolvedStay: {
    checkIn: string;
    checkOut: string;
    guests: number;
    preferredClass?: RoomClass;
    notes?: string;
  };
  /** Ranked options. */
  suggestions: AISuggestion[];
  /** Top-level natural-language summary the operator can read aloud. */
  summary: string;
  /** Which provider produced this — useful for the UI and for debugging. */
  provider: string;
}

export interface AlternativesProvider {
  /** Stable identifier ("openai", "deterministic", ...). */
  id: string;
  /** Human label for the UI. */
  label: string;
  suggestAlternatives(input: {
    desired: DesiredStayInput;
    context: OccupationContext;
  }): Promise<AISuggestionsResponse>;
}
