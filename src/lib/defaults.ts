import { DEFAULT_DEVICE_ID } from "./devices";
import type { PersistedState, Profile, Settings, UiState } from "./types";

export const APP_NAME = "FixView Browser";
export const APP_VERSION = "0.1.0-demo";
export const STORAGE_KEY = "fixview-demo:v1";
export const STATE_VERSION = 1;
export const SLOT_COUNT = 30;
export const NORMAL_KEY = "normal";

export const DEFAULT_SETTINGS: Settings = {
  mode: "px",
  // 720 x 1120 px at 2x is a 360 x 560 CSS viewport, and is the largest
  // "round" size that still fits every target device with a 3-button nav bar.
  px: { w: 720, h: 1120, dpr: 2, top: 100 },
  dp: { w: 360, h: 560, top: 36 },
  align: "left",
  lockSystemScale: true,
  hideImages: false,
  colors: { profiles: { h: 224, l: 52 }, browser: { h: 140, l: 36 } },
  marks: {
    enabled: true,
    shape: "target",
    color: "#FF1744",
    size: 12,
    corners: { tl: true, tr: true, bl: true, br: true },
  },
  statusMark: true,
  tapIndicator: true,
  homeUrl: "demo://start",
};

function seed(slot: number, name: string, hue: number, startUrl: string): Profile {
  return { slot, name, hue, startUrl, createdAt: 0, lastUsedAt: null };
}

export function defaultPersisted(): PersistedState {
  return {
    v: STATE_VERSION,
    settings: structuredClone(DEFAULT_SETTINGS),
    profiles: {
      1: seed(1, "メイン", 268, "demo://start"),
      2: seed(2, "サブA", 190, "demo://news"),
      3: seed(3, "サブB", 28, "demo://login"),
      4: seed(4, "検証用", 328, "demo://grid"),
      5: seed(5, "ニュース", 150, "demo://news"),
    },
    jars: {},
    cache: {},
    sim: { deviceId: DEFAULT_DEVICE_ID, nav: "gesture", fontScale: 1, displayZoom: 1 },
    lastSlot: null,
    seenScaleHint: false,
  };
}

export function defaultUi(): UiState {
  return {
    screen: "profiles",
    session: null,
    normalSession: null,
    gridMode: "open",
    overlay: null,
    dialog: null,
    loading: false,
    pageStats: null,
    toasts: [],
  };
}

export const PROFILE_HUES = [268, 224, 190, 150, 48, 28, 0, 328];

export const PX_PRESETS = [
  { w: 720, h: 1120, dpr: 2 },
  { w: 720, h: 1200, dpr: 2 },
  { w: 720, h: 1280, dpr: 2 },
  { w: 1080, h: 1680, dpr: 3 },
  { w: 1080, h: 1920, dpr: 3 },
];

export const DP_PRESETS = [
  { w: 360, h: 560 },
  { w: 360, h: 600 },
  { w: 360, h: 640 },
  { w: 320, h: 568 },
];

export const MARK_COLORS = ["#FF1744", "#FF00C8", "#FFE600", "#00E5FF", "#000000", "#FFFFFF"];

export const BG_PRESETS = [
  { h: 224, l: 52 },
  { h: 140, l: 36 },
  { h: 268, l: 50 },
  { h: 190, l: 38 },
  { h: 16, l: 52 },
  { h: 330, l: 48 },
  { h: 48, l: 50 },
  { h: 222, l: 20 },
];
