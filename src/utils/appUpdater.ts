import {Capacitor} from '@capacitor/core';
import {CURRENT_APP_VERSION} from '../data/changelog';

export const LIVE_BROWSER_APP_URL =
  'https://ais-pre-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app';
export const DEV_BROWSER_APP_URL =
  'https://ais-dev-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app';

export interface RemoteVersionManifest {
  version: string;
  previousVersion?: string;
  releaseDate?: string;
  releaseTitle?: string;
  browserUrl?: string;
  devBrowserUrl?: string;
  highlights?: string[];
}

export interface UpdateCheckResult {
  status: 'up-to-date' | 'update-ready' | 'offline';
  currentVersion: string;
  latestVersion: string;
  remoteManifest: RemoteVersionManifest | null;
  waitingWorker: ServiceWorker | null;
  targetSyncUrl: string | null;
  isNativeApp: boolean;
  checkedFromBrowserServer: boolean;
  checkedAtLabel: string;
}

export function compareSemver(a: string, b: string): number {
  const pa = a
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);
  const pb = b
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

async function fetchManifestWithTimeout(
  url: string,
  timeoutMs = 4500,
): Promise<RemoteVersionManifest | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<RemoteVersionManifest>;
    if (!data || typeof data.version !== 'string') return null;
    return {
      version: data.version,
      previousVersion: data.previousVersion,
      releaseDate: data.releaseDate,
      releaseTitle: data.releaseTitle,
      browserUrl: data.browserUrl,
      devBrowserUrl: data.devBrowserUrl,
      highlights: Array.isArray(data.highlights) ? data.highlights : undefined,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function checkLiveBrowserVersion(): Promise<UpdateCheckResult> {
  const checkedAtLabel = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isNativeApp = Capacitor.isNativePlatform();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'offline',
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      remoteManifest: null,
      waitingWorker: null,
      targetSyncUrl: null,
      isNativeApp,
      checkedFromBrowserServer: false,
      checkedAtLabel,
    };
  }

  let waitingWorker: ServiceWorker | null = null;
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update().catch(() => {});
        if (reg.waiting) {
          waitingWorker = reg.waiting;
        }
      }
    } catch {
      // Ignore service worker probe errors
    }
  }

  // Check same-origin /version.json first
  const sameOriginManifest = await fetchManifestWithTimeout('/version.json');

  // If running inside Capacitor native APK (local origin) or if hosted browser URL differs from current origin,
  // also check the live browser deployment so the app always matches the current browser build.
  let liveBrowserManifest: RemoteVersionManifest | null = null;
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const shouldCheckHostedBrowser =
    isNativeApp ||
    (currentOrigin !== LIVE_BROWSER_APP_URL &&
      currentOrigin !== DEV_BROWSER_APP_URL &&
      !currentOrigin.includes('localhost'));

  if (shouldCheckHostedBrowser || !sameOriginManifest) {
    liveBrowserManifest =
      (await fetchManifestWithTimeout(`${LIVE_BROWSER_APP_URL}/version.json`)) ??
      (await fetchManifestWithTimeout(`${DEV_BROWSER_APP_URL}/version.json`));
  }

  // Pick whichever valid manifest has the highest version
  let bestManifest: RemoteVersionManifest | null = sameOriginManifest;
  let checkedFromBrowserServer = false;

  if (liveBrowserManifest) {
    if (
      !bestManifest ||
      compareSemver(liveBrowserManifest.version, bestManifest.version) >= 0
    ) {
      bestManifest = liveBrowserManifest;
      checkedFromBrowserServer = true;
    }
  }

  const latestVersion = bestManifest?.version ?? CURRENT_APP_VERSION;
  const hasNewerVersion =
    compareSemver(latestVersion, CURRENT_APP_VERSION) > 0;
  const targetSyncUrl =
    bestManifest?.browserUrl ??
    (liveBrowserManifest ? LIVE_BROWSER_APP_URL : null);

  return {
    status: hasNewerVersion || waitingWorker ? 'update-ready' : 'up-to-date',
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    remoteManifest: bestManifest,
    waitingWorker,
    targetSyncUrl,
    isNativeApp,
    checkedFromBrowserServer:
      checkedFromBrowserServer || Boolean(sameOriginManifest),
    checkedAtLabel,
  };
}

/**
 * Applies the update directly inside the app:
 * - Clears stale Service Worker & CacheStorage entries
 * - Activates any waiting Service Worker
 * - If inside Capacitor native APK and a newer hosted browser URL exists, switches seamlessly inside WebView
 * - Otherwise forces a clean reload so the browser/PWA boots the latest version
 */
export async function applyInAppUpdate(
  result: UpdateCheckResult | null,
): Promise<void> {
  if (result?.waitingWorker) {
    try {
      result.waitingWorker.postMessage({type: 'SKIP_WAITING'});
    } catch {
      // Ignore postMessage failure
    }
  }

  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      // Ignore CacheStorage cleanup errors
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
    } catch {
      // Ignore SW refresh errors
    }
  }

  if (typeof window === 'undefined') return;

  const isNative = Capacitor.isNativePlatform();
  const hasNewerRemote =
    result && compareSemver(result.latestVersion, CURRENT_APP_VERSION) > 0;

  if (isNative && hasNewerRemote && result?.targetSyncUrl) {
    window.location.replace(result.targetSyncUrl);
    return;
  }

  // In browser/PWA, reload with clean cache-busting parameter if needed
  const url = new URL(window.location.href);
  url.searchParams.set('v', result?.latestVersion ?? CURRENT_APP_VERSION);
  window.location.replace(url.toString());
}
