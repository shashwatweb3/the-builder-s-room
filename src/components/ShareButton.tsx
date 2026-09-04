import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { opportunityPath } from "@/lib/opportunity";

type ShareButtonProps = {
  title: string;
  slug: string;
};

/**
 * Absolute share target for an opportunity. Built from the current origin so
 * the URL is correct locally and in production.
 */
function buildShareUrl(slug: string) {
  return typeof window === "undefined"
    ? opportunityPath(slug)
    : new URL(opportunityPath(slug), window.location.origin).href;
}

/**
 * Small, secondary share action for opportunity cards.
 *
 * Uses the native Web Share API when available; otherwise falls back to
 * copying the opportunity's public detail URL to the clipboard with a brief
 * "Link copied" confirmation. Cancelling the native share sheet is not an error.
 */
export function ShareButton({ title, slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(slug));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard unavailable; nothing sensible to do without an alert.
    }
  }, [slug]);

  const handleClick = useCallback(async () => {
    const url = buildShareUrl(slug);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: `Check out ${title} on Krew3.`, url });
      } catch (err) {
        // Ignore a user cancellation of the native share sheet. Any other
        // failure falls back to the clipboard.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          await copyToClipboard();
        }
      }
      return;
    }
    await copyToClipboard();
  }, [copyToClipboard, slug, title]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Share ${title}`}
      title={`Share ${title}`}
      className="relative z-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Share2 className="size-3.5" aria-hidden />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
