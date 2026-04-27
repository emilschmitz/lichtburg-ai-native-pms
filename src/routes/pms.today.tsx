import { createFileRoute } from "@tanstack/react-router";
import { TodayView } from "@/components/pms/TodayView";

export const Route = createFileRoute("/pms/today")({
  head: () => ({
    meta: [
      { title: "Today · Lichtburg PMS" },
      { name: "description", content: "Arrivals, departures, and in-house guests." },
    ],
  }),
  component: TodayView,
});
