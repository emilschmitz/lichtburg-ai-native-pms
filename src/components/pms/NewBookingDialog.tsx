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
import { ROOMS, BEDS, ROOM_CLASS_LABEL, TODAY } from "@/data/hostel";
import type { Booking } from "@/data/hostel/types";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";
import { roomForBed } from "@/lib/pms/availability";
import { addDaysISO, diffDays, formatShort } from "@/lib/pms/dates";
import {
  X,
  Plus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Leg {
  bedId: string;
  checkIn: string;
  checkOut: string;
}

export function NewBookingDialog() {
  const { newBookingOpen, newBookingPrefill, closeNewBooking, openBooking } = usePmsUi();
  const { bookings, checkConflicts, create } = useBookings();

  // Defaults — empty fields where reasonable, but dates default to a sensible range
  const defaultBed = newBookingPrefill?.bedId ?? BEDS[0]?.id ?? "";
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
  const [legs, setLegs] = useState<Leg[]>([
    { bedId: defaultBed, checkIn: defaultIn, checkOut: defaultOut },
  ]);

  // Re-seed when the dialog re-opens with a different prefill
  useEffect(() => {
    if (!newBookingOpen) return;
    setGuestName("");
    setGuestCountry("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestAddress("");
    setStatus("confirmed");
    setNotes("");
    setLegs([
      {
        bedId: newBookingPrefill?.bedId ?? BEDS[0]?.id ?? "",
        checkIn: newBookingPrefill?.checkIn ?? TODAY,
        checkOut:
          newBookingPrefill?.checkOut ??
          addDaysISO(newBookingPrefill?.checkIn ?? TODAY, 1),
      },
    ]);
  }, [newBookingOpen, newBookingPrefill]);

  // Compute conflicts per leg + overall
  const legAnalyses = useMemo(
    () =>
      legs.map((leg) => {
        const datesValid = leg.checkIn < leg.checkOut;
        const conf = datesValid
          ? checkConflicts(leg.bedId, leg.checkIn, leg.checkOut)
          : { ok: true, conflicts: [] };
        const nights = datesValid ? diffDays(leg.checkIn, leg.checkOut) : 0;
        return { leg, datesValid, conflicts: conf.conflicts, nights };
      }),
    [legs, checkConflicts, bookings],
  );

  // Validate that the legs together cover a continuous range with no gap
  // (it's OK to have just one leg). Sorted by checkIn.
  const sortedLegs = useMemo(
    () => [...legAnalyses].sort((a, z) => a.leg.checkIn.localeCompare(z.leg.checkIn)),
    [legAnalyses],
  );
  const continuityWarning = useMemo(() => {
    for (let i = 1; i < sortedLegs.length; i++) {
      if (sortedLegs[i].leg.checkIn !== sortedLegs[i - 1].leg.checkOut) {
        return `Leg ${i} ends ${sortedLegs[i - 1].leg.checkOut} but next leg starts ${sortedLegs[i].leg.checkIn} — there's a gap or overlap in the stay.`;
      }
    }
    return null;
  }, [sortedLegs]);

  const totalNights = legAnalyses.reduce((s, l) => s + l.nights, 0);
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

  if (!newBookingOpen) return null;

  function handleClose() {
    if (isDirty) {
      const ok = window.confirm(
        "Discard this new booking? All entered information will be lost.",
      );
      if (!ok) return;
    }
    closeNewBooking();
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        bedId: last?.bedId ?? BEDS[0].id,
        checkIn: last?.checkOut ?? TODAY,
        checkOut: addDaysISO(last?.checkOut ?? TODAY, 1),
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
    closeNewBooking();
    // Open the first leg so the operator can verify
    if (created[0]) openBooking(created[0].id);
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
          <section className="space-y-2">
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
                className="hairline px-2 py-1 text-[10px] uppercase tracking-wider hover:bg-secondary flex items-center gap-1"
                title="Extend the stay onto another bed for further nights"
              >
                <Plus className="h-3 w-3" /> Extend onto another bed
              </button>
            </div>

            {legs.length > 1 && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Multi-bed stays are saved as one guest with multiple legs. Legs
                must be back-to-back with no gap.
              </p>
            )}

            <ol className="space-y-2">
              {legAnalyses.map(({ leg, datesValid, conflicts, nights }, i) => {
                const room = roomForBed(ROOMS, BEDS, leg.bedId);
                return (
                  <li
                    key={i}
                    className="hairline bg-background p-2.5 space-y-2"
                  >
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
                        className="w-full hairline bg-card px-2 py-1.5 text-[12px]"
                      >
                        {ROOMS.map((r) => (
                          <optgroup key={r.id} label={`${r.number} · ${r.name}`}>
                            {BEDS.filter((b) => b.roomId === r.id).map((b) => (
                              <option key={b.id} value={b.id}>
                                {r.number} · {b.label} · €{r.pricePerNight}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Check-in">
                        <input
                          type="date"
                          value={leg.checkIn}
                          onChange={(e) => updateLeg(i, { checkIn: e.target.value })}
                          className="w-full hairline bg-card px-2 py-1.5 text-[12px] tabular"
                        />
                      </Field>
                      <Field label="Check-out">
                        <input
                          type="date"
                          value={leg.checkOut}
                          onChange={(e) => updateLeg(i, { checkOut: e.target.value })}
                          className="w-full hairline bg-card px-2 py-1.5 text-[12px] tabular"
                        />
                      </Field>
                    </div>

                    {!datesValid && (
                      <Inline color="destructive">
                        Check-out must be after check-in.
                      </Inline>
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
            Tip: need help finding a configuration?{" "}
            <Sparkles className="inline h-2.5 w-2.5" /> use the AI Assistant — it
            chains free beds for you when nothing single covers the stay.
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
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="hairline px-3 py-1.5 text-[12px] font-semibold bg-foreground text-background disabled:opacity-40"
            >
              Create booking
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function Inline({
  color,
  children,
}: {
  color: "destructive";
  children: React.ReactNode;
}) {
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
