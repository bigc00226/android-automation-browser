import { useSyncExternalStore } from "react";
import { createStore } from "./create-store";
import { NORMAL_KEY, SLOT_COUNT, STATE_VERSION, STORAGE_KEY, defaultPersisted, defaultUi } from "./defaults";
import { DEVICES, DISPLAY_ZOOMS, FONT_SCALES } from "./devices";
import { clamp, pad2 } from "./format";
import { demoToPath, isDemoUrl, isSitePath, normalizeInput, pathToDemo } from "./urls";
import type {
  AppState,
  BrowserSession,
  CanvasDialog,
  Corner,
  GridMode,
  HistoryEntry,
  MarkShape,
  Overlay,
  PageStats,
  PersistedState,
  Profile,
  SessionKey,
  Settings,
  SimState,
  ThemeColor,
  Toast,
  UiState,
} from "./types";

/* ------------------------------------------------------------------ */
/* Persistence (localStorage only: the demo has no backend database)   */
/* ------------------------------------------------------------------ */

export const DPR_CHOICES = [1.5, 2, 3];
export const MIN_VIEW_W = 300;

function sanitizeSettings(s: Settings): Settings {
  const int = (v: unknown, min: number, max: number, fallback: number) =>
    Number.isFinite(Number(v)) ? clamp(Math.round(Number(v)), min, max) : fallback;
  const d = defaultPersisted().settings;
  const shapes: MarkShape[] = ["target", "ring", "dot", "square", "cross"];
  const dpr = DPR_CHOICES.includes(Number(s.px.dpr)) ? Number(s.px.dpr) : d.px.dpr;
  return {
    mode: s.mode === "dp" || s.mode === "off" ? s.mode : "px",
    align: s.align === "center" ? "center" : "left",
    lockSystemScale: Boolean(s.lockSystemScale),
    hideImages: Boolean(s.hideImages),
    statusMark: Boolean(s.statusMark),
    tapIndicator: Boolean(s.tapIndicator),
    homeUrl: typeof s.homeUrl === "string" && s.homeUrl ? s.homeUrl : d.homeUrl,
    px: {
      // The toolbar needs at least MIN_VIEW_W logical units to stay usable.
      w: int(s.px.w, MIN_VIEW_W * dpr, 2160, d.px.w),
      h: int(s.px.h, 240, 3840, d.px.h),
      dpr,
      top: int(s.px.top, 0, 800, d.px.top),
    },
    dp: {
      w: int(s.dp.w, MIN_VIEW_W, 720, d.dp.w),
      h: int(s.dp.h, 120, 1280, d.dp.h),
      top: int(s.dp.top, 0, 240, d.dp.top),
    },
    colors: {
      profiles: { h: int(s.colors.profiles.h, 0, 360, 224), l: int(s.colors.profiles.l, 12, 88, 52) },
      browser: { h: int(s.colors.browser.h, 0, 360, 140), l: int(s.colors.browser.l, 12, 88, 36) },
    },
    marks: {
      enabled: Boolean(s.marks.enabled),
      shape: shapes.includes(s.marks.shape) ? s.marks.shape : d.marks.shape,
      color: /^#[0-9a-f]{6}$/i.test(String(s.marks.color)) ? s.marks.color.toUpperCase() : d.marks.color,
      size: int(s.marks.size, 6, 24, d.marks.size),
      corners: {
        tl: Boolean(s.marks.corners.tl),
        tr: Boolean(s.marks.corners.tr),
        bl: Boolean(s.marks.corners.bl),
        br: Boolean(s.marks.corners.br),
      },
    },
  };
}

function sanitizeProfiles(input: unknown): Record<number, Profile> {
  const out: Record<number, Profile> = {};
  if (!input || typeof input !== "object") return out;
  for (const value of Object.values(input as Record<string, Partial<Profile>>)) {
    const slot = Number(value?.slot);
    if (!Number.isInteger(slot) || slot < 1 || slot > SLOT_COUNT) continue;
    out[slot] = {
      slot,
      name: String(value.name ?? `プロファイル ${slot}`).slice(0, 20),
      hue: clamp(Number(value.hue) || 0, 0, 360),
      startUrl: String(value.startUrl ?? "demo://start").slice(0, 500),
      createdAt: Number(value.createdAt) || 0,
      lastUsedAt: value.lastUsedAt ? Number(value.lastUsedAt) : null,
    };
  }
  return out;
}

