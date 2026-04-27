/**
 * Timeline view — the "video editor" strip that is the heart of any PMS.
 *
 * Rows = beds, grouped by room. Columns = dates. Bookings render as bars
 * spanning their date range. The user can scroll horizontally and click a
 * booking to see its details.
 */

import { useMemo, useState } from "react";
import {
  ROOMS,
  BEDS,
  BOOKINGS,
  TODAY,
  ROOM_CLASS_LABEL,
} from "@/data/hostel";
import {
  addDaysISO,
  formatDayNum,
  formatWeekday,
  rangeDates,
  diffDays,
} from "@/lib/pms/dates";
import {
  bookingsOnBedInRange,
  occupancySeries,
} from "@/lib/pms/availability";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [anchor, setAnchor] = useState<string>(TODAY);
  const [days, setDays] = useState<number>(14);

  const startDate = anchor;
  const endDate = addDaysISO(anchor, days);
  const dates = useMemo(() => rangeDates(startDate, endDate), [startDate, endDate]);
  const occSeries = useMemo(
    () => occupancySeries(BEDS, BOOKINGS, startDate, endDate),
    [startDate, endDate],
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
                    BOOKINGS,
                    bed.id,
                    startDate,
                    endDate,
                  );
                  return (
                    <div
                      key={bed.id}
                      className="relative flex hairline-b last:border-b-0 hover:bg-muted/40"
                      style={{ height: ROW_H }}
                    >
                      <div
                        className="hairline-r flex items-center px-3 text-[11px] text-muted-foreground bg-card sticky left-0 z-10"
                        style={{ width: LABEL_W }}
                      >
                        <span className="font-mono">{bed.id.slice(2)}</span>
                        <span className="ml-2 truncate">{bed.label}</span>
                      </div>
                      {/* Bookings */}
                      {myBookings.map((bk) => {
                        const left = Math.max(0, diffDays(startDate, bk.checkIn));
                        const visEnd = bk.checkOut > endDate ? endDate : bk.checkOut;
                        const visStart = bk.checkIn < startDate ? startDate : bk.checkIn;
                        const span = diffDays(visStart, visEnd);
                        const realLeft = Math.max(0, diffDays(startDate, visStart));
                        if (span <= 0) return null;
                        return (
                          <div
                            key={bk.id}
                            title={`${bk.guestName} · ${bk.checkIn} → ${bk.checkOut}`}
                            className={cn(
                              "absolute top-1 bottom-1 hairline rounded-[2px] flex items-center px-2 text-[11px] font-medium truncate",
                              CLASS_TOKEN[room.class],
                            )}
                            style={{
                              left: LABEL_W + realLeft * DAY_W + 2,
                              width: span * DAY_W - 4,
                            }}
                          >
                            <span className="truncate">{bk.guestName}</span>
                            <span className="ml-2 opacity-80 tabular text-[10px] shrink-0">
                              {bk.guestCountry}
                            </span>
                          </div>
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
    </div>
  );
}
