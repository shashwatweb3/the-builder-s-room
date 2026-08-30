import type { FeedKind, FeedPost, RoomAnnouncement } from "./types";

/** Demo data. Replace with real community posts later — shapes stay the same. */
export const feedPosts: FeedPost[] = [
  {
    id: "post-lena-checklist",
    kind: "share",
    builderId: "lena-vogt",
    content:
      "Open-sourced my onboarding checklist. Took three failed products to learn most of this — steal it all.",
    postedAt: "2026-08-30T14:20:00Z",
    likes: 41,
    comments: [
      {
        id: "c-1",
        authorName: "Iris Lund",
        authorHandle: "@irislund",
        content: "The empty-state section alone is worth the read.",
        postedAt: "2026-08-30T15:02:00Z",
      },
    ],
  },
  {
    id: "post-arjun-backend",
    kind: "looking-for",
    builderId: "arjun-rao",
    content:
      "Anyone good at backend infra want to take the auth + sync layer of Offset UI? I want to stay in the frontend lane.",
    postedAt: "2026-08-30T11:40:00Z",
    likes: 19,
    comments: [
      {
        id: "c-2",
        authorName: "Sam Okafor",
        authorHandle: "@samok",
        content: "Not backend, but I know two people who are. DMs open.",
        postedAt: "2026-08-30T12:05:00Z",
      },
    ],
  },
  {
    id: "post-sam-evals",
    kind: "question",
    builderId: "sam-okafor",
    content:
      "How are people catching contamination in eval sets at build time? I'm now suspicious of three popular ones.",
    postedAt: "2026-08-29T18:15:00Z",
    likes: 27,
    comments: [
      {
        id: "c-3",
        authorName: "Nora Fell",
        authorHandle: "@norafell",
        content: "We just flag anything that appears verbatim in training data.",
        postedAt: "2026-08-29T19:01:00Z",
      },
    ],
  },
  {
    id: "post-maya-ledgerly",
    kind: "building",
    builderId: "maya-chen",
    content:
      "Weekend goal: Ledgerly linter covers the remaining failure modes. First external team already runs it in CI. Feels good.",
    postedAt: "2026-08-29T09:30:00Z",
    likes: 34,
    comments: [],
  },
  {
    id: "post-dev-tuesday",
    kind: "event",
    builderId: "dev-patel",
    content:
      "Tuesday Club again. Co-working first, then five-minute demos from whoever's brave. Come early, seats go fast.",
    postedAt: "2026-08-28T16:45:00Z",
    likes: 22,
    comments: [],
  },
  {
    id: "post-iris-interview",
    kind: "share",
    builderId: "iris-lund",
    content:
      "New in the digest: Dev Patel on how Tuesday Club survived four hosts quitting and a global pandemic. The boring answer: structure.",
    postedAt: "2026-08-28T08:20:00Z",
    likes: 31,
    comments: [],
  },
  {
    id: "post-nora-quill",
    kind: "launch",
    builderId: "nora-fell",
    content:
      "Quill crossed 10,000 paying users today. Still no investors, still shipping the draft timeline next week.",
    postedAt: "2026-08-27T21:10:00Z",
    likes: 76,
    comments: [
      {
        id: "c-4",
        authorName: "Lena Vogt",
        authorHandle: "@lenav",
        content: "10k on no investors is the flex of the year.",
        postedAt: "2026-08-27T21:48:00Z",
      },
    ],
  },
  {
    id: "post-theo-shameclock",
    kind: "building",
    builderId: "theo-marchetti",
    content:
      "Shame Clock Rev C boards arrived. Two of them even work. The third one is now a heater.",
    postedAt: "2026-08-26T19:55:00Z",
    likes: 44,
    comments: [],
  },
];

export const announcements: RoomAnnouncement[] = [
  {
    title: "Demo night is back",
    body: "Every Friday at 18:00 UTC. Five minutes, one demo, no slides. Come watch or come present.",
  },
  {
    title: "New here? Say hi",
    body: "Post an intro thread in the room. Tell people what you're building and what you're after.",
  },
  {
    title: "Looking for two moderators",
    body: "We want people who keep conversations warm, not rooms quiet. Ping us in the room.",
  },
];

export const feedKindMeta: Record<
  FeedKind,
  { label: string; tag: "default" | "purple" | "ghost" }
> = {
  building: { label: "Building", tag: "purple" },
  question: { label: "Question", tag: "default" },
  share: { label: "Share", tag: "ghost" },
  "looking-for": { label: "Looking for", tag: "default" },
  event: { label: "Event", tag: "purple" },
  launch: { label: "Launch", tag: "default" },
};
