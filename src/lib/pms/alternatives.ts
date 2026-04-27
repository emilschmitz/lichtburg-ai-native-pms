/**
 * Alternatives finder — deterministic, no AI.
 *
 * Given a desired stay (continuous date range) and the current bookings,
 * compute candidate sequences of bed assignments that together cover the
 * full range with no gap. Each "leg" of a sequence is a stay on one bed
 * for a sub-range. We score each alternative on:
 *
 *   - number of room switches (lower is better)
 *   - whether the room class matches the desired one
 *   - total price vs an upgrade premium
 *   - bed-quality penalties (e.g. top bunk)
 *
 * The algorithm: for each starting bed free at `start`, greedily extend by
 * picking the bed (free starting from the current cursor) that covers the
 * MOST nights forward. Then jump the cursor and repeat. We also enumerate
 * a few non-greedy variants (prefer same room class, prefer fewer switches,
 * prefer cheapest) to surface real trade-offs.
 */

import type { Bed, Booking, DesiredStay, Room, RoomClass } from "@/data/hostel/types";
import { bookingsOnBedInRange, roomForBed } from "./availability";
import { diffDays } from "./dates";

export interface AltLeg {
  bedId: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  roomClass: RoomClass;
  bedLabel: string;
  from: string;
  to: string;
  nights: number;
  pricePerNight: number;
}

export interface Alternative {
  id: string;
  legs: AltLeg[];
  totalNights: number;
  totalPrice: number;
  switches: number;
  uniqueRooms: number;
  uniqueClasses: RoomClass[];
  /** How well it matches the desired class: 1 = perfect, 0 = none. */
  classMatch: number;
  /** Average cost per night (handy for UI). */
  avgPerNight: number;
  /** Human label e.g. "Same class, 2 switches". */
  label: string;
  /** A short list of trade-offs to display to the operator. */
  tradeoffs: string[];
}

/** Earliest date this bed is occupied at-or-after `from`, or `Infinity` (= toIso) if free until then. */
function nextBlockedAt(
  bookings: Booking[],
  bedId: string,
  from: string,
  to: string,
): string {
  const inRange = bookingsOnBedInRange(bookings, bedId, from, to);
  for (const b of inRange) {
    // booking that starts at or after `from`
    if (b.checkIn >= from) return b.checkIn;
    // booking that overlaps `from` but ends before `to` shouldn't happen
    // in candidates we already filtered to free-at-`from` beds.
  }
  return to;
}

/** Beds free starting at exactly `from` (i.e. no booking covers `from`). */
function bedsFreeAt(beds: Bed[], bookings: Booking[], from: string): Bed[] {
  return beds.filter(
    (bed) =>
      !bookings.some(
        (b) => b.bedId === bed.id && b.checkIn <= from && b.checkOut > from,
      ),
  );
}

interface BuildOpts {
  pickStrategy:
    | "longest-leg" // greedy max nights forward
    | "same-class-first" // prefer beds of preferred class
    | "cheapest" // prefer cheapest beds
    | "fewest-switches"; // prefer beds that extend furthest of any class
  preferredClass?: RoomClass;
}

function buildSequence(
  beds: Bed[],
  rooms: Room[],
  bookings: Booking[],
  start: string,
  end: string,
  opts: BuildOpts,
): AltLeg[] | null {
  const legs: AltLeg[] = [];
  let cursor = start;
  // Avoid infinite loops; max legs = nights.
  const maxLegs = diffDays(start, end);
  let safety = maxLegs + 2;

  while (cursor < end && safety-- > 0) {
    const candidates = bedsFreeAt(beds, bookings, cursor);
    if (candidates.length === 0) return null;

    // Determine the next-blocked date for each candidate, capped at `end`.
    const enriched = candidates.map((bed) => {
      const room = roomForBed(rooms, beds, bed.id)!;
      const blockedAt = nextBlockedAt(bookings, bed.id, cursor, end);
      return {
        bed,
        room,
        blockedAt,
        nights: diffDays(cursor, blockedAt),
      };
    });

    // Sort by strategy
    enriched.sort((a, z) => {
      switch (opts.pickStrategy) {
        case "longest-leg":
        case "fewest-switches":
          return z.nights - a.nights;
        case "same-class-first": {
          const aMatch = a.room.class === opts.preferredClass ? 0 : 1;
          const zMatch = z.room.class === opts.preferredClass ? 0 : 1;
          if (aMatch !== zMatch) return aMatch - zMatch;
          return z.nights - a.nights;
        }
        case "cheapest": {
          if (a.room.pricePerNight !== z.room.pricePerNight)
            return a.room.pricePerNight - z.room.pricePerNight;
          return z.nights - a.nights;
        }
      }
    });

    const pick = enriched[0];
    const legEnd = pick.blockedAt < end ? pick.blockedAt : end;
    legs.push({
      bedId: pick.bed.id,
      roomId: pick.room.id,
      roomNumber: pick.room.number,
      roomName: pick.room.name,
      roomClass: pick.room.class,
      bedLabel: pick.bed.label,
      from: cursor,
      to: legEnd,
      nights: diffDays(cursor, legEnd),
      pricePerNight: pick.room.pricePerNight,
    });
    cursor = legEnd;
  }

  if (cursor < end) return null;
  return legs;
}

