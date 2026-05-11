import type { Bed, Booking, Room, RoomClass } from "@/data/hostel/types";
import { addDaysISO, diffDays, rangeDates } from "./dates";

/**
 * Whole-room semantics: private rooms (single, double, en-suite) are sold as
 * a unit — once one bed is occupied for a date range, every bed in that room
 * is blocked for that range. Strangers do NOT share a private room.
 *
 * Dorms (shared_mixed, shared_female) remain bed-level: separate guests can
 * book different beds in the same dorm.
 */
const PRIVATE_CLASSES: ReadonlySet<RoomClass> = new Set([
  "single_private",
  "double_private",
  "private_ensuite",
]);

export function isPrivateRoom(room: Room | undefined): boolean {
  return !!room && PRIVATE_CLASSES.has(room.class);
}

/** True if booking covers the given night (checkIn <= night < checkOut). */
export function bookingCoversNight(b: Booking, nightIso: string): boolean {
  return b.checkIn <= nightIso && b.checkOut > nightIso;
}

/** Booking that covers a given bed/night, or null. */
export function bookingForBedOnNight(
  bookings: Booking[],
  bedId: string,
  nightIso: string,
): Booking | null {
  return bookings.find((b) => b.bedId === bedId && bookingCoversNight(b, nightIso)) ?? null;
}

/**
 * Beds free for the FULL [start,end) range without any overlap.
 *
 * Honors whole-room semantics for private rooms when `rooms` is provided:
 * if any bed in a private room is occupied during the range, every bed in
 * that room is excluded (private rooms are never sold to strangers
 * alongside another party).
 */
export function bedsFreeForRange(
  beds: Bed[],
  bookings: Booking[],
  start: string,
  end: string,
  rooms?: Room[],
): Bed[] {
  const bedFree = (bedId: string) =>
    !bookings.some((b) => b.bedId === bedId && b.checkIn < end && b.checkOut > start);
  if (!rooms) return beds.filter((bed) => bedFree(bed.id));

  const blockedRoomIds = new Set<string>();
  for (const room of rooms) {
    if (!isPrivateRoom(room)) continue;
    const roomBeds = beds.filter((b) => b.roomId === room.id);
    if (roomBeds.some((b) => !bedFree(b.id))) blockedRoomIds.add(room.id);
  }
  return beds.filter((bed) => bedFree(bed.id) && !blockedRoomIds.has(bed.roomId));
}

/** % occupancy across all beds for a single night. */
export function nightOccupancy(beds: Bed[], bookings: Booking[], nightIso: string): number {
  const occupied = beds.filter((b) =>
    bookings.some((bk) => bk.bedId === b.id && bookingCoversNight(bk, nightIso)),
  ).length;
  return beds.length === 0 ? 0 : occupied / beds.length;
}

/** Per-night occupancy for a date range — useful for headers / sparkline. */
export function occupancySeries(
  beds: Bed[],
  bookings: Booking[],
  start: string,
  end: string,
): { date: string; occupied: number; total: number; pct: number }[] {
  return rangeDates(start, end).map((date) => {
    const occupied = beds.filter((b) =>
      bookings.some((bk) => bk.bedId === b.id && bookingCoversNight(bk, date)),
    ).length;
    return { date, occupied, total: beds.length, pct: occupied / beds.length };
  });
}

/** Bookings sorted, on a specific bed, in [start,end). */
export function bookingsOnBedInRange(
  bookings: Booking[],
  bedId: string,
  start: string,
  end: string,
): Booking[] {
  return bookings
    .filter((b) => b.bedId === bedId && b.checkIn < end && b.checkOut > start)
    .sort((a, z) => a.checkIn.localeCompare(z.checkIn));
}

/** Today's arrivals (checkIn === date). */
export function arrivalsOn(bookings: Booking[], date: string): Booking[] {
  return bookings.filter((b) => b.checkIn === date);
}

/** Today's departures (checkOut === date). */
export function departuresOn(bookings: Booking[], date: string): Booking[] {
  return bookings.filter((b) => b.checkOut === date);
}

/** In-house guests as of a given date (checkedIn but not yet checkedOut). */
export function inHouseOn(bookings: Booking[], date: string): Booking[] {
  return bookings.filter((b) => b.checkIn <= date && b.checkOut > date);
}

export function roomFor(rooms: Room[], roomId: string): Room | undefined {
  return rooms.find((r) => r.id === roomId);
}

export function roomForBed(rooms: Room[], beds: Bed[], bedId: string): Room | undefined {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return undefined;
  return rooms.find((r) => r.id === bed.roomId);
}

export { addDaysISO, diffDays, rangeDates };
