/**
 * Mutable in-memory bookings store. Initial state seeded from the static
 * mock data; all create/update/delete go through here so the timeline,
 * floor plan, today list, and AI assistant all stay in sync.
 *
 * Persistence: in-memory only for demo — refresh resets to seed.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Booking } from "@/data/hostel/types";
import { BOOKINGS as SEED, DEMO_BOOKINGS, ROOMS, BEDS } from "@/data/hostel";
import { isPrivateRoom } from "./availability";
import { usePmsUi } from "./ui-store";

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
  moveLeg(bookingId: string, next: { bedId?: string; checkIn?: string; checkOut?: string }): void;
  /** Remove the entire stay (all legs in the same group). */
  remove(bookingId: string): void;
}

const BookingsContext = createContext<Ctx | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { tourActive } = usePmsUi();
  const [bookings, setBookings] = useState<Booking[]>(SEED);

  // Inject/remove demo bookings whenever tourActive changes
  useEffect(() => {
    setBookings((cur) => {
      // Strip any existing demo bookings first.
      // We strip by ID (seed data) AND by bedId (bookings created during the tour).
      const clean = cur.filter((b) => !b.id.startsWith("bk-demo-") && !b.bedId.startsWith("b-demo-"));
      if (tourActive) {
        return [...clean, ...DEMO_BOOKINGS];
      }
      return clean;
    });
  }, [tourActive]);

  const get = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);

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
      // Direct bed-level conflicts
      const direct = bookings.filter(
        (b) =>
          b.bedId === bedId &&
          !ignoreIds.includes(b.id) &&
          b.checkIn < checkOut &&
          b.checkOut > checkIn,
      );
      // Whole-room block: if this bed is in a private room, also surface
      // any sibling-bed bookings overlapping the range as conflicts.
      const bed = BEDS.find((x) => x.id === bedId);
      const room = bed ? ROOMS.find((r) => r.id === bed.roomId) : undefined;
      let sibling: Booking[] = [];
      if (room && isPrivateRoom(room)) {
        const siblingBedIds = BEDS.filter((b) => b.roomId === room.id && b.id !== bedId).map(
          (b) => b.id,
        );
        sibling = bookings.filter(
          (b) =>
            siblingBedIds.includes(b.bedId) &&
            !ignoreIds.includes(b.id) &&
            b.checkIn < checkOut &&
            b.checkOut > checkIn,
        );
      }
      const conflicts = [...direct, ...sibling];
      return { ok: conflicts.length === 0, conflicts };
    },
    [bookings],
  );

  const create = useCallback<Ctx["create"]>((input) => {
    const groupId = input.legs.length > 1 ? `grp-${Date.now().toString(36)}` : undefined;
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
        (b) => b.id !== bookingId && b.bedId === newBed && b.checkIn < newOut && b.checkOut > newIn,
      );
      if (conflicts.length > 0) {
        throw new Error(
          `Cannot move: conflicts with ${conflicts.map((c) => c.guestName).join(", ")}`,
        );
      }
      return cur.map((b) =>
        b.id === bookingId ? { ...b, bedId: newBed, checkIn: newIn, checkOut: newOut } : b,
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

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings(): Ctx {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}