function mergePersisted(saved: Partial<PersistedState>): PersistedState {
  const base = defaultPersisted();
  const s = (saved.settings ?? {}) as Partial<Settings>;
  const settings = sanitizeSettings({
    ...base.settings,
    ...s,
    px: { ...base.settings.px, ...s.px },
    dp: { ...base.settings.dp, ...s.dp },
    colors: {
      profiles: { ...base.settings.colors.profiles, ...s.colors?.profiles },
      browser: { ...base.settings.colors.browser, ...s.colors?.browser },
    },
    marks: {
      ...base.settings.marks,
      ...s.marks,
      corners: { ...base.settings.marks.corners, ...s.marks?.corners },
    },
  });
  return {
    v: STATE_VERSION,
    settings,
    profiles: saved.profiles ? sanitizeProfiles(saved.profiles) : base.profiles,
    jars: saved.jars ?? {},
    cache: saved.cache ?? {},
    sim: sanitizeSim({ ...base.sim, ...saved.sim }, base.sim),
    lastSlot: saved.lastSlot ?? null,
    seenScaleHint: Boolean(saved.seenScaleHint),
  };
}

function sanitizeSim(sim: SimState, fallback: SimState): SimState {
  return {
    deviceId: DEVICES.some((d) => d.id === sim.deviceId) ? sim.deviceId : fallback.deviceId,
    nav: sim.nav === "buttons" ? "buttons" : "gesture",
    fontScale: FONT_SCALES.some((f) => f.value === sim.fontScale) ? sim.fontScale : 1,
    displayZoom: DISPLAY_ZOOMS.some((z) => z.value === sim.displayZoom) ? sim.displayZoom : 1,
  };
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return defaultPersisted();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted();
    const saved = JSON.parse(raw) as Partial<PersistedState>;
    return saved.v === STATE_VERSION ? mergePersisted(saved) : defaultPersisted();
  } catch {
    return defaultPersisted();
  }
}

export const store = createStore<AppState>({ ...loadPersisted(), ui: defaultUi() });

if (typeof window !== "undefined") {
  let timer: number | undefined;
  let lastSaved: unknown[] = [];
  store.subscribe(() => {
    const st = store.get();
    const parts = [st.settings, st.profiles, st.jars, st.cache, st.sim, st.lastSlot, st.seenScaleHint];
    if (parts.every((part, i) => part === lastSaved[i])) return;
    lastSaved = parts;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const { ui: _ui, ...persisted } = store.get();
      void _ui;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      } catch {
        // Storage may be unavailable (private mode); the demo still works in memory.
      }
    }, 200);
  });
}

export function useApp<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

const set = store.set;
const patchUi = (patch: Partial<UiState>) => set((s) => ({ ...s, ui: { ...s.ui, ...patch } }));

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function updateSettings(patch: Partial<Settings>) {
  set((s) => ({ ...s, settings: sanitizeSettings({ ...s.settings, ...patch }) }));
}
export const updatePx = (patch: Partial<Settings["px"]>) => updateSettings({ px: { ...store.get().settings.px, ...patch } });
export const updateDp = (patch: Partial<Settings["dp"]>) => updateSettings({ dp: { ...store.get().settings.dp, ...patch } });
export const updateMarks = (patch: Partial<Settings["marks"]>) =>
  updateSettings({ marks: { ...store.get().settings.marks, ...patch } });

export function toggleMarkCorner(corner: Corner) {
  const { marks } = store.get().settings;
  updateMarks({ corners: { ...marks.corners, [corner]: !marks.corners[corner] } });
}

export function updateThemeColor(which: "profiles" | "browser", patch: Partial<ThemeColor>) {
  const { colors } = store.get().settings;
  updateSettings({ colors: { ...colors, [which]: { ...colors[which], ...patch } } });
}

export function updateSim(patch: Partial<SimState>) {
  set((s) => ({ ...s, sim: { ...s.sim, ...patch } }));
}

export function toggleHideImages() {
  const next = !store.get().settings.hideImages;
  updateSettings({ hideImages: next });
  const session = store.get().ui.session;
  const src = session?.entries[session.index].src;
  // An embedded third-party page cannot be altered from this web demo.
  const external = typeof src === "string" && !src.startsWith("/");
  toast(
    !next
      ? "画像非表示: OFF"
      : external
        ? "画像非表示: ON（外部サイトへの適用は Android アプリ本体で有効です）"
        : "画像非表示: ON（レイアウトは維持されます）",
    "info",
  );
}

