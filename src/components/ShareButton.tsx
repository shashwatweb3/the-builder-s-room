import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { opportunityPath } from "@/lib/opportunity";

type ShareButtonProps = {
  title: string;
  slug: string;
  /** Path to the public detail page, e.g. "/events/my-slug". Defaults to the opportunity path. */
  path?: string;
};

/**
 * Absolute share target for a detail page. Built from the current origin so
 * the URL is correct locally and in production.
 */
function buildShareUrl(slug: string, path?: string) {
  const sharePath = path ?? opportunityPath(slug);
  return typeof window === "undefined"
    ? sharePath
    : new URL(sharePath, window.location.origin).href;
}

/**
 * Small, secondary share action for content cards.
 *
 * Uses the native Web Share API when available; otherwise falls back to
 * copying the item's public detail URL to the clipboard with a brief
 * "Link copied" confirmation. Cancelling the native share sheet is not an error.
 */
export function ShareButton({ title, slug, path }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(slug, path));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard unavailable; nothing sensible to do without an alert.
    }
  }, [path, slug]);

  const handleClick = useCallback(async () => {
    const url = buildShareUrl(slug, path);
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
  }, [copyToClipboard, path, slug, title]);

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
