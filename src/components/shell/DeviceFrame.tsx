import type { ReactNode } from "react";
import type { DeviceSpec } from "@/lib/devices";
import css from "./DeviceFrame.module.css";

const BEZEL = 11;

/** Outer size of the drawn handset in dp (screen plus bezel). */
export function frameSize(device: DeviceSpec) {
  return {
    w: device.px.w / device.density + BEZEL * 2,
    h: device.px.h / device.density + BEZEL * 2,
  };
}

/**
 * Handset mock-up for desktop. The screen inside is laid out 1:1 in dp and the
 * whole handset is scaled to fit the available space.
 */
export function DeviceFrame({ device, scale, children }: { device: DeviceSpec; scale: number; children: ReactNode }) {
  const { w, h } = frameSize(device);
  return (
    <div className={css.scaler} style={{ width: w * scale, height: h * scale }}>
      <div
        className={css.device}
        style={{ width: w, height: h, borderRadius: device.radiusDp + BEZEL, transform: `scale(${scale})` }}
      >
        <span className={css.power} />
        <span className={css.volume} />
        <div
          className={css.screen}
          style={{ width: w - BEZEL * 2, height: h - BEZEL * 2, borderRadius: device.radiusDp }}
        >
          {children}
          <span className={css.cutout} data-kind={device.cutout} />
        </div>
      </div>
    </div>
  );
}
