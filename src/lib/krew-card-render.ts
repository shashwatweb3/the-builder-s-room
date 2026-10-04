import qrcode from "qrcode-generator";
import { cardFileStem, type KrewCardModel } from "@/lib/krew-card-model";

/**
 * Phase 2 exports.
 *
 * The card, wallpaper and print PDF are painted on a canvas rather than
 * rasterised from the DOM, which keeps every output deterministic and free of
 * cross-origin canvas tainting. All three read the same KrewCardModel as the
 * on-screen preview, so an export cannot drift from /profile/card.
 */

const SANS = '"Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

/** Digital card size: a landscape networking card. A6 print raster is separate. */
export const CARD_PNG_WIDTH = 1200;
export const CARD_PNG_HEIGHT = 760;
export const WALLPAPER_WIDTH = 1080;
export const WALLPAPER_HEIGHT = 1920;
/** A6 is 105x148mm; at 300dpi that is 1240x1748px. */
const A6_WIDTH_MM = 105;
const A6_HEIGHT_MM = 148;
const PRINT_DPI = 300;

interface CardTheme {
  background: string;
  card: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  lavender: string;
  mutedForeground: string;
  border: string;
}

function readTheme(): CardTheme {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    background: token("--color-background", "#f7f5ef"),
    card: token("--color-card", "#fdfcf8"),
    foreground: token("--color-foreground", "#2a2930"),
    primary: token("--color-primary", "#7c3aed"),
    primaryForeground: token("--color-primary-foreground", "#fdfaf5"),
    lavender: token("--color-lavender", "#e9ddfd"),
    mutedForeground: token("--color-muted-foreground", "#6f6e78"),
    border: token("--color-border", "#2a2930"),
  };
}

/** Webfonts must be resident or the canvas silently falls back to system type. */
async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const specs = [
    `400 16px "Space Grotesk"`,
    `500 16px "Space Grotesk"`,
    `600 16px "Space Grotesk"`,
    `700 16px "Space Grotesk"`,
    `400 12px "JetBrains Mono"`,
    `500 12px "JetBrains Mono"`,
    `600 12px "JetBrains Mono"`,
  ];
  await Promise.all(specs.map((spec) => document.fonts.load(spec).catch(() => undefined)));
  await document.fonts.ready;
}

/**
 * Load an image for canvas use. Cross-origin sources request CORS so the canvas
 * is not tainted; a failure returns null and the caller falls back to the logo.
 */
function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith("/")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Dark-module grid for the payload. */
function qrGrid(value: string): boolean[][] {
  const qr = qrcode(0, "M");
  qr.addData(value, "Byte");
  qr.make();
  const count = qr.getModuleCount();
  const grid: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) row.push(qr.isDark(r, c));
    grid.push(row);
  }
  return grid;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function font(ctx: CanvasRenderingContext2D, size: number, weight = 400, mono = false): void {
  ctx.font = `${weight} ${Math.round(size)}px ${mono ? MONO : SANS}`;
}

/** Greedy word wrap; falls back to hard breaks for unbroken long tokens. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = "";
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Canvas has no letter-spacing everywhere, so tracked text is drawn per glyph. */
function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
): number {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  return cursor - spacing;
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  return Math.max(0, total - spacing);
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  grid: boolean[][],
  x: number,
  y: number,
  size: number,
  theme: CardTheme,
): void {
  const count = grid.length;
  const margin = 2;
  const module = Math.max(1, Math.floor(size / (count + margin * 2)));
  const dim = module * (count + margin * 2);
  const ox = x + Math.round((size - dim) / 2);
  const oy = y + Math.round((size - dim) / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(ox, oy, dim, dim);
  ctx.fillStyle = theme.foreground;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (grid[r]?.[c] !== true) continue;
      ctx.fillRect(ox + (c + margin) * module, oy + (r + margin) * module, module, module);
    }
  }
}

