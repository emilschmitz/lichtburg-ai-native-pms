/**
 * Core PMS types — kept dependency-free so they can be reused by the AI module
 * and any business-logic module.
 */

export type RoomClass =
  | "shared_mixed"
  | "shared_female"
  | "double_private"
  | "single_private"
  | "private_ensuite";

export type BedType = "single" | "double" | "bunk_top" | "bunk_bottom";

export interface Room {
  id: string;
  number: string;
  name: string;
  class: RoomClass;
  capacity: number;
  floor: 0 | 1 | 2;
  /** Pixel-ish coordinates on a 12-col x 8-row grid for floor plan rendering. */
  layout: { x: number; y: number; w: number; h: number };
  pricePerNight: number; // EUR per bed per night
  amenities: string[];
}

export interface Bed {
  id: string;
  roomId: string;
  label: string; // e.g. "A", "B", "Bunk 1 top"
  type: BedType;
}

/**
 * A booking groups one or more bed-segments into a single guest stay. A guest
 * may move between beds mid-stay (a "split" stay), but their contact info
 * stays with the booking. Each segment is a contiguous occupation of one bed.
 *
 * The classic single-bed booking is just a booking with one segment.
 */
export interface BookingSegment {
  bedId: string;
  /** ISO date YYYY-MM-DD, inclusive. */
  checkIn: string;
  /** ISO date YYYY-MM-DD, exclusive. */
  checkOut: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestCountry: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
  /** A booking always occupies one or more bed-segments. */
  segments: BookingSegment[];
  status: "confirmed" | "tentative" | "checked_in" | "checked_out";
  notes?: string;
  /** Auto-set when the booking spans 2+ different beds. */
  isSplit?: boolean;
}

export interface DesiredStay {
  guestName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Preferred room class, optional. */
  preferredClass?: RoomClass;
  budgetPerNight?: number;
  notes?: string;
}

export const ROOM_CLASS_LABEL: Record<RoomClass, string> = {
  shared_mixed: "Shared mixed dorm",
  shared_female: "Shared female dorm",
  double_private: "Private double",
  single_private: "Private single",
  private_ensuite: "Private en-suite",
};

export const ROOM_CLASS_ORDER: RoomClass[] = [
  "shared_mixed",
  "shared_female",
  "double_private",
  "single_private",
  "private_ensuite",
];
