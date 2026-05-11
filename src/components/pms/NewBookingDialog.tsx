/**
 * NewBookingDialog — manual booking creation.
 *
 * Flow:
 *   1. Pick guest name + dates + initial bed (prefilled if user dragged on the
 *      timeline or clicked "+ New" from a bed row).
 *   2. If the chosen bed has a conflict somewhere in the requested range, we
 *      show the conflict and offer to "Extend stay onto another bed for the
 *      conflicting nights" — this creates a multi-leg (split) booking.
 *   3. Confirm. The booking(s) appear immediately on the timeline.
 *
 * UX guarantees:
 *   - User always sees what they're committing to (legs list).
 *   - Discarding via X / Esc warns if the form is dirty.
 *   - No silent overwrites: any conflict is surfaced.
 */

import { useEffect, useMemo, useState } from "react";
import { ROOMS, BEDS, DEMO_ROOMS, DEMO_BEDS, ROOM_CLASS_LABEL, TODAY } from "@/data/hostel";
import type { Booking } from "@/data/hostel/types";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";
import { isPrivateRoom, roomForBed } from "@/lib/pms/availability";
import { addDaysISO, diffDays, formatShort } from "@/lib/pms/dates";
import {
  X,
  Plus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Trash2,
  CreditCard,
  Key,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Leg {
  bedId: string;
  checkIn: string;
  checkOut: string;
}

export function NewBookingDialog() {
  const {
    newBookingOpen,
    newBookingPrefill,
    closeNewBooking,
    openBooking,
    updateTourState,
    tourState,
    advanceTourStep,
    tourCompleted,
    tourActive,
  } = usePmsUi();
  const { bookings, checkConflicts, create } = useBookings();

  // Demo rooms only exist during the tour
  const allRooms = useMemo(() => (tourActive ? [...ROOMS, ...DEMO_ROOMS] : ROOMS), [tourActive]);
  const allBeds = useMemo(() => (tourActive ? [...BEDS, ...DEMO_BEDS] : BEDS), [tourActive]);

  // Force HMR reload

  // Defaults — empty fields where reasonable, but dates default to a sensible range
  const defaultBed = newBookingPrefill?.bedId ?? allBeds[0]?.id ?? "";
  const defaultIn = newBookingPrefill?.checkIn ?? TODAY;
  const defaultOut =
    newBookingPrefill?.checkOut ?? addDaysISO(newBookingPrefill?.checkIn ?? TODAY, 1);

  const [guestName, setGuestName] = useState("");
  const [guestCountry, setGuestCountry] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [status, setStatus] = useState<Booking["status"]>("confirmed");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [legs, setLegs] = useState<Leg[]>([
    { bedId: defaultBed, checkIn: defaultIn, checkOut: defaultOut },
  ]);
  // For private rooms, default to "book the whole room" (all sibling beds
  // get auto-added as legs sharing the same dates as leg 1).
  const [wholeRoom, setWholeRoom] = useState<boolean>(true);

  // Re-seed when the dialog re-opens with a different prefill
  useEffect(() => {
    if (!newBookingOpen) return;
    const isDemo = newBookingPrefill?.bedId === "b-demo-1-a";
    setGuestName(isDemo ? "John Doe" : "");
    setGuestCountry(isDemo ? "US" : "");
    setGuestEmail(isDemo ? "john.doe@example.com" : "");
    setGuestPhone(isDemo ? "+1 555 123 4567" : "");
    setGuestAddress(isDemo ? "123 Main St, Anytown, US" : "");
    setStatus("confirmed");
    setNotes("");
    setWholeRoom(true);
    setIsSubmitted(false);
    setLegs([
      {
        bedId: newBookingPrefill?.bedId ?? allBeds[0]?.id ?? "",
        checkIn: newBookingPrefill?.checkIn ?? TODAY,
        checkOut: newBookingPrefill?.checkOut ?? addDaysISO(newBookingPrefill?.checkIn ?? TODAY, 1),
      },
    ]);
  }, [newBookingOpen, newBookingPrefill, allBeds]);

  // The first leg drives "whole room" detection. If it lives in a private
  // room with siblings AND the toggle is on, ensure all sibling beds are
  // present as legs with matching dates. If the toggle is off, prune them.
  const leg1 = legs[0];
  const leg1Room = leg1 ? roomForBed(allRooms, allBeds, leg1.bedId) : undefined;
  const leg1IsPrivate = isPrivateRoom(leg1Room);
  const siblingBedIds = useMemo(
    () =>
      leg1Room
        ? allBeds.filter((b) => b.roomId === leg1Room.id && b.id !== leg1.bedId).map((b) => b.id)
        : [],
    [leg1Room, leg1?.bedId, allBeds],
  );
  const hasSiblings = siblingBedIds.length > 0;

  useEffect(() => {
    if (!leg1 || !leg1IsPrivate || !hasSiblings) return;
    setLegs((cur) => {
      // Always keep leg 1 untouched. Manage only sibling-bed legs that match
      // leg 1 dates — those are considered "whole-room auto-legs".
      const others = cur
        .slice(1)
        .filter(
          (l) =>
            !siblingBedIds.includes(l.bedId) ||
            l.checkIn !== leg1.checkIn ||
            l.checkOut !== leg1.checkOut,
        );
      if (wholeRoom) {
        const autoLegs = siblingBedIds.map((bedId) => ({
          bedId,
          checkIn: leg1.checkIn,
          checkOut: leg1.checkOut,
        }));
        return [cur[0], ...autoLegs, ...others];
      }
      return [cur[0], ...others];
    });
    // Re-run when bed/dates of leg 1 or toggle changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    leg1?.bedId,
    leg1?.checkIn,
    leg1?.checkOut,
    leg1IsPrivate,
    hasSiblings,
    wholeRoom,
    siblingBedIds.join(","),
  ]);

  // Compute conflicts per leg + overall
  const legAnalyses = useMemo(
    () =>
      legs.map((leg) => {
        const datesValid = leg.checkIn < leg.checkOut;
        const conf =
          datesValid && !isSubmitted
            ? checkConflicts(leg.bedId, leg.checkIn, leg.checkOut)
            : { ok: true, conflicts: [] };
        const nights = datesValid ? diffDays(leg.checkIn, leg.checkOut) : 0;
        return { leg, datesValid, conflicts: conf.conflicts, nights };
      }),
    [legs, checkConflicts, bookings, isSubmitted],
  );

  // Validate that the legs together cover a continuous range with no gap
  // (it's OK to have just one leg). Sorted by checkIn.
  const sortedLegs = useMemo(
    () => [...legAnalyses].sort((a, z) => a.leg.checkIn.localeCompare(z.leg.checkIn)),
    [legAnalyses],
  );
  const continuityWarning = useMemo(() => {
    // The legs together must cover ONE contiguous date range. Parallel legs
    // on different beds (same dates) are allowed — that's a whole-room stay.
    // We merge overlapping ranges; if the result is a single interval, OK.
    const ranges = sortedLegs
      .filter((l) => l.datesValid)
      .map((l) => ({ from: l.leg.checkIn, to: l.leg.checkOut }))
      .sort((a, z) => a.from.localeCompare(z.from));
    if (ranges.length <= 1) return null;
    const merged: { from: string; to: string }[] = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      if (ranges[i].from <= last.to) {
        if (ranges[i].to > last.to) last.to = ranges[i].to;
      } else {
        merged.push(ranges[i]);
      }
    }
    if (merged.length > 1) {
      return `Stay isn't continuous: there's a gap between ${merged[0].to} and ${merged[1].from}.`;
    }
    return null;
  }, [sortedLegs]);

  // Real "stay length" is the span of the merged range (parallel legs don't
  // multiply nights). Per-leg "bed-nights" still drive pricing.
  const totalNights = useMemo(() => {
    const valid = legAnalyses.filter((l) => l.datesValid);
    if (valid.length === 0) return 0;
    const minIn = valid.reduce(
      (m, l) => (l.leg.checkIn < m ? l.leg.checkIn : m),
      valid[0].leg.checkIn,
    );
    const maxOut = valid.reduce(
      (m, l) => (l.leg.checkOut > m ? l.leg.checkOut : m),
      valid[0].leg.checkOut,
    );
    return diffDays(minIn, maxOut);
  }, [legAnalyses]);
  const hasAnyConflict = legAnalyses.some((l) => l.conflicts.length > 0);
  const allDatesValid = legAnalyses.every((l) => l.datesValid);
  const canSubmit =
    guestName.trim().length > 0 &&
    legs.length > 0 &&
    allDatesValid &&
    !hasAnyConflict &&
    !continuityWarning;

  const isDirty =
    guestName.length > 0 ||
    guestCountry.length > 0 ||
    guestEmail.length > 0 ||
    guestPhone.length > 0 ||
    guestAddress.length > 0 ||
    notes.length > 0 ||
    legs.length > 1;

  useEffect(() => {
    if (!newBookingOpen) return;
    const isDemo = newBookingPrefill?.bedId === "b-demo-1-a";
    if (isDemo && legs.length > 0) {
      const firstLeg = legs[0];
      const checkOutValid = diffDays(firstLeg.checkIn, firstLeg.checkOut) <= 3;
      const hasSecondLeg = legs.length > 1;
      let secondLegCheckOutValid = false;
      let secondLegBedValid = false;
      if (hasSecondLeg) {
        const secondLeg = legs[1];
        secondLegBedValid = secondLeg.bedId === "b-demo-2-a";
        secondLegCheckOutValid = diffDays(secondLeg.checkIn, secondLeg.checkOut) === 1;
      }

      updateTourState({
        checkOutValid,
        hasSecondLeg,
        secondLegBedValid,
        secondLegCheckOutValid,
        statusCheckedIn: status === "checked_in",
      });
    }
  }, [legs, status, newBookingOpen, newBookingPrefill?.bedId, updateTourState]);

  if (!newBookingOpen) return null;

  function handleClose() {
    closeNewBooking();
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    const isDemo = newBookingPrefill?.bedId === "b-demo-1-a";
    setLegs([
      ...legs,
      {
        bedId: last?.bedId ?? allBeds[0].id,
        checkIn: last?.checkOut ?? TODAY,
        checkOut: isDemo ? "" : addDaysISO(last?.checkOut ?? TODAY, 1),
      },
    ]);
  }

  function removeLeg(idx: number) {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx));
  }

  function updateLeg(idx: number, patch: Partial<Leg>) {
    setLegs(legs.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const created = create({
      guestName: guestName.trim(),
      guestCountry: guestCountry.trim() || "—",
      guestEmail: guestEmail.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
      guestAddress: guestAddress.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      legs,
    });

    const isDemo = newBookingPrefill?.bedId === "b-demo-1-a";

    if (!isDemo) {
      closeNewBooking();
      if (created[0]) {
        openBooking(created[0].id);
      }
    } else {
      setIsSubmitted(true);
      updateTourState({ bookingSaved: true });
    }
    // For demo: we don't close immediately to prevent Joyride from losing its target.
    // PmsShell's handleTourCallback will close it when the tour advances.
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/30 animate-in fade-in"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-label="New booking"
        className="fixed top-0 right-0 bottom-0 z-50 w-[480px] max-w-full bg-card hairline-l flex flex-col animate-in slide-in-from-right duration-200"
      >
        <header className="hairline-b px-4 py-3 flex items-center gap-3 shrink-0">
          <Plus className="h-4 w-4" />
          <h2 className="text-[14px] font-semibold tracking-tight">New booking</h2>
          <button
            onClick={handleClose}
            className="ml-auto hairline p-1.5 hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Guest info */}
          <section className="space-y-2 tour-guest-section">
            <SectionTitle>Guest</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Field label="Name *">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
                    placeholder=""
                    autoFocus
                  />
                </Field>
              </div>
              <Field label="Country">
                <input
                  value={guestCountry}
                  onChange={(e) => setGuestCountry(e.target.value)}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular uppercase"
                  maxLength={3}
                  placeholder=""
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Phone">
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Booking["status"])}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
                >
                  <option value="tentative">tentative</option>
                  <option value="confirmed">confirmed</option>
                  <option value="checked_in">checked in</option>
                </select>
              </Field>
            </div>
            <Field label="Address">
              <textarea
                value={guestAddress}
                onChange={(e) => setGuestAddress(e.target.value)}
                rows={2}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] resize-y"
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] resize-y"
              />
            </Field>
          </section>

          {/* Legs */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <SectionTitle>
                Stay {legs.length > 1 ? `(split across ${legs.length} beds)` : "(single bed)"}
              </SectionTitle>
              <button
                onClick={addLeg}
                className="hairline px-2 py-1 text-[10px] uppercase tracking-wider hover:bg-secondary flex items-center gap-1 tour-add-leg-btn"
                title="Extend the stay onto another bed for further nights"
              >
                <Plus className="h-3 w-3" /> Extend onto another bed
              </button>
            </div>

            {leg1IsPrivate && hasSiblings && (
              <label className="flex items-start gap-2 hairline bg-secondary/40 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeRoom}
                  onChange={(e) => setWholeRoom(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[11px] leading-snug">
                  <strong>Book the whole room</strong> — private rooms are normally sold as a unit.
                  With this on, all {siblingBedIds.length + 1} beds in {leg1Room?.number}{" "}
                  {leg1Room?.name} are reserved for this guest. Uncheck only if you really intend to
                  leave the other bed{siblingBedIds.length > 1 ? "s" : ""} bookable to a stranger
                  (unusual).
                </span>
              </label>
            )}

            {legs.length > 1 && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Multi-bed stays are saved as one guest with multiple legs. Legs must be back-to-back
                with no gap.
              </p>
            )}

            <ol className="space-y-2">
              {legAnalyses.map(({ leg, datesValid, conflicts, nights }, i) => {
                const room = roomForBed(allRooms, allBeds, leg.bedId);
                return (
                  <li key={i} className="hairline bg-background p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="hairline bg-foreground text-background text-[10px] font-bold w-5 h-5 flex items-center justify-center font-mono">
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular">
                        Leg {i + 1}
                        {nights > 0 && ` · ${nights}n`}
                      </span>
                      {legs.length > 1 && (
                        <button
                          onClick={() => removeLeg(i)}
                          className="ml-auto hairline p-1 hover:bg-destructive/10 text-destructive"
                          aria-label={`Remove leg ${i + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <Field label="Bed">
                      <select
                        value={leg.bedId}
                        onChange={(e) => updateLeg(i, { bedId: e.target.value })}
                        className={`w-full hairline bg-card px-2 py-1.5 text-[12px] ${i === 1 ? "tour-second-leg-bed" : ""}`}
                      >
                        {allRooms
                          .filter((r) => !tourCompleted || !r.id.startsWith("r-demo-"))
                          .map((r) => (
                            <optgroup key={r.id} label={`${r.number} · ${r.name}`}>
                              {allBeds.filter((b) => b.roomId === r.id && (!tourCompleted || !b.id.startsWith("b-demo-"))).map((b) => (
                                <option key={b.id} value={b.id}>
                                  {r.number} · {b.label} · €{r.pricePerNight}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                      </select>
                    </Field>

                    <div
                      className={`grid grid-cols-2 gap-2 ${i === 0 ? "tour-dates-section" : "tour-second-leg-dates"}`}
                    >
                      <Field label="Check-in">
                        <input
                          type="date"
                          lang="de-DE"
                          value={leg.checkIn}
                          onChange={(e) => updateLeg(i, { checkIn: e.target.value })}
                          className="w-full hairline bg-card px-2 py-1.5 text-[12px] tabular"
                        />
                      </Field>
                      <Field label="Check-out">
                        <input
                          type="date"
                          lang="de-DE"
                          value={leg.checkOut}
                          onChange={(e) => updateLeg(i, { checkOut: e.target.value })}
                          className="w-full hairline bg-card px-2 py-1.5 text-[12px] tabular"
                        />
                      </Field>
                    </div>

                    {!datesValid && (
                      <Inline color="destructive">Check-out must be after check-in.</Inline>
                    )}
                    {datesValid && conflicts.length > 0 && (
                      <Inline color="destructive">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div>
                          <strong>Bed conflict:</strong>{" "}
                          {conflicts
                            .map((c) => `${c.guestName} (${c.checkIn} → ${c.checkOut})`)
                            .join(", ")}
                          .{" "}
                          <button
                            onClick={addLeg}
                            className="underline font-medium hover:no-underline"
                          >
                            Extend onto another bed
                          </button>{" "}
                          to cover the conflicting nights.
                        </div>
                      </Inline>
                    )}
                    {room && (
                      <div className="text-[10px] text-muted-foreground tabular">
                        {ROOM_CLASS_LABEL[room.class]} · €{room.pricePerNight} ·
                        {nights > 0 && ` €${nights * room.pricePerNight} for this leg`}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {continuityWarning && (
              <Inline color="destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {continuityWarning}
              </Inline>
            )}
          </section>

          {/* Payment & Keys (Mock UI for Tour) */}
          <section className="space-y-4 pt-4 border-t border-[var(--color-hairline)]">
            <div className="flex flex-col gap-2">
              <SectionTitle>Payment</SectionTitle>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Clicking these would usually activate the physical card reader, but we'll simulate
                it for now.
              </div>
              <div className="flex flex-wrap gap-2 tour-payment-btn">
                <button
                  className={cn(
                    "hairline px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors",
                    tourState.paymentDone
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-secondary",
                  )}
                  onClick={() => updateTourState({ paymentDone: true })}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Credit Card
                </button>
                <button
                  className={cn(
                    "hairline px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors",
                    "bg-card hover:bg-secondary",
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" /> EC Card
                </button>l
                <button
                  className={cn(
                    "hairline px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors",
                    "bg-card hover:bg-secondary",
                  )}
                >
                  Cash
                </button>
                {tourState.paymentDone && (
                  <span className="text-[11px] text-green-500 font-bold ml-2 self-center flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-hairline)]">
              <SectionTitle>Keycards</SectionTitle>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Hold physical keycards against the encoder and click:
              </div>
              <button
                className={cn(
                  "tour-keycard-btn w-fit hairline px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors",
                  tourState.keysDone
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-secondary",
                )}
                onClick={() => updateTourState({ keysDone: true })}
              >
                <Key className="w-3.5 h-3.5" /> Encode Keycards
              </button>
            </div>
          </section>

          <section className="hairline bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Summary
            </div>
            <div className="text-[12px] tabular mt-1">
              {legs.length > 1
                ? `${legs.length} legs · ${totalNights} nights total`
                : `${totalNights} nights`}
              {sortedLegs.length > 0 && totalNights > 0 && (
                <>
                  {" "}
                  · {formatShort(sortedLegs[0].leg.checkIn)}
                  <ArrowRight className="inline h-3 w-3 mx-1.5 align-middle" />
                  {formatShort(sortedLegs[sortedLegs.length - 1].leg.checkOut)}
                </>
              )}
            </div>
          </section>

          <p className="text-[10px] text-muted-foreground italic">
            Tip: need help finding a configuration? <Sparkles className="inline h-2.5 w-2.5" /> use
            the AI Assistant — it chains free beds for you when nothing single covers the stay.
          </p>
        </div>

        <footer className="hairline-t p-3 bg-card flex items-center gap-2 shrink-0">
          <button
            onClick={handleClose}
            className="hairline px-3 py-1.5 text-[12px] hover:bg-secondary"
          >
            Discard
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              disabled={!canSubmit || isSubmitted}
              onClick={handleSubmit}
              className="hairline px-3 py-1.5 text-[12px] font-semibold bg-foreground text-background disabled:opacity-40 tour-save-btn flex items-center gap-1.5"
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Inline({ color, children }: { color: "destructive"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "hairline text-[11px] px-2 py-1.5 flex items-start gap-1.5 leading-snug",
        color === "destructive" && "bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </div>
  );
}
