"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { BRIDGE_KEY, STANDALONE_ENV, type SiteBridge, type SiteEnv } from "@/lib/bridge-types";
import { createStore } from "@/lib/create-store";
import { useHydrated } from "@/lib/hooks";
import { demoToPath, isDemoUrl, normalizeInput } from "@/lib/urls";

/*
 * Runtime shared by the bundled demo pages. Inside the browser shell it talks
 * to the shell through the bridge; opened directly in a tab it falls back to
 * an in-memory stand-in so every page still works on its own.
 */

interface SiteApi {
  env: SiteEnv;
  navigate(input: string): void;
  cookieSet(host: string, name: string, value: string): void;
  cookieRemove(host: string, name: string): void;
  /** Registers an image of the current page; returns the unregister function. */
  registerImage(bytes: number): () => void;
}

const SiteContext = createContext<SiteApi | null>(null);

export function useSite(): SiteApi {
  const api = useContext(SiteContext);
  if (!api) throw new Error("useSite must be used inside <SiteRoot>");
  return api;
}

/** A cookie of the active profile (or of the no-profile browser). */
export function useCookie(host: string, name: string): [string | undefined, (value: string | null) => void] {
  const { env, cookieSet, cookieRemove } = useSite();
  const value = env.jar[host]?.[name];
  const setValue = useCallback(
    (next: string | null) => (next === null ? cookieRemove(host, name) : cookieSet(host, name, next)),
    [cookieRemove, cookieSet, host, name],
  );
  return [value, setValue];
}

function findBridge(): SiteBridge | null {
  try {
    if (window.parent === window) return null;
    return (window.parent as unknown as Record<string, SiteBridge | undefined>)[BRIDGE_KEY] ?? null;
  } catch {
    // Cross-origin parent: not our shell.
    return null;
  }
}

function standaloneBridge(): SiteBridge {
  const local = createStore<SiteEnv>({ ...STANDALONE_ENV, unitPx: window.devicePixelRatio || 1 });
  return {
    getEnv: local.get,
    subscribe: local.subscribe,
    navigate(input) {
      const url = normalizeInput(input, "demo://start");
      window.location.href = isDemoUrl(url) ? demoToPath(url) : url;
    },
    location() {},
    page() {},
    pointer() {},
    cookieSet(host, name, value) {
      local.set((env) => ({ ...env, jar: { ...env.jar, [host]: { ...env.jar[host], [name]: value } } }));
    },
    cookieRemove(host, name) {
      local.set((env) => {
        const { [name]: _removed, ...rest } = env.jar[host] ?? {};
        void _removed;
        return { ...env, jar: { ...env.jar, [host]: rest } };
      });
    },
  };
}

/**
 * Rendering waits for the client: what a page shows depends on the profile and
 * on the image setting, and with images hidden the <img> tags must never reach
 * the document at all.
 */
export function SiteRoot({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  return hydrated ? <SiteRuntime>{children}</SiteRuntime> : null;
}

function SiteRuntime({ children }: { children: ReactNode }) {
  const [bridge] = useState<SiteBridge>(() => findBridge() ?? standaloneBridge());
  const env = useSyncExternalStore(bridge.subscribe, bridge.getEnv, bridge.getEnv);
  const pathname = usePathname();
  const images = useRef({ count: 0, bytes: 0 });
  const reportTimer = useRef<number | undefined>(undefined);

  const reportSoon = useCallback(() => {
    window.clearTimeout(reportTimer.current);
    reportTimer.current = window.setTimeout(() => {
      bridge.page({ images: images.current.count, bytes: images.current.bytes, hidden: bridge.getEnv().hideImages });
    }, 120);
  }, [bridge]);

  const registerImage = useCallback(
    (bytes: number) => {
      images.current.count += 1;
      images.current.bytes += bytes;
      reportSoon();
      return () => {
        images.current.count -= 1;
        images.current.bytes -= bytes;
        reportSoon();
      };
    },
    [reportSoon],
  );

  // Address bar and history follow navigations that happen inside the page.
  useEffect(() => {
    bridge.location(window.location.pathname + window.location.search, document.title);
    reportSoon();
  }, [bridge, pathname, reportSoon]);

  useEffect(() => {
    reportSoon();
  }, [env.hideImages, reportSoon]);

  useEffect(() => () => window.clearTimeout(reportTimer.current), []);

  // Pointer positions feed the coordinate read-out of the shell.
  useEffect(() => {
    const move = (e: PointerEvent) => bridge.pointer("move", e.clientX, e.clientY);
    const down = (e: PointerEvent) => bridge.pointer("down", e.clientX, e.clientY);
    const leave = () => bridge.pointer("leave", 0, 0);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down, { capture: true });
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [bridge]);

  // Stand-in for the WebView's text zoom: font sizes are in rem, boxes in px.
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * env.textScale}px`;
  }, [env.textScale]);

  const api = useMemo<SiteApi>(
    () => ({
      env,
      navigate: bridge.navigate,
      cookieSet: bridge.cookieSet,
      cookieRemove: bridge.cookieRemove,
      registerImage,
    }),
    [env, bridge, registerImage],
  );

  return <SiteContext.Provider value={api}>{children}</SiteContext.Provider>;
}
