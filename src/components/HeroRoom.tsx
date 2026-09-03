import { cn } from "@/lib/utils";
import { Dot } from "./StatusBadge";

const notes = [
  {
    kind: "Project",
    note: "Building something weird",
    tape: "bg-lavender",
    mobileOrder: "order-2",
    smPos: "sm:absolute sm:left-[3%] sm:top-[6%] sm:w-[38%] sm:z-20 sm:shadow-offset",
    tilt: "1.5deg",
    delay: "0.8s",
  },
  {
    kind: "Event",
    note: "Demo Night — Friday",
    tape: "bg-card",
    mobileOrder: "order-3",
    smPos: "sm:absolute sm:right-[3%] sm:top-[4%] sm:w-[38%] sm:z-20 sm:shadow-offset",
    tilt: "-2deg",
    delay: "1.2s",
  },
  {
    kind: "Opportunity",
    note: "Hackathon applications open",
    tape: "bg-lavender-deep/30",
    mobileOrder: "order-4",
    smPos: "sm:absolute sm:left-[22%] sm:bottom-[5%] sm:w-[56%] sm:z-20 sm:shadow-offset-sm",
    tilt: "0.8deg",
    delay: "1.6s",
  },
];

export function HeroRoom() {
  return (
    <div
      aria-hidden
      className="grid-paper relative flex flex-col rounded-3xl border-2 border-border bg-background p-4 shadow-offset-lg sm:h-[460px] sm:p-0 lg:h-[500px]"
    >
      <span className="label-mono flex items-center gap-2 text-muted-foreground sm:absolute sm:top-3 sm:left-4 sm:z-30">
        <Dot /> The room
      </span>

      {/* Mobile: stacked column. Desktop: relative container for absolute children */}
      <div className="relative mt-3 flex flex-1 flex-col items-stretch gap-3 sm:mt-0 sm:h-full sm:flex-row sm:items-center sm:justify-center sm:gap-0">
        {/* Lavender glow — sits behind everything */}
        <span className="pointer-events-none absolute top-1/2 left-1/2 z-0 hidden size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender/60 blur-3xl sm:block sm:size-64" />

        {/* Centerpiece — large REC ROOM sign */}
        <div className="order-1 z-10 mb-1 rounded-2xl border-2 border-border bg-lavender p-5 sm:absolute sm:left-[20%] sm:top-[15%] sm:mb-0 sm:flex sm:w-[60%] sm:flex-col sm:items-center sm:justify-center sm:rounded-3xl sm:border-[3px] sm:p-8 sm:shadow-offset-lg sm:rotate-[-1.5deg]">
          <p className="text-2xl leading-none font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            THE REC ROOM
          </p>
          <p className="label-mono mt-2 sm:mt-3 sm:text-sm">BUILD · LEARN · SHARE</p>
        </div>

        {/* Three pinned notes */}
        {notes.map((n) => (
          <div
            key={n.kind}
            style={
              {
                "--tilt": n.tilt,
                animationDelay: n.delay,
              } as React.CSSProperties
            }
            className={cn(
              "w-full rounded-xl border-2 border-border bg-card p-4 shadow-offset-sm float-soft",
              n.mobileOrder,
              n.smPos,
            )}
          >
            <span className={cn("mb-2 block h-1.5 w-8 rounded-full", n.tape)} />
            <p className="label-mono opacity-60">{n.kind}</p>
            <p className="mt-1 text-sm leading-snug font-bold sm:text-base">{n.note}</p>
          </div>
        ))}
      </div>

      <span className="label-mono mt-2 text-right text-muted-foreground sm:absolute sm:right-4 sm:bottom-3 sm:z-30">
        People building things
      </span>
    </div>
  );
}
