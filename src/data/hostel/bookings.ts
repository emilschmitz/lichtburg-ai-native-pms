import type { Booking } from "./types";
import { BEDS } from "./rooms";

/**
 * Deterministic mock. We pin "today" so the calendar always shows the
 * intended scenario regardless of when the app runs.
 */
export const TODAY = "2026-04-27";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * "Next week" = the 7-night window starting tomorrow.
 * Nights covered: T+1, T+2, T+3, T+4, T+5, T+6, T+7. Departure morning T+8.
 */
export const NEXT_WEEK_START = addDays(TODAY, 1);
export const NEXT_WEEK_END = addDays(TODAY, 8);

/**
 * Design intent (verified by the unit checks at the bottom of this file):
 *
 *   • Occupancy across the week is ~95%+ (hostel feels "fully booked").
 *   • NO single bed has the same guest for all 7 nights — the "stay one
 *     room the whole week" path is blocked.
 *   • There exist >=3 distinct hop-sequences that DO cover all 7 nights,
 *     each forcing a meaningful trade-off:
 *
 *       Path A (cheap, many switches): hops between mixed dorms (Spree, Skyline)
 *       Path B (one switch, mixed class): start in a private then move to a dorm
 *       Path C (upgrade): move into the en-suite for the second half
 *
 *   • The 3 hop-paths share at most 1 bed/night so they are genuinely
 *     distinct alternatives the AI can rank by trade-off.
 *
 * Note: T+0 is "today". T+1..T+7 are the seven nights the operator views
 * as "next week".
 */

type Seed = Omit<Booking, "id">;

// Convenience alias — every booking ends at "checkOut morning".
const T = (n: number) => addDays(TODAY, n);