/** Wraps text, then truncates the final kept line with an ellipsis. */
function wrapClamped(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines = wrap(ctx, text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last.replace(/[\s,.;:!?-]+$/, "")}…`;
  return kept;
}

/**
 * Largest display size that still fits the safe width on at most two lines, so a
 * long name shrinks rather than being clipped. Only a pathologically long name
 * falls back to the minimum size with a third, truncated line.
 */
function fitDisplayName(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): { size: number; lines: string[] } {
  for (let size = maxSize; size > minSize; size -= 2) {
    font(ctx, size, 700);
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= 2) return { size, lines };
  }
  font(ctx, minSize, 700);
  return { size: minSize, lines: wrapClamped(ctx, text, maxWidth, 3) };
}

interface RenderAssets {
  theme: CardTheme;
  logo: HTMLImageElement | null;
  avatar: HTMLImageElement | null;
  grid: boolean[][];
}

async function prepare(model: KrewCardModel): Promise<RenderAssets> {
  await ensureFonts();
  const [logo, avatar] = await Promise.all([loadImage(model.logoSrc), loadImage(model.avatarUrl)]);
  return { theme: readTheme(), logo, avatar, grid: qrGrid(model.url) };
}

function newCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Draw into a square tile, cropping to fill. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  ctx.save();
  roundRect(ctx, x, y, size, size, radius);
  ctx.clip();
  const side = Math.min(img.width, img.height);
  const dw = size;
  const dh = (img.height / img.width) * dw;
  const scale = Math.max(dw / img.width, dh / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();
}

/**
 * Portrait Krew Card raster used for the 300dpi A6 print PDF. Sized from both
 * axes so the print run keeps the document composition regardless of the
 * landscape PNG proportions.
 */
function drawCard(
  ctx: CanvasRenderingContext2D,
  model: KrewCardModel,
  assets: RenderAssets,
  W: number,
  H: number,
): void {
  const { theme, logo, avatar, grid } = assets;

  ctx.clearRect(0, 0, W, H);

  const m = Math.round(W * 0.03);
  const shadow = Math.round(W * 0.014);
  const cw = W - m * 2;
  const ch = H - m * 2;
  const radius = Math.round(W * 0.045);
  const border = Math.max(2, Math.round(W * 0.0045));
  const pad = Math.round(cw * 0.075);

  // Offset shadow, matching --shadow-offset (solid ink, no blur).
  ctx.fillStyle = theme.foreground;
  roundRect(ctx, m + shadow, m + shadow * 1.25, cw, ch, radius);
  ctx.fill();

  ctx.fillStyle = theme.card;
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.fill();

  ctx.save();
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.clip();

  // Masthead band.
  const headerH = Math.round(ch * 0.085);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = theme.lavender;
  ctx.fillRect(m, m, cw, headerH);
  ctx.globalAlpha = 1;

  const logoSize = Math.round(headerH * 0.56);
  const logoX = m + pad;
  const logoY = m + (headerH - logoSize) / 2;
  ctx.fillStyle = theme.primary;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, Math.round(logoSize * 0.28));
  ctx.fill();
  if (logo) {
    ctx.save();
    roundRect(ctx, logoX, logoY, logoSize, logoSize, Math.round(logoSize * 0.28));
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  ctx.fillStyle = theme.foreground;
  font(ctx, headerH * 0.46, 700);
  ctx.textBaseline = "middle";
  ctx.fillText("Krew3", logoX + logoSize + pad * 0.4, m + headerH / 2);

  ctx.fillStyle = theme.mutedForeground;
  font(ctx, headerH * 0.3, 500, true);
  const label = "KREW CARD";
  const labelW = trackedWidth(ctx, label, headerH * 0.04);
  tracked(ctx, label, m + cw - pad - labelW, m + headerH / 2, headerH * 0.04);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = border;
  ctx.beginPath();
  ctx.moveTo(m, m + headerH);
  ctx.lineTo(m + cw, m + headerH);
  ctx.stroke();

  // Identity block.
  const bodyTop = m + headerH + pad * 0.9;
  let y = bodyTop;
  const avatarSize = Math.round(cw * 0.17);
  const textX = logoX + avatarSize + pad * 0.6;
  const textW = m + cw - pad - textX;

  ctx.fillStyle = theme.lavender;
  ctx.globalAlpha = 0.4;
  roundRect(ctx, logoX, y, avatarSize, avatarSize, Math.round(avatarSize * 0.3));
  ctx.fill();
  ctx.globalAlpha = 1;

  const face = avatar ?? logo;
  if (face) {
    drawCover(ctx, face, logoX, y, avatarSize, Math.round(avatarSize * 0.3));
  }

  const nameSize = Math.round(cw * 0.062);
  ctx.fillStyle = theme.foreground;
  font(ctx, nameSize, 700);
  ctx.textBaseline = "top";
  const nameLines = wrap(ctx, model.displayName, textW).slice(0, 2);
  let nameY = y;
  for (const line of nameLines) {
    ctx.fillText(line, textX, nameY);
    nameY += nameSize * 1.12;
  }

  const handleSize = Math.round(cw * 0.032);
  ctx.fillStyle = theme.mutedForeground;
  font(ctx, handleSize, 500, true);
  ctx.fillText(`@${model.username}`, textX, nameY + handleSize * 0.25);

  if (model.typeLabel) {
    const pillY = nameY + handleSize * 0.25 + handleSize * 1.9;
    const pillH = Math.round(handleSize * 1.75);
    font(ctx, handleSize, 600, true);
    const tw = trackedWidth(ctx, model.typeLabel.toUpperCase(), handleSize * 0.08);
    const pw = tw + pillH * 0.9;
    ctx.fillStyle = theme.primary;
    roundRect(ctx, textX, pillY, pw, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = theme.primaryForeground;
    tracked(
      ctx,
      model.typeLabel.toUpperCase(),
      textX + (pw - tw) / 2,
      pillY + pillH / 2,
      handleSize * 0.08,
    );
  }

  y = Math.max(y + avatarSize, nameY + handleSize * 2.6) + pad * 0.8;

  // Bio.
  if (model.bio) {
    font(ctx, Math.round(cw * 0.036), 400);
    ctx.fillStyle = theme.foreground;
    const lines = wrap(ctx, model.bio, cw - pad * 2).slice(0, 4);
    const lh = Math.round(cw * 0.05);
    for (const line of lines) {
      ctx.fillText(line, m + pad, y);
      y += lh;
    }
    y += pad * 0.2;
  }

  // Best work.
  if (model.bestWorkTitle) {
    const labelSize = Math.round(cw * 0.026);
    font(ctx, labelSize, 500, true);
    ctx.fillStyle = theme.mutedForeground;
    tracked(ctx, "BEST WORK", m + pad, y, labelSize * 0.16);
    y += labelSize * 1.5;
    font(ctx, Math.round(cw * 0.042), 600);
    ctx.fillStyle = theme.foreground;
    for (const line of wrap(ctx, model.bestWorkTitle, cw - pad * 2).slice(0, 2)) {
      ctx.fillText(line, m + pad, y);
      y += Math.round(cw * 0.056);
    }
  }

  // QR block, bottom-anchored.
  const qrSize = Math.round(cw * 0.3);
  const blockH = Math.round(qrSize + pad * 0.9);
  const blockY = m + ch - pad * 0.6 - blockH;
  ctx.fillStyle = theme.background;
  roundRect(ctx, m + pad * 0.5, blockY, cw - pad, blockH, Math.round(cw * 0.04));
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = border;
  ctx.setLineDash([border * 3, border * 2.4]);
  roundRect(ctx, m + pad * 0.5, blockY, cw - pad, blockH, Math.round(cw * 0.04));
  ctx.stroke();
  ctx.setLineDash([]);

  const qrX = m + pad * 0.5 + pad * 0.45;
  drawQr(ctx, grid, qrX, blockY + pad * 0.45, qrSize, theme);

  const qrTextX = qrX + qrSize + pad * 0.55;
  const ctaSize = Math.round(cw * 0.03);
  font(ctx, ctaSize, 600, true);
  ctx.fillStyle = theme.foreground;
  ctx.textBaseline = "middle";
  tracked(ctx, "SCAN TO CONNECT", qrTextX, blockY + blockH * 0.38, ctaSize * 0.1);

  font(ctx, Math.round(cw * 0.034), 400, true);
  ctx.fillStyle = theme.mutedForeground;
  for (const line of wrap(ctx, model.pathLabel, m + cw - pad * 0.6 - qrTextX).slice(0, 2)) {
    ctx.fillText(line, qrTextX, blockY + blockH * 0.68);
    break;
  }

  ctx.restore();

  // Card border last so it sits above the clipped content.
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = border;
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.stroke();
}

/** Small up-right link arrow, drawn as vectors so no font glyph can drop out. */
function drawArrowUpRight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const t = Math.max(2, Math.round(size * 0.14));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size - t * 2.2, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + t * 2.2);
  ctx.stroke();
  ctx.restore();
}

/** Up to two initials for the placeholder tile used when no avatar exists. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0] ?? "";
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${(words[words.length - 1] ?? "")[0] ?? ""}`.toUpperCase();
}

