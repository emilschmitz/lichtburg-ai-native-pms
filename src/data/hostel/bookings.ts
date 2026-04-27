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
 * Nights covered: T+1..T+7. Departure morning T+8.
 */
export const NEXT_WEEK_START = addDays(TODAY, 1);
export const NEXT_WEEK_END = addDays(TODAY, 8);

/**
 * Design intent for the AI to have something interesting to solve.
 *
 * Hostel total: 17 beds × 7 nights = 119 bed-nights.
 * Booked next week: ~95 (≈80% occupancy — feels full but not impossible).
 * Free per night: every single night T+1..T+7 has ≥3 free beds, spread
 * across at least 2 different room classes.
 *
 * For a "7 nights, cheap as possible" query the AI should be able to
 * surface MULTIPLE distinct trade-off paths, e.g.:
 *
 *   A. CHEAPEST, many switches — bounce across mixed dorms (3 switches,
 *      ~€29/night avg). Annoying but cheap.
 *   B. ONE SWITCH, mid budget — start in a mixed dorm, move to the single
 *      private (102) mid-week. Quieter second half, ~€45/night avg.
 *   C. PREMIUM, NO SWITCH — en-suite 202 bed A free all 7 nights.
 *      Most expensive (~€119/night) but zero hassle.
 *   D. FEMALE-ONLY, one switch — Mauerpark 201 has a path with one swap.
 *   E. PRIVATE DOUBLE, two switches — Tempelhof 103 with bed-pair churn.
 *
 * No single bed is free for the entire week EXCEPT 202-a (premium), so
 * the AI must reason about chains for any cheap/mid request.
 */

type Seed = Omit<Booking, "id">;
const T = (n: number) => addDays(TODAY, n);

