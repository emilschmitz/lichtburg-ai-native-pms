/**
 * Build a compact OccupationContext from raw PMS data — small enough to put
 * into an LLM prompt without burning tokens.
 *
 * This is deliberately a pure function with no AI dependency: it's used both
 * to feed the AI provider and to generate seed alternatives in the UI.
 */

import type { Bed, Booking, Room } from "@/data/hostel/types";
import { TODAY } from "@/data/hostel";
import type { CompactBooking, CompactRoom, OccupationContext } from "./types";
import { findAlternatives } from "@/lib/pms/alternatives";

export function buildOccupationContext(args: {
  rooms: Room[];
  beds: Bed[];
  bookings: Booking[];
  windowStart: string;
  windowEnd: string;
  desiredCheckIn?: string;
  desiredCheckOut?: string;
  preferredClass?: Room["class"];
  today?: string;
}): OccupationContext {
  const { rooms, beds, bookings, windowStart, windowEnd } = args;

  const compactRooms: CompactRoom[] = rooms.map((r) => {
    const roomBeds = beds.filter((b) => b.roomId === r.id);
    return {
      id: r.id,
      number: r.number,
      name: r.name,
      class: r.class,
      capacity: r.capacity,
      pricePerNight: r.pricePerNight,
      bedIds: roomBeds.map((b) => b.id),
      bedLabels: Object.fromEntries(roomBeds.map((b) => [b.id, b.label])),
    };
  });

  const overlapping = bookings.filter(
    (b) => b.checkIn < windowEnd && b.checkOut > windowStart,
  );
  const compactBookings: CompactBooking[] = overlapping.map((b) => ({
    id: b.id,
    bedId: b.bedId,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status,
  }));

  // Seed candidate alternatives if a desired stay is given — this gives the
  // AI good starting points to refine and rank, instead of asking it to do
  // graph search itself.
  const candidates =
    args.desiredCheckIn && args.desiredCheckOut
      ? findAlternatives(
          rooms,
          beds,
          bookings,
          {
            checkIn: args.desiredCheckIn,
            checkOut: args.desiredCheckOut,
            guests: 1,
            preferredClass: args.preferredClass,
          },
          6,
        )
      : [];

  return {
    today: args.today ?? TODAY,
    windowStart,
    windowEnd,
    bookings: compactBookings,
    rooms: compactRooms,
    candidateAlternatives: candidates,
  };
}
