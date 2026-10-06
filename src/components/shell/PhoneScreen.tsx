"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { Icon } from "@/components/Icon";
import { publishEnv } from "@/lib/bridge-host";
import { EMPTY_JAR } from "@/lib/bridge-types";
import { INK_DARK, themePalette } from "@/lib/color";
import { NORMAL_KEY } from "@/lib/defaults";
import type { Cutout } from "@/lib/devices";
import { cx, px } from "@/lib/format";
import { computeGeometry, type Geometry, type Point, type ScreenMetrics } from "@/lib/geometry";
import { pointerFromScreen, setPointerGeometry, tapStore, type PointerKind } from "@/lib/pointer";
import { dismissScaleHint, setOverlay, updateSettings, useApp } from "@/lib/store";
import { BrowserScreen } from "./BrowserScreen";
import { CanvasDialogs } from "./CanvasDialogs";
import { ProfileSheet } from "./ProfileSheet";
import { ProfilesScreen } from "./ProfilesScreen";
import { SettingsScreen } from "./SettingsScreen";
import { UrlSheet } from "./UrlSheet";
import css from "./PhoneScreen.module.css";

/**
 * Everything that is drawn on one device screen: the (simulated) system bars,
 * the fixed app canvas, and the overlays that are meant for people rather than
 * macros and therefore stay at the device's natural scale.
 */
