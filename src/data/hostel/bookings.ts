import type { Booking } from "./types";
import { BEDS } from "./rooms";

/**
 * Deterministic mock. We pin "today" so the calendar always shows the
 * intended scenario regardless of when the app runs. The UI imports
 * `TODAY` from here so the timeline / floor-plan center on the same day.
 */
export const TODAY = "2026-04-27";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Next week" = the 7-night window [TODAY+1 .. TODAY+8). */
export const NEXT_WEEK_START = addDays(TODAY, 1);
export const NEXT_WEEK_END = addDays(TODAY, 8);

/**
 * Hand-crafted booking set. Designed properties:
 *
 *  1. Every bed (all 17) is occupied every night between NEXT_WEEK_START and
 *     NEXT_WEEK_END — i.e. zero availability for the next 7 nights.
 *  2. NO bed is occupied by the SAME guest for all 7 of those nights.
 *     This is what forces the "switch rooms / upgrade" trade-off when someone
 *     asks to stay the entire week.
 *  3. There is meaningful churn: short stays of 1–4 nights interleave so the
 *     timeline view looks like a real PMS (the "video editor strip").
 *  4. Today and the day before today have a few empty beds so the current view
 *     also shows arrivals/departures activity, not just a brick wall.
 */

type Seed = Omit<Booking, "id">;

