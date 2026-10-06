"use client";

import { Icon } from "@/components/Icon";
import { Segmented } from "@/components/ui/Controls";
import { DEVICES, DISPLAY_ZOOMS, FONT_SCALES } from "@/lib/devices";
import { cx, num } from "@/lib/format";
import type { ScreenMetrics } from "@/lib/geometry";
import { updateSettings, updateSim, useApp } from "@/lib/store";
import { InspectorBody, PointerReadout } from "./Inspector";
import css from "./Panels.module.css";

/** Desktop only: pick the simulated handset and its system settings. */
export function SimPanel() {
  const sim = useApp((s) => s.sim);
  const minWidth = Math.min(...DEVICES.map((d) => d.px.w));

  return (
    <div className={css.panel}>
      <section className={css.card}>
        <h2 className={css.cardTitle}>
          <Icon name="phone" size={17} />
          端末シミュレーター
        </h2>
        <p className={css.cardDesc}>機種を切り替えて、表示エリアの位置と大きさがどう変わるかを確認できます。</p>
        <div className={css.devices} role="radiogroup" aria-label="機種">
          {DEVICES.map((device) => {
            const on = device.id === sim.deviceId;
            return (
              <button
                key={device.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={cx(css.device, on && css.deviceOn)}
                onClick={() => updateSim({ deviceId: device.id })}
              >
                <span className={css.deviceGlyph} style={{ aspectRatio: `${device.px.w} / ${device.px.h}` }} />
                <span className={css.deviceText}>
                  <strong>
                    {device.name}
                    {device.px.w === minWidth && <em>最小解像度</em>}
                  </strong>
                  <small>
                    {device.px.w}×{device.px.h}px・密度 {num(device.density)}・{device.inch}型
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={css.card}>
        <h2 className={css.cardTitle}>
          <Icon name="settings" size={17} />
          端末側のシステム設定
        </h2>
        <p className={css.cardDesc}>ユーザーが端末で変える設定です。アプリの表示に影響するかを確認できます。</p>
        <div className={css.fieldRow}>
          <span>ナビゲーション</span>
          <Segmented
            compact
            label="ナビゲーション"
            value={sim.nav}
            options={[
              { value: "gesture", label: "ジェスチャー" },
              { value: "buttons", label: "3ボタン" },
            ]}
            onChange={(nav) => updateSim({ nav })}
          />
        </div>
        <div className={css.fieldRow}>
          <span>文字サイズ</span>
          <Segmented
            compact
            label="文字サイズ"
            value={sim.fontScale}
            options={FONT_SCALES}
            onChange={(fontScale) => updateSim({ fontScale })}
          />
        </div>
        <div className={css.fieldRow}>
          <span>表示サイズ</span>
          <Segmented
            compact
            label="表示サイズ"
            value={sim.displayZoom}
            options={DISPLAY_ZOOMS}
            onChange={(displayZoom) => updateSim({ displayZoom })}
          />
        </div>
      </section>

      <section className={cx(css.card, css.guide)}>
        <h2 className={css.cardTitle}>
          <Icon name="star" size={17} />
          デモの見どころ
        </h2>
        <ol>
          <li>
            <b>プロファイル番号をタップ</b>して切替。ログイン状態（Cookie）はプロファイルごとに別々です。
          </li>
          <li>
            <b>機種を切り替え</b>ても、表示エリアは同じピクセル座標のまま。右の比較表で確認できます。
          </li>
          <li>
            <b>画像非表示</b>は、レイアウトを保ったまま画像の読み込みだけを止めます。
          </li>
          <li>
            <b>設定</b>で px / dp の固定方式、サイズ、背景色、座標マークを変更できます。
          </li>
        </ol>
      </section>
    </div>
  );
}

/** Desktop only: coordinates for the current setup. */
export function InspectorPanel({ metrics }: { metrics: ScreenMetrics }) {
  const mode = useApp((s) => s.settings.mode);
  return (
    <div className={css.panel}>
      <section className={css.card}>
        <h2 className={css.cardTitle}>
          <Icon name="crosshair" size={17} />
          座標インスペクター
        </h2>
        <div className={css.fieldRow}>
          <span>表示エリアの固定方式（アプリの設定と連動）</span>
          <Segmented
            compact
            label="表示エリアの固定方式"
            value={mode}
            options={[
              { value: "px", label: "px 固定" },
              { value: "dp", label: "dp 固定" },
              { value: "off", label: "固定なし" },
            ]}
            onChange={(next) => updateSettings({ mode: next })}
          />
        </div>
        <PointerReadout />
        <InspectorBody metrics={metrics} />
      </section>
    </div>
  );
}