export function PhoneScreen({ metrics, cutout }: { metrics: ScreenMetrics; cutout?: Cutout }) {
  const settings = useApp((s) => s.settings);
  const screen = useApp((s) => s.ui.screen);
  const overlay = useApp((s) => s.ui.overlay);
  const dialogOpen = useApp((s) => s.ui.dialog !== null);
  const nav = useApp((s) => s.sim.nav);
  const geo = useMemo(() => computeGeometry(metrics, settings), [metrics, settings]);
  const palette = useMemo(() => themePalette(settings.colors[screen]), [settings.colors, screen]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const d = metrics.baseDensity;

  useEffect(() => {
    setPointerGeometry(geo);
  }, [geo]);
  useEffect(() => () => setPointerGeometry(null), []);
  usePublishEnv(geo);

  const report = (kind: PointerKind) => (e: PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const point: Point = {
      x: ((e.clientX - rect.left) / rect.width) * metrics.px.w + el.scrollLeft * d,
      y: ((e.clientY - rect.top) / rect.height) * metrics.px.h + el.scrollTop * d,
    };
    pointerFromScreen(kind, point);
  };

  const statusH = metrics.statusBarPx / d;
  const navH = metrics.navBarPx / d;
  const vars = {
    "--bg": palette.bg,
    "--on": palette.on,
    "--inv": palette.inv,
    // Settings and sheets are light surfaces that reach under the system bars.
    "--status-ink": overlay?.type === "settings" ? INK_DARK : palette.on,
    "--nav-ink": overlay ? INK_DARK : palette.on,
    ...(metrics.real ? {} : { "--inset-top": `${statusH}px`, "--inset-bottom": `${navH}px` }),
  } as CSSProperties;

  return (
    <div className={cx(css.screen, metrics.real ? css.real : css.sim)} style={vars}>
      <div
        ref={scrollerRef}
        className={css.scroller}
        onPointerMove={report("move")}
        onPointerDown={report("down")}
        onPointerLeave={report("leave")}
      >
        <div
          className={css.canvas}
          style={{
            left: geo.canvasPx.x / d,
            top: geo.canvasPx.y / d,
            width: geo.canvasLu.w,
            height: geo.canvasLu.h,
            transform: `scale(${geo.cssScale})`,
          }}
        >
          {screen === "profiles" ? <ProfilesScreen geo={geo} /> : <BrowserScreen geo={geo} />}
          <CanvasDialogs />
        </div>
        <TapIndicator density={d} screenW={geo.screenCss.w} />
      </div>

      {!metrics.real && (
        <>
          {/* Opaque like the real bars, so a canvas that does not fit is visibly cut off. */}
          <div className={css.barFill} style={{ top: 0, height: statusH }} data-dimmed={dialogOpen} />
          <div className={css.barFill} style={{ bottom: 0, height: navH }} data-dimmed={dialogOpen} />
          <div className={css.statusBar} style={{ height: statusH }} data-cutout={cutout}>
            <span className={css.clock}>12:30</span>
            <span className={css.sysIcons}>
              <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" aria-hidden="true">
                <rect x="0" y="8" width="2.6" height="4" rx="0.8" />
                <rect x="4.1" y="5.5" width="2.6" height="6.5" rx="0.8" />
                <rect x="8.2" y="3" width="2.6" height="9" rx="0.8" />
                <rect x="12.3" y="0" width="2.6" height="12" rx="0.8" />
              </svg>
              <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true">
                <rect x="0.6" y="0.6" width="18.3" height="10.8" rx="3" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <rect x="2.3" y="2.3" width="14.9" height="7.4" rx="1.6" fill="currentColor" />
                <rect x="20" y="3.8" width="1.6" height="4.4" rx="0.8" fill="currentColor" opacity="0.6" />
              </svg>
            </span>
          </div>
          <div className={css.navBar} style={{ height: navH }}>
            {nav === "gesture" ? (
              <span className={css.navPill} />
            ) : (
              <span className={css.navButtons}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M11 2.500L4 8l7 5.500z" strokeLinejoin="round" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.500" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <rect x="3" y="3" width="10" height="10" rx="1.800" />
                </svg>
              </span>
            )}
          </div>
        </>
      )}

      <div className={css.appLayer}>
        <div className={css.bottomStack}>
          <Toasts />
          <FitNotice geo={geo} />
          {metrics.real && !overlay && <ScaleHint geo={geo} />}
        </div>
        {overlay?.type === "settings" && <SettingsScreen metrics={metrics} geo={geo} />}
        {overlay?.type === "profile" && <ProfileSheet key={overlay.slot} slot={overlay.slot} />}
        {overlay?.type === "url" && <UrlSheet />}
      </div>
    </div>
  );
}

/** Keeps the embedded demo pages informed about the session and the geometry they live in. */
function usePublishEnv(geo: Geometry) {
  const session = useApp((s) => s.ui.session);
  const profiles = useApp((s) => s.profiles);
  const jars = useApp((s) => s.jars);
  const hideImages = useApp((s) => s.settings.hideImages);
  useEffect(() => {
    const profile = session?.slot != null ? profiles[session.slot] : undefined;
    publishEnv({
      embedded: true,
      sessionKey: session?.key ?? NORMAL_KEY,
      profileSlot: profile?.slot ?? null,
      profileName: profile?.name ?? null,
      profileHue: profile?.hue ?? null,
      hideImages,
      textScale: geo.textScale,
      mode: geo.mode,
      unitPx: geo.unitPx,
      originX: geo.viewPx.x,
      originY: geo.viewPx.y,
      jar: (session && jars[session.key]) || EMPTY_JAR,
    });
  }, [session, profiles, jars, hideImages, geo]);
}

function Toasts() {
  const toasts = useApp((s) => s.ui.toasts);
  return (
    <>
      {toasts.map((t) => (
        <div key={t.id} className={cx(css.toast, css[`toast_${t.tone}`])} role="status">
          {t.tone === "ok" && <Icon name="check" size={15} stroke={2.4} />}
          {t.tone === "warn" && <Icon name="alert" size={15} stroke={2} />}
          <span>{t.text}</span>
        </div>
      ))}
    </>
  );
}

function FitNotice({ geo }: { geo: Geometry }) {
  if (geo.fits) return null;
  const { top, bottom, right } = geo.overflow;
  const parts = [top && `上 ${top}px`, bottom && `下 ${bottom}px`, right && `右 ${right}px`].filter(Boolean);
  return (
    <button type="button" className={css.fitNotice} onClick={() => setOverlay({ type: "settings" })}>
      <Icon name="alert" size={15} stroke={2} />
      <span>表示エリアがこの画面に収まりません（{parts.join("・")}）</span>
    </button>
  );
}

/**
 * Shown once on a real phone when px fixing makes the app visibly smaller (or
 * larger) than usual, which would otherwise look like a layout bug.
 */
function ScaleHint({ geo }: { geo: Geometry }) {
  const seen = useApp((s) => s.seenScaleHint);
  const size = useApp((s) => s.settings.px);
  if (seen || geo.mode !== "px" || Math.abs(geo.cssScale - 1) < 0.04) return null;
  return (
    <div className={css.hint} role="dialog" aria-label="表示エリアの固定について">
      <strong>
        表示エリアを {size.w}×{size.h}px に固定しています
      </strong>
      <p>
        この端末では通常の {Math.round(geo.cssScale * 100)}% の大きさで表示されます。その代わり、どの機種でも同じピクセル座標になります。
      </p>
      <div>
        <button
          type="button"
          onClick={() => {
            updateSettings({ mode: "dp" });
            dismissScaleHint();
          }}
        >
          dp 固定で見る
        </button>
        <button type="button" className={css.hintPrimary} onClick={dismissScaleHint}>
          このまま使う
        </button>
      </div>
    </div>
  );
}

/** Short-lived marker showing where a tap landed, in device pixels. */
function TapIndicator({ density, screenW }: { density: number; screenW: number }) {
  const tap = useSyncExternalStore(tapStore.subscribe, tapStore.get, () => null);
  const enabled = useApp((s) => s.settings.tapIndicator);
  if (!enabled || !tap) return null;
  const x = tap.px.x / density;
  const y = tap.px.y / density;
  const side = x < 70 ? "start" : x > screenW - 70 ? "end" : "center";
  return (
    <div key={tap.id} className={css.tap} style={{ left: x, top: y }} data-side={side} data-below={y < 64} aria-hidden="true">
      <span className={css.tapRing} />
      <span className={css.tapDot} />
      <span className={css.tapLabel}>
        X {px(tap.px.x)}
        <i />Y {px(tap.px.y)}
      </span>
    </div>
  );
}
