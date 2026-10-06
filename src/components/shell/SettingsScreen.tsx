"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Chip, NumberField, Segmented, Slider, Switch } from "@/components/ui/Controls";
import { themeHex } from "@/lib/color";
import { APP_NAME, APP_VERSION, BG_PRESETS, DP_PRESETS, MARK_COLORS, PX_PRESETS } from "@/lib/defaults";
import { DEVICES } from "@/lib/devices";
import { cx, num, px } from "@/lib/format";
import { recommendSize, simulatedMetrics, type Geometry, type ScreenMetrics } from "@/lib/geometry";
import { useEscape } from "@/lib/hooks";
import {
  DPR_CHOICES,
  MIN_VIEW_W,
  exportJson,
  importJson,
  resetAll,
  setOverlay,
  toast,
  toggleMarkCorner,
  updateDp,
  updateMarks,
  updatePx,
  updateSettings,
  updateThemeColor,
  useApp,
} from "@/lib/store";
import type { Corner, FixMode, MarkShape } from "@/lib/types";
import { Mark } from "./BrowserScreen";
import { InspectorBody } from "./Inspector";
import css from "./Overlays.module.css";

const MODE_NOTES: Record<FixMode, string> = {
  px: "表示エリアを物理ピクセルで固定します。どの機種でも同じピクセル座標になるため、座標指定のマクロをそのまま共有できます。高解像度の機種では小さく表示されます。",
  dp: "表示エリアを dp（密度非依存ピクセル）で固定します。見た目の大きさは揃いますが、ピクセル座標は機種の画面密度に比例して変わります。",
  off: "通常のブラウザと同じように画面いっぱいに表示します。機種ごとに表示範囲が変わります（比較用）。",
};

const SHAPES: { value: MarkShape; name: string }[] = [
  { value: "target", name: "二重丸" },
  { value: "ring", name: "リング" },
  { value: "dot", name: "丸" },
  { value: "square", name: "四角" },
  { value: "cross", name: "十字" },
];

const CORNERS: { value: Corner; name: string }[] = [
  { value: "tl", name: "左上" },
  { value: "tr", name: "右上" },
  { value: "bl", name: "左下" },
  { value: "br", name: "右下" },
];

const HUE_TRACK =
  "linear-gradient(90deg, hsl(0 78% 50%), hsl(60 78% 50%), hsl(120 78% 50%), hsl(180 78% 50%), hsl(240 78% 50%), hsl(300 78% 50%), hsl(360 78% 50%))";

function copyText(text: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast(`${text} をコピーしました`, "ok"),
    () => {},
  );
}

function engineLabel(): string {
  const ua = navigator.userAgent;
  const chromium = /(?:Chrome|CriOS)\/(\d+)/.exec(ua);
  if (chromium) return `Chromium ${chromium[1]}`;
  const firefox = /(?:Firefox|FxiOS)\/(\d+)/.exec(ua);
  if (firefox) return `Firefox ${firefox[1]}`;
  const safari = /Version\/(\d+).*Safari/.exec(ua);
  if (safari) return `Safari ${safari[1]}`;
  return "不明";
}

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className={css.section}>
      <h3 className={css.sectionTitle}>{title}</h3>
      {desc && <p className={css.sectionDesc}>{desc}</p>}
      <div className={css.card}>{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={css.row}>
      <div className={css.rowLabel}>
        {label}
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Row label={label} hint={desc}>
      <Switch label={label} checked={checked} onChange={onChange} />
    </Row>
  );
}

