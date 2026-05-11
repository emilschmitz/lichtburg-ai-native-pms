/**
 * BookingDrawer — slides in from the right when an existing booking is selected.
 *
 * Lets the operator:
 *   - View guest info (name, country, email, phone, address, status, notes)
 *   - Edit guest fields and status
 *   - Move the leg (change bed and/or dates) — guarded by conflict check
 *   - Delete the entire stay (warns if multi-leg group)
 *
 * Uses the BookingsContext for mutations. All buttons make their consequence
 * obvious ("Discard changes", "Delete entire stay", etc.).
 */

import { useEffect, useMemo, useState } from "react";
import { ROOMS, BEDS, DEMO_ROOMS, DEMO_BEDS, ROOM_CLASS_LABEL } from "@/data/hostel";
import type { Booking } from "@/data/hostel/types";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";
import { roomForBed } from "@/lib/pms/availability";
import { diffDays, formatShort } from "@/lib/pms/dates";
import {
  X,
  Save,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Bed as BedIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: Booking["status"][] = ["tentative", "confirmed", "checked_in", "checked_out"];

export function BookingDrawer() {
  const { selectedBookingId, closeBooking, updateTourState, tourState, tourActive } = usePmsUi();
  const { get, legsOf, updateGuest, moveLeg, remove, checkConflicts } = useBookings();
  const booking = selectedBookingId ? get(selectedBookingId) : null;

  // Demo rooms only exist during the tour
  const allRooms = useMemo(() => (tourActive ? [...ROOMS, ...DEMO_ROOMS] : ROOMS), [tourActive]);
  const allBeds = useMemo(() => (tourActive ? [...BEDS, ...DEMO_BEDS] : BEDS), [tourActive]);

  // ---- Local edit state ----
  const [draft, setDraft] = useState<{
    guestName: string;
    guestCountry: string;
    guestEmail: string;
    guestPhone: string;
    guestAddress: string;
    status: Booking["status"];
    notes: string;
    bedId: string;
    checkIn: string;
    checkOut: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset draft whenever a new booking is selected
  useEffect(() => {
    if (!booking) {
      setDraft(null);
      setConfirmDelete(false);
      setError(null);
      return;
    }
    setDraft({
      guestName: booking.guestName,
      guestCountry: booking.guestCountry,
      guestEmail: booking.guestEmail ?? "",
      guestPhone: booking.guestPhone ?? "",
      guestAddress: booking.guestAddress ?? "",
      status: booking.status,
      notes: booking.notes ?? "",
      bedId: booking.bedId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    });
    setConfirmDelete(false);
    setError(null);
  }, [booking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const allLegs = useMemo(() => (booking ? legsOf(booking) : []), [booking, legsOf]);
  const isSplit = allLegs.length > 1;

  if (!booking || !draft) return null;

  const room = roomForBed(allRooms, allBeds, draft.bedId);
  const bed = allBeds.find((b) => b.id === draft.bedId);

  const dirtyGuest =
    draft.guestName !== booking.guestName ||
    draft.guestCountry !== booking.guestCountry ||
    draft.guestEmail !== (booking.guestEmail ?? "") ||
    draft.guestPhone !== (booking.guestPhone ?? "") ||
    draft.guestAddress !== (booking.guestAddress ?? "") ||
    draft.status !== booking.status ||
    draft.notes !== (booking.notes ?? "");
  const dirtyLeg =
    draft.bedId !== booking.bedId ||
    draft.checkIn !== booking.checkIn ||
    draft.checkOut !== booking.checkOut;
  const dirty = dirtyGuest || dirtyLeg;

  // Validate proposed leg
  const datesValid = draft.checkIn < draft.checkOut;
  const conflictCheck = datesValid
    ? checkConflicts(draft.bedId, draft.checkIn, draft.checkOut, [booking.id])
    : { ok: true, conflicts: [] };

  function handleSave() {
    if (!booking || !draft) return;
    setError(null);
    try {
      if (dirtyLeg) {
        if (!datesValid) throw new Error("Check-out must be after check-in.");
        moveLeg(booking.id, {
          bedId: draft.bedId,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
        });
      }
      if (dirtyGuest) {
        updateGuest(booking.id, {
          guestName: draft.guestName,
          guestCountry: draft.guestCountry,
          guestEmail: draft.guestEmail || undefined,
          guestPhone: draft.guestPhone || undefined,
          guestAddress: draft.guestAddress || undefined,
          status: draft.status,
          notes: draft.notes || undefined,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDelete() {
    if (!booking) return;
    remove(booking.id);
    closeBooking();
  }

  function handleClose() {
    if (dirty) {
      const ok = window.confirm(
        "Discard unsaved changes to this booking? Your edits will be lost.",
      );
      if (!ok) return;
    }
    closeBooking();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/30 animate-in fade-in"
        onClick={handleClose}
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Booking details"
        className="fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-full bg-card hairline-l flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <header className="hairline-b px-4 py-3 flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Booking · {booking.id}
              {isSplit && (
                <span className="ml-2 hairline px-1 py-0.5 bg-accent text-accent-foreground">
                  split stay · leg {allLegs.findIndex((l) => l.id === booking.id) + 1}/
                  {allLegs.length}
                </span>
              )}
            </div>
            <h2 className="text-[15px] font-semibold leading-tight mt-0.5 truncate">
              {booking.guestName}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="hairline p-1.5 hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Stay summary */}
          <section className="hairline bg-background p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              This leg
            </div>
            <div className="flex items-center gap-2 text-[12px] tabular">
              <BedIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono font-semibold">{room?.number}</span>
              <span>{room?.name}</span>
              <span className="text-muted-foreground">· {bed?.label}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {room && ROOM_CLASS_LABEL[room.class]} · €{room?.pricePerNight}/night
            </div>
            <div className="text-[12px] tabular">
              {formatShort(draft.checkIn)}
              <ArrowRight className="inline h-3 w-3 mx-1.5 align-middle" />
              {formatShort(draft.checkOut)}
              <span className="text-muted-foreground ml-2">
                · {diffDays(draft.checkIn, draft.checkOut)} nights
              </span>
            </div>

            {isSplit && (
              <div className="mt-2 pt-2 hairline-t space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  All legs of this stay
                </div>
                {allLegs.map((leg, i) => {
                  const lr = roomForBed(allRooms, allBeds, leg.bedId);
                  const lb = allBeds.find((b) => b.id === leg.bedId);
                  const isActive = leg.id === booking.id;

                  return (
                    <div
                      key={leg.id}
                      className={cn(
                        "flex items-center gap-2 text-[11px] tabular px-1.5 py-1 hairline",
                        isActive ? "bg-primary text-primary-foreground" : "bg-card",
                      )}
                    >
                      <span className="font-mono font-semibold w-5">{i + 1}.</span>
                      <span className="font-mono">{lr?.number}</span>
                      <span className="truncate flex-1">{lb?.label}</span>
                      <span>
                        {leg.checkIn} <ArrowRight className="inline h-2.5 w-2.5" /> {leg.checkOut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Edit leg */}
          <section className="space-y-2">
            <SectionTitle>Move or extend this leg</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Check-in">
                <input
                  type="date"
                  value={draft.checkIn}
                  onChange={(e) => setDraft({ ...draft, checkIn: e.target.value })}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
                />
              </Field>
              <Field label="Check-out">
                <input
                  type="date"
                  value={draft.checkOut}
                  onChange={(e) => setDraft({ ...draft, checkOut: e.target.value })}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
                />
              </Field>
            </div>
            <Field label="Bed">
              <select
                value={draft.bedId}
                onChange={(e) => setDraft({ ...draft, bedId: e.target.value })}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
              >
                {allRooms.map((r) => (
                  <optgroup key={r.id} label={`${r.number} · ${r.name}`}>
                    {allBeds
                      .filter((b) => b.roomId === r.id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {r.number} · {b.label}
                        </option>
                      ))}
                  </optgroup>
                ))}

              </select>
            </Field>

            {dirtyLeg && !conflictCheck.ok && (
              <div className="hairline bg-destructive/10 text-destructive text-[11px] px-2 py-1.5 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  This bed is already booked in that range:{" "}
                  {conflictCheck.conflicts
                    .map((c) => `${c.guestName} (${c.checkIn} → ${c.checkOut})`)
                    .join(", ")}
                </div>
              </div>
            )}
            {dirtyLeg && !datesValid && (
              <div className="hairline bg-destructive/10 text-destructive text-[11px] px-2 py-1.5">
                Check-out must be after check-in.
              </div>
            )}
          </section>

          {/* Guest info */}
          <section className="space-y-2">
            <SectionTitle>Guest</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <input
                  value={draft.guestName}
                  onChange={(e) => setDraft({ ...draft, guestName: e.target.value })}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
                />
              </Field>
              <Field label="Country">
                <input
                  value={draft.guestCountry}
                  onChange={(e) => setDraft({ ...draft, guestCountry: e.target.value })}
                  className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular uppercase"
                  maxLength={3}
                />
              </Field>
            </div>
            <Field label="Email" icon={<Mail className="h-3 w-3" />}>
              <input
                type="email"
                value={draft.guestEmail}
                onChange={(e) => setDraft({ ...draft, guestEmail: e.target.value })}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
                placeholder="guest@example.com"
              />
            </Field>
            <Field label="Phone" icon={<Phone className="h-3 w-3" />}>
              <input
                type="tel"
                value={draft.guestPhone}
                onChange={(e) => setDraft({ ...draft, guestPhone: e.target.value })}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
                placeholder="+49 …"
              />
            </Field>
            <Field label="Address" icon={<MapPin className="h-3 w-3" />}>
              <textarea
                value={draft.guestAddress}
                onChange={(e) => setDraft({ ...draft, guestAddress: e.target.value })}
                rows={2}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] resize-y"
                placeholder="Street, City, Country"
              />
            </Field>
            <Field label="Status">
              <div className="hairline divide-x divide-[var(--color-hairline)] flex tour-status-section">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setDraft({ ...draft, status: s })}
                    className={cn(
                      "flex-1 px-1.5 py-1.5 text-[10px] uppercase tracking-wider tabular",
                      draft.status === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-secondary",
                    )}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes" icon={<StickyNote className="h-3 w-3" />}>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] resize-y"
                placeholder="Internal notes for staff"
              />
            </Field>
          </section>

          {error && (
            <div className="hairline bg-destructive/10 text-destructive text-[11px] px-2 py-1.5">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="hairline-t p-3 bg-card flex items-center gap-2 shrink-0">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="hairline px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete{isSplit ? " entire stay" : ""}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-destructive">
                {isSplit ? "Delete all legs?" : "Delete this booking?"}
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="hairline px-2 py-1 text-[11px] hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="hairline px-2 py-1 text-[11px] bg-destructive text-destructive-foreground"
              >
                Confirm delete
              </button>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <span className="text-[11px] text-muted-foreground italic">Unsaved changes</span>
            )}
            <button
              disabled={!dirty || (dirtyLeg && (!conflictCheck.ok || !datesValid))}
              onClick={handleSave}
              className="hairline px-3 py-1.5 text-[12px] font-semibold flex items-center gap-1.5 bg-foreground text-background disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </footer>
      </aside>
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
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}