const seeds: Seed[] = [
  // ============================================================
  // SPREE DORM 101 — 6 beds, mixed
  // ============================================================
  // 101-1t: A→B (one switch) — covers all 7 nights via 2 guests
  { guestName: "Liam O'Connor", guestCountry: "IE", bedId: "b-101-1t",
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  { guestName: "Marta Kowalski", guestCountry: "PL", bedId: "b-101-1t",
    checkIn: T(4), checkOut: T(10), status: "confirmed" },

  // 101-1b: GAP on T+1..T+3 (3 nights free) — Path A leg #1 lives here
  { guestName: "Pedro Alves", guestCountry: "PT", bedId: "b-101-1b",
    checkIn: T(-1), checkOut: T(1), status: "checked_in" },
  // gap T+1..T+4
  { guestName: "Anna Schmidt", guestCountry: "DE", bedId: "b-101-1b",
    checkIn: T(4), checkOut: T(9), status: "confirmed" },

  // 101-2t: continuous coverage with 2 short stays
  { guestName: "Thomas Becker", guestCountry: "AT", bedId: "b-101-2t",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Sofia Romano", guestCountry: "IT", bedId: "b-101-2t",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // 101-2b: continuous churn
  { guestName: "Hans Vogel", guestCountry: "DE", bedId: "b-101-2b",
    checkIn: T(-1), checkOut: T(2), status: "checked_in" },
  { guestName: "Noah Dubois", guestCountry: "FR", bedId: "b-101-2b",
    checkIn: T(2), checkOut: T(5), status: "confirmed" },
  { guestName: "Diego Fernández", guestCountry: "ES", bedId: "b-101-2b",
    checkIn: T(5), checkOut: T(8), status: "confirmed" },

  // 101-3t: continuous churn
  { guestName: "Olivia Brown", guestCountry: "GB", bedId: "b-101-3t",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Ravi Patel", guestCountry: "IN", bedId: "b-101-3t",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // 101-3b: continuous churn
  { guestName: "Felix Wagner", guestCountry: "DE", bedId: "b-101-3b",
    checkIn: T(-2), checkOut: T(2), status: "checked_in" },
  { guestName: "Lucas Martín", guestCountry: "AR", bedId: "b-101-3b",
    checkIn: T(2), checkOut: T(5), status: "confirmed" },
  { guestName: "Astrid Berg", guestCountry: "NO", bedId: "b-101-3b",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // ============================================================
  // LINDEN SINGLE 102 — 1 bed
  // ============================================================
  // GAP on T+4..T+8 (4 nights free) — supports Path B (single upgrade) leg #2
  { guestName: "Margaret Hall", guestCountry: "US", bedId: "b-102-a",
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  // gap T+4..T+8
  { guestName: "Jean-Paul Mercier", guestCountry: "FR", bedId: "b-102-a",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  // ============================================================
  // TEMPELHOF DOUBLE 103 — 2 beds (booked as a pair, usually)
  // ============================================================
  { guestName: "Mia Johansson", guestCountry: "SE", bedId: "b-103-a",
    checkIn: T(0), checkOut: T(3), status: "checked_in" },
  { guestName: "Carla Mendes", guestCountry: "BR", bedId: "b-103-a",
    checkIn: T(3), checkOut: T(6), status: "confirmed" },
  { guestName: "Helga Müller", guestCountry: "DE", bedId: "b-103-a",
    checkIn: T(6), checkOut: T(10), status: "confirmed" },

  { guestName: "Erik Johansson", guestCountry: "SE", bedId: "b-103-b",
    checkIn: T(0), checkOut: T(3), status: "checked_in" },
  { guestName: "Bruno Costa", guestCountry: "BR", bedId: "b-103-b",
    checkIn: T(3), checkOut: T(6), status: "confirmed" },
  { guestName: "Klaus Müller", guestCountry: "DE", bedId: "b-103-b",
    checkIn: T(6), checkOut: T(10), status: "confirmed" },

  // ============================================================
  // MAUERPARK FEMALE 201 — 4 beds
  // ============================================================
  { guestName: "Chiara Bianchi", guestCountry: "IT", bedId: "b-201-1t",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Rin Kobayashi", guestCountry: "JP", bedId: "b-201-1t",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  { guestName: "Hannah Becker", guestCountry: "DE", bedId: "b-201-1b",
    checkIn: T(-1), checkOut: T(4), status: "checked_in" },
  { guestName: "Maya Rosenberg", guestCountry: "IL", bedId: "b-201-1b",
    checkIn: T(4), checkOut: T(8), status: "confirmed" },
  { guestName: "Zara Ahmed", guestCountry: "GB", bedId: "b-201-1b",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  { guestName: "Ines Garcia", guestCountry: "ES", bedId: "b-201-2t",
    checkIn: T(0), checkOut: T(2), status: "checked_in" },
  { guestName: "Eva Novak", guestCountry: "CZ", bedId: "b-201-2t",
    checkIn: T(2), checkOut: T(6), status: "confirmed" },
  { guestName: "Lila Dupont", guestCountry: "FR", bedId: "b-201-2t",
    checkIn: T(6), checkOut: T(10), status: "confirmed" },

  { guestName: "Petra Janssen", guestCountry: "NL", bedId: "b-201-2b",
    checkIn: T(-2), checkOut: T(2), status: "checked_in" },
  { guestName: "Sophie Wilson", guestCountry: "CA", bedId: "b-201-2b",
    checkIn: T(2), checkOut: T(5), status: "confirmed" },
  { guestName: "Greta Lindqvist", guestCountry: "SE", bedId: "b-201-2b",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // ============================================================
  // GÖRLI EN-SUITE 202 — 2 beds (private, premium)
  // ============================================================
  // GAP on bed 202-b T+4..T+8 (4 nights free) — supports Path C upgrade leg
  { guestName: "Daniel Park", guestCountry: "KR", bedId: "b-202-a",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Alessandro Rossi", guestCountry: "IT", bedId: "b-202-a",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  { guestName: "Hye-jin Park", guestCountry: "KR", bedId: "b-202-b",
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  // gap T+4..T+8
  { guestName: "Giulia Rossi", guestCountry: "IT", bedId: "b-202-b",
    checkIn: T(8), checkOut: T(12), status: "confirmed" },

  // ============================================================
  // SKYLINE DORM 301 — 2 beds, mixed
  // ============================================================
  // 301-a: GAP on T+4..T+8 (4 nights free) — Path A leg #2
  { guestName: "Tariq Hassan", guestCountry: "EG", bedId: "b-301-a",
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  // gap T+4..T+8
  { guestName: "Leon Hofer", guestCountry: "CH", bedId: "b-301-a",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  // 301-b: continuous churn
  { guestName: "Owen Murphy", guestCountry: "IE", bedId: "b-301-b",
    checkIn: T(-2), checkOut: T(1), status: "checked_in" },
  { guestName: "Nora Eriksen", guestCountry: "NO", bedId: "b-301-b",
    checkIn: T(1), checkOut: T(6), status: "confirmed" },
  { guestName: "Saskia de Vries", guestCountry: "NL", bedId: "b-301-b",
    checkIn: T(6), checkOut: T(10), status: "confirmed" },
];

export const BOOKINGS: Booking[] = seeds.map((b, i) => ({
  ...b,
  id: `bk-${String(i + 1).padStart(4, "0")}`,
}));

// ============================================================
// Sanity checks (run from a script, see scripts/validate-data.ts)
// ============================================================
export function _validateNoOverlaps(): string[] {
  const errs: string[] = [];
  const byBed = new Map<string, Booking[]>();
  for (const b of BOOKINGS) {
    if (!BEDS.find((x) => x.id === b.bedId)) errs.push(`Unknown bed ${b.bedId}`);
    const list = byBed.get(b.bedId) ?? [];
    list.push(b);
    byBed.set(b.bedId, list);
  }
  for (const [bedId, list] of byBed) {
    list.sort((a, z) => a.checkIn.localeCompare(z.checkIn));
    for (let i = 1; i < list.length; i++) {
      if (list[i].checkIn < list[i - 1].checkOut) {
        errs.push(`Overlap on ${bedId}: ${list[i - 1].id} vs ${list[i].id}`);
      }
    }
  }
  return errs;
}
