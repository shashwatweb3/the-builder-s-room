import { cn } from "@/lib/utils";
import { Dot } from "./StatusBadge";

const cards = [
  { kind: "Job", note: "Open now", pos: "left-[4%] top-[8%]", tilt: "-3deg", delay: "0s", tone: "bg-card" },
  { kind: "Hackathon", note: "7 days left", pos: "right-[5%] top-[3%]", tilt: "2.5deg", delay: "0.8s", tone: "bg-lavender" },
  { kind: "Residency", note: "Applications open", pos: "left-[8%] top-[42%]", tilt: "2deg", delay: "1.6s", tone: "bg-card" },
  { kind: "Ambassador", note: "Looking for builders", pos: "right-[6%] top-[38%]", tilt: "-2deg", delay: "0.4s", tone: "bg-card" },
  { kind: "Project", note: "Building", pos: "left-[26%] bottom-[5%]", tilt: "-1.5deg", delay: "1.2s", tone: "bg-primary text-primary-foreground" },
];

/** Original illustrative "room" — pure CSS, no stock imagery. */
export function HeroRoom() {
  return (
    <div
      aria-hidden
      className="grid-paper relative h-[420px] w-full overflow-hidden rounded-3xl border-2 border-border bg-background shadow-offset-lg sm:h-[480px] lg:h-[560px]"
    >
      <span className="label-mono absolute top-3 left-4 flex items-center gap-2 text-muted-foreground">
        <Dot /> The room
      </span>
      <span className="label-mono absolute top-3 right-4 text-muted-foreground">
        5 things happening
      </span>

      <span className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender/60 blur-2xl sm:size-56" />

      {cards.map((c) => (
        <div
          key={c.kind}
          style={
            {
              "--tilt": c.tilt,
              animationDelay: c.delay,
            } as React.CSSProperties
          }
          className={cn(
            "float-soft absolute w-[42%] max-w-[190px] rounded-2xl border-2 border-border p-3 shadow-offset sm:p-4",
            c.pos,
            c.tone,
          )}
        >
          <p className="label-mono opacity-70">{c.kind}</p>
          <p className="mt-1 text-sm leading-tight font-bold sm:text-base">
            {c.note}
          </p>
        </div>
      ))}
    </div>
  );
}
