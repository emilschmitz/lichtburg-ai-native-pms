import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pms/")({
  beforeLoad: () => {
    throw redirect({ to: "/pms/timeline" });
  },
  component: () => null,
});
