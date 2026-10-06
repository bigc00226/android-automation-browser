import type { PointerKind } from "./pointer";
import type { CookieJar, FixMode, PageStats } from "./types";

/*
 * Contract between the browser shell and the bundled demo pages it embeds.
 * The pages are same-origin, so they reach the shell through a single object
 * on the parent window. It stands in for what the Android app does natively
 * for every site: per-profile cookie storage, image blocking and text zoom.
 */

export const BRIDGE_KEY = "__FIXVIEW_BRIDGE__";

export interface SiteEnv {
  /** False when a demo page is opened directly in a tab, outside the shell. */
  embedded: boolean;
  sessionKey: string;
  profileSlot: number | null;
  profileName: string | null;
  profileHue: number | null;
  hideImages: boolean;
  textScale: number;
  mode: FixMode;
  /** Physical px per CSS px of the page. */
  unitPx: number;
  /** Top-left of the display area on the device screen, physical px. */
  originX: number;
  originY: number;
  /** Cookies of the active session. */
  jar: CookieJar;
}

export interface SiteBridge {
  getEnv(): SiteEnv;
  subscribe(listener: () => void): () => void;
  navigate(input: string): void;
  location(path: string, title: string): void;
  page(stats: PageStats): void;
  pointer(kind: PointerKind, x: number, y: number): void;
  cookieSet(host: string, name: string, value: string): void;
  cookieRemove(host: string, name: string): void;
}

export const EMPTY_JAR: CookieJar = {};

export const STANDALONE_ENV: SiteEnv = {
  embedded: false,
  sessionKey: "standalone",
  profileSlot: null,
  profileName: null,
  profileHue: null,
  hideImages: false,
  textScale: 1,
  mode: "off",
  unitPx: 1,
  originX: 0,
  originY: 0,
  jar: EMPTY_JAR,
};
