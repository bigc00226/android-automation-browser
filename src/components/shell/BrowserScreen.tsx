"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { dropSiteListeners } from "@/lib/bridge-host";
import { profilePalette } from "@/lib/color";
import { cx, formatBytes, num, pad2 } from "@/lib/format";
import { TOOLBAR_H, URLBAR_H, stripInset, type Geometry } from "@/lib/geometry";
import {
  frameLoaded,
  goBack,
  goForward,
  goProfiles,
  reload,
  setDialog,
  setOverlay,
  toggleHideImages,
  useApp,
} from "@/lib/store";
import type { Corner, MarkShape } from "@/lib/types";
import { displayUrl } from "@/lib/urls";
import css from "./Canvas.module.css";

/** Browser screen, drawn on the fixed canvas (all sizes are logical units). */
export function BrowserScreen({ geo }: { geo: Geometry }) {
  const session = useApp((s) => s.ui.session);
  const settings = useApp((s) => s.settings);
  const loading = useApp((s) => s.ui.loading);
  const stats = useApp((s) => s.ui.pageStats);
  const profile = useApp((s) => (s.ui.session?.slot != null ? s.profiles[s.ui.session.slot] : undefined));
  if (!session) return null;

  const entry = session.entries[session.index];
  const { marks } = settings;
  const mark = (corner: Corner) =>
    marks.enabled && marks.corners[corner] ? (
      <Mark shape={marks.shape} className={corner.endsWith("l") ? css.markL : css.markR} />
    ) : null;

  const sizeLabel =
    settings.mode === "px"
      ? `${settings.px.w}×${settings.px.h}px @${num(settings.px.dpr)}x`
      : settings.mode === "dp"
        ? `${settings.dp.w}×${settings.dp.h}dp`
        : `${Math.round(geo.viewLu.w)}×${Math.round(geo.viewLu.h)}dp 可変`;
  const statsLabel =
    stats && stats.images > 0
      ? stats.hidden
        ? `画像${stats.images}枚を非表示・約${formatBytes(stats.bytes)}節約`
        : `画像${stats.images}枚・約${formatBytes(stats.bytes)}`
      : "";
  const pc = profile ? profilePalette(profile.hue) : null;
  const stripVars = {
    "--mark": `${marks.size}px`,
    "--mark-color": marks.color,
    "--mark-space": `${stripInset(settings)}px`,
    height: geo.stripH,
  } as CSSProperties;

  return (
    <div className={css.root}>
      <div className={css.toolbar} style={{ height: TOOLBAR_H }}>
        <button type="button" className={css.pill} onClick={() => setOverlay({ type: "settings" })}>
          設定
        </button>
        <button type="button" className={css.pill} onClick={goProfiles}>
          プロファイル
        </button>
        <button
          type="button"
          className={cx(css.pill, settings.hideImages && css.pillOn)}
          aria-pressed={settings.hideImages}
          onClick={toggleHideImages}
        >
          画像非表示
        </button>
        {profile && pc ? (
          <button
            type="button"
            className={css.sessionChip}
            title={`プロファイル ${pad2(profile.slot)}「${profile.name}」`}
            onClick={() => setOverlay({ type: "profile", slot: profile.slot })}
          >
            <i style={{ background: pc.bg, color: pc.on }}>{pad2(profile.slot)}</i>
            <span>{profile.name}</span>
          </button>
        ) : (
          // Only the no-profile browser needs its own cookie/cache reset.
          <button
            type="button"
            className={css.pill}
            title="Cookie・キャッシュをリセット"
            onClick={() => setDialog({ type: "reset-normal" })}
          >
            リセット
          </button>
        )}
      </div>

      <div className={css.urlRow} style={{ height: URLBAR_H }}>
        <button type="button" className={css.iconBtn} aria-label="戻る" disabled={session.index === 0} onClick={goBack}>
          <Icon name="back" size={19} stroke={2.1} />
        </button>
        <button
          type="button"
          className={css.iconBtn}
          aria-label="進む"
          disabled={session.index >= session.entries.length - 1}
          onClick={goForward}
        >
          <Icon name="forward" size={19} stroke={2.1} />
        </button>
        <button type="button" className={cx(css.iconBtn, loading && css.spinning)} aria-label="再読み込み" onClick={reload}>
          <Icon name="reload" size={17} stroke={2.1} />
        </button>
        <button type="button" className={css.urlField} aria-label="アドレスを入力" onClick={() => setOverlay({ type: "url" })}>
          <Icon name={entry.url.startsWith("https://") ? "lock" : "globe"} size={13} stroke={2.1} />
          <span>{displayUrl(entry.url)}</span>
        </button>
        <span className={cx(css.progress, loading && css.progressOn)} />
      </div>

      <div className={css.strip} style={stripVars}>
        {mark("tl")}
        <span className={css.stripText}>
          {settings.statusMark && (
            <>
              <i className={css.statusBox} data-loading={loading} />
              {loading ? "読込中" : "完了"}
            </>
          )}
        </span>
        <span className={css.stripText}>{sizeLabel}</span>
        {mark("tr")}
      </div>

      <div className={css.viewport} style={{ width: geo.viewLu.w, height: geo.viewLu.h }}>
        {entry.src === null ? (
          <div className={css.pending}>
            <span className={css.spinner} />
            接続を確認しています…
          </div>
        ) : (
          <WebFrame key={session.navKey} src={entry.src} />
        )}
      </div>

      <div className={css.strip} style={stripVars}>
        {mark("bl")}
        <span className={css.stripText}>{profile ? `P${pad2(profile.slot)} ${profile.name}` : "通常モード"}</span>
        <span className={css.stripText}>{statsLabel}</span>
        {mark("br")}
      </div>
    </div>
  );
}

export function Mark({ shape, className, style }: { shape: MarkShape; className?: string; style?: CSSProperties }) {
  return <i className={cx(css.mark, className)} data-shape={shape} style={style} />;
}

// External pages cannot navigate the demo itself away; everything else they need stays enabled.
const SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

/**
 * The web display area. Mounted once per shell-initiated navigation (keyed by
 * navKey): `src` is only read on mount, because writing it again later would
 * reload a page that has already navigated itself.
 */
function WebFrame({ src }: { src: string }) {
  const [initialSrc] = useState(src);
  useEffect(() => {
    dropSiteListeners();
  }, []);
  return (
    <iframe
      className={css.frame}
      src={initialSrc}
      title="Web 表示エリア"
      sandbox={initialSrc.startsWith("/") ? undefined : SANDBOX}
      referrerPolicy="no-referrer"
      onLoad={frameLoaded}
    />
  );
}
