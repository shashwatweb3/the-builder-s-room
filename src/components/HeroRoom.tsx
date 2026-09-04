export function HeroRoom() {
  return (
    <div
      aria-hidden
      className="grid-paper relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-background p-4 shadow-offset-lg sm:min-h-[460px] sm:p-0 lg:min-h-[500px]"
    >
      {/* Subtle lavender glow behind the sign */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender/60 blur-3xl sm:size-80" />

      {/* The main object: physical Krew3 sign */}
      <div className="relative z-10 flex flex-col items-center rounded-2xl border-2 border-border bg-lavender px-8 py-7 text-center shadow-offset-lg sm:rounded-3xl sm:border-[3px] sm:px-14 sm:py-10 sm:rotate-[-1.5deg] lg:px-16">
        <p className="text-center text-3xl leading-[0.92] font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          KREW
          <br />3
        </p>
        <p className="label-mono mt-4 text-muted-foreground sm:mt-5 sm:text-sm">
          BUILD · LEARN · HELP
        </p>
      </div>

      {/* Tiny decorative details — corner pin + bits of tape */}
      <span className="pointer-events-none absolute top-[18%] right-[11%] size-2 rounded-full bg-primary shadow-offset-sm sm:top-[20%]" />
      <span className="pointer-events-none absolute top-[8%] left-[12%] block h-4 w-14 rotate-[8deg] rounded-sm border border-border bg-card opacity-80 shadow-offset-sm" />
      <span className="pointer-events-none absolute right-[14%] bottom-[16%] block h-3.5 w-14 -rotate-[12deg] rounded-sm border border-border bg-lavender-deep/30 opacity-80 shadow-offset-sm" />
    </div>
  );
}