/** Centred tracked text; tracked() always draws left to right. */
function trackedCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
): void {
  tracked(ctx, text, centerX - trackedWidth(ctx, text, spacing) / 2, y, spacing);
}

/**
 * The landscape Krew Card PNG: a compact event-networking card.
 *
 * Composition is a measured two-column flow, not a stack of absolutely placed
 * blocks. The left column holds identity, then a tinted panel for bio and best
 * work, then the tiny footer; the right column is a full-height solid QR rail.
 * Heights are measured before anything is painted and the leftover column height
 * is shared out between a capped number of gaps, so the card reads as a
 * deliberately typeset card instead of a stretched resume. Short profiles centre
 * rather than stretch, which keeps the whitespace balanced.
 */
function drawNetworkingCard(
  ctx: CanvasRenderingContext2D,
  model: KrewCardModel,
  assets: RenderAssets,
  W: number,
  H: number,
): void {
  const { theme, logo, avatar, grid } = assets;

  ctx.clearRect(0, 0, W, H);

  const m = Math.round(H * 0.045);
  const shadow = Math.round(H * 0.02);
  const cw = W - m * 2;
  const ch = H - m * 2;
  const radius = Math.round(H * 0.05);
  const border = Math.max(3, Math.round(H * 0.0065));
  const pad = Math.round(cw * 0.055);

  // Heavy offset shadow in solid ink, matching --shadow-offset.
  ctx.fillStyle = theme.foreground;
  roundRect(ctx, m + shadow, m + shadow * 1.2, cw, ch, radius);
  ctx.fill();

  ctx.fillStyle = theme.card;
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.fill();

  ctx.save();
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.clip();

  // ---- Header: small logo + wordmark left, KREW ID mono label right.
  const headerH = Math.round(ch * 0.115);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = theme.lavender;
  ctx.fillRect(m, m, cw, headerH);
  ctx.globalAlpha = 1;

  const logoSize = Math.round(headerH * 0.5);
  const logoX = m + pad;
  const logoY = m + (headerH - logoSize) / 2;
  ctx.fillStyle = theme.primary;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, Math.round(logoSize * 0.28));
  ctx.fill();
  if (logo) {
    ctx.save();
    roundRect(ctx, logoX, logoY, logoSize, logoSize, Math.round(logoSize * 0.28));
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  const wordmarkSize = Math.round(headerH * 0.34);
  ctx.fillStyle = theme.foreground;
  font(ctx, wordmarkSize, 700);
  ctx.textBaseline = "middle";
  ctx.fillText("Krew3", logoX + logoSize + Math.round(pad * 0.3), m + headerH / 2);

  const idLabelSize = Math.round(headerH * 0.2);
  font(ctx, idLabelSize, 600, true);
  const idSpacing = idLabelSize * 0.18;
  ctx.fillStyle = theme.mutedForeground;
  tracked(
    ctx,
    "KREW ID",
    m + cw - pad - trackedWidth(ctx, "KREW ID", idSpacing),
    m + headerH / 2,
    idSpacing,
  );

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = Math.max(1, Math.round(border * 0.35));
  ctx.beginPath();
  ctx.moveTo(m, m + headerH);
  ctx.lineTo(m + cw, m + headerH);
  ctx.stroke();

  // ---- Measured grid.
  const contentTop = m + headerH + Math.round(ch * 0.055);
  const contentBottom = m + ch - Math.round(ch * 0.045);
  const availH = contentBottom - contentTop;
  const contentX = m + pad;
  const contentW = cw - pad * 2;

  const qrSize = qrBoxFor(grid.length, Math.round(Math.min(ch * 0.265, qrMaxFor(availH))));
  const railPad = Math.round(qrSize * 0.17);
  const railW = qrSize + railPad * 2;
  const railGap = Math.round(cw * 0.045);
  const railX = contentX + contentW - railW;
  const leftW = railX - railGap - contentX;

  const avatarSize = Math.max(
    180,
    Math.min(210, Math.round(leftW * 0.265), Math.round(availH * 0.42)),
  );
  const avatarRadius = Math.round(avatarSize * 0.16);
  const avatarGap = Math.round(leftW * 0.045);
  const nameMaxW = leftW - avatarSize - avatarGap;

  // Measure the identity row: name (fitted), handle, member type.
  const fitted = fitDisplayName(
    ctx,
    model.displayName,
    nameMaxW,
    Math.round(leftW * 0.076),
    Math.round(leftW * 0.042),
  );
  const nameLead = Math.round(fitted.size * 1.1);
  const handleSize = Math.round(leftW * 0.031);
  const typeSize = Math.round(leftW * 0.023);
  const typeSpacing = typeSize * 0.16;
  const chipH = Math.round(typeSize * 2.05);
  const stackGap = Math.round(leftW * 0.022);
  const typeText = model.typeLabel ? model.typeLabel.toUpperCase() : "";
  font(ctx, typeSize, 600, true);
  const chipW = typeText ? trackedWidth(ctx, typeText, typeSpacing) + chipH * 0.8 : 0;
  const stackH =
    fitted.lines.length * nameLead +
    Math.round(stackGap * 0.7) +
    Math.round(handleSize * 1.34) +
    (typeText ? Math.round(stackGap * 0.5) + chipH : 0);
  let identityH = Math.max(avatarSize, stackH);

  // Measure the tinted panel: bio, rule, best work.
  const panelPadMax = Math.round(leftW * 0.042);
  const workLabelSize = Math.round(leftW * 0.021);
  const workLabelSpacing = workLabelSize * 0.16;
  const workSize = Math.round(leftW * 0.044);
  const arrowSize = Math.round(workSize * 0.72);
  const innerGap = Math.round(leftW * 0.038);

  const footerSize = Math.round(leftW * 0.019);
  const footerSpacing = footerSize * 0.2;
  const footerText = "NOT A COMMUNITY. A KREW.";
  const footerH = Math.round(footerSize * 1.3);

  const gapMin = Math.round(ch * 0.028);
  const gapMax = Math.round(ch * 0.075);

  // One measuring pass over the panel at a given bio size, padding and line cap.
  // Every wrap is measured in the font it will be painted in.
  const measurePanel = (bioSize: number, panelPad: number, maxBioLines: number) => {
    const innerW = leftW - panelPad * 2;
    const lead = Math.round(bioSize * 1.52);
    font(ctx, bioSize, 400);
    const lines = model.bio ? wrapClamped(ctx, model.bio, innerW, maxBioLines) : [];
    font(ctx, workSize, 600);
    const w = model.bestWorkTitle
      ? wrapClamped(ctx, model.bestWorkTitle, innerW - arrowSize - 12, 1)
      : [];
    const hasBio = lines.length > 0;
    const hasWork = w.length > 0;
    const rule = Math.max(Math.round(innerW * 0.16), Math.round(workLabelSize * 1.2));
    const innerH =
      lines.length * lead +
      (hasBio && hasWork ? innerGap + rule + Math.round(innerGap * 0.55) : 0) +
      (hasWork ? Math.round(workSize * 1.5) : 0);
    return {
      bioSize,
      lead,
      lines,
      workLines: w,
      hasBio,
      hasWork,
      ruleW: rule,
      innerW,
      innerH,
      h: hasBio || hasWork ? innerH + panelPad * 2 : 0,
    };
  };

  // Shrink-to-fit: give the panel only what the identity row and footer leave,
  // so a long bio can never push the footer past the card edge. Truncation is
  // the last resort, after the line cap, the type size and the padding.
  let avatarBox = avatarSize;
  let panelPad = panelPadMax;
  let bioSize = Math.round(leftW * 0.0345);
  let maxBioLines = 4;
  let panel = measurePanel(bioSize, panelPad, maxBioLines);
  let identity = Math.max(avatarBox, stackH);
  const room = () => availH - identity - footerH - gapMin * (panel.h > 0 ? 2 : 1);
  while (panel.h > room() && maxBioLines > 2) {
    maxBioLines--;
    panel = measurePanel(bioSize, panelPad, maxBioLines);
  }
  while (panel.h > room() && bioSize > 18) {
    bioSize--;
    panel = measurePanel(bioSize, panelPad, maxBioLines);
  }
  while (panel.h > room() && panelPad > 14) {
    panelPad--;
    panel = measurePanel(bioSize, panelPad, maxBioLines);
  }
  while (panel.h > room() && avatarBox > 150) {
    avatarBox -= 4;
    identity = Math.max(avatarBox, stackH);
  }

  const { bioLines, workLines, hasBio, hasWork, ruleW, bioLead } = {
    bioLines: panel.lines,
    workLines: panel.workLines,
    hasBio: panel.hasBio,
    hasWork: panel.hasWork,
    ruleW: panel.ruleW,
    bioLead: panel.lead,
  };
  const panelH = panel.h;
  identityH = identity;

  // Distribute leftover height: capped gaps first, then centre the column.
  const fixedH = identityH + panelH + footerH;
  const gapSlots = panelH > 0 ? 2 : 1;
  const slack = availH - fixedH;
  let gap = gapMin;
  if (slack > 0) gap = Math.max(gapMin, Math.min(gapMax, Math.round(slack / (gapSlots + 1))));
  const usedH = fixedH + gap * gapSlots;
  const leadIn = Math.max(0, Math.round((availH - usedH) / 2));

  // ---- Paint: left column.
  let y = contentTop + leadIn;
  const identityY = y;
  const avatarY = identityY;
  const stackX = contentX + avatarBox + avatarGap;
  const stackTop = identityY;

  // Placeholder tile first so the photo, its shadow and its border layer over it.
  ctx.fillStyle = theme.lavender;
  roundRect(
    ctx,
    contentX + shadow * 0.45,
    avatarY + shadow * 0.55,
    avatarBox,
    avatarBox,
    avatarRadius,
  );
  ctx.fill();
  ctx.fillStyle = theme.card;
  roundRect(ctx, contentX, avatarY, avatarBox, avatarBox, avatarRadius);
  ctx.fill();

  if (avatar) {
    drawCover(ctx, avatar, contentX, avatarY, avatarBox, avatarRadius);
  } else {
    const initials = initialsOf(model.displayName);
    ctx.fillStyle = theme.lavender;
    roundRect(ctx, contentX, avatarY, avatarBox, avatarBox, avatarRadius);
    ctx.fill();
    if (initials) {
      ctx.save();
      ctx.fillStyle = theme.foreground;
      font(ctx, Math.round(avatarBox * 0.38), 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, contentX + avatarBox / 2, avatarY + avatarBox / 2 + avatarBox * 0.02);
      ctx.restore();
    }
  }
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = Math.max(2, Math.round(border * 0.8));
  roundRect(ctx, contentX, avatarY, avatarBox, avatarBox, avatarRadius);
  ctx.stroke();

  // Identity stack: name is the strongest element on the card.
  let nameY = stackTop;
  ctx.fillStyle = theme.foreground;
  font(ctx, fitted.size, 700);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const line of fitted.lines) {
    ctx.fillText(line, stackX, nameY);
    nameY += nameLead;
  }
  ctx.fillStyle = theme.mutedForeground;
  font(ctx, handleSize, 500, true);
  ctx.fillText(`@${model.username}`, stackX, nameY + Math.round(stackGap * 0.7));
  if (typeText) {
    const chipY =
      nameY +
      Math.round(stackGap * 0.7) +
      Math.round(handleSize * 1.34) +
      Math.round(stackGap * 0.5);
    ctx.fillStyle = theme.foreground;
    roundRect(ctx, stackX, chipY, chipW, chipH, Math.round(chipH * 0.34));
    ctx.fill();
    ctx.fillStyle = theme.card;
    font(ctx, typeSize, 600, true);
    tracked(
      ctx,
      typeText,
      stackX + (chipW - trackedWidth(ctx, typeText, typeSpacing)) / 2,
      chipY + chipH / 2,
      typeSpacing,
    );
  }

  y = identityY + identityH + gap;

  // Tinted panel holding bio and best work.
  if (panelH > 0) {
    ctx.fillStyle = theme.lavender;
    ctx.globalAlpha = 0.62;
    roundRect(ctx, contentX, y, leftW, panelH, Math.round(ch * 0.03));
    ctx.fill();
    ctx.globalAlpha = 1;

    let py = y + panelPad;
    ctx.fillStyle = theme.foreground;
    font(ctx, bioSize, 400);
    ctx.textBaseline = "top";
    for (const line of bioLines) {
      ctx.fillText(line, contentX + panelPad, py);
      py += bioLead;
    }

    if (hasWork) {
      if (hasBio) {
        const ruleY = Math.round(py + innerGap * 0.5 - Math.max(ruleW, workLabelSize) / 2);
        ctx.fillStyle = theme.foreground;
        ctx.fillRect(contentX + panelPad, ruleY, ruleW, Math.max(2, Math.round(border * 0.5)));
        py = ruleY + Math.max(ruleW, Math.round(workLabelSize * 1.2)) + innerGap * 0.55;
      }
      ctx.fillStyle = theme.mutedForeground;
      font(ctx, workLabelSize, 600, true);
      tracked(ctx, "BEST WORK", contentX + panelPad, py, workLabelSpacing);
      py += Math.round(workLabelSize * 1.9);

      ctx.fillStyle = theme.foreground;
      font(ctx, workSize, 600);
      ctx.textBaseline = "alphabetic";
      const workBaseline = py + Math.round(workSize * 0.8);
      const workText = workLines[0] ?? "";
      ctx.fillText(workText, contentX + panelPad, workBaseline);
      const workTextW = ctx.measureText(workText).width;
      drawArrowUpRight(
        ctx,
        contentX + panelPad + workTextW + 10,
        workBaseline - arrowSize - Math.round(workSize * 0.04),
        arrowSize,
        theme.foreground,
      );
    }
  }

  if (panelH > 0) y += panelH + gap;

  // Tiny footer pinned to the bottom of the left column.
  ctx.fillStyle = theme.mutedForeground;
  font(ctx, footerSize, 600, true);
  tracked(ctx, footerText, contentX, Math.max(y, contentBottom - footerSize * 0.35), footerSpacing);

  // ---- Paint: right QR rail. Solid, black-bordered, never dashed.
  const railY = contentTop;
  const railH = availH;
  ctx.fillStyle = theme.lavender;
  roundRect(ctx, railX + shadow * 0.4, railY + shadow * 0.5, railW, railH, Math.round(ch * 0.035));
  ctx.fill();
  ctx.fillStyle = theme.background;
  roundRect(ctx, railX, railY, railW, railH, Math.round(ch * 0.035));
  ctx.fill();

  const ctaSize = Math.round(qrSize * 0.1);
  const ctaSpacing = ctaSize * 0.14;
  const pathSize = Math.round(qrSize * 0.105);
  const railGapIn = Math.round(qrSize * 0.12);
  const ctaH = Math.round(ctaSize * 1.5);
  const pathH = Math.round(pathSize * 1.4);
  const pathLines = wrapClamped(ctx, model.pathLabel, railW - railPad * 2, 2);
  const pathBlockH = pathLines.length * pathH;
  const stackTotal =
    qrSize +
    railGapIn +
    ctaH +
    (pathLines.length > 1 ? railGapIn * 0.4 : railGapIn * 0.6) +
    pathBlockH;
  const stackTopY = railY + Math.round((railH - stackTotal) / 2);
  const qrX = railX + Math.round((railW - qrSize) / 2);
  const qrY = stackTopY;

  drawQr(ctx, grid, qrX, qrY, qrSize, theme);

  ctx.fillStyle = theme.foreground;
  font(ctx, ctaSize, 700, true);
  trackedCentered(
    ctx,
    "SCAN TO CONNECT",
    railX + railW / 2,
    qrY + qrSize + railGapIn + ctaH * 0.62,
    ctaSpacing,
  );

  ctx.fillStyle = theme.foreground;
  font(ctx, pathSize, 500, true);
  const pathY =
    qrY + qrSize + railGapIn + ctaH + (pathLines.length > 1 ? railGapIn * 0.4 : railGapIn * 0.6);
  for (let i = 0; i < pathLines.length; i++) {
    const line = pathLines[i] ?? "";
    const w = ctx.measureText(line).width;
    ctx.fillText(line, railX + Math.round((railW - w) / 2), pathY + pathH * (i + 0.72));
  }

  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = Math.max(2, Math.round(border * 0.8));
  roundRect(ctx, railX, railY, railW, railH, Math.round(ch * 0.035));
  ctx.stroke();

  ctx.restore();

  // Card border last so it sits above the clipped content.
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = border;
  roundRect(ctx, m, m, cw, ch, radius);
  ctx.stroke();
}

