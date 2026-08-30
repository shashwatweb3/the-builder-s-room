import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart, MessageCircle } from "lucide-react";
import type { FeedPost } from "@/data/types";
import { getBuilder, initials } from "@/data/builders";
import { feedKindMeta } from "@/data/feed";
import { formatShortDate } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";

export function FeedPostCard({ post, className }: { post: FeedPost; className?: string }) {
  const builder = post.builderId ? getBuilder(post.builderId) : null;
  const name = builder?.name ?? post.authorName ?? "Someone in the room";
  const handle = builder?.handle ?? post.authorHandle;
  const role = builder?.roleLabel ?? post.authorRole;
  const kind = feedKindMeta[post.kind];

  return (
    <OffsetCard className={cn("flex h-full flex-col gap-3 p-5 sm:p-6", className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl border-2 border-border text-sm font-extrabold shadow-offset-sm",
            builder?.accent ?? "bg-lavender",
          )}
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{name}</p>
          <p className="label-mono truncate text-muted-foreground">
            {handle ?? role?.toLowerCase()}
          </p>
        </div>
        <Tag tone={kind.tag}>{kind.label}</Tag>
      </div>

      <p className="text-base leading-relaxed sm:text-lg">{post.content}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-3">
        <span className="label-mono flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5" aria-hidden /> {post.likes}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" aria-hidden /> {post.comments.length}
          </span>
          <span className="hidden sm:inline">{formatShortDate(post.postedAt.slice(0, 10))}</span>
        </span>
        <Link
          to="/room"
          className="label-mono inline-flex items-center gap-1 font-semibold text-foreground underline-offset-4 hover:underline"
        >
          In the room
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </OffsetCard>
  );
}
