/*
 * The built-in sample sites live under /sites/* of this app and are addressed
 * as demo://<path> in the address bar, so they read as "bundled demo pages"
 * rather than as real hosts.
 */

export interface DemoSite {
  id: string;
  url: string;
  label: string;
  desc: string;
  icon: string;
}

export const DEMO_SITES: DemoSite[] = [
  { id: "start", url: "demo://start", label: "スタートページ", desc: "ショートカットと現在のプロファイル", icon: "home" },
  { id: "news", url: "demo://news", label: "デモニュース", desc: "画像の多いページ（画像非表示の確認）", icon: "image" },
  { id: "login", url: "demo://login", label: "会員ログイン", desc: "Cookie がプロファイルごとに分かれる例", icon: "lock" },
  { id: "grid", url: "demo://grid", label: "座標テスト", desc: "タップ位置と座標の確認用グリッド", icon: "crosshair" },
];

export const EXTERNAL_EXAMPLES = [
  {
    url: "https://ja.m.wikipedia.org/wiki/Android_(オペレーティングシステム)",
    label: "Wikipedia（外部サイト例）",
    desc: "実際の外部サイトを固定エリアに表示",
  },
  { url: "https://example.com/", label: "example.com", desc: "シンプルな外部ページ" },
];

const SITE_PREFIX = "/sites/";
const DEMO_SCHEME = "demo://";

export function isDemoUrl(url: string): boolean {
  return url.startsWith(DEMO_SCHEME);
}

/** demo://news/3?x=1 -> /sites/news/3?x=1 */
export function demoToPath(url: string): string {
  const rest = url.slice(DEMO_SCHEME.length).replace(/^\/+/, "");
  return SITE_PREFIX + (rest || "start");
}

/** /sites/news/3?x=1 -> demo://news/3?x=1 */
export function pathToDemo(path: string): string {
  return DEMO_SCHEME + path.slice(SITE_PREFIX.length).replace(/\/+(\?|$)/, "$1");
}

export function isSitePath(path: string): boolean {
  return path.startsWith(SITE_PREFIX);
}

const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i;
const HOSTPORT_RE = /^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i;

/** Turns whatever was typed into the address bar into a canonical URL. */
export function normalizeInput(raw: string, home: string): string {
  const input = raw.trim();
  if (!input) return home;
  if (isDemoUrl(input)) return pathToDemo(demoToPath(input));
  if (isSitePath(input)) return pathToDemo(input);
  if (/^https?:\/\//i.test(input)) return input;
  const site = DEMO_SITES.find((s) => s.id === input.toLowerCase());
  if (site) return site.url;
  if (!/\s/.test(input) && DOMAIN_RE.test(input)) return "https://" + input;
  if (!/\s/.test(input) && HOSTPORT_RE.test(input)) return "http://" + input;
  return "demo://start?q=" + encodeURIComponent(input);
}

/** Address-bar text: drops the scheme of https URLs like mobile browsers do. */
export function displayUrl(url: string): string {
  if (isDemoUrl(url)) return url;
  try {
    const u = new URL(url);
    const path = decodeURI(u.pathname + u.search).replace(/\/$/, "");
    return u.host + path;
  } catch {
    return url;
  }
}

export function hostOf(url: string): string {
  if (isDemoUrl(url)) return "demo";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
