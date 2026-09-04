import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/Button";
import { Dot } from "@/components/StatusBadge";
import { JoinCTA } from "@/components/JoinCTA";
import { formatShortDate } from "@/lib/format";
import type { FeedComment, FeedKind, FeedPost, RoomAnnouncement } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room")({
  head: () => ({
    meta: [
      { title: "The Krew — Krew3" },
      {
        name: "description",
        content:
          "The Krew feed. Builders share what they're making, ask questions, find collaborators and post what's happening.",
      },
      { property: "og:title", content: "The Krew — Krew3" },
      {
        property: "og:description",
        content: "See what everyone's working on.",
      },
    ],
  }),
  component: RoomPage,
});

const kindOptions: { value: FeedKind; label: string }[] = [
  { value: "building", label: "Building" },
  { value: "question", label: "Question" },
  { value: "share", label: "Share" },
  { value: "looking-for", label: "Looking for" },
  { value: "event", label: "Event" },
  { value: "launch", label: "Launch" },
];

const feedKindMeta: Record<FeedKind, { label: string; tag: "purple" | "ghost" }> = {
  building: { label: "Building", tag: "purple" },
  question: { label: "Question", tag: "ghost" },
  share: { label: "Share", tag: "ghost" },
  "looking-for": { label: "Looking for", tag: "purple" },
  event: { label: "Event", tag: "ghost" },
  launch: { label: "Launch", tag: "purple" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const announcements: RoomAnnouncement[] = [];

function RoomPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [addedComments, setAddedComments] = useState<Record<string, FeedComment[]>>({});
  const [kind, setKind] = useState<FeedKind>("building");
  const [draft, setDraft] = useState("");

  const toggleSet = (set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const like = (id: string) => {
    const adding = !liked.has(id);
    setLiked((s) => toggleSet(s, id));
    if (adding) toast("Liked it.");
  };

  const bookmark = (id: string, label: string) => {
    const adding = !saved.has(id);
    setSaved((s) => toggleSet(s, id));
    toast(adding ? "Bookmarked for later." : "Removed from bookmarks.", {
      description: adding ? label : undefined,
    });
  };

  const addPost = () => {
    const text = draft.trim();
    if (!text) return;
    const post: FeedPost = {
      id: `you-${Date.now()}`,
      kind,
      authorName: "You",
      authorRole: "Just arrived",
      content: text,
      postedAt: new Date().toISOString(),
      likes: 0,
      comments: [],
    };
    setPosts((p) => [post, ...p]);
    setDraft("");
    toast("Posted to the Krew.", { description: "The Krew sees you now." });
  };

  const addComment = (id: string, text: string) => {
    if (!text.trim()) return;
    const comment: FeedComment = {
      id: `c-${Date.now()}`,
      authorName: "You",
      authorHandle: "@you",
      content: text.trim(),
      postedAt: new Date().toISOString(),
    };
    setAddedComments((m) => ({ ...m, [id]: [...(m[id] ?? []), comment] }));
    toast("Comment added.");
  };

  return (
    <>
      <PageHero
        label="The Krew"
        title="Welcome to the Krew."
        aside={
          <OffsetCard size="sm" className="flex items-center gap-3 px-5 py-4">
            <Dot />
            <div>
              <p className="label-mono text-muted-foreground">In the Krew</p>
              <p className="text-2xl font-extrabold tracking-tight">{posts.length}</p>
            </div>
          </OffsetCard>
        }
      >
        See what everyone's working on.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.8fr_1fr] lg:items-start">
          {/* FEED */}
          <div className="min-w-0">
            {/* COMPOSER */}
            <OffsetCard tone="lavender" className="p-5 sm:p-6">
              <p className="label-mono text-muted-foreground">Post something in the Krew</p>
              <FilterBar
                ariaLabel="Choose post type"
                className="mt-4"
                value={kind}
                onChange={(v) => setKind(v as FeedKind)}
                options={kindOptions}
              />
              <label htmlFor="room-draft" className="sr-only">
                Post content
              </label>
              <textarea
                id="room-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What are you building, asking, or sharing?"
                className="mt-4 min-h-28 w-full resize-y rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="label-mono text-muted-foreground">
                  Be kind. The Krew remembers.
                </span>
                <Button size="md" onClick={addPost} disabled={!draft.trim()}>
                  Post to the Krew →
                </Button>
              </div>
            </OffsetCard>

            {/* POSTS */}
            <div className="mt-8 space-y-6">
              {posts.length === 0 ? (
                <OffsetCard className="p-8 text-center">
                  <p className="label-mono text-muted-foreground">
                    The Krew is quiet. Be the first to post something.
                  </p>
                </OffsetCard>
              ) : (
                posts.map((post) => {
                  const name = post.authorName ?? "Someone in the Krew";
                  const handle = post.authorHandle;
                  const role = post.authorRole;
                  const kindMeta = feedKindMeta[post.kind];
                  const likes = post.likes + (liked.has(post.id) ? 1 : 0);
                  const commentCount = post.comments.length + (addedComments[post.id]?.length ?? 0);
                  const commentsOpen = openComments.has(post.id);
                  const isLiked = liked.has(post.id);
                  const isSaved = saved.has(post.id);

                  return (
                    <OffsetCard
                      key={post.id}
                      as="article"
                      className="flex flex-col gap-3 p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <span
                          aria-hidden
                          className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-border text-sm font-extrabold shadow-offset-sm bg-lavender"
                        >
                          {initials(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{name}</p>
                          <p className="label-mono truncate text-muted-foreground">
                            {handle ?? role?.toLowerCase()}
                          </p>
                        </div>
                        <Tag tone={kindMeta.tag}>{kindMeta.label}</Tag>
                      </div>

                      <p className="text-base leading-relaxed sm:text-lg">{post.content}</p>

                      <div className="mt-auto flex flex-wrap items-center gap-2 border-t-2 border-dashed border-foreground/15 pt-3">
                        <button
                          type="button"
                          onClick={() => like(post.id)}
                          aria-pressed={isLiked}
                          className={cn(
                            "press label-mono inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-border px-3 shadow-offset-sm",
                            isLiked ? "bg-primary text-primary-foreground" : "bg-card",
                          )}
                        >
                          <Heart
                            className={cn("size-3.5", isLiked && "fill-current")}
                            aria-hidden
                          />
                          {likes}
                        </button>
                        <button
                          type="button"
                          aria-pressed={commentsOpen}
                          aria-label={`Comments on ${name}'s post`}
                          onClick={() => setOpenComments((s) => toggleSet(s, post.id))}
                          className="press label-mono inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 shadow-offset-sm"
                        >
                          <MessageCircle className="size-3.5" aria-hidden />
                          {commentCount}
                        </button>
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          aria-label={isSaved ? "Remove bookmark" : "Bookmark post"}
                          onClick={() => bookmark(post.id, name)}
                          className={cn(
                            "press label-mono inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-border px-3 shadow-offset-sm",
                            isSaved ? "bg-primary text-primary-foreground" : "bg-card",
                          )}
                        >
                          <Bookmark
                            className={cn("size-3.5", isSaved && "fill-current")}
                            aria-hidden
                          />
                          {isSaved ? "Saved" : "Save"}
                        </button>

                        <span className="label-mono ml-auto text-muted-foreground">
                          {formatShortDate(post.postedAt.slice(0, 10))}
                        </span>
                      </div>

                      {commentsOpen && (
                        <div className="mt-2 space-y-3 rounded-2xl border-2 border-dashed border-foreground/20 p-3 sm:p-4">
                          {[...post.comments, ...(addedComments[post.id] ?? [])].map((c) => (
                            <div key={c.id} className="flex gap-3">
                              <span
                                aria-hidden
                                className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-border bg-lavender text-[0.6rem] font-extrabold"
                              >
                                {initials(c.authorName)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold">
                                  {c.authorName}
                                  {c.authorHandle && (
                                    <span className="label-mono ml-2 font-normal text-muted-foreground">
                                      {c.authorHandle}
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{c.content}</p>
                              </div>
                            </div>
                          ))}
                          <CommentForm onAdd={(t) => addComment(post.id, t)} />
                        </div>
                      )}
                    </OffsetCard>
                  );
                })
              )}
            </div>
          </div>

          {/* RAIL */}
          <aside className="space-y-8 lg:sticky lg:top-24">
            <div>
              <SectionLabel>Announcements</SectionLabel>
              <div className="mt-4 space-y-4">
                {announcements.length === 0 ? (
                  <OffsetCard className="p-5">
                    <p className="label-mono text-muted-foreground">No announcements yet.</p>
                  </OffsetCard>
                ) : (
                  announcements.map((a) => (
                    <OffsetCard key={a.title} className="p-5">
                      <span className="grid size-9 place-items-center rounded-lg border-2 border-border bg-lavender">
                        <Megaphone className="size-4" aria-hidden />
                      </span>
                      <p className="mt-3 font-extrabold">{a.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    </OffsetCard>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-3">
                <SectionLabel>Up next</SectionLabel>
                <Link
                  to="/events"
                  className="label-mono font-semibold underline-offset-4 hover:underline"
                >
                  All events
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                <OffsetCard className="p-5">
                  <p className="label-mono text-muted-foreground">No upcoming events yet.</p>
                </OffsetCard>
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-3">
                <SectionLabel>People to meet</SectionLabel>
                <Link
                  to="/builders"
                  className="label-mono font-semibold underline-offset-4 hover:underline"
                >
                  All builders
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                <OffsetCard className="p-5">
                  <p className="label-mono text-muted-foreground">No builders to meet yet.</p>
                </OffsetCard>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}

function CommentForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue("");
      }}
    >
      <label htmlFor="comment-draft" className="sr-only">
        Add a comment
      </label>
      <input
        id="comment-draft"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Say something useful…"
        className="min-h-11 flex-1 rounded-full border-2 border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground"
      />
      <Button type="submit" size="sm" disabled={!value.trim()}>
        Comment
      </Button>
    </form>
  );
}
