/**
 * Local types for qrcode-generator.
 *
 * The package ships `export =` typings that omit `getModuleCount()` and
 * `isDark()`, which are the two members the canvas renderers need to rasterise
 * a symbol at an arbitrary resolution. Declared here instead of pulling in
 * @types so the surface we actually consume stays explicit.
 */
declare module "qrcode-generator" {
  export interface QrCode {
    addData(data: string, mode?: "Numeric" | "Alphanumeric" | "Byte" | "Kanji"): void;
    make(): void;
    /** Width and height of the symbol in modules, excluding the quiet zone. */
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
  }

  export default function qrcode(
    typeNumber: number,
    errorCorrectionLevel: "L" | "M" | "Q" | "H",
  ): QrCode;
}
