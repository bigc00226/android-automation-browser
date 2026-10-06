"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { themeHex, themePalette } from "@/lib/color";
import { DEVICES } from "@/lib/devices";
import { cx, num, px } from "@/lib/format";
import { computeGeometry, sameRect, simulatedMetrics, type Geometry, type ScreenMetrics } from "@/lib/geometry";
import { pointerStore } from "@/lib/pointer";
import { updateSim, useApp } from "@/lib/store";
import type { FixMode } from "@/lib/types";
import css from "./Inspector.module.css";

const CORNER_NAMES = { tl: "左上", tr: "右上", bl: "左下", br: "右下" };

interface Verdict {
  tone: "ok" | "warn" | "bad";
  title: string;
  detail: string;
}

function judge(rows: Geometry[], mode: FixMode): Verdict {
  if (mode === "off") {
    return {
      tone: "warn",
      title: "機種ごとに表示範囲が変わります",
      detail: "固定なし：通常のブラウザと同じ状態です。座標指定のマクロは共有できません。",
    };
  }
  if (!rows.every((g) => g.fits)) {
    return { tone: "bad", title: "収まらない機種があります", detail: "表示エリアのサイズか位置を見直してください。" };
  }
  if (rows.every((g) => sameRect(g.viewPx, rows[0].viewPx))) {
    return {
      tone: "ok",
      title: `${rows.length} 機種すべてで同じピクセル座標`,
      detail: "座標指定のマクロをそのまま共有できます。",
    };
  }
  return {
    tone: "warn",
    title: "機種によりピクセル座標が異なります",
    detail:
      mode === "dp"
        ? "dp 固定：見た目の大きさは揃いますが、座標は画面密度に比例します。"
        : "水平位置が「中央」のため、画面幅の違う機種で X 座標がずれます。",
  };
}

/** Coordinates of the display area and marks, plus the comparison across the target devices. */
export function InspectorBody({ metrics }: { metrics: ScreenMetrics }) {
  const settings = useApp((s) => s.settings);
  const sim = useApp((s) => s.sim);
  const screen = useApp((s) => s.ui.screen);
  const geo = useMemo(() => computeGeometry(metrics, settings), [metrics, settings]);
  const rows = useMemo(
    () => DEVICES.map((device) => ({ device, geo: computeGeometry(simulatedMetrics(device, sim), settings) })),
    [sim, settings],
  );
  const verdict = judge(
    rows.map((r) => r.geo),
    settings.mode,
  );
  const bg = themeHex(settings.colors[screen]);
  const v = geo.viewPx;
  const onBrowser = screen === "browser";

  return (
    <div className={css.body}>
      <div className={cx(css.verdict, css[`verdict_${verdict.tone}`])}>
        <Icon name={verdict.tone === "ok" ? "check" : "alert"} size={18} stroke={2.3} />
        <div>
          <strong>{verdict.title}</strong>
          <span>{verdict.detail}</span>
        </div>
      </div>

      <dl className={css.facts}>
        <dt>表示エリア（絶対座標）</dt>
        <dd>
          ({px(v.x)}, {px(v.y)}) – ({px(v.x + v.w)}, {px(v.y + v.h)})
        </dd>
        <dt>サイズ</dt>
        <dd>
          {px(v.w)} × {px(v.h)} px
        </dd>
        <dt>ページ側のサイズ</dt>
        <dd>
          {num(geo.viewLu.w, 1)} × {num(geo.viewLu.h, 1)} CSS px（×{num(geo.unitPx)}）
        </dd>
        <dt>背景色</dt>
        <dd>
          <i className={css.colorDot} style={{ background: bg }} />
          {bg}
        </dd>
        {onBrowser && geo.status && (
          <>
            <dt>読込インジケーター</dt>
            <dd>
              ({px(geo.status.px.x)}, {px(geo.status.px.y)})
            </dd>
          </>
        )}
      </dl>

      {onBrowser && geo.status && (
        <p className={css.legend}>
          <span>
            <i className={css.colorDot} style={{ background: themePalette(settings.colors.browser).on }} />
            完了 {themePalette(settings.colors.browser).on}
          </span>
          <span>
            <i className={css.colorDot} style={{ background: "#FF8A00" }} />
            読込中 #FF8A00
          </span>
        </p>
      )}

      {onBrowser && geo.marks.length > 0 && (
        <div className={css.marks}>
          <span>
            <i className={css.colorDot} style={{ background: settings.marks.color }} />
            座標マークの中心（{settings.marks.color}）
          </span>
          <div>
            {geo.marks.map((mk) => (
              <span key={mk.corner}>
                {CORNER_NAMES[mk.corner]}
                <b>
                  ({px(mk.px.x)}, {px(mk.px.y)})
                </b>
              </span>
            ))}
          </div>
        </div>
      )}

      <table className={css.table}>
        <thead>
          <tr>
            <th>機種</th>
            <th>表示エリア左上</th>
            <th>サイズ (px)</th>
            <th>表示倍率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ device, geo: g }) => (
            <tr
              key={device.id}
              className={cx(!metrics.real && device.id === metrics.id && css.current, !g.fits && css.overflowing)}
              onClick={metrics.real ? undefined : () => updateSim({ deviceId: device.id })}
            >
              <th scope="row">
                {device.name}
                {!g.fits && <em>はみ出し</em>}
              </th>
              <td>
                ({px(g.viewPx.x)}, {px(g.viewPx.y)})
              </td>
              <td>
                {px(g.viewPx.w)}×{px(g.viewPx.h)}
              </td>
              <td>{Math.round(g.cssScale * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={css.footnote}>
        表示倍率は通常のアプリ表示（100%）に対する見た目の大きさです。機種の密度やバーの高さは代表値によるシミュレーションです。
      </p>
    </div>
  );
}

/** Live pointer position in device pixels (desktop simulator only). */
export function PointerReadout() {
  const pointer = useSyncExternalStore(pointerStore.subscribe, pointerStore.get, () => null);
  return (
    <div className={css.pointer}>
      <Icon name="crosshair" size={16} />
      {pointer ? (
        <>
          <span>
            画面 <b>X {px(pointer.px.x)}</b> <b>Y {px(pointer.px.y)}</b> px
          </span>
          {pointer.view && (
            <span className={css.pointerView}>
              エリア内 x {px(pointer.view.x)} y {px(pointer.view.y)}
            </span>
          )}
        </>
      ) : (
        <span className={css.pointerIdle}>スマホ画面にカーソルを乗せると座標を表示します</span>
      )}
    </div>
  );
}
