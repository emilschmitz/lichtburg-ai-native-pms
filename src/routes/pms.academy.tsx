import { createFileRoute } from "@tanstack/react-router";
import { AcademyView } from "@/components/pms/AcademyView";

export const Route = createFileRoute("/pms/academy")({
  component: AcademyView,
});
