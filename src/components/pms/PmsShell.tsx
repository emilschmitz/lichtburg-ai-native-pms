import { Link, useLocation } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import { HOSTEL_INFO } from "@/data/hostel";
import { CalendarRange, LayoutGrid, Sparkles, ListChecks } from "lucide-react";

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
  { to: "/pms/assistant", label: "AI Assistant", icon: Sparkles, hint: "Find alternatives" },
];

export function PmsShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <aside className="w-56 hairline-r bg-sidebar shrink-0 flex flex-col">
          <nav className="flex flex-col p-2 gap-0.5">
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
          <div className="mt-auto p-3 hairline-t text-[11px] text-muted-foreground tabular leading-relaxed">
            <div className="font-medium text-foreground">{HOSTEL_INFO.name}</div>
            <div>{HOSTEL_INFO.address}</div>
            <div>{HOSTEL_INFO.totalBeds} beds · 6 rooms</div>
          </div>
        </aside>
        <main className="flex-1 min-w-0 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function TopBar() {
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
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </span>
      </div>
      <div className="flex items-center px-4 gap-3 hairline-l">
        <span className="text-[11px] text-muted-foreground">Operator</span>
        <div className="h-7 w-7 hairline rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[11px] font-medium">
          AM
        </div>
      </div>
    </header>
  );
}
