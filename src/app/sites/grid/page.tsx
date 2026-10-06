"use client";

import { useState, useSyncExternalStore } from "react";
import { useSite } from "@/components/site/SiteRoot";
import { cx, num } from "@/lib/format";
import css from "./grid.module.css";

/** Tap targets at fixed CSS coordinates (centre points). */
const TARGETS = [
  { id: "A", x: 60, y: 190 },
  { id: "B", x: 180, y: 190 },
  { id: "C", x: 300, y: 190 },
  { id: "D", x: 60, y: 310 },
  { id: "E", x: 180, y: 310 },
  { id: "F", x: 300, y: 310 },
];

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const useInnerWidth = () => useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 360);
const useInnerHeight = () => useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 560);

const ticks = (limit: number) => Array.from({ length: Math.floor((limit - 1) / 100) }, (_, i) => (i + 1) * 100);

/**
 * Calibration page: a ruler grid plus fixed tap targets. It shows where a tap
 * landed both in page coordinates and in physical screen pixels, which is what
 * coordinate-based macros work with.
 */
export default function GridPage() {
  const { env } = useSite();
  const w = useInnerWidth();
  const h = useInnerHeight();
  const [tap, setTap] = useState<{ x: number; y: number } | null>(null);
  const [hits, setHits] = useState<Record<string, boolean>>({});

  const screenX = (x: number) => Math.round(env.originX + x * env.unitPx);
  const screenY = (y: number) => Math.round(env.originY + y * env.unitPx);
  const hitCount = Object.values(hits).filter(Boolean).length;

  return (
    <main className={css.page} onPointerDown={(e) => setTap({ x: Math.round(e.clientX), y: Math.round(e.clientY) })}>
      {ticks(w).map((x) => (
        <span key={`x${x}`} className={css.xLabel} style={{ left: x }}>
          {x}
        </span>
      ))}
      {ticks(h).map((y) => (
        <span key={`y${y}`} className={css.yLabel} style={{ top: y }}>
          {y}
        </span>
      ))}

      <section className={css.info}>
        <h1>座標テスト</h1>
        <dl>
          <dt>表示エリア</dt>
          <dd>
            {w} × {h} CSS px
          </dd>
          <dt>物理ピクセル</dt>
          <dd>
            {Math.round(w * env.unitPx)} × {Math.round(h * env.unitPx)} px（×{num(env.unitPx)}）
          </dd>
        </dl>
      </section>

      {TARGETS.map((target) => (
        <button
          key={target.id}
          type="button"
          className={cx(css.target, hits[target.id] && css.hit)}
          style={{ left: target.x, top: target.y }}
          aria-pressed={Boolean(hits[target.id])}
          onClick={() => setHits((prev) => ({ ...prev, [target.id]: !prev[target.id] }))}
        >
          <b>{target.id}</b>
          <small>
            {screenX(target.x)},{screenY(target.y)}
          </small>
        </button>
      ))}

      {tap && (
        <span key={`${tap.x}:${tap.y}`} className={css.cross} style={{ left: tap.x, top: tap.y }} aria-hidden="true" />
      )}

      <section className={css.readout} aria-live="polite">
        {tap ? (
          <>
            <div>
              <small>ページ内（CSS px）</small>
              <strong>
                {tap.x}, {tap.y}
              </strong>
            </div>
            <div>
              <small>画面上（物理 px）</small>
              <strong>
                {screenX(tap.x)}, {screenY(tap.y)}
              </strong>
            </div>
          </>
        ) : (
          <p>画面をタップすると、その位置の座標を表示します。丸いターゲットには画面上の座標（物理 px）を表示しています。</p>
        )}
        <span className={css.hits}>
          ヒット {hitCount}/{TARGETS.length}
          {hitCount > 0 && (
            <button type="button" onClick={() => setHits({})}>
              クリア
            </button>
          )}
        </span>
      </section>
    </main>
  );
}
