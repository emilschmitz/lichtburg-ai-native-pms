import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { format } from "date-fns";
import { HOSTEL_INFO, TODAY } from "@/data/hostel";
import { CalendarRange, LayoutGrid, Sparkles, ListChecks, Plus } from "lucide-react";
import { BookingsProvider } from "@/lib/pms/bookings-store";
import { PmsUiProvider, usePmsUi } from "@/lib/pms/ui-store";
import { BookingDrawer } from "./BookingDrawer";
import { NewBookingDialog } from "./NewBookingDialog";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  hint: string;
}

const NAV: NavItem[] = [
  { to: "/pms/timeline", label: "Timeline", icon: CalendarRange, hint: "Rooms × dates strip" },
  { to: "/pms/floor-plan", label: "Floor plan", icon: LayoutGrid, hint: "Visual occupancy" },
  { to: "/pms/today", label: "Today", icon: ListChecks, hint: "Arrivals & departures" },
  { to: "/pms/assistant", label: "AI Assistant", icon: Sparkles, hint: "Find booking configuration" },
];

export function PmsShell({ children }: { children: React.ReactNode }) {
  return (
    <BookingsProvider>
      <PmsUiProvider>
        <Layout>{children}</Layout>
        <BookingDrawer />
        <NewBookingDialog />
      </PmsUiProvider>
    </BookingsProvider>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const { openNewBooking } = usePmsUi();
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopBar onNewBooking={() => openNewBooking()} />
      <div className="flex-1 flex min-h-0">
        <aside className="w-56 hairline-r bg-sidebar shrink-0 flex flex-col min-h-0">
          <nav className="flex flex-col p-2 gap-0.5 overflow-auto">
            {NAV.map((item) => {
              const active = loc.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "group flex items-start gap-3 px-3 py-2.5 hairline transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-secondary text-foreground")
                  }
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
                    <span
                      className={
                        "text-[11px] " +
                        (active ? "text-primary-foreground/80" : "text-muted-foreground")
                      }
                    >
                      {item.hint}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-3 hairline-t text-[11px] text-muted-foreground tabular leading-relaxed shrink-0">
            <div className="font-medium text-foreground">{HOSTEL_INFO.name}</div>
            <div>{HOSTEL_INFO.address}</div>
            <div>{HOSTEL_INFO.totalBeds} beds · 6 rooms</div>
            <BerlinClock />
          </div>
        </aside>
        <main className="flex-1 min-w-0 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function TopBar({ onNewBooking }: { onNewBooking: () => void }) {
  return (
    <header className="hairline-b bg-card flex items-stretch h-12 shrink-0">
      <div className="w-56 hairline-r flex items-center px-4 gap-2">
        <div className="h-6 w-6 hairline bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-mono font-bold">
          KL
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight">Lichtburg PMS</span>
          <span className="text-[10px] text-muted-foreground tabular">v0.1 · Berlin</span>
        </div>
      </div>
      <div className="flex-1 flex items-center px-4 text-[12px] text-muted-foreground tabular">
        <span>
          Front desk —{" "}
          <span className="text-foreground">
            {format(new Date(TODAY + "T12:00:00Z"), "EEEE, dd MMMM yyyy")}
          </span>
        </span>
      </div>
      <div className="flex items-center px-3 gap-2 hairline-l">
        <button
          onClick={onNewBooking}
          className="hairline px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-foreground text-background flex items-center gap-1.5 hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New booking
        </button>
        <span className="text-[11px] text-muted-foreground ml-2">Operator</span>
        <div className="h-7 w-7 hairline rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[11px] font-medium">
          AM
        </div>
      </div>
    </header>
  );
}

function BerlinClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(time);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  
  return (
    <div className="mt-3 pt-3 hairline-t flex items-center justify-between">
      <span>{`${day} ${month} ${year}`}</span>
      <span>{`${hour}:${minute} CET`}</span>
    </div>
  );
}
