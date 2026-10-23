import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Copy, Download, ImageIcon, Share2, X } from "lucide-react";
import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";
import { SectionLabel } from "./SectionLabel";
import {
  buildScheduleIcs,
  scheduleCalendarFilename,
  type CalendarEventInput,
} from "@/lib/calendar";
import { downloadBlob, downloadText } from "@/lib/download";
import {
  renderScheduleCard,
  scheduleAsText,
  type CardEvent,
  type RenderedCard,
} from "@/lib/schedule-card";
import { cn } from "@/lib/utils";

export type ScheduleToolEvent = CalendarEventInput;

interface ScheduleToolsProps {
  entries: ScheduleToolEvent[];
  className?: string;
}

type Status = { tone: "success" | "info" | "error"; text: string };

interface Preview {
  url: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  scale: number;
}

const CARD_FILENAME = "krew3-week-card.png";

function skippedSummary(names: string[]): string {
  if (names.length === 1) return `1 event without a confirmed date (“${names[0]}”)`;
  if (names.length === 2) {
    return `2 events without confirmed dates (“${names[0]}”, “${names[1]}”)`;
  }
  return `${names.length} events without confirmed dates`;
}

/**
 * Calendar + share-card actions for the personal schedule.
 *
 * Everything happens on-device: the .ics file is a Blob download, the card is
 * drawn on a canvas, and nothing is sent to a server. Copying falls back to a
 * plain-text summary because there is intentionally no public schedule URL.
 */
