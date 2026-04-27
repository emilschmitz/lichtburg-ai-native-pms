/**
 * Mutable in-memory bookings store. Initial state seeded from the static
 * mock data; all create/update/delete go through here so the timeline,
 * floor plan, today list, and AI assistant all stay in sync.
 *
 * Persistence: in-memory only for now — refresh resets to seed. (Easy to
 * swap to localStorage or Lovable Cloud later without touching consumers.)
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Booking } from "@/data/hostel/types";
import { BOOKINGS as SEED } from "@/data/hostel";

export interface NewBookingInput {
  guestName: string;
  guestCountry?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
  status?: Booking["status"];
  notes?: string;
  /** One or more legs. Multiple legs = split stay across beds (groupId is auto). */
  legs: Array<{ bedId: string; checkIn: string; checkOut: string }>;
}

interface ConflictResult {
  ok: boolean;
  conflicts: Booking[];
}

interface Ctx {
  bookings: Booking[];
  /** Look up a single booking by id. */
  get(id: string): Booking | undefined;
  /** All legs sharing a groupId, sorted by checkIn. If no group, just the row. */
  legsOf(booking: Booking): Booking[];
  /** Returns conflicting bookings on the bed for the given range. */
  checkConflicts(
    bedId: string,
    checkIn: string,
    checkOut: string,
    ignoreIds?: string[],
  ): ConflictResult;
  create(input: NewBookingInput): Booking[];
  /** Update guest fields and notes (not bed/dates — use moveLeg). */
  updateGuest(
    bookingId: string,
    patch: Partial<
      Pick<
        Booking,
        | "guestName"
        | "guestCountry"
        | "guestEmail"
        | "guestPhone"
        | "guestAddress"
        | "status"
        | "notes"
      >
    >,
  ): void;
  /** Move a single leg to a new bed/date range. Throws on conflict. */
  moveLeg(
    bookingId: string,
    next: { bedId?: string; checkIn?: string; checkOut?: string },
  ): void;
  /** Remove the entire stay (all legs in the same group). */
  remove(bookingId: string): void;
}

const BookingsContext = createContext<Ctx | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(SEED);

  const get = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );

  const legsOf = useCallback(
    (b: Booking) => {
      if (!b.groupId) return [b];
      return bookings
        .filter((x) => x.groupId === b.groupId)
        .sort((a, z) => a.checkIn.localeCompare(z.checkIn));
    },
    [bookings],
  );

  const checkConflicts = useCallback<Ctx["checkConflicts"]>(
    (bedId, checkIn, checkOut, ignoreIds = []) => {
      const conflicts = bookings.filter(
        (b) =>
          b.bedId === bedId &&
          !ignoreIds.includes(b.id) &&
          b.checkIn < checkOut &&
          b.checkOut > checkIn,
      );
      return { ok: conflicts.length === 0, conflicts };
    },
    [bookings],
  );

  const create = useCallback<Ctx["create"]>((input) => {
    const groupId =
      input.legs.length > 1 ? `grp-${Date.now().toString(36)}` : undefined;
    const created: Booking[] = input.legs.map((leg, i) => ({
      id: `bk-${Date.now().toString(36)}-${i}`,
      groupId,
      guestName: input.guestName,
      guestCountry: input.guestCountry ?? "—",
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestAddress: input.guestAddress,
      bedId: leg.bedId,
      checkIn: leg.checkIn,
      checkOut: leg.checkOut,
      status: input.status ?? "confirmed",
      notes: input.notes,
    }));
    setBookings((cur) => [...cur, ...created]);
    return created;
  }, []);

  const updateGuest = useCallback<Ctx["updateGuest"]>((bookingId, patch) => {
    setBookings((cur) => {
      const target = cur.find((b) => b.id === bookingId);
      if (!target) return cur;
      // If part of a group, sync guest fields across all legs
      const ids = target.groupId
        ? cur.filter((x) => x.groupId === target.groupId).map((x) => x.id)
        : [bookingId];
      return cur.map((b) => (ids.includes(b.id) ? { ...b, ...patch } : b));
    });
  }, []);

  const moveLeg = useCallback<Ctx["moveLeg"]>((bookingId, next) => {
    setBookings((cur) => {
      const target = cur.find((b) => b.id === bookingId);
      if (!target) return cur;
      const newBed = next.bedId ?? target.bedId;
      const newIn = next.checkIn ?? target.checkIn;
      const newOut = next.checkOut ?? target.checkOut;
      // conflict check
      const conflicts = cur.filter(
        (b) =>
          b.id !== bookingId &&
          b.bedId === newBed &&
          b.checkIn < newOut &&
          b.checkOut > newIn,
      );
      if (conflicts.length > 0) {
        throw new Error(
          `Cannot move: conflicts with ${conflicts.map((c) => c.guestName).join(", ")}`,
        );
      }
      return cur.map((b) =>
        b.id === bookingId
          ? { ...b, bedId: newBed, checkIn: newIn, checkOut: newOut }
          : b,
      );
    });
  }, []);

  const remove = useCallback<Ctx["remove"]>((bookingId) => {
    setBookings((cur) => {
      const target = cur.find((b) => b.id === bookingId);
      if (!target) return cur;
      const ids = target.groupId
        ? cur.filter((x) => x.groupId === target.groupId).map((x) => x.id)
        : [bookingId];
      return cur.filter((b) => !ids.includes(b.id));
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ bookings, get, legsOf, checkConflicts, create, updateGuest, moveLeg, remove }),
    [bookings, get, legsOf, checkConflicts, create, updateGuest, moveLeg, remove],
  );

  return (
    <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
  );
}

export function useBookings(): Ctx {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}
