/**
 * Timeline view — the "video editor" strip that is the heart of any PMS.
 *
 * Rows = beds, grouped by room. Columns = dates. Bookings render as bars
 * spanning their date range. Click a booking bar to open the booking drawer.
 * Click an empty cell to open the new-booking dialog prefilled for that
 * bed + night.
 */

import { useMemo, useState } from "react";
import {
  ROOMS,
  BEDS,
  TODAY,
} from "@/data/hostel";
import type { Booking, Room } from "@/data/hostel/types";
import {
  addDaysISO,
  formatDayNum,
  formatWeekday,
  rangeDates,
  diffDays,
} from "@/lib/pms/dates";
import {
  bookingsOnBedInRange,
  isPrivateRoom,
  occupancySeries,
} from "@/lib/pms/availability";
import { ChevronLeft, ChevronRight, Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookings } from "@/lib/pms/bookings-store";
import { usePmsUi } from "@/lib/pms/ui-store";

const DAY_W = 110; // px per day column
const ROW_H = 30; // px per bed row
const LABEL_W = 220; // px for left labels

const CLASS_TOKEN: Record<string, string> = {
  shared_mixed: "bg-class-shared text-primary-foreground",
  shared_female: "bg-class-female text-primary-foreground",
  double_private: "bg-class-double text-primary-foreground",
  single_private: "bg-class-single text-primary-foreground",
  private_ensuite: "bg-class-private text-primary-foreground",
};

