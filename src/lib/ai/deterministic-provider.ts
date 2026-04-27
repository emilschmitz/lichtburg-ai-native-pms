/**
 * Deterministic provider — wraps the pure `findAlternatives` function as an
 * AlternativesProvider. Always available, no network, no API key. Useful as
 * a fallback when AI is down and as a baseline for testing the UI.
 */

import type {
  AISuggestion,
  AISuggestionsResponse,
  AlternativesProvider,
  DesiredStayInput,
  OccupationContext,
} from "./types";

function legsFromAlt(legs: OccupationContext["candidateAlternatives"][number]["legs"]) {
  return legs.map((l) => ({
    bedId: l.bedId,
    roomNumber: l.roomNumber,
    roomName: l.roomName,
    roomClass: l.roomClass,
    bedLabel: l.bedLabel,
    from: l.from,
    to: l.to,
    nights: l.nights,
    pricePerNight: l.pricePerNight,
  }));
}

function describe(alt: OccupationContext["candidateAlternatives"][number]): AISuggestion {
  let title = "Stay plan";
  if (alt.switches === 0) title = "No room change";
  else if (alt.uniqueClasses.length === 1) title = `${alt.switches} room switches, same class`;
  else title = `${alt.switches} switches, ${alt.uniqueClasses.length} room classes`;

  return {
    id: alt.id,
    title,
    rationale:
      alt.switches === 0
        ? "Single bed available for the entire stay."
        : `Stay covers all nights by switching beds ${alt.switches} time(s). ${
            alt.classMatch === 1
              ? "All nights are in the preferred room class."
              : alt.classMatch > 0
                ? `${Math.round(alt.classMatch * 100)}% of nights are in the preferred class.`
                : "No nights are in the preferred class — consider it as an alternative."
          }`,
    legs: legsFromAlt(alt.legs),
    totalNights: alt.totalNights,
    totalPrice: alt.totalPrice,
    switches: alt.switches,
    tradeoffs: alt.tradeoffs,
    confidence: 1,
  };
}

export const deterministicProvider: AlternativesProvider = {
  id: "deterministic",
  label: "Local (no AI)",
  async suggestAlternatives({ desired, context }) {
    const checkIn = desired.checkIn ?? context.windowStart;
    const checkOut = desired.checkOut ?? context.windowEnd;
    const suggestions = context.candidateAlternatives.map(describe);
    const summary =
      suggestions.length === 0
        ? "No way to cover this stay — the hostel is full and there are no chainable beds."
        : `Found ${suggestions.length} option(s) for the stay. The hostel is at high occupancy so all options require some room switches.`;
    return {
      resolvedStay: {
        checkIn,
        checkOut,
        guests: desired.guests ?? 1,
        preferredClass: desired.preferredClass,
        notes: desired.notes,
      },
      suggestions,
      summary,
      provider: "deterministic",
    } satisfies AISuggestionsResponse;
  },
};