function ColorEditor({ which, label }: { which: "browser" | "profiles"; label: string }) {
  const color = useApp((s) => s.settings.colors[which]);
  const hex = themeHex(color);
  return (
    <div className={css.colorEditor}>
      <div className={css.colorHead}>
        <span className={css.colorChip} style={{ background: hex }} />
        <strong>{label}</strong>
        <button type="button" className={css.hex} title="カラーコードをコピー" onClick={() => copyText(hex)}>
          {hex}
          <Icon name="copy" size={13} />
        </button>
      </div>
      <div className={css.sliderRow}>
        <span>色合い</span>
        <Slider
          label={`${label}の色合い`}
          min={0}
          max={360}
          value={color.h}
          track={HUE_TRACK}
          onChange={(h) => updateThemeColor(which, { h })}
        />
      </div>
      <div className={css.sliderRow}>
        <span>濃淡</span>
        <Slider
          label={`${label}の濃淡`}
          min={12}
          max={88}
          value={color.l}
          track={`linear-gradient(90deg, hsl(${color.h} 78% 12%), hsl(${color.h} 78% 50%), hsl(${color.h} 78% 88%))`}
          onChange={(l) => updateThemeColor(which, { l })}
        />
      </div>
      <div className={css.swatches}>
        {BG_PRESETS.map((preset) => {
          const presetHex = themeHex(preset);
          return (
            <button
              key={presetHex}
              type="button"
              className={cx(css.swatch, presetHex === hex && css.swatchOn)}
              style={{ background: presetHex }}
              aria-label={`背景色 ${presetHex}`}
              aria-pressed={presetHex === hex}
              onClick={() => updateThemeColor(which, preset)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Full-screen settings, shown at the device's natural scale. */
export function SettingsScreen({ metrics, geo }: { metrics: ScreenMetrics; geo: Geometry }) {
  const s = useApp((st) => st.settings);
  const sim = useApp((st) => st.sim);
  const close = useCallback(() => setOverlay(null), []);
  useEscape(close);
  const fileRef = useRef<HTMLInputElement>(null);
  const [armed, setArmed] = useState(false);
  const [engine] = useState(engineLabel);
  const targets = useMemo(() => DEVICES.map((device) => simulatedMetrics(device, sim)), [sim]);

  const applyRecommended = () => {
    const rec = recommendSize(s, targets);
    if (!rec) return;
    if (s.mode === "px") updatePx(rec);
    else updateDp(rec);
    toast(`${rec.w} × ${rec.h} ${s.mode} に設定しました`, "ok");
  };

  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixview-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("設定を書き出しました", "ok");
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = importJson(await file.text());
    toast(ok ? "設定を読み込みました" : "読み込めないファイルです", ok ? "ok" : "warn");
  };

  const resetClick = () => {
    if (!armed) {
      setArmed(true);
      window.setTimeout(() => setArmed(false), 3500);
      return;
    }
    setArmed(false);
    resetAll();
    toast("すべて初期状態に戻しました", "ok");
  };

  const { fits, overflow } = geo;
  const overflowText = [
    overflow.top && `上 ${overflow.top}px`,
    overflow.bottom && `下 ${overflow.bottom}px`,
    overflow.right && `右 ${overflow.right}px`,
  ]
    .filter(Boolean)
    .join("・");

  return (
    <div className={css.settings} role="dialog" aria-modal="true" aria-label="設定">
      <header className={css.settingsHead}>
        <button type="button" className={css.backBtn} aria-label="戻る" onClick={close}>
          <Icon name="back" size={22} stroke={2.2} />
        </button>
        <h2>設定</h2>
        <button type="button" className={css.doneBtn} onClick={close}>
          完了
        </button>
      </header>

      <div className={css.settingsBody}>
        <Section title="表示エリアの固定" desc="マクロのデータを複数の機種で共有するための、中心となる設定です。">
          <Segmented
            label="固定方式"
            value={s.mode}
            options={[
              { value: "px", label: "px 固定" },
              { value: "dp", label: "dp 固定" },
              { value: "off", label: "固定なし" },
            ]}
            onChange={(mode) => updateSettings({ mode })}
          />
          <p className={css.modeNote}>{MODE_NOTES[s.mode]}</p>

          {s.mode === "px" && (
            <>
              <Row label="幅">
                <NumberField
                  label="幅"
                  unit="px"
                  value={s.px.w}
                  min={MIN_VIEW_W * s.px.dpr}
                  max={2160}
                  step={40}
                  onChange={(w) => updatePx({ w })}
                />
              </Row>
              <Row label="高さ">
                <NumberField label="高さ" unit="px" value={s.px.h} min={240} max={3840} step={40} onChange={(h) => updatePx({ h })} />
              </Row>
              <div className={css.chipRow}>
                {PX_PRESETS.map((p) => (
                  <Chip
                    key={`${p.w}x${p.h}`}
                    active={p.w === s.px.w && p.h === s.px.h && p.dpr === s.px.dpr}
                    onClick={() => updatePx(p)}
                  >
                    {p.w}×{p.h}
                  </Chip>
                ))}
              </div>
              <Row label="ページ倍率" hint={`ページ側の表示幅 ${num(s.px.w / s.px.dpr)} CSS px`}>
                <Segmented
                  compact
                  label="ページ倍率"
                  value={s.px.dpr}
                  options={DPR_CHOICES.map((v) => ({ value: v, label: `${v}x` }))}
                  onChange={(dpr) => updatePx({ dpr })}
                />
              </Row>
              <Row label="上端からの位置" hint="画面上端からの絶対位置">
                <NumberField label="上端からの位置" unit="px" value={s.px.top} min={0} max={800} step={4} onChange={(top) => updatePx({ top })} />
              </Row>
            </>
          )}

          {s.mode === "dp" && (
            <>
              <Row label="幅">
                <NumberField label="幅" unit="dp" value={s.dp.w} min={MIN_VIEW_W} max={720} step={10} onChange={(w) => updateDp({ w })} />
              </Row>
              <Row label="高さ">
                <NumberField label="高さ" unit="dp" value={s.dp.h} min={120} max={1280} step={20} onChange={(h) => updateDp({ h })} />
              </Row>
              <div className={css.chipRow}>
                {DP_PRESETS.map((p) => (
                  <Chip key={`${p.w}x${p.h}`} active={p.w === s.dp.w && p.h === s.dp.h} onClick={() => updateDp(p)}>
                    {p.w}×{p.h}
                  </Chip>
                ))}
              </div>
              <Row label="上端からの位置" hint="画面上端からの位置">
                <NumberField label="上端からの位置" unit="dp" value={s.dp.top} min={0} max={240} step={2} onChange={(top) => updateDp({ top })} />
              </Row>
            </>
          )}

          {s.mode !== "off" && (
            <Row label="水平位置" hint="左寄せなら画面幅が違っても X 座標が同じ">
              <Segmented
                compact
                label="水平位置"
                value={s.align}
                options={[
                  { value: "left", label: "左寄せ" },
                  { value: "center", label: "中央" },
                ]}
                onChange={(align) => updateSettings({ align })}
              />
            </Row>
          )}

          <div className={cx(css.fitCard, fits ? css.fitOk : css.fitBad)}>
            <Icon name={fits ? "check" : "alert"} size={18} stroke={2.2} />
            <div>
              <strong>
                {metrics.name}：{fits ? "画面に収まります" : `画面に収まりません（${overflowText}）`}
              </strong>
              <span>
                表示エリア {px(geo.viewPx.w)} × {px(geo.viewPx.h)} px ／ 左上 ({px(geo.viewPx.x)}, {px(geo.viewPx.y)})
              </span>
            </div>
          </div>
          {s.mode !== "off" && (
            <button type="button" className={css.btnSoft} onClick={applyRecommended}>
              <Icon name="bolt" size={16} />
              全 {DEVICES.length} 機種に収まる最大サイズにする
            </button>
          )}
        </Section>

        <Section title="端末設定の影響">
          <SwitchRow
            label="端末の文字サイズ・表示サイズを無視"
            desc="端末側で文字や表示を拡大していても、アプリ内の表示を変えません。"
            checked={s.lockSystemScale}
            onChange={(lockSystemScale) => updateSettings({ lockSystemScale })}
          />
        </Section>

        <Section title="背景色" desc="表示エリアの外側を塗る色です。画像認識の基準色としても使えます。">
          <ColorEditor which="browser" label="ブラウザ画面" />
          <hr className={css.divider} />
          <ColorEditor which="profiles" label="プロファイル画面" />
        </Section>

        <Section title="座標マーク" desc="表示エリアの外側の四隅に置く基準マークです。色・画像認識の基準点に使えます。">
          <SwitchRow label="マークを表示" checked={s.marks.enabled} onChange={(enabled) => updateMarks({ enabled })} />
          {s.marks.enabled && (
            <>
              <Row label="形">
                <Segmented
                  compact
                  label="マークの形"
                  value={s.marks.shape}
                  options={SHAPES.map((shape) => ({
                    value: shape.value,
                    title: shape.name,
                    label: (
                      <Mark
                        shape={shape.value}
                        style={{ "--mark": "15px", "--mark-color": "currentColor", margin: "0 auto" } as CSSProperties}
                      />
                    ),
                  }))}
                  onChange={(shape) => updateMarks({ shape })}
                />
              </Row>
              <Row label="色">
                <div className={css.swatches}>
                  {MARK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cx(css.swatch, css.swatchSm, color === s.marks.color && css.swatchOn)}
                      style={{ background: color }}
                      aria-label={`マークの色 ${color}`}
                      aria-pressed={color === s.marks.color}
                      onClick={() => updateMarks({ color })}
                    />
                  ))}
                </div>
              </Row>
              <div className={css.sliderRow}>
                <span>大きさ {s.marks.size}</span>
                <Slider label="マークの大きさ" min={6} max={24} value={s.marks.size} onChange={(size) => updateMarks({ size })} />
              </div>
              <Row label="位置" hint="表示する角を選択">
                <div className={css.corners}>
                  {CORNERS.map((corner) => (
                    <button
                      key={corner.value}
                      type="button"
                      className={cx(css.corner, css[`corner_${corner.value}`], s.marks.corners[corner.value] && css.cornerOn)}
                      aria-label={corner.name}
                      aria-pressed={s.marks.corners[corner.value]}
                      onClick={() => toggleMarkCorner(corner.value)}
                    />
                  ))}
                  <span>表示エリア</span>
                </div>
              </Row>
            </>
          )}
          <hr className={css.divider} />
          <SwitchRow
            label="読込状態インジケーター"
            desc="読込中は橙色、完了すると文字色（白または黒）の四角になります。マクロの待機判定に使えます。"
            checked={s.statusMark}
            onChange={(statusMark) => updateSettings({ statusMark })}
          />
        </Section>

        <Section title="ブラウザ">
          <SwitchRow
            label="画像非表示"
            desc="画像を読み込まず、同じ大きさの枠だけを表示します。通信量を抑えつつレイアウトは変わりません。"
            checked={s.hideImages}
            onChange={(hideImages) => updateSettings({ hideImages })}
          />
          <SwitchRow
            label="タップ位置の座標を表示"
            desc="タップした位置の画面座標（px）を表示します。"
            checked={s.tapIndicator}
            onChange={(tapIndicator) => updateSettings({ tapIndicator })}
          />
        </Section>

        {metrics.real && (
          <Section title="座標情報" desc="現在の設定で表示エリアとマークが置かれる位置です。">
            <InspectorBody metrics={metrics} />
          </Section>
        )}

        <Section title="データ">
          <div className={css.btnRow}>
            <button type="button" className={css.btnSoft} onClick={exportFile}>
              <Icon name="download" size={16} />
              設定を書き出す
            </button>
            <button type="button" className={css.btnSoft} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} />
              設定を読み込む
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importFile} />
          </div>
          <p className={css.note}>表示エリア・色・マーク・プロファイル一覧を JSON に保存し、別の端末へ同じ設定を移せます。</p>
          <button type="button" className={cx(css.btnSoft, css.btnDangerSoft)} onClick={resetClick}>
            <Icon name="trash" size={16} />
            {armed ? "もう一度押すと初期化します" : "すべて初期化"}
          </button>
          <dl className={css.about}>
            <dt>アプリ</dt>
            <dd>
              {APP_NAME} {APP_VERSION}
            </dd>
            <dt>デモの実行エンジン</dt>
            <dd>{engine}</dd>
            <dt>データの保存先</dt>
            <dd>このブラウザ内のみ（データベース不使用）</dd>
          </dl>
        </Section>
      </div>
    </div>
  );
}
