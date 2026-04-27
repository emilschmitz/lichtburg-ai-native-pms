import { createFileRoute } from "@tanstack/react-router";
import { AssistantView } from "@/components/pms/AssistantView";

export const Route = createFileRoute("/pms/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · Lichtburg PMS" },
      { name: "description", content: "AI-assisted booking alternatives for tight occupancy." },
    ],
  }),
  component: AssistantView,
});