/**
 * drawQr() floors the module size, so the painted box lands on a multiple of
 * (modules + quiet zone). Pick the multiple nearest 200px that still lands
 * inside the 180-220 band instead of trusting the requested size.
 */
function qrBoxFor(count: number, fallback: number): number {
  const span = count + 4;
  let best = fallback;
  let bestDelta = Infinity;
  for (let mod = 2; mod <= 14; mod++) {
    const dim = mod * span;
    if (dim < 182 || dim > 216) continue;
    const delta = Math.abs(dim - 200);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = dim;
    }
  }
  return best;
}

/** Largest QR side that still leaves breathing room in a full-height rail. */
function qrMaxFor(availH: number): number {
  return Math.max(180, availH - Math.round(availH * 0.42));
}

/**
 * Phone wallpaper backdrop: the cream field with a faint editorial grid, so the
 * export keeps the Krew3 paper texture instead of reading as a flat fill.
 */
function paintWallpaperBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  theme: CardTheme,
): void {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, W, H);

  const step = Math.round(W / 12);
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = step; x < W; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = step; y < H; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/** One measured wallpaper section: its height, and how to paint at a given top. */
interface WallpaperBlock {
  h: number;
  render: (top: number) => void;
}

/**
 * The phone wallpaper is its own composition rather than a stretched card: a
 * single vertical flow of header, photo, identity, bio, QR panel and footer.
 *
 * Every section is measured before anything is painted and the stack is walked
 * with one cursor, so sections cannot collide and nothing can be drawn outside
 * the safe area. If the content is too tall for the canvas the whole scale
 * shrinks until it fits; if it is short the leftover height is redistributed
 * into the gaps. That is what makes a longer name, handle or bio reflow
 * instead of overflowing.
 */
