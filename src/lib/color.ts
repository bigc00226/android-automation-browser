import type { ThemeColor } from "./types";

const BG_SATURATION = 78;
export const INK_DARK = "#0B1220";
export const INK_LIGHT = "#FFFFFF";

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = light - c / 2;
  return [r + m, g + m, b + m].map((v) => Math.round(v * 255)) as [number, number, number];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Ink colour for text on top of `rgb`. White is preferred on saturated
 * backgrounds as long as it stays readable (contrast >= 3).
 */
export function inkOn(rgb: [number, number, number]): string {
  return 1.05 / (luminance(rgb) + 0.05) >= 3 ? INK_LIGHT : INK_DARK;
}

export interface Palette {
  bg: string;
  on: string;
  /** The opposite of `on`: ink used on top of `on`-coloured surfaces. */
  inv: string;
}

export function themePalette(c: ThemeColor): Palette {
  const rgb = hslToRgb(c.h, BG_SATURATION, c.l);
  const on = inkOn(rgb);
  return { bg: rgbToHex(rgb), on, inv: on === INK_LIGHT ? INK_DARK : INK_LIGHT };
}

export function themeHex(c: ThemeColor): string {
  return rgbToHex(hslToRgb(c.h, BG_SATURATION, c.l));
}

export function profilePalette(hue: number): { bg: string; on: string } {
  const rgb = hslToRgb(hue, 82, 58);
  return { bg: rgbToHex(rgb), on: inkOn(rgb) };
}
