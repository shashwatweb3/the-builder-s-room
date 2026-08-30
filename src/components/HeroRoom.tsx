import { cn } from "@/lib/utils";
import { Dot } from "./StatusBadge";

const cards = [
  {
    kind: "Builder",
    note: "Looking for someone to ship with",
    sm: "sm:left-[5%] sm:top-[16%] sm:w-[44%]",
    tilt: "-2.5deg",
    delay: "0s",
    tone: "bg-card",
  },
  {
    kind: "Project",
    note: "Building something weird",
    sm: "sm:right-[5%] sm:top-[11%] sm:w-[44%]",
    tilt: "2deg",
    delay: "0.8s",
    tone: "bg-lavender",
  },
  {
    kind: "Discussion",
    note: "“What are you building?”",
    sm: "sm:right-4 sm:left-4 sm:bottom-[7%] sm:mx-auto sm:w-fit sm:max-w-[240px]",
    tilt: "-1.5deg",
    delay: "1.6s",
    tone: "bg-primary text-primary-foreground",
  },
];

/** Pure CSS "room" notice board — no stock imagery. */
export function HeroRoom() {
  return (
    <div
      aria-hidden
      className="grid-paper relative flex min-h-[400px] flex-col rounded-3xl border-2 border-border bg-background p-4 shadow-offset-lg sm:block sm:h-[460px] sm:min-h-0 sm:p-0 lg:h-[520px]"
    >
      <span className="label-mono flex items-center gap-2 text-muted-foreground sm:absolute sm:top-3 sm:left-4">
        <Dot /> The room
      </span>

      <div className="relative mt-3 flex flex-1 flex-col justify-center gap-3 sm:static sm:mt-0 sm:h-full sm:block">
        <span
          className={cn(
            "absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender/70 blur-3xl",
            "sm:size-64",
          )}
        />

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
              "w-full rounded-2xl border-2 border-border p-4 shadow-offset sm:absolute sm:p-5 sm:float-soft",
              c.sm,
              c.tone,
            )}
          >
            <p className="label-mono opacity-70">{c.kind}</p>
            <p className="mt-1.5 text-base leading-tight font-bold sm:text-lg">{c.note}</p>
          </div>
        ))}
      </div>

      <span className="label-mono mt-3 text-muted-foreground sm:absolute sm:right-4 sm:bottom-3">
        People building things
      </span>
    </div>
  );
}
