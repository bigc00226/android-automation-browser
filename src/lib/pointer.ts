import { createStore } from "./create-store";
import type { Geometry, Point } from "./geometry";

/*
 * Pointer read-out shared by the phone screen, the embedded pages and the
 * inspector. Positions are absolute physical pixels of the (simulated) device;
 * `view` is the position inside the web display area in CSS px, if any.
 */

export interface PointerInfo {
  px: Point;
  view: Point | null;
}
export interface TapInfo extends PointerInfo {
  id: number;
}
export type PointerKind = "move" | "down" | "leave";

export const pointerStore = createStore<PointerInfo | null>(null);
export const tapStore = createStore<TapInfo | null>(null);

let geometry: Geometry | null = null;
let tapId = 0;

export function setPointerGeometry(g: Geometry | null) {
  geometry = g;
}

function emit(kind: PointerKind, px: Point, view: Point | null) {
  if (kind === "leave") {
    pointerStore.set(null);
    return;
  }
  pointerStore.set({ px, view });
  if (kind === "down") tapStore.set({ id: ++tapId, px, view });
}

/** Event that happened inside the embedded page, in that page's CSS px. */
export function pointerFromView(kind: PointerKind, x: number, y: number) {
  const g = geometry;
  if (!g) return;
  emit(kind, { x: g.viewPx.x + x * g.unitPx, y: g.viewPx.y + y * g.unitPx }, { x, y });
}

/** Event that happened on the phone screen itself, already in device px. */
export function pointerFromScreen(kind: PointerKind, px: Point) {
  const g = geometry;
  if (!g) return;
  const vx = (px.x - g.viewPx.x) / g.unitPx;
  const vy = (px.y - g.viewPx.y) / g.unitPx;
  const inside = vx >= 0 && vy >= 0 && vx <= g.viewLu.w && vy <= g.viewLu.h;
  emit(kind, px, inside ? { x: vx, y: vy } : null);
}
