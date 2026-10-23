/**
 * Browser-only file download helpers.
 *
 * Kept tiny on purpose — the app needs plain Blob downloads for calendar
 * files and the generated share card, without pulling in a utility library.
 */

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

export function downloadText(
  text: string,
  filename: string,
  type = "text/plain;charset=utf-8",
): void {
  downloadBlob(new Blob([text], { type }), filename);
}
