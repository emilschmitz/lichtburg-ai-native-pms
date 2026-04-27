/**
 * Today view — operational list of arrivals, departures, and in-house guests
 * for a selected date (defaults to today).
 */

import { useMemo, useState } from "react";
import { BEDS, ROOMS, TODAY, ROOM_CLASS_LABEL } from "@/data/hostel";
import {
  arrivalsOn,
  departuresOn,
  inHouseOn,
  roomForBed,
} from "@/lib/pms/availability";
import { addDaysISO, formatShort } from "@/lib/pms/dates";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/data/hostel/types";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";

export function TodayView() {
  const { bookings } = useBookings();
  const { openBooking } = usePmsUi();
  const [date, setDate] = useState<string>(TODAY);
  const arrivals = useMemo(() => arrivalsOn(bookings, date), [date, bookings]);
  const departures = useMemo(() => departuresOn(bookings, date), [date, bookings]);
  const inHouse = useMemo(() => inHouseOn(bookings, date), [date, bookings]);

  return (
    <div className="flex flex-col h-full">
      <div className="hairline-b bg-card px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex hairline">
          <button
            onClick={() => setDate(addDaysISO(date, -1))}
            className="px-2 py-1 hairline-r hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDate(TODAY)}
            className="px-3 py-1 text-[12px] font-medium hover:bg-secondary"
          >
            Today
          </button>
          <button
            onClick={() => setDate(addDaysISO(date, 1))}
            className="px-2 py-1 hairline-l hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[13px] font-medium tabular">{formatShort(date)}</div>
        <div className="ml-auto flex items-center gap-4 text-[11px] text-muted-foreground tabular">
          <Stat icon={<LogIn className="h-3.5 w-3.5" />} value={arrivals.length} label="Arrivals" />
          <Stat icon={<LogOut className="h-3.5 w-3.5" />} value={departures.length} label="Departures" />
          <Stat icon={<Users className="h-3.5 w-3.5" />} value={inHouse.length} label="In-house" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Arrivals" icon={<LogIn className="h-4 w-4" />} count={arrivals.length}>
          {arrivals.length === 0 ? (
            <Empty>No arrivals on this date.</Empty>
          ) : (
            arrivals.map((b) => (
              <BookingRow key={b.id} booking={b} variant="arrival" onOpen={openBooking} />
            ))
          )}
        </Section>
        <Section title="Departures" icon={<LogOut className="h-4 w-4" />} count={departures.length}>
          {departures.length === 0 ? (
            <Empty>No departures on this date.</Empty>
          ) : (
            departures.map((b) => (
              <BookingRow key={b.id} booking={b} variant="departure" onOpen={openBooking} />
            ))
          )}
        </Section>
        <Section title="In-house" icon={<Users className="h-4 w-4" />} count={inHouse.length}>
          {inHouse.map((b) => (
            <BookingRow key={b.id} booking={b} variant="in-house" onOpen={openBooking} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      <span className="text-foreground font-semibold">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="hairline bg-card flex flex-col min-h-0">
      <header className="hairline-b px-3 py-2 flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-semibold uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-[11px] text-muted-foreground tabular">{count}</span>
      </header>
      <div className="flex-1 overflow-auto divide-y divide-[var(--color-hairline)]">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">{children}</div>;
}

function BookingRow({
  booking,
  variant,
}: {
  booking: Booking;
  variant: "arrival" | "departure" | "in-house";
}) {
  const room = roomForBed(ROOMS, BEDS, booking.bedId);
  const bed = BEDS.find((b) => b.id === booking.bedId);
  return (
    <div className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50">
      <div
        className={cn(
          "h-1.5 w-1.5 hairline shrink-0",
          variant === "arrival" && "bg-occ-arrival",
          variant === "departure" && "bg-occ-departure",
          variant === "in-house" && "bg-occ-occupied",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate">{booking.guestName}</div>
        <div className="text-[10px] text-muted-foreground tabular truncate">
          {room?.number} · {room?.name} · {bed?.label} · {ROOM_CLASS_LABEL[room?.class ?? "shared_mixed"]}
        </div>
      </div>
      <div className="text-right text-[10px] text-muted-foreground tabular shrink-0">
        <div>{booking.checkIn} → {booking.checkOut}</div>
        <div className="font-mono uppercase">{booking.status.replace("_", " ")}</div>
      </div>
    </div>
  );
}