function describe(legs: AltLeg[], desired?: RoomClass): Omit<Alternative, "id" | "label"> {
  const totalNights = legs.reduce((s, l) => s + l.nights, 0);
  const totalPrice = legs.reduce((s, l) => s + l.nights * l.pricePerNight, 0);
  const uniqueRoomIds = new Set(legs.map((l) => l.roomId));
  const uniqueClasses = Array.from(new Set(legs.map((l) => l.roomClass))) as RoomClass[];
  const switches = Math.max(0, legs.length - 1);
  const classMatch = desired
    ? legs.filter((l) => l.roomClass === desired).reduce((s, l) => s + l.nights, 0) /
      Math.max(1, totalNights)
    : 1;

  const tradeoffs: string[] = [];
  if (switches === 0) tradeoffs.push("No room change — ideal");
  else if (switches === 1) tradeoffs.push("One mid-stay room change");
  else tradeoffs.push(`${switches} room changes during the stay`);
  if (desired && classMatch < 1) {
    if (classMatch === 0) tradeoffs.push("No nights in preferred room class");
    else tradeoffs.push(`${Math.round(classMatch * 100)}% of nights in preferred class`);
  }
  if (uniqueClasses.length > 1) tradeoffs.push(`Mixed room classes: ${uniqueClasses.length}`);

  return {
    legs,
    totalNights,
    totalPrice,
    switches,
    uniqueRooms: uniqueRoomIds.size,
    uniqueClasses,
    classMatch,
    avgPerNight: totalPrice / Math.max(1, totalNights),
    tradeoffs,
  };
}

function legsKey(legs: AltLeg[]): string {
  return legs.map((l) => `${l.bedId}@${l.from}-${l.to}`).join("|");
}

export function findAlternatives(
  rooms: Room[],
  beds: Bed[],
  bookings: Booking[],
  desired: DesiredStay,
  limit = 4,
): Alternative[] {
  const strategies: BuildOpts["pickStrategy"][] = [
    "fewest-switches",
    "same-class-first",
    "cheapest",
    "longest-leg",
  ];

  const seen = new Map<string, Alternative>();
  let counter = 0;

  for (const strat of strategies) {
    const seq = buildSequence(beds, rooms, bookings, desired.checkIn, desired.checkOut, {
      pickStrategy: strat,
      preferredClass: desired.preferredClass,
    });
    if (!seq) continue;
    const key = legsKey(seq);
    if (seen.has(key)) continue;

    const base = describe(seq, desired.preferredClass);
    const labelBits: string[] = [];
    if (base.switches === 0) labelBits.push("No switches");
    else labelBits.push(`${base.switches} switches`);
    if (desired.preferredClass) {
      labelBits.push(
        base.classMatch === 1
          ? "same class throughout"
          : base.classMatch === 0
            ? "different class"
            : "mixed class",
      );
    }
    labelBits.push(`€${Math.round(base.totalPrice)}`);

    seen.set(key, {
      id: `alt-${++counter}`,
      label: labelBits.join(" · "),
      ...base,
    });
  }

  return Array.from(seen.values())
    .sort((a, z) => {
      // Prefer fewer switches, then better class match, then cheaper.
      if (a.switches !== z.switches) return a.switches - z.switches;
      if (a.classMatch !== z.classMatch) return z.classMatch - a.classMatch;
      return a.totalPrice - z.totalPrice;
    })
    .slice(0, limit);
}
