export type Cutout = "punch-center" | "punch-left" | "drop";

export interface DeviceSpec {
  id: string;
  name: string;
  /** Physical resolution in pixels (portrait). */
  px: { w: number; h: number };
  /** Default density scale (dpi / 160). */
  density: number;
  statusBarDp: number;
  cutout: Cutout;
  /** Corner radius of the display in dp. */
  radiusDp: number;
  inch: number;
}

/**
 * The devices named in the client's spec sheet. Resolutions are the published
 * ones; density, status-bar height and corner radius are representative values
 * and must be measured on the real hardware before they are relied on.
 */
export const DEVICES: DeviceSpec[] = [
  {
    id: "aquos-wish4",
    name: "AQUOS wish4",
    px: { w: 720, h: 1612 },
    density: 2,
    statusBarDp: 28,
    cutout: "drop",
    radiusDp: 20,
    inch: 6.6,
  },
  {
    id: "oppo-reno9a",
    name: "OPPO Reno9 A",
    px: { w: 1080, h: 2400 },
    density: 3,
    statusBarDp: 32,
    cutout: "punch-left",
    radiusDp: 30,
    inch: 6.4,
  },
  {
    id: "galaxy-a54",
    name: "Galaxy A54 5G",
    px: { w: 1080, h: 2340 },
    density: 2.8125,
    statusBarDp: 30,
    cutout: "punch-center",
    radiusDp: 30,
    inch: 6.4,
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    px: { w: 1080, h: 2340 },
    density: 3,
    statusBarDp: 30,
    cutout: "punch-center",
    radiusDp: 34,
    inch: 6.2,
  },
];

export const DEFAULT_DEVICE_ID = DEVICES[0].id;

export function deviceById(id: string): DeviceSpec {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0];
}

export const FONT_SCALES = [
  { value: 0.85, label: "小" },
  { value: 1, label: "標準" },
  { value: 1.15, label: "大" },
  { value: 1.3, label: "最大" },
];

export const DISPLAY_ZOOMS = [
  { value: 0.85, label: "小" },
  { value: 1, label: "標準" },
  { value: 1.15, label: "大" },
];
