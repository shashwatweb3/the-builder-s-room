import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/x-card-test-2")({
  head: () => ({
    meta: [
      { title: "Krew3 Venues — Find a place for your Devcon side event" },
      {
        name: "description",
        content:
          "Find venues around BKC, Bandra, Kurla, Santacruz and nearby areas for your Devcon 8 side event.",
      },
      { property: "og:title", content: "Krew3 Venues — Find a place for your Devcon side event" },
      {
        property: "og:description",
        content:
          "Find venues around BKC, Bandra, Kurla, Santacruz and nearby areas for your Devcon 8 side event.",
      },
      { property: "og:url", content: "https://www.krew3.site/x-card-test-2" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.krew3.site/venue-og-x-v1.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Krew3 Venues — Find a place for your Devcon side event" },
      {
        name: "twitter:description",
        content:
          "Find venues around BKC, Bandra, Kurla, Santacruz and nearby areas for your Devcon 8 side event.",
      },
      { name: "twitter:image", content: "https://www.krew3.site/venue-og-x-v1.jpg" },
      {
        name: "twitter:image:alt",
        content: "Krew3 Devcon 8 Mumbai side-event venue directory",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.krew3.site/x-card-test-2" }],
  }),
  component: XCardTestPage,
});

function XCardTestPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold">X card test 2</h1>
      <p className="mt-3 text-muted-foreground">Temporary route for link-preview diagnostics.</p>
    </div>
  );
}