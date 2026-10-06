import type { DeviceSpec } from "./devices";
import type { Corner, FixMode, NavStyle, Settings, SimState } from "./types";

/*
 * Layout engine.
 *
 * The whole app surface (toolbar, address bar, mark strips, web display area,
 * profile grid) is drawn on one "canvas" measured in logical units (lu). One lu
 * is one CSS px of the embedded web page. The fix mode decides how many
 * physical pixels one lu covers:
 *
 *   px  : a fixed number (the configured DPR) -> identical pixels on every device
 *   dp  : the device density                  -> identical physical size
 *   off : the device density, canvas fills the screen like an ordinary browser
 *
 * Everything is computed in physical pixels of the device first; the UI then
 * divides by `baseDensity` to draw it.
 */

export const TOOLBAR_H = 44;
export const URLBAR_H = 38;
export const MARK_INSET = 4;
export const MIN_STRIP_H = 18;
/** Loading indicator: a square placed right after the top-left mark. */
export const STATUS_SIZE = 10;
export const STATUS_GAP = 7;
export const NAV_DP: Record<NavStyle, number> = { gesture: 20, buttons: 48 };

export interface Size {
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Rect extends Point, Size {}

/** A concrete screen: either a simulated handset or the real browser window. */
export interface ScreenMetrics {
  id: string;
  name: string;
  real: boolean;
  px: Size;
  /** Physical px per dp at the default display size. */
  baseDensity: number;
  statusBarPx: number;
  navBarPx: number;
  /** System "display size" multiplier. */
  zoom: number;
  /** System font scale. */
  fontScale: number;
}

export function simulatedMetrics(d: DeviceSpec, sim: SimState): ScreenMetrics {
  const density = d.density * sim.displayZoom;
  return {
    id: d.id,
    name: d.name,
    real: false,
    px: d.px,
    baseDensity: d.density,
    statusBarPx: Math.round(d.statusBarDp * density),
    navBarPx: Math.round(NAV_DP[sim.nav] * density),
    zoom: sim.displayZoom,
    fontScale: sim.fontScale,
  };
}

export function realMetrics(cssW: number, cssH: number, dpr: number): ScreenMetrics {
  return {
    id: "this-device",
    name: "この端末",
    real: true,
    px: { w: Math.round(cssW * dpr), h: Math.round(cssH * dpr) },
    baseDensity: dpr,
    statusBarPx: 0,
    navBarPx: 0,
    zoom: 1,
    fontScale: 1,
  };
}

export interface MarkPos {
  corner: Corner;
  lu: Point;
  px: Point;
}

export interface Geometry {
  metrics: ScreenMetrics;
  mode: FixMode;
  /** Physical px per logical unit. */
  unitPx: number;
  /** Scale applied to the canvas inside the drawn screen (unitPx / baseDensity). */
  cssScale: number;
  screenCss: Size;
  stripH: number;
  canvasLu: Size;
  canvasPx: Rect;
  /** Web display area inside the canvas, logical units. */
  viewLu: Rect;
  /** Web display area on the device screen, absolute physical px. */
  viewPx: Rect;
  marks: MarkPos[];
  /** Centre of the loading indicator, if it is shown. */
  status: { lu: Point; px: Point } | null;
  textScale: number;
  /** How far the canvas sticks out of the usable screen, in px (0 = fits). */
  overflow: { top: number; bottom: number; right: number };
  fits: boolean;
}

export function stripHeight(s: Settings): number {
  return Math.max(MIN_STRIP_H, s.marks.enabled ? s.marks.size + 6 : 0);
}

/** Horizontal space a strip keeps free for the corner mark on each side. */
export function stripInset(s: Settings): number {
  return (s.marks.enabled ? s.marks.size : 0) + MARK_INSET + STATUS_GAP;
}

export function chromeHeight(s: Settings): number {
  return TOOLBAR_H + URLBAR_H + stripHeight(s) * 2;
}

/** Physical px per dp as the app sees it (optionally ignoring the display-size setting). */
function systemUnit(m: ScreenMetrics, s: Settings): number {
  return m.baseDensity * (s.lockSystemScale ? 1 : m.zoom);
}

export function computeGeometry(m: ScreenMetrics, s: Settings): Geometry {
  const stripH = stripHeight(s);
  const chromeH = chromeHeight(s);
  let unitPx: number;
  let canvasLu: Size;
  let canvasPx: Rect;

  const centered = (wPx: number) => (s.align === "center" ? Math.max(0, Math.round((m.px.w - wPx) / 2)) : 0);

  if (s.mode === "px") {
    unitPx = s.px.dpr;
    canvasLu = { w: s.px.w / unitPx, h: s.px.h / unitPx + chromeH };
    const wPx = canvasLu.w * unitPx;
    canvasPx = { x: centered(wPx), y: s.px.top, w: wPx, h: canvasLu.h * unitPx };
  } else if (s.mode === "dp") {
    unitPx = systemUnit(m, s);
    canvasLu = { w: s.dp.w, h: s.dp.h + chromeH };
    const wPx = canvasLu.w * unitPx;
    canvasPx = { x: centered(wPx), y: s.dp.top * unitPx, w: wPx, h: canvasLu.h * unitPx };
  } else {
    unitPx = systemUnit(m, s);
    const hPx = Math.max(0, m.px.h - m.statusBarPx - m.navBarPx);
    canvasLu = { w: m.px.w / unitPx, h: Math.floor(hPx / unitPx) };
    canvasPx = { x: 0, y: m.statusBarPx, w: m.px.w, h: hPx };
  }

  const viewLu: Rect = {
    x: 0,
    y: TOOLBAR_H + URLBAR_H + stripH,
    w: canvasLu.w,
    h: Math.max(0, canvasLu.h - chromeH),
  };
  const viewPx: Rect = {
    x: canvasPx.x,
    y: canvasPx.y + viewLu.y * unitPx,
    w: viewLu.w * unitPx,
    h: viewLu.h * unitPx,
  };

  const half = s.marks.size / 2;
  const left = MARK_INSET + half;
  const right = canvasLu.w - MARK_INSET - half;
  const top = TOOLBAR_H + URLBAR_H + stripH / 2;
  const bottom = viewLu.y + viewLu.h + stripH / 2;
  const at = (corner: Corner, x: number, y: number): MarkPos => ({
    corner,
    lu: { x, y },
    px: { x: canvasPx.x + x * unitPx, y: canvasPx.y + y * unitPx },
  });
  const marks: MarkPos[] = s.marks.enabled
    ? [at("tl", left, top), at("tr", right, top), at("bl", left, bottom), at("br", right, bottom)].filter(
        (mk) => s.marks.corners[mk.corner],
      )
    : [];

  const statusLu = { x: stripInset(s) + STATUS_SIZE / 2, y: top };
  const status = s.statusMark
    ? { lu: statusLu, px: { x: canvasPx.x + statusLu.x * unitPx, y: canvasPx.y + statusLu.y * unitPx } }
    : null;

  const overflow =
    s.mode === "off"
      ? { top: 0, bottom: 0, right: 0 }
      : {
          top: Math.max(0, Math.round(m.statusBarPx - canvasPx.y)),
          bottom: Math.max(0, Math.round(canvasPx.y + canvasPx.h - (m.px.h - m.navBarPx))),
          right: Math.max(0, Math.round(canvasPx.x + canvasPx.w - m.px.w)),
        };

  return {
    metrics: m,
    mode: s.mode,
    unitPx,
    cssScale: unitPx / m.baseDensity,
    screenCss: { w: m.px.w / m.baseDensity, h: m.px.h / m.baseDensity },
    stripH,
    canvasLu,
    canvasPx,
    viewLu,
    viewPx,
    marks,
    status,
    textScale: s.lockSystemScale ? 1 : m.fontScale,
    overflow,
    fits: overflow.top === 0 && overflow.bottom === 0 && overflow.right === 0,
  };
}

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

/** Largest display area (in the current mode's unit) that fits every given screen. */
export function recommendSize(s: Settings, screens: ScreenMetrics[]): (Size & { top: number }) | null {
  if (s.mode === "off" || screens.length === 0) return null;
  const chromeH = chromeHeight(s);
  if (s.mode === "px") {
    const unit = s.px.dpr;
    const top = Math.max(s.px.top, ceilTo(Math.max(...screens.map((m) => m.statusBarPx)), 4));
    const w = Math.min(...screens.map((m) => m.px.w));
    const h = Math.min(...screens.map((m) => m.px.h - m.navBarPx - top - chromeH * unit));
    return { w: floorTo(w, 40), h: Math.max(240, floorTo(h, 40)), top };
  }
  const unit = (m: ScreenMetrics) => systemUnit(m, s);
  const top = Math.max(s.dp.top, ceilTo(Math.max(...screens.map((m) => m.statusBarPx / unit(m))), 2));
  const w = Math.min(...screens.map((m) => m.px.w / unit(m)));
  const h = Math.min(...screens.map((m) => (m.px.h - m.navBarPx) / unit(m) - top - chromeH));
  return { w: floorTo(w, 20), h: Math.max(120, floorTo(h, 20)), top };
}

export function sameRect(a: Rect, b: Rect): boolean {
  const r = Math.round;
  return r(a.x) === r(b.x) && r(a.y) === r(b.y) && r(a.w) === r(b.w) && r(a.h) === r(b.h);
}
