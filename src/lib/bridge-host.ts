import { BRIDGE_KEY, STANDALONE_ENV, type SiteBridge, type SiteEnv } from "./bridge-types";
import { createStore } from "./create-store";
import { pointerFromView } from "./pointer";
import { cookieRemove, cookieSet, frameLocation, navigate, reportPage } from "./store";

/** Shell side of the bridge (see bridge-types.ts). */

export const envStore = createStore<SiteEnv>({ ...STANDALONE_ENV, embedded: true });

// Listeners belong to embedded documents that can disappear without cleaning
// up, so they are called defensively and dropped as soon as one throws.
const listeners = new Set<() => void>();
envStore.subscribe(() => {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      listeners.delete(listener);
    }
  }
});

export function publishEnv(next: SiteEnv) {
  envStore.set((prev) => ((Object.keys(next) as (keyof SiteEnv)[]).every((k) => prev[k] === next[k]) ? prev : next));
}

/** Forget the listeners of the previous document when the frame is recreated. */
export function dropSiteListeners() {
  listeners.clear();
}

const bridge: SiteBridge = {
  getEnv: envStore.get,
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  navigate,
  location: frameLocation,
  page: reportPage,
  pointer: pointerFromView,
  cookieSet,
  cookieRemove,
};

export function installBridge(): () => void {
  const host = window as unknown as Record<string, unknown>;
  host[BRIDGE_KEY] = bridge;
  return () => {
    delete host[BRIDGE_KEY];
  };
}