export function dismissScaleHint() {
  set((s) => (s.seenScaleHint ? s : { ...s, seenScaleHint: true }));
}

/* ------------------------------------------------------------------ */
/* Overlays, dialogs, toasts                                           */
/* ------------------------------------------------------------------ */

export const setOverlay = (overlay: Overlay) => patchUi({ overlay });
export const setDialog = (dialog: CanvasDialog) => patchUi({ dialog });
export const setGridMode = (gridMode: GridMode) => patchUi({ gridMode });

let toastId = 0;
export function toast(text: string, tone: Toast["tone"] = "info") {
  const id = ++toastId;
  set((s) => ({ ...s, ui: { ...s.ui, toasts: [...s.ui.toasts.slice(-1), { id, text, tone }] } }));
  window.setTimeout(() => {
    set((s) => ({ ...s, ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) } }));
  }, 2800);
}

/* ------------------------------------------------------------------ */
/* Browser sessions and navigation                                     */
/* ------------------------------------------------------------------ */

export const sessionKeyOf = (slot: number | null): SessionKey => (slot == null ? NORMAL_KEY : `p${slot}`);

let navCounter = 0;
const nextNavKey = () => ++navCounter;

function entryFor(url: string): HistoryEntry {
  // External addresses are resolved asynchronously (see resolveExternal).
  return { url, src: isDemoUrl(url) ? demoToPath(url) : null };
}

function withSession(s: AppState, session: BrowserSession, ui: Partial<UiState> = {}): AppState {
  return {
    ...s,
    ui: {
      ...s.ui,
      ...ui,
      session,
      normalSession: session.slot == null ? session : s.ui.normalSession,
    },
  };
}

/* Loading indicator. Local pages load almost instantly, so the busy state is
   held for a short minimum to keep the status mark from flickering. */
const MIN_LOAD_MS = 450;
let loadStartedAt = 0;
let loadTimer: number | undefined;

function beginLoad() {
  loadStartedAt = Date.now();
  window.clearTimeout(loadTimer);
  if (!store.get().ui.loading) patchUi({ loading: true });
}

function endLoad() {
  window.clearTimeout(loadTimer);
  const wait = Math.max(0, MIN_LOAD_MS - (Date.now() - loadStartedAt));
  loadTimer = window.setTimeout(() => patchUi({ loading: false }), wait);
}

function blockedSrc(url: string, reason: string): string {
  return `/sites/blocked?reason=${reason}&url=${encodeURIComponent(url)}`;
}

const frameCheckCache = new Map<string, string>();

/**
 * Many sites refuse to be shown inside an iframe (X-Frame-Options / CSP).
 * That is a limitation of this web demo only, so it is detected up front and
 * replaced by an explanatory page instead of a broken frame.
 */