const seeds: Seed[] = [
  // ===== Spree Dorm (6 beds) — heavy churn =====
  // Bed 101-1t: A→B→C across the week (3 different guests)
  { guestName: "Liam O'Connor", guestCountry: "IE", bedId: "b-101-1t",
    checkIn: TODAY, checkOut: addDays(TODAY, 3), status: "checked_in" },
  { guestName: "Marta Kowalski", guestCountry: "PL", bedId: "b-101-1t",
    checkIn: addDays(TODAY, 3), checkOut: addDays(TODAY, 6), status: "confirmed" },
  { guestName: "Yuki Tanaka", guestCountry: "JP", bedId: "b-101-1t",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 10), status: "confirmed" },

  // Bed 101-1b: continuous through the week (single guest, but only 5 nights — gap on day 6→8)
  { guestName: "Pedro Alves", guestCountry: "PT", bedId: "b-101-1b",
    checkIn: addDays(TODAY, -1), checkOut: addDays(TODAY, 6), status: "checked_in" },
  { guestName: "Anna Schmidt", guestCountry: "DE", bedId: "b-101-1b",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // Bed 101-2t: two halves
  { guestName: "Thomas Becker", guestCountry: "AT", bedId: "b-101-2t",
    checkIn: TODAY, checkOut: addDays(TODAY, 4), status: "checked_in" },
  { guestName: "Sofia Romano", guestCountry: "IT", bedId: "b-101-2t",
    checkIn: addDays(TODAY, 4), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // Bed 101-2b: three short stays
  { guestName: "Noah Dubois", guestCountry: "FR", bedId: "b-101-2b",
    checkIn: addDays(TODAY, 1), checkOut: addDays(TODAY, 3), status: "confirmed" },
  { guestName: "Emma Larsen", guestCountry: "DK", bedId: "b-101-2b",
    checkIn: addDays(TODAY, 3), checkOut: addDays(TODAY, 5), status: "confirmed" },
  { guestName: "Diego Fernández", guestCountry: "ES", bedId: "b-101-2b",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 8), status: "confirmed" },
  // need to also cover today on this bed
  { guestName: "Hans Vogel", guestCountry: "DE", bedId: "b-101-2b",
    checkIn: addDays(TODAY, -1), checkOut: addDays(TODAY, 1), status: "checked_in" },

  // Bed 101-3t: two stays
  { guestName: "Olivia Brown", guestCountry: "GB", bedId: "b-101-3t",
    checkIn: TODAY, checkOut: addDays(TODAY, 5), status: "checked_in" },
  { guestName: "Ravi Patel", guestCountry: "IN", bedId: "b-101-3t",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // Bed 101-3b: two stays
  { guestName: "Lucas Martín", guestCountry: "AR", bedId: "b-101-3b",
    checkIn: addDays(TODAY, 1), checkOut: addDays(TODAY, 4), status: "confirmed" },
  { guestName: "Astrid Berg", guestCountry: "NO", bedId: "b-101-3b",
    checkIn: addDays(TODAY, 4), checkOut: addDays(TODAY, 9), status: "confirmed" },
  // cover today
  { guestName: "Felix Wagner", guestCountry: "DE", bedId: "b-101-3b",
    checkIn: addDays(TODAY, -2), checkOut: addDays(TODAY, 1), status: "checked_in" },

  // ===== Linden Single (1 bed) =====
  { guestName: "Margaret Hall", guestCountry: "US", bedId: "b-102-a",
    checkIn: TODAY, checkOut: addDays(TODAY, 4), status: "checked_in" },
  { guestName: "Jean-Paul Mercier", guestCountry: "FR", bedId: "b-102-a",
    checkIn: addDays(TODAY, 4), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // ===== Tempelhof Double (2 beds, usually booked together) =====
  { guestName: "Mia Johansson", guestCountry: "SE", bedId: "b-103-a",
    checkIn: TODAY, checkOut: addDays(TODAY, 3), status: "checked_in" },
  { guestName: "Erik Johansson", guestCountry: "SE", bedId: "b-103-b",
    checkIn: TODAY, checkOut: addDays(TODAY, 3), status: "checked_in" },
  { guestName: "Carla Mendes", guestCountry: "BR", bedId: "b-103-a",
    checkIn: addDays(TODAY, 3), checkOut: addDays(TODAY, 6), status: "confirmed" },
  { guestName: "Bruno Costa", guestCountry: "BR", bedId: "b-103-b",
    checkIn: addDays(TODAY, 3), checkOut: addDays(TODAY, 6), status: "confirmed" },
  { guestName: "Helga Müller", guestCountry: "DE", bedId: "b-103-a",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 10), status: "confirmed" },
  { guestName: "Klaus Müller", guestCountry: "DE", bedId: "b-103-b",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 10), status: "confirmed" },

  // ===== Mauerpark Female (4 beds) =====
  { guestName: "Chiara Bianchi", guestCountry: "IT", bedId: "b-201-1t",
    checkIn: TODAY, checkOut: addDays(TODAY, 5), status: "checked_in" },
  { guestName: "Rin Kobayashi", guestCountry: "JP", bedId: "b-201-1t",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 9), status: "confirmed" },

  { guestName: "Hannah Becker", guestCountry: "DE", bedId: "b-201-1b",
    checkIn: addDays(TODAY, -1), checkOut: addDays(TODAY, 4), status: "checked_in" },
  { guestName: "Maya Rosenberg", guestCountry: "IL", bedId: "b-201-1b",
    checkIn: addDays(TODAY, 4), checkOut: addDays(TODAY, 8), status: "confirmed" },
  { guestName: "Zara Ahmed", guestCountry: "GB", bedId: "b-201-1b",
    checkIn: addDays(TODAY, 8), checkOut: addDays(TODAY, 11), status: "confirmed" },

  { guestName: "Ines Garcia", guestCountry: "ES", bedId: "b-201-2t",
    checkIn: TODAY, checkOut: addDays(TODAY, 2), status: "checked_in" },
  { guestName: "Eva Novak", guestCountry: "CZ", bedId: "b-201-2t",
    checkIn: addDays(TODAY, 2), checkOut: addDays(TODAY, 6), status: "confirmed" },
  { guestName: "Lila Dupont", guestCountry: "FR", bedId: "b-201-2t",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 10), status: "confirmed" },

  { guestName: "Sophie Wilson", guestCountry: "CA", bedId: "b-201-2b",
    checkIn: addDays(TODAY, 1), checkOut: addDays(TODAY, 5), status: "confirmed" },
  { guestName: "Greta Lindqvist", guestCountry: "SE", bedId: "b-201-2b",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 9), status: "confirmed" },
  // cover today
  { guestName: "Petra Janssen", guestCountry: "NL", bedId: "b-201-2b",
    checkIn: addDays(TODAY, -2), checkOut: addDays(TODAY, 1), status: "checked_in" },

  // ===== Görli En-Suite (2 beds) =====
  { guestName: "Daniel Park", guestCountry: "KR", bedId: "b-202-a",
    checkIn: TODAY, checkOut: addDays(TODAY, 5), status: "checked_in" },
  { guestName: "Hye-jin Park", guestCountry: "KR", bedId: "b-202-b",
    checkIn: TODAY, checkOut: addDays(TODAY, 5), status: "checked_in" },
  { guestName: "Alessandro Rossi", guestCountry: "IT", bedId: "b-202-a",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 9), status: "confirmed" },
  { guestName: "Giulia Rossi", guestCountry: "IT", bedId: "b-202-b",
    checkIn: addDays(TODAY, 5), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // ===== Skyline Dorm (2 beds) =====
  // Bed 301-a: split in halves
  { guestName: "Tariq Hassan", guestCountry: "EG", bedId: "b-301-a",
    checkIn: TODAY, checkOut: addDays(TODAY, 4), status: "checked_in" },
  { guestName: "Leon Hofer", guestCountry: "CH", bedId: "b-301-a",
    checkIn: addDays(TODAY, 4), checkOut: addDays(TODAY, 9), status: "confirmed" },

  // Bed 301-b: split in halves with a different boundary so a 7-night guest
  // could "follow" by switching beds inside the room (this is one of the AI
  // alternatives we want to surface).
  { guestName: "Nora Eriksen", guestCountry: "NO", bedId: "b-301-b",
    checkIn: addDays(TODAY, 1), checkOut: addDays(TODAY, 6), status: "confirmed" },
  { guestName: "Saskia de Vries", guestCountry: "NL", bedId: "b-301-b",
    checkIn: addDays(TODAY, 6), checkOut: addDays(TODAY, 10), status: "confirmed" },
  // cover today
  { guestName: "Owen Murphy", guestCountry: "IE", bedId: "b-301-b",
    checkIn: addDays(TODAY, -2), checkOut: addDays(TODAY, 1), status: "checked_in" },
];

export const BOOKINGS: Booking[] = seeds.map((b, i) => ({
  ...b,
  id: `bk-${String(i + 1).padStart(4, "0")}`,
}));

// Sanity check we can import and trust at runtime in dev.
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