export function TimelineView() {
  const { bookings } = useBookings();
  const { openBooking, openNewBooking } = usePmsUi();
  const [anchor, setAnchor] = useState<string>(TODAY);
  const [days, setDays] = useState<number>(14);

  const startDate = anchor;
  const endDate = addDaysISO(anchor, days);
  const dates = useMemo(() => rangeDates(startDate, endDate), [startDate, endDate]);
  const occSeries = useMemo(
    () => occupancySeries(BEDS, bookings, startDate, endDate),
    [startDate, endDate, bookings],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="hairline-b bg-card px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex hairline">
          <button
            onClick={() => setAnchor(addDaysISO(anchor, -7))}
            className="px-2 py-1 hairline-r hover:bg-secondary"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnchor(TODAY)}
            className="px-3 py-1 text-[12px] font-medium hover:bg-secondary tabular"
          >
            Today
          </button>
          <button
            onClick={() => setAnchor(addDaysISO(anchor, 7))}
            className="px-2 py-1 hairline-l hover:bg-secondary"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex hairline text-[11px]">
          {[7, 14, 21, 28].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={cn(
                "px-2.5 py-1 tabular",
                n !== 28 && "hairline-r",
                days === n ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              {n}d
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <Legend />
        </div>
      </div>

      {/* Scroll container */}
      <div className="flex-1 overflow-auto bg-background">
        <div
          className="relative"
          style={{ width: LABEL_W + dates.length * DAY_W, minWidth: "100%" }}
        >
          {/* Date header */}
          <div className="sticky top-0 z-20 bg-card hairline-b flex">
            <div
              className="hairline-r shrink-0 flex items-center px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground"
              style={{ width: LABEL_W }}
            >
              Bed / Room
            </div>
            <div className="flex">
              {dates.map((d, i) => {
                const occ = occSeries[i];
                const isToday = d === TODAY;
                return (
                  <div
                    key={d}
                    className={cn(
                      "hairline-r text-center py-1 tabular",
                      isToday && "bg-accent",
                    )}
                    style={{ width: DAY_W }}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {formatWeekday(d)}
                    </div>
                    <div className="text-[14px] font-semibold leading-tight">
                      {formatDayNum(d)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(occ.pct * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertical day grid lines (background) */}
          <div
            className="absolute pointer-events-none"
            style={{ left: LABEL_W, top: 0, right: 0, bottom: 0 }}
          >
            {dates.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "absolute top-0 bottom-0 hairline-r",
                  d === TODAY && "bg-accent/30",
                )}
                style={{ left: i * DAY_W, width: DAY_W }}
              />
            ))}
          </div>

          {/* Rooms + beds */}
          {ROOMS.map((room) => {
            const roomBeds = BEDS.filter((b) => b.roomId === room.id);
            return (
              <div key={room.id} className="hairline-b">
                {/* Room header row */}
                <div
                  className="flex bg-secondary hairline-b sticky left-0 z-10"
                  style={{ height: 28 }}
                >
                  <div
                    className="hairline-r flex items-center px-3 gap-2"
                    style={{ width: LABEL_W }}
                  >
                    <span className={cn("h-2 w-2 hairline", CLASS_TOKEN[room.class])} />
                    <span className="text-[11px] font-semibold tabular">{room.number}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {room.name}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground tabular">
                      €{room.pricePerNight}
                    </span>
                  </div>
                </div>
                {/* Bed rows */}
                {roomBeds.map((bed) => {
                  const myBookings = bookingsOnBedInRange(
                    bookings,
                    bed.id,
                    startDate,
                    endDate,
                  );
                  return (
                    <div
                      key={bed.id}
                      className="relative flex hairline-b last:border-b-0 hover:bg-muted/40 group/bed"
                      style={{ height: ROW_H }}
                    >
                      <div
                        className="hairline-r flex items-center px-3 text-[11px] text-muted-foreground bg-card sticky left-0 z-10"
                        style={{ width: LABEL_W }}
                      >
                        <span className="font-mono">{bed.id.slice(2)}</span>
                        <span className="ml-2 truncate">{bed.label}</span>
                      </div>
                      {/* Empty-cell click targets for new bookings */}
                      {dates.map((d, di) => {
                        const occupied = myBookings.some(
                          (bk) => bk.checkIn <= d && bk.checkOut > d,
                        );
                        if (occupied) return null;
                        return (
                          <button
                            key={d}
                            onClick={() =>
                              openNewBooking({
                                bedId: bed.id,
                                checkIn: d,
                                checkOut: addDaysISO(d, 1),
                              })
                            }
                            title={`New booking on ${bed.label}, ${d}`}
                            className="absolute top-0 bottom-0 opacity-0 hover:opacity-100 hover:bg-primary/10 flex items-center justify-center text-primary transition-opacity"
                            style={{
                              left: LABEL_W + di * DAY_W,
                              width: DAY_W,
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        );
                      })}
                      {/* Bookings */}
                      {myBookings.map((bk) => {
                        const visEnd = bk.checkOut > endDate ? endDate : bk.checkOut;
                        const visStart = bk.checkIn < startDate ? startDate : bk.checkIn;
                        const span = diffDays(visStart, visEnd);
                        const realLeft = Math.max(0, diffDays(startDate, visStart));
                        if (span <= 0) return null;
                        return (
                          <button
                            key={bk.id}
                            onClick={() => openBooking(bk.id)}
                            title={`${bk.guestName} · ${bk.checkIn} → ${bk.checkOut}${bk.groupId ? " · split stay" : ""}`}
                            className={cn(
                              "absolute top-1 bottom-1 hairline rounded-[2px] flex items-center px-2 text-[11px] font-medium truncate cursor-pointer hover:brightness-110 hover:ring-1 hover:ring-foreground transition",
                              CLASS_TOKEN[room.class],
                              bk.status === "tentative" && "opacity-60",
                              bk.groupId && "border-dashed",
                            )}
                            style={{
                              left: LABEL_W + realLeft * DAY_W + 2,
                              width: span * DAY_W - 4,
                            }}
                          >
                            <span className="truncate text-left flex-1">{bk.guestName}</span>
                            <span className="ml-2 opacity-80 tabular text-[10px] shrink-0">
                              {bk.guestCountry}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const items: { key: string; label: string }[] = [
    { key: "shared_mixed", label: "Mixed dorm" },
    { key: "shared_female", label: "Female" },
    { key: "double_private", label: "Double" },
    { key: "single_private", label: "Single" },
    { key: "private_ensuite", label: "En-suite" },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 hairline", CLASS_TOKEN[it.key])} />
          <span>{it.label}</span>
        </div>
      ))}
      <span className="ml-2 hairline border-dashed px-1.5 py-0.5 text-[10px]">
        dashed = split stay
      </span>
    </div>
  );
}
