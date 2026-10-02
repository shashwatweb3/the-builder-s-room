import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

const TELEGRAM_CTA_URL = "https://t.me/+wWXPenW-mUNjNmI1";
const POPUP_DELAY_MS = 5000;
const POPUP_SHOWN_KEY = "krew3_events_community_popup_shown";

function readPopupShown(): boolean {
  try {
    return window.sessionStorage.getItem(POPUP_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function writePopupShown() {
  try {
    window.sessionStorage.setItem(POPUP_SHOWN_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

/**
 * Non-blocking Telegram community nudge for the Krew3 Events page.
 *
 * Shows exactly ONCE per browser session, 5s after the visitor enters
 * /events. A sessionStorage flag is set the moment it first appears, so it
 * never returns after being closed, after rerenders or remounts, when
 * switching between the Devcon and Pre-Devcon views, or on refresh. The
 * single timeout is cleared on unmount so it stops as soon as the visitor
 * navigates away. It is a fixed, non-modal aside — pointer-events are only
 * enabled on the card itself so the page underneath stays scrollable and
 * fully usable. The URL is intentionally local rather than the shared
 * TELEGRAM_INVITE_URL so other pages keep their existing invite link.
 */
export function EventsTelegramPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readPopupShown()) return;

    const timer = window.setTimeout(() => {
      writePopupShown();
      setOpen(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      data-testid="events-telegram-popup"
      role="complementary"
      aria-label="Join the Krew3 Telegram community"
      className="rise-in pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end sm:px-0 sm:pb-0"
    >
      <div className="pointer-events-auto relative w-full max-w-[360px] rounded-2xl border-2 border-border bg-background p-5 shadow-offset-lg sm:w-[360px]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss the Krew3 Telegram popup"
          className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full border-2 border-border bg-card text-foreground transition-colors hover:bg-lavender focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>

        <SectionLabel dot={false}>Krew3 Community</SectionLabel>

        <h2 className="mt-2 pr-8 text-lg leading-tight font-extrabold tracking-tight">
          Want the updates first?
        </h2>

        <p className="mt-2 pr-8 text-sm leading-snug text-muted-foreground">
          Join the Krew3 Telegram community for exclusive updates on hackathons, residencies, jobs,
          opportunities and more.
        </p>

        <Button asChild size="md" className="mt-4 w-full">
          <a
            href={TELEGRAM_CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the Krew on Telegram (opens in a new tab)"
          >
            Join the Krew →
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>

        <p className="label-mono mt-3 text-center text-muted-foreground">Be a member of Krew3.</p>
      </div>
    </div>
  );
}
