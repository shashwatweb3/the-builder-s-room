import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/opportunities/$id")({
  component: () => null,
});
