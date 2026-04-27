/**
 * Floor plan view — visual room layout, color-coded by occupancy on a date.
 * Floors are shown side-by-side; each room is a hairline-bordered box.
 */

import { useMemo, useState } from "react";
import { ROOMS, BEDS, TODAY } from "@/data/hostel";
import { addDaysISO, formatShort, rangeDates } from "@/lib/pms/dates";
import {
  bookingForBedOnNight,
  inHouseOn,
  nightOccupancy,
} from "@/lib/pms/availability";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";

const CELL_PX = 36;
const CLASS_TOKEN: Record<string, string> = {
  shared_mixed: "bg-class-shared",
  shared_female: "bg-class-female",
  double_private: "bg-class-double",
  single_private: "bg-class-single",
  private_ensuite: "bg-class-private",
};

export function FloorPlanView() {
  const { bookings } = useBookings();
  const { openBooking, openNewBooking } = usePmsUi();
  const [date, setDate] = useState<string>(TODAY);
  const dates = useMemo(() => rangeDates(addDaysISO(TODAY, -2), addDaysISO(TODAY, 14)), []);
  const occ = useMemo(() => nightOccupancy(BEDS, bookings, date), [date, bookings]);
  const inHouse = useMemo(() => inHouseOn(bookings, date), [date, bookings]);

  const floors = [0, 1, 2] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="hairline-b bg-card px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex hairline">
          <button
            onClick={() => setDate(addDaysISO(date, -1))}
            className="px-2 py-1 hairline-r hover:bg-secondary"
            aria-label="Previous day"
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
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[13px] font-medium tabular">{formatShort(date)}</div>
        <div className="ml-auto text-[12px] text-muted-foreground tabular">
          Occupancy{" "}
          <span className="text-foreground font-semibold">
            {Math.round(occ * 100)}%
          </span>{" "}
          · {inHouse.length}/{BEDS.length} beds in-house
        </div>
      </div>

      {/* Mini date strip for quick scanning */}
      <div className="hairline-b bg-background px-4 py-2 flex gap-1 overflow-x-auto shrink-0">
        {dates.map((d) => {
          const pct = nightOccupancy(BEDS, bookings, d);
          const active = d === date;
          const isToday = d === TODAY;
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={cn(
                "hairline shrink-0 px-2 py-1.5 text-[10px] tabular flex flex-col items-center gap-0.5",
                active
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-accent"
                    : "bg-card hover:bg-secondary",
              )}
              style={{ minWidth: 56 }}
            >
              <span className="uppercase opacity-70">{formatShort(d).slice(0, 3)}</span>
              <span className="font-semibold text-[12px]">{d.slice(8, 10)}</span>
              <span className="opacity-80">{Math.round(pct * 100)}%</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {floors.map((floor) => {
          const floorRooms = ROOMS.filter((r) => r.floor === floor);
          if (floorRooms.length === 0) return null;
          // Determine grid extent
          const cols = 12;
          const rows = Math.max(...floorRooms.map((r) => r.layout.y + r.layout.h));
          return (
            <section key={floor} className="hairline bg-card">
              <header className="hairline-b px-3 py-2 flex items-center gap-3">
                <span className="font-mono text-[11px] hairline px-1.5 py-0.5 bg-secondary">
                  F{floor}
                </span>
                <span className="text-[12px] font-medium">
                  {floor === 0 ? "Ground floor" : floor === 1 ? "First floor" : "Second floor"}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground tabular">
                  {floorRooms.reduce((s, r) => s + r.capacity, 0)} beds
                </span>
              </header>
              <div className="p-4">
                <div
                  className="relative mx-auto"
                  style={{
                    width: cols * CELL_PX,
                    height: rows * CELL_PX,
                  }}
                >
                  {floorRooms.map((room) => {
                    const roomBeds = BEDS.filter((b) => b.roomId === room.id);
                    return (
                      <div
                        key={room.id}
                        className={cn(
                          "absolute hairline bg-background flex flex-col",
                        )}
                        style={{
                          left: room.layout.x * CELL_PX,
                          top: room.layout.y * CELL_PX,
                          width: room.layout.w * CELL_PX,
                          height: room.layout.h * CELL_PX,
                        }}
                      >
                        <div className="hairline-b px-2 py-1 flex items-center gap-2 text-[10px]">
                          <span
                            className={cn(
                              "h-2 w-2 hairline",
                              CLASS_TOKEN[room.class],
                            )}
                          />
                          <span className="font-mono font-semibold tabular">{room.number}</span>
                          <span className="truncate text-muted-foreground">{room.name}</span>
                        </div>
                        <div className="flex-1 grid auto-rows-[1fr] gap-1 p-1.5"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(roomBeds.length, 3)}, minmax(0,1fr))`,
                          }}
                        >
                          {roomBeds.map((bed) => {
                            const bk = bookingForBedOnNight(bookings, bed.id, date);
                            return (
                              <button
                                key={bed.id}
                                onClick={() =>
                                  bk
                                    ? openBooking(bk.id)
                                    : openNewBooking({
                                        bedId: bed.id,
                                        checkIn: date,
                                        checkOut: addDaysISO(date, 1),
                                      })
                                }
                                title={
                                  bk
                                    ? `${bk.guestName} · ${bk.checkIn} → ${bk.checkOut} · click to manage`
                                    : `${bed.label} · free · click to book`
                                }
                                className={cn(
                                  "hairline text-[9px] leading-tight p-1 flex flex-col justify-end overflow-hidden text-left hover:ring-1 hover:ring-foreground transition",
                                  bk
                                    ? "bg-occ-occupied text-occ-occupied-foreground"
                                    : "bg-occ-available text-foreground",
                                )}
                              >
                                <div className="opacity-70 truncate font-mono">{bed.label}</div>
                                {bk ? (
                                  <div className="font-medium truncate">{bk.guestName.split(" ")[0]}</div>
                                ) : (
                                  <div className="font-semibold uppercase tracking-wider opacity-80">free</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
