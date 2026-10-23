import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Compass,
  GraduationCap,
  Hammer,
  Plus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";
import { SectionLabel } from "./SectionLabel";
import { Tag } from "./Tag";
import { useQuests } from "@/lib/quests";
import {
  MAX_LINKS_PER_QUEST,
  questDefinition,
  questMilestones,
  questProgress,
  resolveQuestLink,
  sortLinks,
  type Quest,
  type QuestCategory,
  type QuestDefinition,
} from "@/lib/quests-core";
import { formatMonthYear, formatShortDate, formatTimeRange } from "@/lib/format";
import { parseTimeToMinutes } from "@/lib/schedule-conflicts";
import { cn } from "@/lib/utils";
import type { RecEvent } from "@/data/types";

const ICONS: Record<QuestCategory, LucideIcon> = {
  learn: GraduationCap,
  meet: Users,
  build: Hammer,
  explore: Compass,
};

/**
 * Optional goals layered on top of My Schedule.
 * Everything is self-reported, device-local and reversible.
 */
export function Sidequests({ events }: { events: RecEvent[] }) {
  const { quests, hydrated, count, completedCount, addQuest } = useQuests();

  const remaining = (["learn", "meet", "build", "explore"] as const)
    .filter((category) => !quests.some((quest) => quest.category === category))
    .map((category) => questDefinition(category));

  return (
    <section
      id="sidequests"
      aria-labelledby="sidequests-title"
      className="scroll-mt-24 border-t-2 border-border pt-8 sm:pt-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <SectionLabel>Sidequests · optional</SectionLabel>
          <h2
            id="sidequests-title"
            className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Give the week a shape.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Pick a goal, link a few events, and mark them done once you&apos;ve been. Self-reported,
            stored on this device, and entirely optional.
          </p>
        </div>
        {hydrated && count > 0 && (
          <p className="label-mono text-muted-foreground">
            {completedCount} of {count} marked complete
          </p>
        )}
      </div>

      {!hydrated ? (
        <p className="mt-6 text-sm text-muted-foreground">Reading your sidequests…</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {quests.map((quest) => (
            <QuestCard key={quest.category} quest={quest} events={events} />
          ))}

          {remaining.length > 0 && (
            <div className={quests.length ? "mt-2" : undefined}>
              <p className="label-mono text-muted-foreground">
                {quests.length ? "Add another sidequest" : "Choose a sidequest"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {remaining.map((definition) => (
                  <GoalCard
                    key={definition.id}
                    definition={definition}
                    onAdd={() => addQuest(definition.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {quests.length > 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Progress is self-reported. Krew3 doesn&apos;t verify attendance, track your location,
              or share this with anyone.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function GoalCard({ definition, onAdd }: { definition: QuestDefinition; onAdd: () => void }) {
  const Icon = ICONS[definition.id];
  return (
    <OffsetCard
      tone="ivory"
      size="sm"
      className="flex flex-col gap-3 p-4"
      data-goal={definition.id}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-border bg-lavender">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm leading-snug font-extrabold tracking-tight">{definition.title}</h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{definition.blurb}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="self-start px-0" onClick={onAdd}>
        <Plus className="size-4" aria-hidden /> Add sidequest
      </Button>
    </OffsetCard>
  );
}

function QuestCard({ quest, events }: { quest: Quest; events: RecEvent[] }) {
  const { removeQuest, linkEvent, unlinkEvent, toggleLinkDone, setQuestCompleted } = useQuests();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const definition = questDefinition(quest.category);
  const Icon = ICONS[quest.category];
  const progress = questProgress(quest);
  const milestones = questMilestones(progress);
  const links = sortLinks(quest.links);

  const liveBySlug = useMemo(() => new Map(events.map((event) => [event.slug, event])), [events]);

  return (
    <OffsetCard size="sm" className="p-4 sm:p-5" data-quest={quest.category}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-border bg-lavender">
          <Icon className="size-4" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="label-mono text-muted-foreground">Sidequest</p>
          <h3 className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight">
            {definition.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{definition.prompt}</p>
        </div>

        {confirmRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
              Keep
            </Button>
            <Button variant="outline" size="sm" onClick={() => removeQuest(quest.category)}>
              Remove
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${definition.title} sidequest`}
            title="Remove sidequest"
            className="press grid size-8 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-foreground shadow-offset-sm hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="label-mono text-muted-foreground">
            {progress.total === 0
              ? "No events linked yet"
              : `${progress.done} of ${progress.total} marked done`}
          </p>
          <p className="label-mono text-muted-foreground">{progress.percent}%</p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label={`${definition.title} progress`}
          className="mt-1.5 h-2 overflow-hidden rounded-full border-2 border-border bg-background"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {(milestones.started || milestones.allDone || progress.completed) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {milestones.started && (
              <Tag compact tone="purple">
                Started
              </Tag>
            )}
            {milestones.halfway && !milestones.allDone && (
              <Tag compact tone="purple">
                Halfway
              </Tag>
            )}
            {milestones.allDone && (
              <Tag compact tone="purple">
                All events done
              </Tag>
            )}
            {progress.completed && (
              <Tag compact tone="default">
                Sidequest complete
              </Tag>
            )}
          </div>
        )}
      </div>

      {links.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {links.map((link) => {
            const resolved = resolveQuestLink(link, liveBySlug.get(link.slug));
            const { name, date, available } = resolved;
            const timeRange = formatTimeRange(resolved.startTime, resolved.endTime);
            return (
              <li
                key={link.slug}
                className="flex items-start gap-2.5 rounded-xl border-2 border-border bg-background/70 p-2.5"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={link.done}
                  aria-label={link.done ? `Reopen ${name}` : `Mark ${name} done`}
                  onClick={() => toggleLinkDone(quest.category, link.slug)}
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 border-border transition-colors",
                    link.done
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-lavender/60",
                  )}
                >
                  {link.done && <Check className="size-3.5" aria-hidden />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {available ? (
                      <Link
                        to="/events/$id"
                        params={{ id: link.slug }}
                        className={cn(
                          "text-sm leading-snug font-bold underline-offset-2 hover:text-primary hover:underline",
                          link.done && "text-muted-foreground line-through decoration-2",
                        )}
                      >
                        {name}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "text-sm leading-snug font-bold",
                          link.done && "text-muted-foreground line-through decoration-2",
                        )}
                      >
                        {name}
                      </span>
                    )}
                    {!available && (
                      <Tag compact tone="ghost">
                        Not in the directory
                      </Tag>
                    )}
                  </div>
                  <p className="label-mono mt-0.5 text-muted-foreground">
                    {date ? formatShortDate(date) : "Date TBA"}
                    {timeRange ? ` · ${timeRange}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => unlinkEvent(quest.category, link.slug)}
                  aria-label={`Remove ${name} from this sidequest`}
                  title="Remove event"
                  className="press grid size-7 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-border/50 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <EventPicker quest={quest} events={events} onLink={linkEvent} />

        <Button
          variant={progress.completed ? "outline" : progress.allDone ? "primary" : "soft"}
          size="sm"
          onClick={() => setQuestCompleted(quest.category, !progress.completed)}
          className="shrink-0"
        >
          {progress.completed ? "Reopen sidequest" : "Mark sidequest complete"}
        </Button>
      </div>
    </OffsetCard>
  );
}

function EventPicker({
  quest,
  events,
  onLink,
}: {
  quest: Quest;
  events: RecEvent[];
  onLink: (category: QuestCategory, event: RecEvent) => void;
}) {
  const groups = useMemo(() => {
    const linked = new Set(quest.links.map((link) => link.slug));
    const candidates = events
      .filter((event) => !linked.has(event.slug))
      .slice()
      .sort((a, b) => {
        if (!a.date && !b.date) return a.name.localeCompare(b.name);
        if (!a.date) return 1;
        if (!b.date) return -1;
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        const aTime = parseTimeToMinutes(a.startTime);
        const bTime = parseTimeToMinutes(b.startTime);
        if (aTime === null && bTime === null) return a.name.localeCompare(b.name);
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return aTime - bTime || a.name.localeCompare(b.name);
      });

    const buckets = new Map<string, RecEvent[]>();
    for (const event of candidates) {
      const key = event.date ? event.date.slice(0, 7) : "tba";
      const bucket = buckets.get(key);
      if (bucket) bucket.push(event);
      else buckets.set(key, [event]);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => {
        if (a === "tba") return 1;
        if (b === "tba") return -1;
        return a.localeCompare(b);
      })
      .map(([key, bucket]) => ({
        key,
        label: key === "tba" ? "Date TBA" : formatMonthYear(key),
        events: bucket,
      }));
  }, [events, quest.links]);

  if (quest.links.length >= MAX_LINKS_PER_QUEST) {
    return (
      <p className="text-xs text-muted-foreground">
        This sidequest has {MAX_LINKS_PER_QUEST} linked events. Remove one to add another.
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Every directory event is already linked.</p>
    );
  }

  return (
    <label className="flex w-full flex-col gap-1 sm:max-w-[320px]">
      <span className="label-mono text-muted-foreground">Link a directory event</span>
      <select
        value=""
        onChange={(event) => {
          const slug = event.target.value;
          event.currentTarget.value = "";
          if (!slug) return;
          const match = events.find((candidate) => candidate.slug === slug);
          if (match) onLink(quest.category, match);
        }}
        className="min-h-10 w-full rounded-full border-2 border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Choose an event…</option>
        {groups.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.events.map((event) => (
              <option key={event.slug} value={event.slug}>
                {event.name}
                {event.date ? ` — ${formatShortDate(event.date)}` : " — Date TBA"}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
