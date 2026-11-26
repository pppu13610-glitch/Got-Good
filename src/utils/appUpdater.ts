import {Capacitor} from '@capacitor/core';
import {
  AppVersionEntry,
  ChangeCategory,
  CURRENT_APP_VERSION,
  VERSION_HISTORY,
} from '../data/changelog';
import {
  CREATOR_GITHUB_PROFILE_URL,
  CREATOR_GITHUB_REPO_URL,
  isTrustedSameOrHttpsUrl,
  sanitizeExternalUrl,
} from './security';

export const LIVE_BROWSER_APP_URL =
  'https://ais-pre-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app';
export const DEV_BROWSER_APP_URL =
  'https://ais-dev-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app';
export const GITHUB_RAW_VERSION_URL =
  'https://raw.githubusercontent.com/pppu13610-glitch/baan-cha-3d/main/public/version.json';
export const GITHUB_LATEST_RELEASE_API =
  'https://api.github.com/repos/pppu13610-glitch/baan-cha-3d/releases/latest';

export interface RemoteVersionManifest {
  version: string;
  previousVersion?: string;
  releaseDate?: string;
  releaseTitle?: string;
  browserUrl?: string;
  devBrowserUrl?: string;
  githubUrl?: string;
  highlights?: string[];
}

export interface VersionDeltaAnalysis {
  currentVersion: string;
  targetVersion: string;
  hasUpdate: boolean;
  versionsBehind: number;
  missingReleases: AppVersionEntry[];
  categoryBreakdown: Record<ChangeCategory, number>;
  comparisonSummary: string;
  githubProfileUrl: string;
  githubRepoUrl: string;
  browserAppUrl: string;
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
  checkedFromGithub: boolean;
  sourceLabel: string;
  checkedAtLabel: string;
  analysis: VersionDeltaAnalysis;
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

export function analyzeVersionUpdate(
  currentVersion: string,
  latestVersion: string,
  remoteManifest: RemoteVersionManifest | null,
): VersionDeltaAnalysis {
  const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;
  const missingReleases = VERSION_HISTORY.filter(
    (entry) => compareSemver(entry.version, currentVersion) > 0,
  );

  const categoryBreakdown: Record<ChangeCategory, number> = {
    ฟีเจอร์ใหม่: 0,
    เมนูชาและสูตร: 0,
    'ภาพและ 3 มิติ': 0,
    ประสิทธิภาพ: 0,
  };

  const inspectList =
    missingReleases.length > 0
      ? missingReleases
      : VERSION_HISTORY.slice(0, 1);

  for (const rel of inspectList) {
    for (const ch of rel.changes) {
      categoryBreakdown[ch.category] += 1;
    }
  }

  const versionsBehind = hasUpdate
    ? Math.max(1, missingReleases.length)
    : 0;

  let comparisonSummary = `ตัวเกมของคุณ (v${currentVersion}) ตรงกับเวอร์ชั่นล่าสุดบน Browser และคลังของผู้พัฒนาแล้ว`;
  if (hasUpdate) {
    const highlightCount = remoteManifest?.highlights?.length ?? 0;
    comparisonSummary =
      missingReleases.length > 0
        ? `พบอัปเดตใหม่ v${latestVersion} (ใหม่กว่าเวอร์ชั่นเดิม ${missingReleases.length} รุ่น) พร้อมรายการปรับปรุงรวม ${Object.values(categoryBreakdown).reduce((a, b) => a + b, 0)} รายการ`
        : `พบเวอร์ชั่นใหม่ v${latestVersion} บนเซิร์ฟเวอร์ Browser${highlightCount > 0 ? ` (เพิ่มความสามารถใหม่ ${highlightCount} หัวข้อ)` : ''}`;
  }

  return {
    currentVersion,
    targetVersion: latestVersion,
    hasUpdate,
    versionsBehind,
    missingReleases,
    categoryBreakdown,
    comparisonSummary,
    githubProfileUrl: CREATOR_GITHUB_PROFILE_URL,
    githubRepoUrl: CREATOR_GITHUB_REPO_URL,
    browserAppUrl: LIVE_BROWSER_APP_URL,
  };
}

async function fetchManifestWithTimeout(
  url: string,
  timeoutMs = 4500,
): Promise<RemoteVersionManifest | null> {
  if (!isTrustedSameOrHttpsUrl(url)) return null;
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
      version: data.version.replace(/^v/i, '').trim(),
      previousVersion: data.previousVersion,
      releaseDate: data.releaseDate,
      releaseTitle: data.releaseTitle,
      browserUrl: data.browserUrl
        ? sanitizeExternalUrl(data.browserUrl, LIVE_BROWSER_APP_URL)
        : undefined,
      devBrowserUrl: data.devBrowserUrl
        ? sanitizeExternalUrl(data.devBrowserUrl, DEV_BROWSER_APP_URL)
        : undefined,
      githubUrl: data.githubUrl
        ? sanitizeExternalUrl(data.githubUrl, CREATOR_GITHUB_PROFILE_URL)
        : undefined,
      highlights: Array.isArray(data.highlights) ? data.highlights : undefined,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchHtmlMetaVersionFallback(
  browserUrl: string,
  timeoutMs = 3500,
): Promise<RemoteVersionManifest | null> {
  if (!isTrustedSameOrHttpsUrl(browserUrl)) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${browserUrl}/?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(
      /<meta\s+name=["']app-version["']\s+content=["']([0-9]+\.[0-9]+\.[0-9]+)["']/i,
    );
    if (!match) return null;
    return {
      version: match[1],
      browserUrl,
      githubUrl: CREATOR_GITHUB_PROFILE_URL,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchGithubReleaseManifest(
  timeoutMs = 3200,
): Promise<RemoteVersionManifest | null> {
  const rawManifest = await fetchManifestWithTimeout(
    GITHUB_RAW_VERSION_URL,
    timeoutMs,
  );
  if (rawManifest) return rawManifest;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GITHUB_LATEST_RELEASE_API, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tag_name?: string;
      name?: string;
      published_at?: string;
      body?: string;
    };
    const rawTag = (data.tag_name ?? '').replace(/^v/i, '').trim();
    if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(rawTag)) return null;
    const highlights = typeof data.body === 'string'
      ? data.body
          .split('\n')
          .map((l) => l.replace(/^[-*•]\s*/, '').trim())
          .filter((l) => l.length > 4)
          .slice(0, 5)
      : undefined;
    return {
      version: rawTag,
      releaseTitle: data.name || `GitHub Release v${rawTag}`,
      releaseDate: data.published_at?.slice(0, 10),
      githubUrl: CREATOR_GITHUB_PROFILE_URL,
      browserUrl: LIVE_BROWSER_APP_URL,
      highlights,
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
      checkedFromGithub: false,
      sourceLabel: 'โหมดออฟไลน์ในเครื่อง',
      checkedAtLabel,
      analysis: analyzeVersionUpdate(
        CURRENT_APP_VERSION,
        CURRENT_APP_VERSION,
        null,
      ),
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

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const shouldCheckHostedBrowser =
    isNativeApp ||
    (currentOrigin !== LIVE_BROWSER_APP_URL &&
      currentOrigin !== DEV_BROWSER_APP_URL &&
      !currentOrigin.includes('localhost'));

  const [sameOriginManifest, liveManifestDirect, githubManifest] =
    await Promise.all([
      fetchManifestWithTimeout('/version.json'),
      shouldCheckHostedBrowser
        ? fetchManifestWithTimeout(`${LIVE_BROWSER_APP_URL}/version.json`).then(
            async (res) =>
              res ??
              (await fetchManifestWithTimeout(
                `${DEV_BROWSER_APP_URL}/version.json`,
              )) ??
              (await fetchHtmlMetaVersionFallback(LIVE_BROWSER_APP_URL)),
          )
        : Promise.resolve(null),
      fetchGithubReleaseManifest(),
    ]);

  let bestManifest: RemoteVersionManifest | null = sameOriginManifest;
  let checkedFromBrowserServer = Boolean(sameOriginManifest);
  const checkedFromGithub = Boolean(githubManifest);

  if (liveManifestDirect) {
    if (
      !bestManifest ||
      compareSemver(liveManifestDirect.version, bestManifest.version) >= 0
    ) {
      bestManifest = liveManifestDirect;
      checkedFromBrowserServer = true;
    }
  }

  if (githubManifest) {
    if (
      !bestManifest ||
      compareSemver(githubManifest.version, bestManifest.version) > 0
    ) {
      bestManifest = githubManifest;
    }
  }

  const latestVersion = bestManifest?.version ?? CURRENT_APP_VERSION;
  const hasNewerVersion =
    compareSemver(latestVersion, CURRENT_APP_VERSION) > 0;
  const targetSyncUrl = sanitizeExternalUrl(
    bestManifest?.browserUrl ??
      (liveManifestDirect ? LIVE_BROWSER_APP_URL : LIVE_BROWSER_APP_URL),
    LIVE_BROWSER_APP_URL,
  );

  const sourceLabel = checkedFromGithub && checkedFromBrowserServer
    ? 'Browser Server + GitHub ผู้สร้าง'
    : checkedFromBrowserServer
      ? 'Browser Server ปัจจุบัน'
      : checkedFromGithub
        ? 'GitHub ผู้สร้างเกม'
        : 'ตรวจสอบในเครื่อง';

  const analysis = analyzeVersionUpdate(
    CURRENT_APP_VERSION,
    latestVersion,
    bestManifest,
  );

  return {
    status: hasNewerVersion || waitingWorker ? 'update-ready' : 'up-to-date',
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    remoteManifest: bestManifest,
    waitingWorker,
    targetSyncUrl,
    isNativeApp,
    checkedFromBrowserServer,
    checkedFromGithub,
    sourceLabel,
    checkedAtLabel,
    analysis,
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
    const safeTarget = sanitizeExternalUrl(
      result.targetSyncUrl,
      LIVE_BROWSER_APP_URL,
    );
    window.location.replace(safeTarget);
    return;
  }

  // In browser/PWA, reload with clean cache-busting parameter
  const url = new URL(window.location.href);
  url.searchParams.set('v', result?.latestVersion ?? CURRENT_APP_VERSION);
  window.location.replace(url.toString());
}
