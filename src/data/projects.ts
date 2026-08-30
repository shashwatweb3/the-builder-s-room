import type { Project, ProjectStatus } from "./types";

/** Demo data. Replace with real submissions later — shapes stay the same. */
export const projects: Project[] = [
  {
    id: "ledgerly",
    name: "Ledgerly",
    pitch: "Settlement proofs you can actually read.",
    description:
      "A viewer and linter for settlement proofs. Paste a proof, get a plain-language explanation of what it claims and where it's weak.",
    problem:
      "Proof formats are written for machines and reviewed by humans who are guessing. Mistakes get found in production.",
    building:
      "A parser, a diffing view, and a lint rule set that teams can extend. CLI first, web viewer second.",
    builderIds: ["maya-chen", "sam-okafor"],
    category: "Developer tools",
    stack: ["Rust", "WASM", "TypeScript"],
    status: "building",
    github: "https://github.com",
    demo: "https://example.com",
    lookingFor: ["Designer", "Technical writer"],
    updates: [
      { date: "2026-08-26", text: "Lint rules now cover 14 of the 20 known failure modes." },
      { date: "2026-08-12", text: "First external team adopted the CLI in CI." },
    ],
    accent: "bg-lavender",
  },
  {
    id: "offset-ui",
    name: "Offset UI",
    pitch: "A component kit for interfaces with edges and opinions.",
    description:
      "Borders, offset shadows, deliberate motion. A small React kit for people who don't want another rounded gradient card.",
    problem: "Most component libraries produce the same site. Taste is not a dependency you can install, but a starting point helps.",
    building: "Forty components, a motion spec, and theming that doesn't require fighting the library.",
    builderIds: ["arjun-rao"],
    category: "Design",
    stack: ["React", "TypeScript", "Tailwind"],
    status: "live",
    github: "https://github.com",
    demo: "https://example.com",
    lookingFor: ["Contributors", "Accessibility reviewer"],
    updates: [
      { date: "2026-08-24", text: "v0.6 out — focus states rewritten from scratch." },
    ],
    accent: "bg-primary/20",
  },
  {
    id: "quill",
    name: "Quill",
    pitch: "A writing tool for people who think by typing.",
    description:
      "Distraction-free drafting with version history that reads like a story instead of a diff.",
    problem: "Writing apps optimise for output. The interesting part is the mess before the output.",
    building: "Draft timeline, snapshot compare, and an export that respects your formatting.",
    builderIds: ["nora-fell", "lena-vogt"],
    category: "Productivity",
    stack: ["TypeScript", "Postgres", "CRDTs"],
    status: "live",
    demo: "https://example.com",
    lookingFor: ["Founding engineer"],
    updates: [{ date: "2026-08-20", text: "Crossed 10,000 paying users. Still no investors." }],
    accent: "bg-muted",
  },
  {
    id: "honest-bench",
    name: "Honest Bench",
    pitch: "Benchmarks that admit what they can't measure.",
    description:
      "An evaluation harness that reports confidence intervals, contamination checks and the questions the benchmark cannot answer.",
    problem: "Leaderboards get quoted as facts. Most of them are noise with a decimal point.",
    building: "A harness, a contamination scanner and a public results archive.",
    builderIds: ["sam-okafor"],
    category: "Research",
    stack: ["Python", "DuckDB"],
    status: "experiment",
    github: "https://github.com",
    lookingFor: ["Frontend developer", "Statistician"],
    updates: [{ date: "2026-08-18", text: "Contamination scanner found overlap in three popular sets." }],
    accent: "bg-lavender-deep/40",
  },
  {
    id: "shame-clock",
    name: "Shame Clock",
    pitch: "A desk clock that quietly judges your focus.",
    description:
      "An e-ink desk object that tracks focus blocks and displays a single, mildly disappointed sentence.",
    problem: "Focus apps live on the device that distracts you.",
    building: "Open hardware: board files, firmware, and a printable case.",
    builderIds: ["theo-marchetti"],
    category: "Hardware",
    stack: ["C", "ESP32", "E-ink"],
    status: "needs-help",
    github: "https://github.com",
    lookingFor: ["Industrial designer", "Firmware reviewer"],
    updates: [{ date: "2026-08-22", text: "Rev C boards arrived. Two of them even work." }],
    accent: "bg-primary/15",
  },
  {
    id: "tuesday-club",
    name: "Tuesday Club",
    pitch: "A build club that has met every Tuesday for three years.",
    description:
      "Weekly co-working, monthly demos, and a directory of who is working on what. Now being packaged so other cities can copy it.",
    problem: "Most communities die when the organiser gets tired. Structure helps more than enthusiasm.",
    building: "An open playbook, a lightweight RSVP tool, and a shared member directory.",
    builderIds: ["dev-patel", "iris-lund"],
    category: "Community",
    stack: ["Next.js", "Supabase"],
    status: "building",
    demo: "https://example.com",
    lookingFor: ["City organisers", "Designer"],
    updates: [{ date: "2026-08-15", text: "Playbook v1 published. Four cities forked it." }],
    accent: "bg-lavender",
  },
  {
    id: "kerned",
    name: "Kerned",
    pitch: "Type pairing without the guesswork.",
    description: "Paste your headline, get pairings that hold up at real sizes on real screens.",
    problem: "Font pairing tools show you specimens, not your actual layout.",
    building: "Live preview, contrast checks, and export to CSS variables.",
    builderIds: ["arjun-rao", "iris-lund"],
    category: "Design",
    stack: ["React", "Canvas"],
    status: "live",
    demo: "https://example.com",
    lookingFor: ["Type designers"],
    updates: [{ date: "2026-08-08", text: "Added non-Latin script previews." }],
    accent: "bg-muted",
  },
  {
    id: "foldbook",
    name: "Foldbook",
    pitch: "Onboarding checklists that adapt to what users already did.",
    description: "A small SDK that hides steps people have finished and nags gently about the ones they haven't.",
    problem: "Static onboarding checklists insult returning users.",
    building: "Event ingestion, rule builder, and a two-line React embed.",
    builderIds: ["lena-vogt"],
    category: "Developer tools",
    stack: ["TypeScript", "Postgres"],
    status: "experiment",
    lookingFor: ["Design partner", "Early testers"],
    updates: [{ date: "2026-08-27", text: "Three teams testing the embed." }],
    accent: "bg-lavender-deep/30",
  },
];

export const projectStatusLabel: Record<ProjectStatus, string> = {
  building: "Building",
  live: "Live",
  experiment: "Experiment",
  "needs-help": "Looking for help",
};

export const getProject = (id: string) => projects.find((p) => p.id === id);

export const projectsByBuilder = (builderId: string) =>
  projects.filter((p) => p.builderIds.includes(builderId));
