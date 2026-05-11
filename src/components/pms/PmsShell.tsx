import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, type ComponentType, type SVGProps } from "react";
import { format } from "date-fns";
import { HOSTEL_INFO, TODAY } from "@/data/hostel";
import {
  CalendarDays,
  Home,
  Building2,
  Bed,
  Maximize2,
  GraduationCap,
  X,
  ChevronRight,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Globe,
  Clock,
  Trophy,
  CalendarRange,
  LayoutGrid,
  Sparkles,
  ListChecks,
  Plus,
} from "lucide-react";
import { Joyride, STATUS, TooltipRenderProps } from "react-joyride";
import { usePmsUi } from "@/lib/pms/ui-store";
import { useAcademy } from "@/lib/pms/academy-store";
import { COURSES, LEVELS } from "@/data/academy";
import { BookingDrawer } from "./BookingDrawer";
import { NewBookingDialog } from "./NewBookingDialog";
import { OnboardingDialog } from "./OnboardingDialog";

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
  {
    to: "/pms/assistant",
    label: "Intelligent booking search",
    icon: Sparkles,
    hint: "Find booking configuration",
  },
];

const CustomTooltip = ({
  index,
  step,
  backProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => {
  const { tourState, newBookingOpen, setTourRun, setTourActive, closeNewBooking, closeBooking, setTourCompleted } = usePmsUi();
  // Determine if the Next button should be disabled based on the current step
  let isNextDisabled = false;
  if (index === 1) isNextDisabled = !newBookingOpen;
  if (index === 3) isNextDisabled = !tourState.checkOutValid;
  if (index === 4) isNextDisabled = !tourState.hasSecondLeg;
  if (index === 5) isNextDisabled = !tourState.secondLegBedValid;
  if (index === 6) isNextDisabled = !tourState.secondLegCheckOutValid;
  if (index === 7) isNextDisabled = !tourState.statusCheckedIn;
  if (index === 8) isNextDisabled = !tourState.paymentDone;
  if (index === 9) isNextDisabled = !tourState.keysDone;
  if (index === 10) isNextDisabled = !tourState.bookingSaved;

  // Step 10 = Save Btn (Final step)
  const isLastStep = index === 10;

  return (
    <div {...tooltipProps} className="bg-card text-card-foreground p-4 rounded-lg max-w-sm relative shadow-2xl">
      <button
        onClick={() => {
          setTourCompleted(true);
          setTourRun(false);
          setTourActive(false);
          closeNewBooking();
          closeBooking();
        }}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 transition-colors"
        aria-label="Abort tour"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="text-sm pr-4">{step.content as React.ReactNode}</div>
      <div className="flex justify-end mt-4">
        {!isLastStep && (
          <button
            {...primaryProps}
            onClick={(e) => {
              if (isNextDisabled) e.preventDefault();
              else primaryProps.onClick(e);
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              isNextDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:opacity-90"
            }`}
          >
            Next
          </button>
        )}
        {isLastStep && (
          <button
            {...primaryProps}
            onClick={(e) => {
              // Force cleanup on finish click
              setTourCompleted(true);
              setTourRun(false);
              setTourActive(false);
              closeNewBooking();
              closeBooking();
              primaryProps.onClick(e);
            }}
            className="px-4 py-1.5 text-sm font-medium rounded bg-foreground text-background hover:opacity-90 transition-colors"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export function PmsShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Layout>{children}</Layout>
      <BookingDrawer />
      <NewBookingDialog />
      <OnboardingDialog />
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const {
    openNewBooking,
    closeNewBooking,
    closeBooking,
    newBookingOpen,
    tourState,
    updateTourState,
    resetTourStepIndex,
    tourCompleted,
    setTourCompleted,
    tourActive,
    setTourActive,
    tourRun,
    setTourRun,
    experienceLevel,
    nudgeDismissed,
    setNudgeDismissed,
    tourNudgeDismissed,
    setTourNudgeDismissed,
  } = usePmsUi();
  const { points, completedCourses, completeCourse, setActiveCourseId } = useAcademy();
  const [nudgeCooldown, setNudgeCooldown] = useState(false);

  function startTour() {
    navigate({ to: "/pms/timeline" });
    resetTourStepIndex();
    updateTourState({
      checkOutValid: false,
      hasSecondLeg: false,
      secondLegBedValid: false,
      secondLegCheckOutValid: false,
      paymentDone: false,
      keysDone: false,
      statusCheckedIn: false,
      bookingSaved: false,
    });
    setTourActive(true);
    setTourRun(true);
  }

  const currentLevel = LEVELS.find((l) => points >= l.minPoints) || LEVELS[LEVELS.length - 1];
  const activeAcademy = loc.pathname === "/pms/academy";

  let suggestedAction = "course";
  let suggestedCourseId: string | null = null;
  let nudgeTitle = "";
  let nudgeText = "";

  const isTourDone = tourCompleted || completedCourses.includes("tour");

  if (!isTourDone && !tourNudgeDismissed) {
    suggestedAction = "tour";
    nudgeTitle = "New to Lichtburg?";
    nudgeText =
      "Welcome! Before you dive into the courses, let's take a quick interactive tour to show you how bookings work.";
  } else if (!completedCourses.includes("perfect-checkin")) {
    suggestedAction = "course";
    suggestedCourseId = "perfect-checkin";
    nudgeTitle = "Ready for the Academy?";
    nudgeText =
      "Awesome job! There's a lot more to learn about bookings though! Avoid potential pitfalls and do your job confidently by taking the Check-in Procedure course.";
  } else if (!completedCourses.includes("vcc-masterclass")) {
    suggestedAction = "course";
    suggestedCourseId = "vcc-masterclass";
    nudgeTitle = "Next Step: Virtual Cards";
    nudgeText =
      "Great job! Next, learn how to handle Virtual Credit Cards so you don't accidentally double-charge guests.";
  }

  const showNudge =
    experienceLevel !== null &&
    !nudgeDismissed &&
    !activeAcademy &&
    !tourActive &&
    (suggestedAction === "tour" || suggestedCourseId !== null);

  const [pointAnim, setPointAnim] = useState<{ id: number; val: number }[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);

  const tourSteps: any[] = useMemo(
    () => [
      {
        target: ".tour-demo-room-row",
        content:
          "First, notice Demo Room 1. It's a single room. Let's see what happens when a guest wants to book it. Click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "bottom",
      },
      {
        target: ".tour-timeline-demo-1",
        content:
          "A new customer wants to stay 4 nights starting today. The room is only available for 3 nights, but we'll worry about that later. Click this specific square to start booking them into Demo Room 1.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "bottom",
      },
      {
        target: ".tour-guest-section",
        content:
          "The guest's personal info has already been filled in for us to save time! Click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-dates-section",
        content:
          "The guest wants 4 nights, but the room is booked on the 4th night! Change this leg's check-out to 3 nights, then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-add-leg-btn",
        content: "Now click 'Extend onto another bed' to add a second leg. Then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-second-leg-bed",
        content:
          "Change the bed for this new leg to Demo Room 2, since Demo Room 1 is booked. Then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-second-leg-dates",
        content:
          "The checkout date is empty! Set it to 1 night from the check-in date to complete the 4-night stay, then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-status-section",
        content:
          "Finally, change their status to 'checked in', wish them a pleasant stay, and click Next!",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-payment-btn",
        content:
          "Now for billing! For walk-ins, you'd process their credit card on the physical terminal, then click here to mark it as Paid. Then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-keycard-btn",
        content:
          "Next, grab physical keycards from the drawer, hold them against the encoder, and click here to encode. Then click Next.",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "left",
      },
      {
        target: ".tour-save-btn",
        content: "All done! Click 'Save' to create the booking, then click 'Finish' to exit the tour!",
        skipBeacon: true,
        spotlightClicks: true,
        placement: "top",
      },
    ],
    [],
  );

  const handleTourCallback = (data: any) => {
    const { status, action } = data;

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED, "error"];
    if (finishedStatuses.includes(status) || action === "close") {
      if (status === "error") {
        console.error("Joyride tour errored out!", data);
      }
      setTimeout(() => {
        setTourRun(false);
        setTourActive(false);
        setTourCompleted(true);
        closeNewBooking(); // Force sidebar collapse on finish
        closeBooking(); // Close any open drawer

        if (!completedCourses.includes("tour")) {
          setNudgeCooldown(true);
          const animId = Date.now();
          setTimeout(() => {
            completeCourse("tour", 50);
            setPointAnim((prev) => [...prev, { id: animId, val: 50 }]);
            setTimeout(() => {
              setPointAnim((prev) => prev.filter((p) => p.id !== animId));
            }, 3000);

            setShowCongrats(true);
            setTimeout(() => setShowCongrats(false), 5000);

            // Allow nudges again after trophy is done
            setTimeout(() => setNudgeCooldown(false), 4000);
          }, 1500);
        }
      }, 0);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {showCongrats && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-card text-card-foreground shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500 delay-150 fill-mode-both">
            <Trophy className="w-24 h-24 text-yellow-500 animate-bounce" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Congratulations!
            </h1>
            <p className="text-lg font-medium text-muted-foreground">
              You earned <span className="text-primary font-bold">50 Points</span> for completing
              the Quick Tour!
            </p>
          </div>
        </div>
      )}

      {/* @ts-ignore */}
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous={true}

        tooltipComponent={CustomTooltip}
        // @ts-ignore
        callback={handleTourCallback}
      />
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
          <div className="mt-auto p-2 relative">
            {showNudge && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-primary text-primary-foreground p-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom-2 fade-in">
                <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-primary border-r-[8px] border-r-transparent"></div>

                <button
                  onClick={() => {
                    if (suggestedAction === "tour") setTourNudgeDismissed(true);
                    else setNudgeDismissed(true);
                  }}
                  className="absolute top-2 right-2 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <h4 className="font-bold text-[12px] mb-1 pr-4 leading-tight">{nudgeTitle}</h4>
                <p className="text-[11px] leading-relaxed opacity-90 mb-2">{nudgeText}</p>
                <div className="text-[9.5px] leading-tight text-primary-foreground/75 mb-3 italic">
                  💡 You can pause anytime to assist a guest and seamlessly resume your progress
                  later!
                </div>
                <button
                  onClick={() => {
                    if (suggestedAction === "tour") {
                      startTour();
                    } else {
                      setNudgeDismissed(true);
                      setActiveCourseId(suggestedCourseId);
                      navigate({ to: "/pms/academy" });
                    }
                  }}
                  className="bg-background text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded w-full hover:opacity-90 transition-opacity"
                >
                  {suggestedAction === "tour" ? "Start Tour" : "Start Course"}
                </button>
              </div>
            )}

            <Link
              to="/pms/academy"
              className={
                "group tour-academy-link flex flex-col gap-1.5 px-3 py-3 hairline rounded-lg transition-colors " +
                (activeAcademy
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-secondary text-foreground")
              }
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary relative z-10" />
                <span className="font-semibold uppercase tracking-wider text-[11px] relative z-10">
                  Academy
                </span>

                {/* Points Animation */}
                {pointAnim.map((p) => (
                  <div
                    key={p.id}
                    className="absolute left-6 -top-2 text-primary font-bold text-sm z-20 animate-in slide-in-from-bottom-2 fade-in duration-500 ease-out"
                    style={{ animationFillMode: "forwards" }}
                  >
                    +{p.val} pts!
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className={
                    "text-[11px] font-medium " +
                    (activeAcademy ? "text-primary-foreground" : currentLevel.color)
                  }
                >
                  {currentLevel.name}
                </span>
                <div
                  className={
                    "w-full h-1 rounded-full mt-0.5 " +
                    (activeAcademy ? "bg-primary-foreground/30" : "bg-muted")
                  }
                >
                  <div
                    className={
                      "h-full rounded-full " +
                      (activeAcademy ? "bg-primary-foreground" : "bg-primary")
                    }
                    style={{ width: `${(completedCourses.length / COURSES.length) * 100}%` }}
                  />
                </div>
                <span
                  className={
                    "text-[10px] mt-0.5 " +
                    (activeAcademy ? "text-primary-foreground/80" : "text-muted-foreground")
                  }
                >
                  {completedCourses.length} of {COURSES.length} courses completed
                </span>
              </div>
            </Link>
          </div>
          <div className="p-3 hairline-t text-[11px] text-muted-foreground tabular leading-relaxed shrink-0">
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
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[13px] font-semibold tracking-tight">Lichtburg PMS</span>
          <span className="text-[10px] text-muted-foreground tabular">v0.1</span>
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
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;

  return (
    <div className="mt-3 pt-3 hairline-t flex items-center justify-between">
      <span>{`${day} ${month} ${year}`}</span>
      <span>{`${hour}:${minute} CET`}</span>
    </div>
  );
}