async function externalSrc(url: string): Promise<string> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return blockedSrc(url, "invalid");
  }
  if (target.origin === window.location.origin) {
    return isSitePath(target.pathname) ? target.pathname + target.search : blockedSrc(url, "self");
  }
  if (window.location.protocol === "https:" && target.protocol === "http:") return blockedSrc(url, "mixed");
  const cached = frameCheckCache.get(url);
  if (cached) return cached;
  let src = url;
  try {
    const res = await fetch(`/api/frame-check?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const verdict = (await res.json()) as { embeddable: boolean; reason?: string };
      if (!verdict.embeddable) src = blockedSrc(url, verdict.reason ?? "refused");
    }
  } catch {
    // If the check itself fails, just try to show the page.
  }
  frameCheckCache.set(url, src);
  return src;
}

function startLoad(session: BrowserSession) {
  beginLoad();
  const entry = session.entries[session.index];
  if (entry.src !== null) return;
  const { navKey } = session;
  void externalSrc(entry.url).then((src) => {
    set((s) => {
      const current = s.ui.session;
      if (!current || current.navKey !== navKey) return s;
      const cur = current.entries[current.index];
      if (cur.url !== entry.url || cur.src !== null) return s;
      const entries = current.entries.slice();
      entries[current.index] = { ...cur, src };
      return withSession(s, { ...current, entries });
    });
  });
}

function openSession(session: BrowserSession, extra: Partial<AppState> = {}) {
  set((s) => ({
    ...withSession({ ...s, ...extra }, session, {
      screen: "browser",
      gridMode: "open",
      dialog: null,
      overlay: null,
      pageStats: null,
    }),
  }));
  startLoad(session);
}

/** Switching to a profile always starts from its registered start URL (deterministic for macros). */
export function openProfile(slot: number) {
  const profile = store.get().profiles[slot];
  if (!profile) return;
  const session: BrowserSession = {
    key: sessionKeyOf(slot),
    slot,
    entries: [entryFor(profile.startUrl)],
    index: 0,
    navKey: nextNavKey(),
  };
  openSession(session, {
    lastSlot: slot,
    profiles: { ...store.get().profiles, [slot]: { ...profile, lastUsedAt: Date.now() } },
  });
  toast(`プロファイル ${pad2(slot)}「${profile.name}」に切り替えました`, "ok");
}

/** The no-profile browser resumes its last page for as long as the app stays open. */
export function openNormal() {
  const { ui, settings } = store.get();
  const session: BrowserSession = ui.normalSession
    ? { ...ui.normalSession, navKey: nextNavKey() }
    : { key: NORMAL_KEY, slot: null, entries: [entryFor(settings.homeUrl)], index: 0, navKey: nextNavKey() };
  openSession(session);
}

export function goProfiles() {
  window.clearTimeout(loadTimer);
  patchUi({ screen: "profiles", session: null, dialog: null, overlay: null, loading: false, pageStats: null });
}

export function navigate(input: string) {
  const { ui, settings } = store.get();
  const session = ui.session;
  if (!session) return;
  const url = normalizeInput(input, settings.homeUrl);
  const entries = [...session.entries.slice(0, session.index + 1), entryFor(url)];
  const next = { ...session, entries, index: entries.length - 1, navKey: nextNavKey() };
  set((s) => withSession(s, next, { pageStats: null, overlay: null }));
  startLoad(next);
}

function step(delta: number) {
  const session = store.get().ui.session;
  if (!session) return;
  const index = session.index + delta;
  if (index < 0 || index >= session.entries.length) return;
  const next = { ...session, index, navKey: nextNavKey() };
  set((s) => withSession(s, next, { pageStats: null }));
  startLoad(next);
}
export const goBack = () => step(-1);
export const goForward = () => step(1);

export function reload() {
  const session = store.get().ui.session;
  if (!session) return;
  const next = { ...session, navKey: nextNavKey() };
  set((s) => withSession(s, next, { pageStats: null }));
  startLoad(next);
}

const samePath = (a: string | null | undefined, b: string) => {
  if (a == null) return false;
  try {
    return decodeURI(a) === decodeURI(b);
  } catch {
    return a === b;
  }
};

/**
 * Called by an embedded demo page whenever its own location changes, which is
 * how link taps inside the page reach the address bar and the history.
 */
export function frameLocation(path: string, title: string) {
  const session = store.get().ui.session;
  if (!session) return;
  const current = session.entries[session.index];
  if (samePath(current.src, path)) {
    if (title && current.title !== title) {
      const entries = session.entries.slice();
      entries[session.index] = { ...current, title };
      set((s) => (s.ui.session === session ? withSession(s, { ...session, entries }) : s));
    }
    return;
  }
  if (!isSitePath(path) || path.startsWith("/sites/blocked")) return;
  let next: BrowserSession;
  if (samePath(session.entries[session.index - 1]?.src, path)) {
    next = { ...session, index: session.index - 1 };
  } else if (samePath(session.entries[session.index + 1]?.src, path)) {
    next = { ...session, index: session.index + 1 };
  } else {
    const entries = [...session.entries.slice(0, session.index + 1), { url: pathToDemo(path), src: path, title }];
    next = { ...session, entries, index: entries.length - 1 };
  }
  set((s) => (s.ui.session === session ? withSession(s, next, { pageStats: null }) : s));
  beginLoad();
  endLoad();
}

export function frameLoaded() {
  endLoad();
}

/* ------------------------------------------------------------------ */
/* Per-session data: simulated cookies and cache                       */
/* ------------------------------------------------------------------ */

export function cookieSet(host: string, name: string, value: string) {
  set((s) => {
    const key = s.ui.session?.key;
    if (!key) return s;
    const jar = s.jars[key] ?? {};
    if (jar[host]?.[name] === value) return s;
    return { ...s, jars: { ...s.jars, [key]: { ...jar, [host]: { ...jar[host], [name]: value } } } };
  });
}

export function cookieRemove(host: string, name: string) {
  set((s) => {
    const key = s.ui.session?.key;
    if (!key || s.jars[key]?.[host]?.[name] === undefined) return s;
    const { [name]: _removed, ...rest } = s.jars[key][host];
    void _removed;
    return { ...s, jars: { ...s.jars, [key]: { ...s.jars[key], [host]: rest } } };
  });
}

export function cookieCount(state: AppState, key: SessionKey): number {
  return Object.values(state.jars[key] ?? {}).reduce((n, host) => n + Object.keys(host).length, 0);
}

const PAGE_BASE_BYTES = 64 * 1024;
let counted = { page: "", bytes: 0 };

/** Embedded pages report their image weight; it feeds the "saved data" read-out and the fake cache size. */
export function reportPage(stats: PageStats) {
  set((s) => {
    const session = s.ui.session;
    if (!session) return s;
    const page = `${session.navKey}:${session.index}`;
    const loaded = PAGE_BASE_BYTES + (stats.hidden ? 0 : stats.bytes);
    let add = 0;
    if (counted.page !== page) {
      add = loaded;
      counted = { page, bytes: loaded };
    } else if (loaded > counted.bytes) {
      add = loaded - counted.bytes;
      counted = { page, bytes: loaded };
    }
    const prev = s.ui.pageStats;
    const same = prev && prev.images === stats.images && prev.bytes === stats.bytes && prev.hidden === stats.hidden;
    if (!add && same) return s;
    return {
      ...s,
      cache: add ? { ...s.cache, [session.key]: (s.cache[session.key] ?? 0) + add } : s.cache,
      ui: { ...s.ui, pageStats: stats },
    };
  });
}

function dropSessionData(s: AppState, key: SessionKey): AppState {
  const { [key]: _jar, ...jars } = s.jars;
  const { [key]: _cache, ...cache } = s.cache;
  void _jar;
  void _cache;
  return { ...s, jars, cache };
}

/** Clears cookies and cache of one session; reloads the page if that session is on screen. */
export function clearSessionData(key: SessionKey) {
  set((s) => dropSessionData(s, key));
  if (store.get().ui.session?.key === key) reload();
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export function saveProfile(input: Pick<Profile, "slot" | "name" | "hue" | "startUrl">) {
  set((s) => {
    const prev = s.profiles[input.slot];
    const profile: Profile = {
      createdAt: prev?.createdAt ?? Date.now(),
      lastUsedAt: prev?.lastUsedAt ?? null,
      ...input,
      name: input.name.trim().slice(0, 20) || `プロファイル ${input.slot}`,
      startUrl: normalizeInput(input.startUrl, s.settings.homeUrl),
    };
    return { ...s, profiles: { ...s.profiles, [input.slot]: profile } };
  });
}

export function deleteProfile(slot: number) {
  if (store.get().ui.session?.slot === slot) goProfiles();
  set((s) => {
    const { [slot]: _gone, ...profiles } = s.profiles;
    void _gone;
    return { ...dropSessionData(s, sessionKeyOf(slot)), profiles, lastSlot: s.lastSlot === slot ? null : s.lastSlot };
  });
}

/* ------------------------------------------------------------------ */
/* Export / import / reset                                             */
/* ------------------------------------------------------------------ */

const EXPORT_TAG = "fixview-demo";

export function exportJson(): string {
  const { settings, profiles } = store.get();
  return JSON.stringify({ app: EXPORT_TAG, v: STATE_VERSION, exportedAt: new Date().toISOString(), settings, profiles }, null, 2);
}

export function importJson(text: string): boolean {
  try {
    const data = JSON.parse(text) as { app?: string; settings?: Settings; profiles?: unknown };
    if (data?.app !== EXPORT_TAG || !data.settings) return false;
    const merged = mergePersisted({ settings: data.settings, profiles: sanitizeProfiles(data.profiles) });
    set((s) => ({ ...s, settings: merged.settings, profiles: merged.profiles }));
    return true;
  } catch {
    return false;
  }
}

export function resetAll() {
  window.clearTimeout(loadTimer);
  set((s) => ({ ...defaultPersisted(), ui: { ...defaultUi(), overlay: s.ui.overlay } }));
}
