/**
 * UI store for the global booking detail drawer and the new-booking dialog.
 * Any view can call `openBooking(id)` or `openNewBooking({...prefill})`.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface NewBookingPrefill {
  bedId?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface TourState {
  checkOutValid: boolean;
  hasSecondLeg: boolean;
  secondLegBedValid: boolean;
  secondLegCheckOutValid: boolean;
  paymentDone: boolean;
  keysDone: boolean;
  statusCheckedIn: boolean;
  bookingSaved: boolean;
}

export type ExperienceLevel = "new" | "other" | "lichtburg pms" | null;

export const IS_TOUR_ENABLED = import.meta.env.VITE_ACTIVATE_TOUR === "true";

interface Ctx {
  selectedBookingId: string | null;
  openBooking(id: string): void;
  closeBooking(): void;
  newBookingOpen: boolean;
  newBookingPrefill: NewBookingPrefill | null;
  openNewBooking(prefill?: NewBookingPrefill): void;
  closeNewBooking(): void;
  tourState: TourState;
  updateTourState: (update: Partial<TourState>) => void;
  /** Called by NewBookingDialog when the demo booking is saved — advances the controlled Joyride step */
  advanceTourStep: () => void;
  resetTourStepIndex: () => void;
  /** True once the Quick Tour has been finished */
  tourCompleted: boolean;
  setTourCompleted: (v: boolean) => void;
  /** True while the tour is actively running (Joyride is open) */
  tourActive: boolean;
  setTourActive: (v: boolean) => void;
  /** Internal Joyride run state */
  tourRun: boolean;
  setTourRun: (v: boolean) => void;
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (v: ExperienceLevel) => void;
  nudgeDismissed: boolean;
  setNudgeDismissed: (v: boolean) => void;
  tourNudgeDismissed: boolean;
  setTourNudgeDismissed: (v: boolean) => void;
  isTourEnabled: boolean;
}

const PmsUiContext = createContext<Ctx | null>(null);

export function PmsUiProvider({ children }: { children: ReactNode }) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingPrefill, setNewBookingPrefill] = useState<NewBookingPrefill | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(null);
  const [tourState, setTourState] = useState<TourState>({
    checkOutValid: false,
    hasSecondLeg: false,
    secondLegBedValid: false,
    secondLegCheckOutValid: false,
    paymentDone: false,
    keysDone: false,
    statusCheckedIn: false,
    bookingSaved: false,
  });
  const advanceTourStep = useCallback(() => { }, []); // Dummy for now as it's not used to drive Joyride
  const resetTourStepIndex = useCallback(() => { }, []); // Dummy
  const [tourCompleted, setTourCompleted] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [tourNudgeDismissed, setTourNudgeDismissed] = useState(false);

  const updateTourState = useCallback((update: Partial<TourState>) => {
    setTourState((prev) => ({ ...prev, ...update }));
  }, []);

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
      tourState,
      updateTourState,
      advanceTourStep,
      resetTourStepIndex,
      tourCompleted,
      setTourCompleted,
      tourActive,
      setTourActive,
      tourRun,
      setTourRun,
      experienceLevel,
      setExperienceLevel,
      nudgeDismissed,
      setNudgeDismissed,
      tourNudgeDismissed,
      setTourNudgeDismissed,
      isTourEnabled: IS_TOUR_ENABLED,
    }),
    [
      selectedBookingId,
      openBooking,
      closeBooking,
      newBookingOpen,
      newBookingPrefill,
      openNewBooking,
      closeNewBooking,
      tourState,
      updateTourState,
      advanceTourStep,
      resetTourStepIndex,
      tourCompleted,
      tourActive,
      tourRun,
      experienceLevel,
      nudgeDismissed,
      tourNudgeDismissed,
    ],
  );

  return <PmsUiContext.Provider value={value}>{children}</PmsUiContext.Provider>;
}

export function usePmsUi(): Ctx {
  const ctx = useContext(PmsUiContext);
  if (!ctx) throw new Error("usePmsUi must be used within PmsUiProvider");
  return ctx;
}
