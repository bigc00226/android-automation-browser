"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { clamp, cx } from "@/lib/format";
import css from "./Controls.module.css";

export interface Option<T> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  compact,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={cx(css.segmented, compact && css.compact)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          className={cx(css.segment, o.value === value && css.segmentOn)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(css.switch, checked && css.switchOn)}
      onClick={() => onChange(!checked)}
    >
      <span className={css.knob} />
    </button>
  );
}

/** Stepper with a directly editable value; commits on blur or Enter. */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    if (draft !== "" && Number.isFinite(n)) onChange(clamp(Math.round(n), min, max));
    setDraft(null);
  };
  return (
    <div className={css.number}>
      <button
        type="button"
        className={css.step}
        aria-label={`${label}を減らす`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step, min, max))}
      >
        −
      </button>
      <label className={css.numberBox}>
        <input
          inputMode="numeric"
          aria-label={label}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        {unit && <span>{unit}</span>}
      </label>
      <button
        type="button"
        className={css.step}
        aria-label={`${label}を増やす`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step, min, max))}
      >
        +
      </button>
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  track,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  /** CSS background for the track (e.g. a hue gradient). */
  track?: string;
}) {
  return (
    <input
      type="range"
      className={css.slider}
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={track ? ({ "--track": track } as CSSProperties) : undefined}
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={cx(css.chip, active && css.chipOn)} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
