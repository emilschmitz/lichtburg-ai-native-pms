import { createFileRoute } from "@tanstack/react-router";
import { TimelineView } from "@/components/pms/TimelineView";

export const Route = createFileRoute("/pms/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · Lichtburg PMS" },
      { name: "description", content: "Rooms × dates strip view of all bookings." },
    ],
  }),
  component: TimelineView,
});
