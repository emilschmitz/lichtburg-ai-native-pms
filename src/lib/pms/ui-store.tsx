/**
 * UI store for the global booking detail drawer and the new-booking dialog.
 * Any view can call `openBooking(id)` or `openNewBooking({...prefill})`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface NewBookingPrefill {
  bedId?: string;
  checkIn?: string;
  checkOut?: string;
}

interface Ctx {
  selectedBookingId: string | null;
  openBooking(id: string): void;
  closeBooking(): void;
  newBookingOpen: boolean;
  newBookingPrefill: NewBookingPrefill | null;
  openNewBooking(prefill?: NewBookingPrefill): void;
  closeNewBooking(): void;
}

const PmsUiContext = createContext<Ctx | null>(null);

export function PmsUiProvider({ children }: { children: ReactNode }) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingPrefill, setNewBookingPrefill] =
    useState<NewBookingPrefill | null>(null);

  const openBooking = useCallback((id: string) => setSelectedBookingId(id), []);
  const closeBooking = useCallback(() => setSelectedBookingId(null), []);
  const openNewBooking = useCallback((prefill?: NewBookingPrefill) => {
    setNewBookingPrefill(prefill ?? null);
    setNewBookingOpen(true);
  }, []);
  const closeNewBooking = useCallback(() => {
    setNewBookingOpen(false);
    setNewBookingPrefill(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      selectedBookingId,
      openBooking,
      closeBooking,
      newBookingOpen,
      newBookingPrefill,
      openNewBooking,
      closeNewBooking,
    }),
    [selectedBookingId, openBooking, closeBooking, newBookingOpen, newBookingPrefill, openNewBooking, closeNewBooking],
  );

  return <PmsUiContext.Provider value={value}>{children}</PmsUiContext.Provider>;
}

export function usePmsUi(): Ctx {
  const ctx = useContext(PmsUiContext);
  if (!ctx) throw new Error("usePmsUi must be used within PmsUiProvider");
  return ctx;
}
