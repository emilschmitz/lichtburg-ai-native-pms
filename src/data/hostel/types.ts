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

/** A booking always occupies a specific bed for a date range [checkIn, checkOut). */
export interface Booking {
  id: string;
  guestName: string;
  guestCountry: string;
  bedId: string;
  /** ISO date YYYY-MM-DD, inclusive. */
  checkIn: string;
  /** ISO date YYYY-MM-DD, exclusive (departure morning). */
  checkOut: string;
  status: "confirmed" | "tentative" | "checked_in" | "checked_out";
  notes?: string;
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
