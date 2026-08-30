import type { Builder, BuilderRole, BuilderStatus } from "./types";

/** Demo data. Replace with real profiles later — shapes stay the same. */
export const builders: Builder[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    handle: "@mayabuilds",
    roleLabel: "Protocol Designer",
    role: "developer",
    bio: "Designs settlement protocols. Currently obsessed with making state proofs readable by humans.",
    about:
      "I spent four years on payments infrastructure and left to work on the parts nobody wants to own: the spec, the failure modes, the docs. I write a lot, mostly to figure out what I think.",
    skills: ["Rust", "Protocol Design", "Cryptography", "Technical Writing"],
    location: "Berlin, DE",
    statuses: ["building", "open-to-collabs"],
    currentProject: "Ledgerly",
    pastProjects: [
      { name: "Statefold", note: "Proof compression library, 2.1k stars" },
      { name: "Slow Payments", note: "An essay series that got out of hand" },
    ],
    contributions: [
      "Maintainer of statefold",
      "Wrote the beginner's guide to settlement proofs",
      "Mentored at Ship Week 2025",
    ],
    lookingFor: ["A designer who likes hard diagrams", "Early testers"],
    links: [
      { label: "Site", url: "https://example.com" },
      { label: "GitHub", url: "https://github.com" },
      { label: "X", url: "https://x.com" },
    ],
    stats: { projects: 3, hackathons: 8, collaborations: 12 },
    accent: "bg-lavender",
  },
  {
    id: "arjun-rao",
    name: "Arjun Rao",
    handle: "@arjun",
    roleLabel: "Design Engineer",
    role: "designer",
    bio: "Interfaces, motion, and the stubborn belief that software can feel nice.",
    about:
      "Ex-agency, now independent. I build design systems that survive contact with real teams, and I prototype in code because Figma lies about motion.",
    skills: ["React", "Motion", "Design Systems", "Typography"],
    location: "Bangalore, IN",
    statuses: ["available-for-work", "open-to-collabs"],
    currentProject: "Offset UI",
    pastProjects: [
      { name: "Tinyplot", note: "Charting library for people who hate charts" },
      { name: "Kerned", note: "A type-pairing tool, 40k monthly users" },
    ],
    contributions: ["Ran two workshops at Weekend Agents Jam", "Open-sourced Offset UI"],
    lookingFor: ["A backend partner", "Paid design engineering work"],
    links: [
      { label: "Site", url: "https://example.com" },
      { label: "GitHub", url: "https://github.com" },
    ],
    stats: { projects: 6, hackathons: 5, collaborations: 9 },
    accent: "bg-primary/20",
  },
  {
    id: "nora-fell",
    name: "Nora Fell",
    handle: "@norafell",
    roleLabel: "Founder",
    role: "founder",
    bio: "Building a writing tool for people who think by typing. Ten thousand users, no investors.",
    about:
      "Second-time founder. First one failed loudly. This one is small, profitable and much more fun. I do support tickets on Fridays.",
    skills: ["Product", "TypeScript", "Customer Research", "Writing"],
    location: "Lisbon, PT",
    statuses: ["building", "open-to-opportunities"],
    currentProject: "Quill",
    pastProjects: [{ name: "Blockhouse", note: "Team wiki. Sunset in 2023." }],
    contributions: ["Publishes monthly revenue notes", "Hosts the Lisbon builder dinner"],
    lookingFor: ["A founding engineer", "People to swap notes with"],
    links: [
      { label: "Site", url: "https://example.com" },
      { label: "X", url: "https://x.com" },
    ],
    stats: { projects: 2, hackathons: 3, collaborations: 7 },
    accent: "bg-lavender-deep/40",
  },
  {
    id: "sam-okafor",
    name: "Sam Okafor",
    handle: "@samok",
    roleLabel: "Researcher",
    role: "researcher",
    bio: "Works on evaluation. Mostly trying to prove that benchmarks are lying to us.",
    about:
      "Half academic, half engineer. I publish openly and I like collaborators who argue with me early rather than politely at the end.",
    skills: ["Python", "Evaluation", "Statistics", "Papers"],
    location: "Lagos, NG",
    statuses: ["open-to-collabs"],
    currentProject: "Honest Bench",
    pastProjects: [{ name: "Driftcheck", note: "Dataset drift detector" }],
    contributions: ["Three open datasets", "Reviewer for two workshops"],
    lookingFor: ["Engineers to productionise research", "A frontend person"],
    links: [{ label: "GitHub", url: "https://github.com" }],
    stats: { projects: 4, hackathons: 2, collaborations: 11 },
    accent: "bg-muted",
  },
  {
    id: "iris-lund",
    name: "Iris Lund",
    handle: "@irislund",
    roleLabel: "Writer & Editor",
    role: "writer",
    bio: "Writes about the people behind the tools. Allergic to founder mythology.",
    about:
      "I interview builders and try to keep the boring true parts in. Also edit other people's launch posts so they stop sounding like press releases.",
    skills: ["Longform", "Interviews", "Editing", "Newsletters"],
    location: "Copenhagen, DK",
    statuses: ["available-for-work"],
    currentProject: "Workbench Letters",
    pastProjects: [{ name: "Making Of", note: "52 interviews with independent builders" }],
    contributions: ["Edits the Rec Room digest", "Runs a free editing clinic monthly"],
    lookingFor: ["Interview subjects", "Editing clients"],
    links: [{ label: "Site", url: "https://example.com" }],
    stats: { projects: 2, hackathons: 1, collaborations: 15 },
    accent: "bg-lavender",
  },
  {
    id: "dev-patel",
    name: "Dev Patel",
    handle: "@devbuilds",
    roleLabel: "Community Builder",
    role: "community",
    bio: "Runs a 4,000 person build club that meets every single Tuesday.",
    about:
      "I care about attendance, not signups. Most of my job is remembering names and following up.",
    skills: ["Events", "Moderation", "Programming", "Discord"],
    location: "Toronto, CA",
    statuses: ["building", "open-to-opportunities"],
    currentProject: "Tuesday Club",
    pastProjects: [{ name: "Hack Nights TO", note: "60 events, ~3k attendees" }],
    contributions: ["Wrote the community moderation playbook", "Mentors first-time organisers"],
    lookingFor: ["Sponsors who don't want a logo wall", "Co-hosts"],
    links: [{ label: "Discord", url: "https://discord.com" }],
    stats: { projects: 1, hackathons: 12, collaborations: 20 },
    accent: "bg-primary/15",
  },
  {
    id: "lena-vogt",
    name: "Lena Vogt",
    handle: "@lenav",
    roleLabel: "Product Engineer",
    role: "product",
    bio: "Ships small features weekly. Talks to users more than to the team.",
    about:
      "I like the boring middle: onboarding, empty states, error copy. That's where products are won.",
    skills: ["TypeScript", "Postgres", "Product", "Analytics"],
    location: "Remote",
    statuses: ["open-to-collabs", "available-for-work"],
    currentProject: "Foldbook",
    pastProjects: [{ name: "Nudge", note: "Habit tool, acquired 2024" }],
    contributions: ["Open-sourced her onboarding checklist", "Ship Week judge"],
    lookingFor: ["Contract work", "A hackathon team"],
    links: [{ label: "GitHub", url: "https://github.com" }],
    stats: { projects: 5, hackathons: 6, collaborations: 8 },
    accent: "bg-muted",
  },
  {
    id: "theo-marchetti",
    name: "Theo Marchetti",
    handle: "@theom",
    roleLabel: "Hardware Tinkerer",
    role: "other",
    bio: "Makes objects that beep. Currently building a desk clock that shames you gently.",
    about:
      "Firmware by trade, junk-drawer engineer by temperament. I run soldering nights and lose a lot of screws.",
    skills: ["Firmware", "PCB Design", "C", "3D Printing"],
    location: "Amsterdam, NL",
    statuses: ["building"],
    currentProject: "Shame Clock",
    pastProjects: [{ name: "Parts Bin", note: "Open hardware inventory tracker" }],
    contributions: ["Runs Hardware Hack Night", "Publishes all board files"],
    lookingFor: ["An industrial designer", "Beta testers with desks"],
    links: [{ label: "GitHub", url: "https://github.com" }],
    stats: { projects: 7, hackathons: 9, collaborations: 4 },
    accent: "bg-lavender-deep/30",
  },
];

export const roleOptions: { value: BuilderRole; label: string }[] = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "founder", label: "Founder" },
  { value: "researcher", label: "Researcher" },
  { value: "writer", label: "Writer" },
  { value: "community", label: "Community" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" },
];

export const statusOptions: { value: BuilderStatus; label: string }[] = [
  { value: "open-to-collabs", label: "Looking for collaborators" },
  { value: "available-for-work", label: "Available for work" },
  { value: "building", label: "Building something" },
  { value: "open-to-opportunities", label: "Open to opportunities" },
];

export const statusLabel: Record<BuilderStatus, string> = {
  building: "Building",
  "open-to-collabs": "Open to collabs",
  "available-for-work": "Available for work",
  "open-to-opportunities": "Open to opportunities",
};

export const getBuilder = (id: string) => builders.find((b) => b.id === id);

export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
