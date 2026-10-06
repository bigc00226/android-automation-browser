"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Segmented } from "@/components/ui/Controls";
import { installBridge } from "@/lib/bridge-host";
import { APP_NAME } from "@/lib/defaults";
import { deviceById } from "@/lib/devices";
import { clamp, cx, num } from "@/lib/format";
import { realMetrics, simulatedMetrics } from "@/lib/geometry";
import { useDevicePixelRatio, useElementSize, useHydrated, useMediaQuery } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { DeviceFrame, frameSize } from "./DeviceFrame";
import { InspectorPanel, SimPanel } from "./Panels";
import { PhoneScreen } from "./PhoneScreen";
import css from "./Shell.module.css";

/** Below this width the page is treated as a real phone: no mock-up, the app fills the window. */
const PHONE_QUERY = "(max-width: 560px)";

export default function Shell() {
  const hydrated = useHydrated();
  return (
    <div data-fv-shell="" className={css.root}>
      {hydrated ? <ShellBody /> : <Splash />}
    </div>
  );
}

function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className={css.logo} style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
        <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function Splash() {
  return (
    <div className={css.splash}>
      <Logo size={56} />
      <strong>{APP_NAME}</strong>
    </div>
  );
}

function ShellBody() {
  const phone = useMediaQuery(PHONE_QUERY);
  useEffect(() => installBridge(), []);
  return phone ? <PhoneHost /> : <DesktopStage />;
}

/** Real phone (or a narrow window): the app is the page. */
function PhoneHost() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const dpr = useDevicePixelRatio();
  const metrics = useMemo(() => (size ? realMetrics(size.w, size.h, dpr) : null), [size, dpr]);
  return (
    <div ref={ref} className={css.phoneHost}>
      {metrics && <PhoneScreen metrics={metrics} />}
    </div>
  );
}

/** Desktop: a handset mock-up in the middle, simulator controls and coordinates around it. */
function DesktopStage() {
  const sim = useApp((s) => s.sim);
  const device = deviceById(sim.deviceId);
  const metrics = useMemo(() => simulatedMetrics(device, sim), [device, sim]);
  const areaRef = useRef<HTMLDivElement>(null);
  const area = useElementSize(areaRef);
  const wide = useMediaQuery("(min-width: 1240px)");
  const drawer = useMediaQuery("(max-width: 899px)");
  const [tab, setTab] = useState<"sim" | "inspect">("sim");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const frame = frameSize(device);
  const scale = area ? clamp(Math.min((area.w - 24) / frame.w, (area.h - 40) / frame.h), 0.2, 1.5) : 0;

  return (
    <div className={css.stage}>
      <header className={css.header}>
        <Logo />
        <div className={css.brand}>
          <strong>
            {APP_NAME}
            <em>Web デモ</em>
          </strong>
          <span>機種に依存しない固定表示エリアとマルチプロファイルを備えた、Android 自動化向けブラウザ</span>
        </div>
        {drawer && (
          <button type="button" className={css.drawerBtn} onClick={() => setDrawerOpen(true)}>
            <Icon name="panel" size={18} />
            シミュレーター
          </button>
        )}
      </header>

      <div className={cx(css.columns, wide && css.columnsWide, drawer && css.columnsDrawer)}>
        {wide && (
          <aside key="left" className={css.side}>
            <SimPanel />
          </aside>
        )}

        <main key="device" ref={areaRef} className={css.deviceArea}>
          {scale > 0 && (
            <>
              <DeviceFrame device={device} scale={scale}>
                <PhoneScreen metrics={metrics} cutout={device.cutout} />
              </DeviceFrame>
              <p className={css.caption}>
                {device.name}・{device.px.w} × {device.px.h} px・密度 {num(device.density)}
                <span>（画面上の縮尺 {Math.round(scale * 100)}%）</span>
              </p>
            </>
          )}
        </main>

        {drawer && drawerOpen && <div className={css.drawerScrim} onClick={() => setDrawerOpen(false)} />}
        <aside key="right" className={cx(css.side, drawer && css.drawer, drawer && drawerOpen && css.drawerOpen)}>
          {wide ? (
            <InspectorPanel metrics={metrics} />
          ) : (
            <>
              <div className={css.tabs}>
                <Segmented
                  label="パネル"
                  value={tab}
                  options={[
                    { value: "sim", label: "端末シミュレーター" },
                    { value: "inspect", label: "座標インスペクター" },
                  ]}
                  onChange={setTab}
                />
                {drawer && (
                  <button type="button" className={css.drawerClose} aria-label="閉じる" onClick={() => setDrawerOpen(false)}>
                    <Icon name="close" size={18} stroke={2.2} />
                  </button>
                )}
              </div>
              {tab === "sim" ? <SimPanel /> : <InspectorPanel metrics={metrics} />}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