const seeds: Seed[] = [
  // ============================================================
  // SPREE DORM 101 — 6 mixed-dorm beds (cheapest tier, €28)
  // Free slots engineered for Path A (cheap, many switches):
  //   • 101-1b free T+1..T+3 (3 nights)
  //   • 101-3t free T+4..T+6 (3 nights)
  // ============================================================
  // 101-1t — covered all week by two stays
  { guestName: "Liam O'Connor", guestCountry: "IE", bedId: "b-101-1t",
    guestEmail: "liam.oconnor@example.ie", guestPhone: "+353 87 555 0143",
    guestAddress: "12 Patrick St, Dublin 8, Ireland",
    guestLanguage: "EN", paymentStatus: "paid", channel: "booking.com",
    tags: ["repeat guest"],
    checkIn: T(0), checkOut: T(4), status: "checked_in",
    notes: "Arriving late, requested key in safe box." },
  { guestName: "Marta Kowalski", guestCountry: "PL", bedId: "b-101-1t",
    guestEmail: "m.kowalski@example.pl", channel: "hostelworld",
    paymentStatus: "deposit",
    checkIn: T(4), checkOut: T(10), status: "confirmed" },

  // 101-1b — gap T+1..T+3 (Path A leg #1)
  { guestName: "Pedro Alves", guestCountry: "PT", bedId: "b-101-1b",
    guestPhone: "+351 91 234 5678", channel: "walk_in", paymentStatus: "paid",
    checkIn: T(-1), checkOut: T(0), status: "checked_out" },
  // free T+0..T+3
  { guestName: "Anna Schmidt", guestCountry: "DE", bedId: "b-101-1b",
    guestEmail: "anna.schmidt@example.de", guestLanguage: "DE",
    guestDateOfBirth: "1994-08-12", channel: "direct", paymentStatus: "paid",
    checkIn: T(4), checkOut: T(9), status: "confirmed" },

  // 101-2t — fully booked all week (two contiguous stays)
  { guestName: "Thomas Becker", guestCountry: "AT", bedId: "b-101-2t",
    guestEmail: "tbecker@example.at", channel: "booking.com",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Sofia Romano", guestCountry: "IT", bedId: "b-101-2t",
    guestPhone: "+39 333 444 5566", arrivalTimeEstimate: "after 23:00",
    paymentStatus: "deposit", channel: "hostelworld",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // 101-2b — fully booked
  { guestName: "Hans Vogel", guestCountry: "DE", bedId: "b-101-2b",
    guestLanguage: "DE", channel: "walk_in", paymentStatus: "paid",
    checkIn: T(-1), checkOut: T(2), status: "checked_in" },
  { guestName: "Noah Dubois", guestCountry: "FR", bedId: "b-101-2b",
    guestEmail: "noah.dubois@example.fr",
    checkIn: T(2), checkOut: T(5), status: "confirmed" },
  { guestName: "Diego Fernández", guestCountry: "ES", bedId: "b-101-2b",
    channel: "booking.com",
    checkIn: T(5), checkOut: T(8), status: "confirmed" },

  // 101-3t — gap T+4..T+6 (Path A leg #2 — chains from 101-1b via a hop)
  { guestName: "Olivia Brown", guestCountry: "GB", bedId: "b-101-3t",
    guestEmail: "olivia.b@example.co.uk", guestPhone: "+44 7700 900123",
    paymentStatus: "paid", channel: "direct", tags: ["quiet please"],
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  // free T+4, T+5, T+6
  { guestName: "Ravi Patel", guestCountry: "IN", bedId: "b-101-3t",
    guestEmail: "ravi.patel@example.in", guestIdDocument: "Passport · IN · M9821334",
    channel: "booking.com", paymentStatus: "deposit",
    checkIn: T(7), checkOut: T(10), status: "confirmed" },

  // 101-3b — fully booked
  { guestName: "Felix Wagner", guestCountry: "DE", bedId: "b-101-3b",
    guestLanguage: "DE",
    checkIn: T(-2), checkOut: T(2), status: "checked_in" },
  { guestName: "Lucas Martín", guestCountry: "AR", bedId: "b-101-3b",
    guestEmail: "lucas.m@example.ar", arrivalTimeEstimate: "around 18:00",
    checkIn: T(2), checkOut: T(5), status: "confirmed" },
  { guestName: "Astrid Berg", guestCountry: "NO", bedId: "b-101-3b",
    channel: "hostelworld", paymentStatus: "paid",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  // ============================================================
  // LINDEN SINGLE 102 — 1 private single bed (€65)
  // Free T+3..T+6 (4 nights) — backbone of Path B (one switch, mid)
  // ============================================================
  { guestName: "Margaret Hall", guestCountry: "US", bedId: "b-102-a",
    guestEmail: "m.hall@example.com", guestPhone: "+1 415 555 0177",
    guestAddress: "221 Baker St, San Francisco, CA",
    guestDateOfBirth: "1978-03-22", guestIdDocument: "Passport · US · 543219876",
    paymentStatus: "paid", channel: "direct", tags: ["VIP", "early check-in"],
    checkIn: T(0), checkOut: T(3), status: "checked_in",
    notes: "Vegetarian breakfast preferred." },
  // free T+3..T+6
  { guestName: "Jean-Paul Mercier", guestCountry: "FR", bedId: "b-102-a",
    guestEmail: "jp.mercier@example.fr",
    checkIn: T(7), checkOut: T(11), status: "confirmed" },

  // ============================================================
  // TEMPELHOF DOUBLE 103 — 2 beds, private double (€92)
  // 103-a free T+2..T+3, 103-b free T+5..T+7  → Path E (2 switches)
  // ============================================================
  // 103 is a PRIVATE double — always sold to the same party (both beds together).
  { guestName: "Mia Johansson", guestCountry: "SE", bedId: "b-103-a",
    guestEmail: "mia.j@example.se", guestLanguage: "EN",
    paymentStatus: "paid", channel: "booking.com",
    checkIn: T(0), checkOut: T(2), status: "checked_in",
    notes: "Travelling with Erik (103-b)." },
  { guestName: "Erik Johansson", guestCountry: "SE", bedId: "b-103-b",
    guestEmail: "erik.j@example.se", guestLanguage: "EN",
    paymentStatus: "paid", channel: "booking.com",
    checkIn: T(0), checkOut: T(2), status: "checked_in",
    notes: "Travelling with Mia (103-a)." },
  // room empty T+2, T+3 — both beds free for a couple/pair

  { guestName: "Carla Mendes", guestCountry: "BR", bedId: "b-103-a",
    guestEmail: "carla.m@example.br",
    checkIn: T(4), checkOut: T(7), status: "confirmed",
    notes: "Travelling with Bruno (103-b)." },
  { guestName: "Bruno Mendes", guestCountry: "BR", bedId: "b-103-b",
    checkIn: T(4), checkOut: T(7), status: "confirmed",
    notes: "Travelling with Carla (103-a)." },

  { guestName: "Helga Müller", guestCountry: "DE", bedId: "b-103-a",
    guestLanguage: "DE", channel: "direct",
    checkIn: T(7), checkOut: T(10), status: "confirmed",
    notes: "Travelling with Klaus (103-b)." },
  { guestName: "Klaus Müller", guestCountry: "DE", bedId: "b-103-b",
    guestPhone: "+49 30 1234 5678", guestLanguage: "DE",
    checkIn: T(7), checkOut: T(10), status: "confirmed",
    notes: "Travelling with Helga (103-a)." },

  // ============================================================
  // MAUERPARK FEMALE 201 — 4 female-only dorm beds (€32)
  // 201-2t free T+1..T+2, 201-2b free T+4..T+7  → Path D (1 switch)
  // ============================================================
  { guestName: "Chiara Bianchi", guestCountry: "IT", bedId: "b-201-1t",
    guestEmail: "chiara.b@example.it",
    checkIn: T(0), checkOut: T(5), status: "checked_in" },
  { guestName: "Rin Kobayashi", guestCountry: "JP", bedId: "b-201-1t",
    guestIdDocument: "Passport · JP · TR9988231", guestLanguage: "EN",
    arrivalTimeEstimate: "13:30 flight, ~16:00 arrival",
    checkIn: T(5), checkOut: T(9), status: "confirmed" },

  { guestName: "Hannah Becker", guestCountry: "DE", bedId: "b-201-1b",
    guestLanguage: "DE", channel: "walk_in",
    checkIn: T(-1), checkOut: T(4), status: "checked_in" },
  { guestName: "Maya Rosenberg", guestCountry: "IL", bedId: "b-201-1b",
    guestEmail: "maya.r@example.co.il",
    checkIn: T(4), checkOut: T(8), status: "confirmed" },
  { guestName: "Zara Ahmed", guestCountry: "GB", bedId: "b-201-1b",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  // 201-2t — gap T+1..T+2
  // free T+0..T+2 on 201-2t (Ines arrives later in the week below)
  { guestName: "Ines Garcia", guestCountry: "ES", bedId: "b-201-2t",
    guestPhone: "+34 600 112 233", paymentStatus: "deposit",
    checkIn: T(2), checkOut: T(3), status: "confirmed" },
  { guestName: "Eva Novak", guestCountry: "CZ", bedId: "b-201-2t",
    guestEmail: "eva.novak@example.cz",
    checkIn: T(3), checkOut: T(7), status: "confirmed" },
  { guestName: "Lila Dupont", guestCountry: "FR", bedId: "b-201-2t",
    channel: "airbnb",
    checkIn: T(7), checkOut: T(10), status: "confirmed" },

  // 201-2b — gap T+4..T+7 (Path D leg #2)
  { guestName: "Petra Janssen", guestCountry: "NL", bedId: "b-201-2b",
    guestEmail: "petra.j@example.nl", guestLanguage: "EN",
    checkIn: T(-2), checkOut: T(2), status: "checked_in" },
  { guestName: "Sophie Wilson", guestCountry: "CA", bedId: "b-201-2b",
    guestAddress: "88 Queen St W, Toronto, ON",
    checkIn: T(2), checkOut: T(4), status: "confirmed" },
  // free T+4, T+5, T+6, T+7
  { guestName: "Greta Lindqvist", guestCountry: "SE", bedId: "b-201-2b",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  // ============================================================
  // GÖRLI EN-SUITE 202 — 2 premium beds (€119)
  // 202-a — FREE ALL WEEK (Path C, the "no switch but expensive")
  // 202-b — booked solid
  // ============================================================
  // 202-a: previous guest checks out T+1, next arrives T+8 → 7 nights free
  { guestName: "Daniel Park", guestCountry: "KR", bedId: "b-202-a",
    guestEmail: "daniel.park@example.kr", guestPhone: "+82 10 1234 5678",
    guestIdDocument: "Passport · KR · M77881122",
    paymentStatus: "paid", channel: "direct", tags: ["honeymoon"],
    checkIn: T(-2), checkOut: T(1), status: "checked_in",
    notes: "Champagne already delivered to room." },
  // free T+1..T+7
  { guestName: "Alessandro Rossi", guestCountry: "IT", bedId: "b-202-a",
    checkIn: T(8), checkOut: T(11), status: "confirmed" },

  { guestName: "Hye-jin Park", guestCountry: "KR", bedId: "b-202-b",
    guestEmail: "hyejin.p@example.kr", guestLanguage: "EN",
    paymentStatus: "paid", channel: "direct", tags: ["honeymoon"],
    checkIn: T(-2), checkOut: T(1), status: "checked_in",
    notes: "Travelling with Daniel (202-a). Honeymoon." },
  // 202-b empty T+1..T+3 (entire room free, sellable as couple suite)
  { guestName: "Giulia Rossi", guestCountry: "IT", bedId: "b-202-b",
    guestEmail: "giulia.rossi@example.it",
    checkIn: T(4), checkOut: T(12), status: "confirmed",
    notes: "Travelling with Alessandro (202-a arrives T+8)." },

  // ============================================================
  // SKYLINE DORM 301 — 2 beds, mixed (€30, quiet floor)
  // 301-a free T+4..T+6 — chains with 101 gaps for Path A variants.
  // 301-b free T+1..T+3 (one extra cheap leg).
  // ============================================================
  { guestName: "Tariq Hassan", guestCountry: "EG", bedId: "b-301-a",
    guestEmail: "tariq.h@example.eg", channel: "expedia",
    checkIn: T(0), checkOut: T(4), status: "checked_in" },
  // free T+4, T+5, T+6
  { guestName: "Leon Hofer", guestCountry: "CH", bedId: "b-301-a",
    guestLanguage: "DE",
    checkIn: T(7), checkOut: T(11), status: "confirmed" },

  // 301-b — gap T+1..T+3
  { guestName: "Owen Murphy", guestCountry: "IE", bedId: "b-301-b",
    paymentStatus: "deposit",
    checkIn: T(-2), checkOut: T(0), status: "checked_out" },
  // free T+0..T+3
  { guestName: "Nora Eriksen", guestCountry: "NO", bedId: "b-301-b",
    guestEmail: "nora.e@example.no", arrivalTimeEstimate: "after 21:00",
    checkIn: T(4), checkOut: T(7), status: "confirmed" },
  { guestName: "Saskia de Vries", guestCountry: "NL", bedId: "b-301-b",
    checkIn: T(7), checkOut: T(10), status: "confirmed" },
];

export const BOOKINGS: Booking[] = seeds.map((b, i) => ({
  ...b,
  id: `bk-${String(i + 1).padStart(4, "0")}`,
}));

// ============================================================
// Sanity checks
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