function drawWallpaper(
  ctx: CanvasRenderingContext2D,
  model: KrewCardModel,
  assets: RenderAssets,
  W: number,
  H: number,
): void {
  const { theme, logo, avatar, grid } = assets;
  const S = W / 1080;

  const safe = Math.round(92 * S);
  const contentW = W - safe * 2;
  const avail = H - safe * 2;
  const cx = W / 2;

  paintWallpaperBackdrop(ctx, W, H, theme);

  const border = Math.max(2, Math.round(3 * S));

  /** Builds the whole stack at a given scale; called again if it has to shrink. */
  const build = (u: number): WallpaperBlock[] => {
    const blocks: WallpaperBlock[] = [];

    // Header: logo lockup with the wordmark and the KREW ID label.
    const logoSize = Math.round(64 * u);
    const wordSize = Math.round(30 * u);
    const labelSize = Math.round(13 * u);
    blocks.push({
      h: logoSize,
      render: (top) => {
        const lx = cx - contentW / 2;
        ctx.fillStyle = theme.lavender;
        ctx.globalAlpha = 0.45;
        roundRect(ctx, lx, top, logoSize, logoSize, Math.round(logoSize * 0.3));
        ctx.fill();
        ctx.globalAlpha = 1;
        if (logo) {
          ctx.save();
          roundRect(ctx, lx, top, logoSize, logoSize, Math.round(logoSize * 0.3));
          ctx.clip();
          ctx.drawImage(logo, lx, top, logoSize, logoSize);
          ctx.restore();
        }
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = border;
        roundRect(ctx, lx, top, logoSize, logoSize, Math.round(logoSize * 0.3));
        ctx.stroke();

        const tx = lx + logoSize + Math.round(18 * u);
        ctx.fillStyle = theme.foreground;
        font(ctx, wordSize, 700);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Krew3", tx, top + logoSize * 0.56);

        ctx.fillStyle = theme.mutedForeground;
        font(ctx, labelSize, 500, true);
        const label = "KREW ID";
        const track = Math.round(labelSize * 0.16);
        tracked(ctx, label, tx + Math.round(2 * u), top + logoSize * 0.86, track);
      },
    });

    // Profile photo: square, rounded, outlined, with the lavender offset plate.
    const photo = Math.round(248 * u);
    const photoR = Math.round(photo * 0.3);
    const photoShadow = Math.round(8 * u);
    blocks.push({
      h: photo + photoShadow,
      render: (top) => {
        const px = cx - photo / 2;
        ctx.fillStyle = theme.lavender;
        ctx.globalAlpha = 0.45;
        roundRect(ctx, px + photoShadow, top + photoShadow, photo, photo, photoR);
        ctx.fill();
        ctx.globalAlpha = 1;

        const face = avatar ?? logo;
        if (face) drawCover(ctx, face, px, top, photo, photoR);

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = border;
        roundRect(ctx, px, top, photo, photo, photoR);
        ctx.stroke();
      },
    });

    // Name: large, responsive, never wider than the safe area.
    const name = fitDisplayName(ctx, model.displayName, contentW, 78 * u, 46 * u);
    const nameLh = name.size * 1.04;
    blocks.push({
      h: name.lines.length * nameLh,
      render: (top) => {
        ctx.fillStyle = theme.foreground;
        font(ctx, name.size, 700);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        let y = top + name.size;
        for (const line of name.lines) {
          ctx.fillText(line, cx, y);
          y += nameLh;
        }
      },
    });

    // Handle.
    const handleSize = Math.round(26 * u);
    const handle = `@${model.username}`;
    blocks.push({
      h: Math.round(handleSize * 1.4),
      render: (top) => {
        let size = handleSize;
        font(ctx, size, 500, true);
        while (size > 14 * u && ctx.measureText(handle).width > contentW) {
          size -= 1;
          font(ctx, size, 500, true);
        }
        ctx.fillStyle = theme.mutedForeground;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(handle, cx, top + (size * 1.4) / 2);
      },
    });

    // Member-type badge.
    if (model.typeLabel) {
      const badgeSize = Math.round(18 * u);
      const pillH = Math.round(40 * u);
      const track = Math.round(1.8 * u);
      const label = model.typeLabel.toUpperCase();
      font(ctx, badgeSize, 600, true);
      const pillW = trackedWidth(ctx, label, track) + Math.round(34 * u);
      blocks.push({
        h: pillH,
        render: (top) => {
          font(ctx, badgeSize, 600, true);
          const px = cx - pillW / 2;
          ctx.fillStyle = theme.primary;
          roundRect(ctx, px, top, pillW, pillH, pillH / 2);
          ctx.fill();
          ctx.fillStyle = theme.primaryForeground;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          tracked(
            ctx,
            label,
            px + (pillW - trackedWidth(ctx, label, track)) / 2,
            top + pillH / 2,
            track,
          );
        },
      });
    }

    // Bio: at most three lines, truncated rather than allowed to collide.
    if (model.bio) {
      const bioSize = Math.round(22 * u);
      const bioLh = Math.round(bioSize * 1.55);
      const lines = wrapClamped(ctx, model.bio, contentW, 3);
      blocks.push({
        h: lines.length * bioLh,
        render: (top) => {
          ctx.fillStyle = theme.foreground;
          font(ctx, bioSize, 400);
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          let y = top + bioSize;
          for (const line of lines) {
            ctx.fillText(line, cx, y);
            y += bioLh;
          }
        },
      });
    }

    // QR panel: solid cream plate, solid black border, generous quiet space.
    const qrSize = Math.round(288 * u);
    const panelW = Math.min(contentW, Math.round(660 * u));
    const panelPad = Math.round(36 * u);
    const panelR = Math.round(26 * u);
    const ctaSize = Math.round(17 * u);
    const urlSize = Math.round(19 * u);
    const ctaLh = Math.round(ctaSize * 1.3);
    const urlLh = Math.round(urlSize * 1.3);
    const panelH = panelPad * 2 + qrSize + Math.round(24 * u) + ctaLh + Math.round(8 * u) + urlLh;
    blocks.push({
      h: panelH,
      render: (top) => {
        ctx.fillStyle = theme.card;
        roundRect(ctx, cx - panelW / 2, top, panelW, panelH, panelR);
        ctx.fill();
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = border;
        roundRect(ctx, cx - panelW / 2, top, panelW, panelH, panelR);
        ctx.stroke();

        drawQr(ctx, grid, cx - qrSize / 2, top + panelPad, qrSize, theme);

        const ctaTrack = Math.round(ctaSize * 0.12);
        const cta = "SCAN TO CONNECT";
        font(ctx, ctaSize, 600, true);
        const ctaW = trackedWidth(ctx, cta, ctaTrack);
        const ctaY = top + panelPad + qrSize + Math.round(24 * u) + ctaLh * 0.5;
        ctx.fillStyle = theme.foreground;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        tracked(ctx, cta, cx - ctaW / 2, ctaY, ctaTrack);

        font(ctx, urlSize, 400, true);
        const urlW = ctx.measureText(model.pathLabel).width;
        ctx.fillStyle = theme.mutedForeground;
        ctx.fillText(model.pathLabel, cx - urlW / 2, ctaY + ctaLh / 2 + urlLh * 0.5);
      },
    });

    // Footer line.
    const footSize = Math.round(15 * u);
    const footTrack = Math.round(footSize * 0.18);
    const footText = "NOT A COMMUNITY. A KREW.";
    font(ctx, footSize, 500, true);
    const footW = trackedWidth(ctx, footText, footTrack);
    blocks.push({
      h: Math.round(footSize * 1.6),
      render: (top) => {
        font(ctx, footSize, 500, true);
        ctx.fillStyle = theme.mutedForeground;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        tracked(ctx, footText, cx - footW / 2, top + (footSize * 1.6) / 2, footTrack);
      },
    });

    return blocks;
  };

  // Shrink the whole composition until the sections alone fit the safe area.
  const gapBase = Math.round(34 * S);
  let u = S;
  let blocks = build(u);
  const contentTotal = () => blocks.reduce((sum, b) => sum + b.h, 0);
  while (contentTotal() > avail && u > 0.6 * S) {
    u = Math.max(0.6 * S, u - 0.02 * S);
    blocks = build(u);
  }

  // Redistribute the leftover height into the gaps so the composition breathes
  // instead of bunching at the top. The gap is bounded three ways: it grows
  // from the base spacing using whatever room is spare, it never exceeds the
  // cap, and it never exceeds what the safe area can actually absorb - that last
  // bound is what guarantees the stack cannot be pushed past the bottom edge.
  // Anything the cap leaves over becomes balanced top/bottom padding.
  const contentH = contentTotal();
  const gaps = blocks.length - 1;
  const gapBudget = Math.max(0, avail - contentH);
  const gapCap = Math.round(104 * S);
  const gap =
    gaps > 0
      ? Math.max(
          0,
          Math.min(gapBase + (gapBudget - gapBase * gaps) / gaps, gapCap, gapBudget / gaps),
        )
      : 0;
  let y = safe + Math.max(0, (avail - contentH - gap * gaps) / 2);

  for (const block of blocks) {
    block.render(Math.round(y));
    y += block.h + gap;
  }
}

