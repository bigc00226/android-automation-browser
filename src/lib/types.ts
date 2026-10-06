/** How the app surface is pinned to the physical screen. */
export type FixMode = "px" | "dp" | "off";
export type Align = "left" | "center";
export type MarkShape = "target" | "ring" | "dot" | "square" | "cross";
export type Corner = "tl" | "tr" | "bl" | "br";
export type NavStyle = "gesture" | "buttons";
export type ScreenName = "profiles" | "browser";

/** Background colour as hue (0-360) and lightness % ("色合い" / "濃淡"). */
export interface ThemeColor {
  h: number;
  l: number;
}

export interface Settings {
  mode: FixMode;
  /** px mode: size of the web display area in physical pixels. */
  px: { w: number; h: number; dpr: number; top: number };
  /** dp mode: size of the web display area in density-independent pixels. */
  dp: { w: number; h: number; top: number };
  align: Align;
  /** Ignore the device's font-size / display-size settings. */
  lockSystemScale: boolean;
  hideImages: boolean;
  colors: { profiles: ThemeColor; browser: ThemeColor };
  marks: {
    enabled: boolean;
    shape: MarkShape;
    color: string;
    size: number;
    corners: Record<Corner, boolean>;
  };
  statusMark: boolean;
  tapIndicator: boolean;
  homeUrl: string;
}

export interface Profile {
  slot: number;
  name: string;
  hue: number;
  startUrl: string;
  createdAt: number;
  lastUsedAt: number | null;
}

/** "normal" (no profile) or "p<slot>". */
export type SessionKey = string;
/** host -> cookie name -> value */
export type CookieJar = Record<string, Record<string, string>>;

export interface SimState {
  deviceId: string;
  nav: NavStyle;
  fontScale: number;
  displayZoom: number;
}

export interface PersistedState {
  v: number;
  settings: Settings;
  profiles: Record<number, Profile>;
  jars: Record<SessionKey, CookieJar>;
  /** Simulated cache size in bytes per session. */
  cache: Record<SessionKey, number>;
  sim: SimState;
  lastSlot: number | null;
  /** The one-time note about the scaled-down canvas has been dismissed. */
  seenScaleHint: boolean;
}

export interface HistoryEntry {
  /** Canonical address shown to the user (demo://… or https://…). */
  url: string;
  /** What the iframe actually loads; null while an external URL is being checked. */
  src: string | null;
  title?: string;
}

export interface BrowserSession {
  key: SessionKey;
  slot: number | null;
  entries: HistoryEntry[];
  index: number;
  /** Bumped whenever the shell itself (re)loads the frame. */
  navKey: number;
}

export type Overlay =
  | { type: "settings" }
  | { type: "profile"; slot: number }
  | { type: "url" }
  | null;

export type CanvasDialog =
  | { type: "reset-normal" }
  | { type: "reset-profile"; slot: number }
  | null;

export type GridMode = "open" | "edit" | "reset";

export interface PageStats {
  images: number;
  bytes: number;
  hidden: boolean;
}

export interface Toast {
  id: number;
  text: string;
  tone: "info" | "ok" | "warn";
}

export interface UiState {
  screen: ScreenName;
  session: BrowserSession | null;
  /** Kept in memory so the no-profile browser resumes where it was. */
  normalSession: BrowserSession | null;
  gridMode: GridMode;
  overlay: Overlay;
  dialog: CanvasDialog;
  loading: boolean;
  pageStats: PageStats | null;
  toasts: Toast[];
}

export interface AppState extends PersistedState {
  ui: UiState;
}
