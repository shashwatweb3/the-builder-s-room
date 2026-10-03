import { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * Scannable QR symbol, drawn as a single SVG path so it stays crisp at any
 * size and needs no canvas round-trip.
 *
 * The payload is always the member's public profile URL and nothing else, so
 * the code survives any later change to their socials or bio.
 */
export function KrewQrCode({
  value,
  size,
  className,
  /** Quiet zone in modules. The spec wants 4; 2 still scans reliably here. */
  margin = 2,
  foreground = "currentColor",
  title,
}: {
  value: string;
  size: number;
  className?: string;
  margin?: number;
  foreground?: string;
  title?: string;
}) {
  const { path, extent } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();

    const count = qr.getModuleCount();
    const total = count + margin * 2;
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (!qr.isDark(row, col)) continue;
        // Merge horizontal runs so the path stays small.
        let run = 1;
        while (col + run < count && qr.isDark(row, col + run)) run++;
        d += `M${col + margin} ${row + margin}h${run}v1h-${run}z`;
        col += run - 1;
      }
    }
    return { path: d, extent: total };
  }, [value, margin]);

  return (
    <svg
      viewBox={`0 0 ${extent} ${extent}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? `QR code linking to ${value}`}
    >
      <rect x={0} y={0} width={extent} height={extent} fill="#ffffff" />
      <path d={path} fill={foreground} />
    </svg>
  );
}
