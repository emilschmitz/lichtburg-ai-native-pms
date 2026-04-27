import { createFileRoute } from "@tanstack/react-router";
import { FloorPlanView } from "@/components/pms/FloorPlanView";

export const Route = createFileRoute("/pms/floor-plan")({
  head: () => ({
    meta: [
      { title: "Floor plan · Lichtburg PMS" },
      { name: "description", content: "Visual floor-plan occupancy by date." },
    ],
  }),
  component: FloorPlanView,
});
