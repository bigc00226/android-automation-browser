export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDateTime(ts: number | null): string {
  if (!ts) return "未使用";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Trims float noise for display: 2 -> "2", 2.8125 -> "2.81". */
export function num(v: number, digits = 2): string {
  return String(Number(v.toFixed(digits)));
}

export const px = (v: number) => Math.round(v);
