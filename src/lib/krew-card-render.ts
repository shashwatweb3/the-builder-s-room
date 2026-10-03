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

/** Digital card size. A6 print raster is derived separately. */
export const CARD_PNG_WIDTH = 1080;
export const CARD_PNG_HEIGHT = 1520;
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
 * The Krew Card, matching the KrewCardPreview composition: offset-shadowed
 * card, lavender masthead, identity block, then a QR block anchored to the
 * bottom. Sized from both axes so the same routine serves the PNG and the
 * 300dpi print raster.
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

/** 1080x1920 phone wallpaper: same identity, QR anchored at the bottom. */
function drawWallpaper(
  ctx: CanvasRenderingContext2D,
  model: KrewCardModel,
  assets: RenderAssets,
  W: number,
  H: number,
): void {
  const { theme, logo, avatar, grid } = assets;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, W, H);

  const pad = Math.round(W * 0.09);

  // Masthead.
  const logoSize = Math.round(W * 0.17);
  const y = pad;
  if (logo) {
    roundRect(ctx, pad, y, logoSize, logoSize, Math.round(logoSize * 0.28));
    ctx.save();
    ctx.clip();
    ctx.drawImage(logo, pad, y, logoSize, logoSize);
    ctx.restore();
  }
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = Math.max(2, Math.round(W * 0.005));
  roundRect(ctx, pad, y, logoSize, logoSize, Math.round(logoSize * 0.28));
  ctx.stroke();

  ctx.fillStyle = theme.foreground;
  font(ctx, Math.round(W * 0.085), 700);
  ctx.textBaseline = "top";
  ctx.fillText("Krew3", pad + logoSize + pad * 0.5, y + logoSize * 0.22);

  // Identity, optically centred in the space above the QR block.
  const qrSize = Math.round(W * 0.42);
  const qrTop = H - pad * 0.6 - qrSize;
  const faceSize = Math.round(W * 0.3);
  const faceY = Math.max(y + logoSize + pad * 0.9, qrTop - faceSize - pad * 2.6);

  ctx.fillStyle = theme.lavender;
  ctx.globalAlpha = 0.4;
  roundRect(ctx, (W - faceSize) / 2, faceY, faceSize, faceSize, Math.round(faceSize * 0.3));
  ctx.fill();
  ctx.globalAlpha = 1;

  const face = avatar ?? logo;
  if (face) {
    drawCover(ctx, face, (W - faceSize) / 2, faceY, faceSize, Math.round(faceSize * 0.3));
  }
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = Math.max(2, Math.round(W * 0.005));
  roundRect(ctx, (W - faceSize) / 2, faceY, faceSize, faceSize, Math.round(faceSize * 0.3));
  ctx.stroke();

  let iy = faceY + faceSize + pad * 0.7;

  const nameSize = Math.round(W * 0.108);
  ctx.fillStyle = theme.foreground;
  font(ctx, nameSize, 700);
  ctx.textAlign = "center";
  const nameLines = wrap(ctx, model.displayName, W - pad * 2).slice(0, 2);
  for (const line of nameLines) {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, (W - w) / 2, iy);
    iy += nameSize * 1.06;
  }

  const handleSize = Math.round(W * 0.042);
  font(ctx, handleSize, 500, true);
  ctx.fillStyle = theme.mutedForeground;
  const handle = `@${model.username}`;
  const hw = ctx.measureText(handle).width;
  ctx.fillText(handle, (W - hw) / 2, iy);
  iy += handleSize * 2;

  if (model.typeLabel) {
    const pillH = Math.round(handleSize * 1.9);
    font(ctx, handleSize, 600, true);
    const tw = trackedWidth(ctx, model.typeLabel.toUpperCase(), handleSize * 0.08);
    const pw = tw + pillH;
    ctx.fillStyle = theme.primary;
    roundRect(ctx, (W - pw) / 2, iy, pw, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = theme.primaryForeground;
    ctx.textAlign = "left";
    tracked(
      ctx,
      model.typeLabel.toUpperCase(),
      (W - pw) / 2 + (pw - tw) / 2,
      iy + pillH / 2,
      handleSize * 0.08,
    );
    ctx.textAlign = "center";
    iy += pillH;
  }

  if (model.bio) {
    font(ctx, Math.round(W * 0.042), 400);
    ctx.fillStyle = theme.foreground;
    const lines = wrap(ctx, model.bio, W - pad * 2).slice(0, 3);
    iy += pad * 0.5;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      ctx.fillText(line, (W - w) / 2, iy);
      iy += Math.round(W * 0.058);
    }
  }

  if (model.connections.length > 0) {
    font(ctx, Math.round(W * 0.032), 500, true);
    ctx.fillStyle = theme.mutedForeground;
    iy += pad * 0.45;
    for (const c of model.connections.slice(0, 3)) {
      const w = ctx.measureText(c).width;
      ctx.fillText(c, (W - w) / 2, iy);
      iy += Math.round(W * 0.046);
    }
  }

  // QR footer.
  const qrX = (W - qrSize) / 2;
  drawQr(ctx, grid, qrX, qrTop, qrSize, theme);

  const ctaSize = Math.round(W * 0.034);
  font(ctx, ctaSize, 600, true);
  ctx.fillStyle = theme.foreground;
  const cta = "SCAN TO CONNECT";
  const ctaW = trackedWidth(ctx, cta, ctaSize * 0.1);
  tracked(ctx, cta, (W - ctaW) / 2, qrTop + qrSize + pad * 0.45, ctaSize * 0.1);

  font(ctx, Math.round(W * 0.036), 400, true);
  ctx.fillStyle = theme.mutedForeground;
  const pw2 = ctx.measureText(model.pathLabel).width;
  ctx.fillText(model.pathLabel, (W - pw2) / 2, qrTop + qrSize + pad * 0.45 + ctaSize * 1.7);

  ctx.textAlign = "left";
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
  const canvas = await renderCanvas(model, CARD_PNG_WIDTH, CARD_PNG_HEIGHT, drawCard);
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
