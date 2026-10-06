import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

/*
 * Tells the browser shell whether an external page allows being shown in an
 * iframe. Sites that send X-Frame-Options or a frame-ancestors policy would
 * otherwise appear as a blank frame in this web demo. (The Android app loads
 * pages directly in a WebView and needs none of this.)
 *
 * Only the response headers are read; the body is discarded. Because the
 * server fetches a caller-supplied URL, private and loopback addresses are
 * refused, also after redirects.
 */

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 7000;

type Verdict = { embeddable: boolean; reason?: string };

function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  return ip === "::" || ip === "::1" || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip);
}

async function isPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(localhost|local|internal|lan|home\.arpa)$/.test(host)) return false;
  if (isIP(host)) return !isPrivateAddress(host);
  const addresses = await lookup(host, { all: true });
  return addresses.length > 0 && addresses.every((entry) => !isPrivateAddress(entry.address));
}

/** Reads the two headers that control framing by other origins. */
function judge(headers: Headers, embedder: string | null): Verdict {
  if (headers.get("x-frame-options")) return { embeddable: false, reason: "xfo" };
  const policy = (headers.get("content-security-policy") ?? "")
    .split(/[;,]/)
    .map((directive) => directive.trim().split(/\s+/))
    .find(([name]) => name?.toLowerCase() === "frame-ancestors");
  if (!policy) return { embeddable: true };
  const sources = policy.slice(1).map((source) => source.toLowerCase());
  const allowed =
    sources.includes("*") || sources.includes("https:") || (embedder !== null && sources.includes(embedder.toLowerCase()));
  return allowed ? { embeddable: true } : { embeddable: false, reason: "csp" };
}

export async function GET(request: NextRequest) {
  let current: URL;
  try {
    current = new URL(request.nextUrl.searchParams.get("url") ?? "");
  } catch {
    return Response.json({ embeddable: false, reason: "invalid" } satisfies Verdict);
  }

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        return Response.json({ embeddable: false, reason: "invalid" } satisfies Verdict);
      }
      if (!(await isPublicHost(current.hostname))) {
        return Response.json({ embeddable: false, reason: "private" } satisfies Verdict);
      }
      const response = await fetch(current, {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": MOBILE_UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" },
      });
      void response.body?.cancel();
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current);
        continue;
      }
      return Response.json(judge(response.headers, request.headers.get("origin") ?? request.nextUrl.origin));
    }
    return Response.json({ embeddable: false, reason: "redirects" } satisfies Verdict);
  } catch {
    return Response.json({ embeddable: false, reason: "network" } satisfies Verdict);
  }
}