export function ScheduleTools({ entries, className }: ScheduleToolsProps) {
  const [busy, setBusy] = useState<"ics" | "card" | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => clearPreviewUrl, [clearPreviewUrl]);

  // The card is a snapshot; drop it when the saved set changes so a removed
  // event can never linger in a preview the user might share.
  useEffect(() => {
    clearPreviewUrl();
    setPreview(null);
    setStatus(null);
  }, [entries, clearPreviewUrl]);

  const hasEvents = entries.length > 0;

  const exportCalendar = useCallback(() => {
    if (!hasEvents) {
      setStatus({
        tone: "error",
        text: "Your schedule is empty. Save an event first, then export it here.",
      });
      return;
    }

    const result = buildScheduleIcs(entries, { calendarName: "Krew3 — My Devcon week" });
    if (!result.ics) {
      setStatus({
        tone: "error",
        text: `Nothing to export yet — ${skippedSummary(result.skipped.map((event) => event.name))}.`,
      });
      return;
    }

    downloadText(result.ics, scheduleCalendarFilename(), "text/calendar;charset=utf-8");

    if (result.partial) {
      setStatus({
        tone: "info",
        text: `Exported ${result.included} event${result.included === 1 ? "" : "s"}. Skipped ${skippedSummary(
          result.skipped.map((event) => event.name),
        )}.`,
      });
    } else {
      setStatus({
        tone: "success",
        text: `Exported ${result.included} event${result.included === 1 ? "" : "s"} to your calendar.`,
      });
    }
  }, [entries, hasEvents]);

  const createCard = useCallback(async () => {
    if (!hasEvents) {
      setStatus({
        tone: "error",
        text: "Your schedule is empty. Save an event first, then create a card.",
      });
      return;
    }

    setBusy("card");
    setStatus({ tone: "info", text: "Building your card…" });
    try {
      const rendered: RenderedCard = await renderScheduleCard(entries as CardEvent[]);
      const url = URL.createObjectURL(rendered.blob);
      clearPreviewUrl();
      previewUrlRef.current = url;
      setPreview({
        url,
        blob: rendered.blob,
        filename: CARD_FILENAME,
        width: rendered.width,
        height: rendered.height,
        scale: rendered.scale,
      });
      setStatus({
        tone: "success",
        text: `Card ready — ${entries.length} event${entries.length === 1 ? "" : "s"}.`,
      });
    } catch {
      setStatus({
        tone: "error",
        text: "The card could not be created in this browser. Your calendar export still works.",
      });
    } finally {
      setBusy(null);
    }
  }, [clearPreviewUrl, entries, hasEvents]);

  const downloadCard = useCallback(() => {
    if (!preview) return;
    downloadBlob(preview.blob, preview.filename);
    setStatus({ tone: "success", text: "Card downloaded as a PNG." });
  }, [preview]);

  const shareCard = useCallback(async () => {
    if (!preview) return;
    const file = new File([preview.blob], preview.filename, { type: "image/png" });

    const canShareFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }));

    if (!canShareFiles) {
      downloadBlob(preview.blob, preview.filename);
      setStatus({
        tone: "info",
        text: "This browser can't share an image directly, so the card was downloaded for you.",
      });
      return;
    }

    try {
      await navigator.share({
        files: [file],
        title: "My Krew3 week",
        text: "My Devcon week plan, saved with Krew3.",
      });
      setStatus({ tone: "success", text: "Card shared." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      downloadBlob(preview.blob, preview.filename);
      setStatus({
        tone: "info",
        text: "Sharing didn't complete, so the card was downloaded instead.",
      });
    }
  }, [preview]);

  const copyCard = useCallback(async () => {
    if (!preview) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Image clipboard unavailable");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": preview.blob })]);
      setStatus({ tone: "success", text: "Card image copied to the clipboard." });
    } catch {
      try {
        await navigator.clipboard.writeText(scheduleAsText(entries as CardEvent[]));
        setStatus({
          tone: "info",
          text: "Couldn't copy the image, so a text summary was copied instead.",
        });
      } catch {
        setStatus({
          tone: "error",
          text: "Copying isn't available here. Download the PNG and share it manually.",
        });
      }
    }
  }, [entries, preview]);

  const closePreview = useCallback(() => {
    clearPreviewUrl();
    setPreview(null);
    setStatus(null);
  }, [clearPreviewUrl]);

  const statusClass =
    status?.tone === "error"
      ? "text-destructive"
      : status?.tone === "success"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <OffsetCard
      tone="ivory"
      size="sm"
      className={cn("p-4 sm:p-5", className)}
      data-schedule-tools=""
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <SectionLabel>Take it with you</SectionLabel>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-xl">
            Export or share your plan
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Download a calendar file, or turn your saved week into a Krew3 card. Generated on this
            device — no account, no upload.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCalendar}
            disabled={!hasEvents}
            aria-label="Export schedule as an iCalendar file"
          >
            <CalendarDays className="size-4" aria-hidden />
            Export .ics
          </Button>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={createCard}
            disabled={!hasEvents || busy === "card"}
            aria-label="Create a shareable schedule card"
          >
            <ImageIcon className="size-4" aria-hidden />
            {busy === "card" ? "Building card…" : "Create shareable card"}
          </Button>
        </div>
      </div>

      {!hasEvents && (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing to export yet. Save at least one event from the directory, then come back here.
        </p>
      )}

      {status && (
        <p role="status" aria-live="polite" className={cn("mt-3 text-sm", statusClass)}>
          {status.text}
        </p>
      )}

      {preview && (
        <div className="mt-4 grid gap-4 border-t-2 border-dashed border-border/50 pt-4 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <img
            src={preview.url}
            alt={`Shareable card preview with ${entries.length} saved event${
              entries.length === 1 ? "" : "s"
            }`}
            width={preview.width}
            height={preview.height}
            className="w-full rounded-xl border-2 border-border bg-background shadow-offset-sm"
          />

          <div className="min-w-0">
            <p className="label-mono text-muted-foreground">Ready to share</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Includes event titles, dates and times only — no personal data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={shareCard}>
                <Share2 className="size-4" aria-hidden />
                Share card
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadCard}>
                <Download className="size-4" aria-hidden />
                Download PNG
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={copyCard}>
                <Copy className="size-4" aria-hidden />
                Copy image
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closePreview}
                aria-label="Close card preview"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="label-mono mt-4 text-muted-foreground">
              {preview.width} × {preview.height} px · PNG
            </p>
          </div>
        </div>
      )}
    </OffsetCard>
  );
}