async function renderCanvas(
  model: KrewCardModel,
  width: number,
  height: number,
  draw: (
    ctx: CanvasRenderingContext2D,
    model: KrewCardModel,
    assets: RenderAssets,
    w: number,
    h: number,
  ) => void,
): Promise<HTMLCanvasElement> {
  const canvas = newCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  const assets = await prepare(model);
  draw(ctx, model, assets, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
      type,
      quality,
    );
  });
}

/** Minimal single-page PDF wrapping a JPEG, for true A6 print dimensions. */
function buildA6Pdf(jpeg: Uint8Array, imgW: number, imgH: number): Blob {
  const mmToPt = 72 / 25.4;
  const pageW = (A6_WIDTH_MM * mmToPt).toFixed(2);
  const pageH = (A6_HEIGHT_MM * mmToPt).toFixed(2);

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const pushText = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    length += bytes.length;
  };

  pushText("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");

  offsets[1] = length;
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets[2] = length;
  pushText("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  offsets[3] = length;
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );

  offsets[4] = length;
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  );
  pushBytes(jpeg);
  pushText("\nendstream\nendobj\n");

  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = length;
  pushText(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefStart = length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pushText(xref);
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export async function renderKrewCardPng(model: KrewCardModel): Promise<Blob> {
  const canvas = await renderCanvas(model, CARD_PNG_WIDTH, CARD_PNG_HEIGHT, drawNetworkingCard);
  return canvasToBlob(canvas, "image/png");
}

export async function renderKrewWallpaperPng(model: KrewCardModel): Promise<Blob> {
  const canvas = await renderCanvas(model, WALLPAPER_WIDTH, WALLPAPER_HEIGHT, drawWallpaper);
  return canvasToBlob(canvas, "image/png");
}

export async function renderKrewCardA6Pdf(model: KrewCardModel): Promise<Blob> {
  const width = Math.round((A6_WIDTH_MM / 25.4) * PRINT_DPI);
  const height = Math.round((A6_HEIGHT_MM / 25.4) * PRINT_DPI);
  const canvas = await renderCanvas(model, width, height, drawCard);
  const jpeg = new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", 0.94)).arrayBuffer());
  return buildA6Pdf(jpeg, width, height);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** e.g. cardFileName(model, "png", "-wallpaper") -> "krew-card-shashwat-wallpaper.png" */
export const cardFileName = (model: KrewCardModel, extension: string, suffix = ""): string =>
  `${cardFileStem(model)}${suffix}.${extension}`;
