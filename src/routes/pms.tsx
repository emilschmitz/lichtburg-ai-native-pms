import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PmsShell } from "@/components/pms/PmsShell";

export const Route = createFileRoute("/pms")({
  head: () => ({
    meta: [
      { title: "Lichtburg PMS — Berlin Hostel" },
      { name: "description", content: "Property management for a 17-bed Berlin hostel." },
    ],
  }),
  component: PmsLayout,
});

function PmsLayout() {
  return (
    <PmsShell>
      <Outlet />
    </PmsShell>
  );
}
