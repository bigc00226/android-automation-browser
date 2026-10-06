"use client";

import { useRef, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { profilePalette } from "@/lib/color";
import { SLOT_COUNT } from "@/lib/defaults";
import { clamp, cx, pad2 } from "@/lib/format";
import { TOOLBAR_H, type Geometry } from "@/lib/geometry";
import {
  openNormal,
  openProfile,
  setDialog,
  setGridMode,
  setOverlay,
  toast,
  toggleHideImages,
  useApp,
} from "@/lib/store";
import css from "./Canvas.module.css";

const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1);
const COLS = 5;
const ROWS = SLOT_COUNT / COLS;
/** Height taken by everything except the grid: toolbar, heading, mode buttons, legend. */
const FIXED_H = TOOLBAR_H + 60 + 48 + 28;
const LONG_PRESS_MS = 520;

const HINTS = {
  open: "番号をタップで切替（長押しで詳細）",
  edit: "登録・編集する番号をタップしてください",
  reset: "リセットする番号をタップしてください",
};

/** Default screen: 30 profile slots, laid out on the fixed canvas so every slot keeps its coordinates. */
export function ProfilesScreen({ geo }: { geo: Geometry }) {
  const profiles = useApp((s) => s.profiles);
  const lastSlot = useApp((s) => s.lastSlot);
  const mode = useApp((s) => s.ui.gridMode);
  const hideImages = useApp((s) => s.settings.hideImages);
  const press = useRef<{ timer: number; fired: boolean } | null>(null);

  const circle = Math.floor(
    clamp(Math.min((geo.canvasLu.w - 24) / COLS - 14, (geo.canvasLu.h - FIXED_H) / ROWS - 12), 22, 60),
  );

  const act = (slot: number) => {
    const registered = Boolean(profiles[slot]);
    if (mode === "reset") {
      if (registered) setDialog({ type: "reset-profile", slot });
      else toast(`プロファイル ${pad2(slot)} は未登録です`, "warn");
    } else if (mode === "edit" || !registered) {
      setOverlay({ type: "profile", slot });
    } else {
      openProfile(slot);
    }
  };

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
  };
  const startPress = (slot: number) => {
    cancelPress();
    const state = {
      fired: false,
      timer: window.setTimeout(() => {
        state.fired = true;
        setOverlay({ type: "profile", slot });
      }, LONG_PRESS_MS),
    };
    press.current = state;
  };
  const click = (slot: number) => {
    cancelPress();
    const longPressed = press.current?.fired;
    press.current = null;
    if (!longPressed) act(slot);
  };

  const toggleMode = (next: "edit" | "reset") => setGridMode(mode === next ? "open" : next);

  return (
    <div className={css.root}>
      <div className={css.toolbar} style={{ height: TOOLBAR_H }}>
        <button type="button" className={css.pill} onClick={() => setOverlay({ type: "settings" })}>
          設定
        </button>
        <button type="button" className={css.pill} title="プロファイルを使わない通常のブラウザ" onClick={openNormal}>
          ブラウザ
        </button>
        <button
          type="button"
          className={cx(css.pill, hideImages && css.pillOn)}
          aria-pressed={hideImages}
          onClick={toggleHideImages}
        >
          画像非表示
        </button>
      </div>

      <div className={css.head}>
        <h1 className={css.title}>プロファイル</h1>
        <p className={cx(css.hint, mode !== "open" && css.hintActive)}>{HINTS[mode]}</p>
      </div>

      <div className={css.modes}>
        <button
          type="button"
          className={cx(css.modeBtn, mode === "edit" && css.modeOn)}
          aria-pressed={mode === "edit"}
          onClick={() => toggleMode("edit")}
        >
          <Icon name="edit" size={14} stroke={2.2} />
          登録・編集
        </button>
        <button
          type="button"
          className={cx(css.modeBtn, mode === "reset" && css.modeOn)}
          aria-pressed={mode === "reset"}
          onClick={() => toggleMode("reset")}
        >
          <Icon name="reset" size={14} stroke={2.2} />
          リセット
        </button>
        <span className={css.count}>
          登録 {Object.keys(profiles).length} / {SLOT_COUNT}
        </span>
      </div>

      <div className={css.grid} onContextMenu={(e) => e.preventDefault()}>
        {SLOTS.map((slot) => {
          const profile = profiles[slot];
          const pc = profile ? profilePalette(profile.hue) : null;
          const style = {
            width: circle,
            height: circle,
            fontSize: Math.round(circle * (profile ? 0.38 : 0.34)),
            ...(pc ? { "--pc": pc.bg, "--pon": pc.on } : {}),
          } as CSSProperties;
          return (
            <button
              key={slot}
              type="button"
              className={cx(
                css.slot,
                profile ? css.slotFilled : css.slotEmpty,
                profile && slot === lastSlot && css.slotLast,
                !profile && mode === "reset" && css.slotDim,
              )}
              style={style}
              aria-label={profile ? `プロファイル ${slot}「${profile.name}」` : `プロファイル ${slot}（未登録）`}
              title={profile ? `${pad2(slot)} ${profile.name}` : `${pad2(slot)} 未登録`}
              onPointerDown={() => profile && startPress(slot)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              onClick={() => click(slot)}
            >
              {slot}
              {mode === "edit" && (
                <span className={css.badge}>
                  <Icon name={profile ? "edit" : "plus"} size={11} stroke={2.6} />
                </span>
              )}
              {mode === "reset" && profile && (
                <span className={css.badge}>
                  <Icon name="reset" size={11} stroke={2.6} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={css.foot}>
        <span className={css.legend}>
          <i className={css.legendFilled} />
          登録済み
        </span>
        <span className={css.legend}>
          <i className={css.legendEmpty} />
          未登録
        </span>
        <span className={css.legend}>
          <i className={css.legendLast} />
          前回使用
        </span>
      </div>
    </div>
  );
}
