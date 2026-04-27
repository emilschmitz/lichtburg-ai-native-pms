import type { Bed, Booking, Room } from "@/data/hostel/types";
import { addDaysISO, diffDays, rangeDates } from "./dates";

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
  return (
    bookings.find((b) => b.bedId === bedId && bookingCoversNight(b, nightIso)) ?? null
  );
}

/** Beds free for the FULL [start,end) range without any overlap. */
export function bedsFreeForRange(
  beds: Bed[],
  bookings: Booking[],
  start: string,
  end: string,
): Bed[] {
  return beds.filter(
    (bed) =>
      !bookings.some(
        (b) => b.bedId === bed.id && b.checkIn < end && b.checkOut > start,
      ),
  );
}

/** % occupancy across all beds for a single night. */
export function nightOccupancy(
  beds: Bed[],
  bookings: Booking[],
  nightIso: string,
): number {
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

export function roomForBed(
  rooms: Room[],
  beds: Bed[],
  bedId: string,
): Room | undefined {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return undefined;
  return rooms.find((r) => r.id === bed.roomId);
}

export { addDaysISO, diffDays, rangeDates };
