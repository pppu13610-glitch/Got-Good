import {GameSettings, OptimizationProfile, TargetFps} from '../types/tea';
import {
  clampTargetFpsToDisplay,
  DisplayRefreshRate,
} from './refreshRate';

export interface NativeHardwareSnapshot {
  manufacturer?: string;
  model?: string;
  device?: string;
  board?: string;
  hardware?: string;
  socModel?: string;
  androidRelease?: string;
  sdkInt?: number;
  displayId?: string;
  totalRamMb?: number;
  displayHz?: number;
  gameModeSupported?: boolean;
}

export interface DeviceOptimizationReport {
  detectedModelLabel: string;
  hardwareSpecSummary: string;
  osVersionLabel: string;
  isRealmeNote50: boolean;
  isGalaxyA10: boolean;
  isUnisocT612OrMaliG57: boolean;
  isMaliG71OrExynos7884: boolean;
  isBudgetMobileGpu: boolean;
  isDetected2GbRam: boolean;
  isUltraLowRam: boolean;
  liteGpuActive: boolean;
  showRealmeNote50Option: boolean;
  showGalaxyA10Option: boolean;
  showLowRam2GbOption: boolean;
  effectiveProfile: OptimizationProfile;
  gpuRendererName: string;
  hardwareThreads: number;
  deviceMemoryGb: number | null;
  nativeDisplayHz: number | null;
  gameBoosterReady: boolean;
}

const REALME_NOTE_50_RE = /RMX3834|realme\s*note\s*50/i;
const REALME_BRAND_RE = /realme/i;
const UNISOC_T612_RE = /Unisoc|Tiger\s*T612|\bT612\b|ums9230/i;
const MALI_G57_RE = /Mali-G57/i;

const GALAXY_A10_RE =
  /SM-A105[A-Z0-9]*|SM-A102[A-Z0-9]*|galaxy\s*a10\b/i;
const SAMSUNG_BRAND_RE = /samsung/i;
const EXYNOS_7884_RE = /Exynos\s*7884|universal7884|s5e7885/i;
const MALI_G71_RE = /Mali-G71/i;

const BUDGET_MOBILE_GPU_RE =
  /Mali-G57|Mali-G71|Mali-G52|Mali-G51|Mali-G31|Mali-T|PowerVR\s*GE8|Adreno\s*\(TM\)\s*(50[0-9]|610|612)/i;

let cachedGpuName: string | null = null;
let cachedHighEntropyModel = '';
let cachedHighEntropyPlatformVersion = '';
let cachedHighEntropyPlatform = '';
let highEntropyRequested = false;

interface NavigatorUAData {
  platform?: string;
  mobile?: boolean;
  brands?: {brand: string; version: string}[];
  getHighEntropyValues?: (hints: string[]) => Promise<{
    model?: string;
    platformVersion?: string;
    platform?: string;
  }>;
}

function readNativeBridgeSnapshot(): NativeHardwareSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const bridge = (
      window as Window & {
        BaanChaHardwareBridge?: {
          getHardwareSnapshotJson?: () => string;
        };
      }
    ).BaanChaHardwareBridge;
    if (!bridge || typeof bridge.getHardwareSnapshotJson !== 'function') {
      return null;
    }
    const raw = bridge.getHardwareSnapshotJson();
    if (!raw || typeof raw !== 'string') return null;
    const parsed = JSON.parse(raw) as NativeHardwareSnapshot;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function warmHighEntropyDeviceInfo(): Promise<boolean> {
  if (highEntropyRequested) return false;
  highEntropyRequested = true;
  if (typeof navigator === 'undefined') return false;
  const uaData = (navigator as Navigator & {userAgentData?: NavigatorUAData})
    .userAgentData;
  if (!uaData || typeof uaData.getHighEntropyValues !== 'function') {
    return false;
  }
  try {
    const vals = await uaData.getHighEntropyValues([
      'model',
      'platformVersion',
      'platform',
    ]);
    let changed = false;
    if (typeof vals.model === 'string' && vals.model !== cachedHighEntropyModel) {
      cachedHighEntropyModel = vals.model;
      changed = true;
    }
    if (
      typeof vals.platformVersion === 'string' &&
      vals.platformVersion !== cachedHighEntropyPlatformVersion
    ) {
      cachedHighEntropyPlatformVersion = vals.platformVersion;
      changed = true;
    }
    if (
      typeof vals.platform === 'string' &&
      vals.platform !== cachedHighEntropyPlatform
    ) {
      cachedHighEntropyPlatform = vals.platform;
      changed = true;
    }
    return changed;
  } catch {
    return false;
  }
}

function readGpuRendererName(): string {
  if (cachedGpuName !== null) return cachedGpuName;
  if (typeof document === 'undefined') {
    cachedGpuName = '';
    return '';
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedGpuName = '';
      return '';
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedGpuName = gpu;
    return gpu;
  } catch {
    cachedGpuName = '';
    return '';
  }
}

function detectOsVersionLabel(
  bridge: NativeHardwareSnapshot | null,
  ua: string,
): string {
  if (bridge?.androidRelease) {
    const sdkPart = bridge.sdkInt ? ` (API ${bridge.sdkInt})` : '';
    return `Android ${bridge.androidRelease}${sdkPart}`;
  }
  const androidMatch = ua.match(/Android\s+([0-9._]+)/i);
  if (androidMatch) {
    const ver =
      cachedHighEntropyPlatformVersion || androidMatch[1].replace(/_/g, '.');
    return `Android ${ver}`;
  }
  if (cachedHighEntropyPlatform && cachedHighEntropyPlatformVersion) {
    return `${cachedHighEntropyPlatform} ${cachedHighEntropyPlatformVersion}`;
  }
  const iosMatch = ua.match(/OS\s+([0-9_]+)\s+like\s+Mac/i);
  if (iosMatch) {
    return `iOS ${iosMatch[1].replace(/_/g, '.')}`;
  }
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Web Runtime';
}

export function sanitizeProfileForDevice(
  profile: OptimizationProfile,
  report: Pick<
    DeviceOptimizationReport,
    'showRealmeNote50Option' | 'showGalaxyA10Option' | 'showLowRam2GbOption'
  >,
): OptimizationProfile {
  if (profile === 'realme-note-50' && !report.showRealmeNote50Option) {
    return 'auto';
  }
  if (profile === 'galaxy-a10' && !report.showGalaxyA10Option) {
    return 'auto';
  }
  if (profile === 'low-ram-2gb' && !report.showLowRam2GbOption) {
    return 'auto';
  }
  return profile;
}

export function probeDeviceOptimization(
  requestedProfile: OptimizationProfile,
): DeviceOptimizationReport {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const bridge = readNativeBridgeSnapshot();
  const hardwareThreads =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const navigatorMemGb =
    typeof navigator !== 'undefined' &&
    'deviceMemory' in navigator &&
    typeof (navigator as Navigator & {deviceMemory?: number}).deviceMemory ===
      'number'
      ? ((navigator as Navigator & {deviceMemory?: number}).deviceMemory ??
        null)
      : null;

  const bridgeRamGb =
    bridge?.totalRamMb && bridge.totalRamMb > 0
      ? Number((bridge.totalRamMb / 1024).toFixed(1))
      : null;
  const deviceMemoryGb = bridgeRamGb ?? navigatorMemGb;

  const gpuRendererName = readGpuRendererName();
  const hwIdentityPool = [
    ua,
    cachedHighEntropyModel,
    bridge?.manufacturer ?? '',
    bridge?.model ?? '',
    bridge?.device ?? '',
    bridge?.board ?? '',
    bridge?.hardware ?? '',
    bridge?.socModel ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const isRealmeNote50 =
    REALME_NOTE_50_RE.test(hwIdentityPool) ||
    (REALME_BRAND_RE.test(hwIdentityPool) && UNISOC_T612_RE.test(hwIdentityPool));

  const isSamsungDevice =
    SAMSUNG_BRAND_RE.test(hwIdentityPool) || /SM-[A-Z0-9]+/i.test(hwIdentityPool);

  const isMaliG71 = MALI_G71_RE.test(gpuRendererName);
  const isExynos7884 = EXYNOS_7884_RE.test(hwIdentityPool);

  const isDetected2GbRam =
    (bridge?.totalRamMb !== undefined && bridge.totalRamMb <= 2300) ||
    (navigatorMemGb !== null && navigatorMemGb <= 2);

  const isGalaxyA10 =
    GALAXY_A10_RE.test(hwIdentityPool) ||
    isExynos7884 ||
    (isSamsungDevice && isMaliG71 && (isDetected2GbRam || hardwareThreads <= 8));

  const isUnisocT612OrMaliG57 =
    isRealmeNote50 ||
    UNISOC_T612_RE.test(hwIdentityPool) ||
    MALI_G57_RE.test(gpuRendererName);

  const isMaliG71OrExynos7884 = isGalaxyA10 || isExynos7884 || isMaliG71;

  // Strict exclusive visibility flags:
  // 1) realme Note 50 option -> ONLY realme Note 50
  // 2) Samsung Galaxy A10 option -> ONLY Samsung Galaxy A10
  // 3) 2 GB RAM option -> ONLY devices with <= 2 GB RAM that do NOT have a dedicated device optimizer
  const showRealmeNote50Option = isRealmeNote50;
  const showGalaxyA10Option = isGalaxyA10;
  const showLowRam2GbOption =
    isDetected2GbRam && !isRealmeNote50 && !isGalaxyA10;

  const effectiveProfile = sanitizeProfileForDevice(requestedProfile, {
    showRealmeNote50Option,
    showGalaxyA10Option,
    showLowRam2GbOption,
  });

  const isMobileUa =
    /Android|Mobile/i.test(ua) || Boolean(bridge?.model);
  const isBudgetGpuString = BUDGET_MOBILE_GPU_RE.test(gpuRendererName);
  const isLowMemoryMobile =
    isMobileUa && deviceMemoryGb !== null && deviceMemoryGb <= 4;

  const isBudgetMobileGpu =
    isRealmeNote50 ||
    isGalaxyA10 ||
    isUnisocT612OrMaliG57 ||
    isMaliG71OrExynos7884 ||
    isBudgetGpuString ||
    isLowMemoryMobile;

  const isUltraLowRam =
    (effectiveProfile === 'low-ram-2gb' && showLowRam2GbOption) ||
    effectiveProfile === 'galaxy-a10' ||
    (effectiveProfile === 'auto' && (isDetected2GbRam || isGalaxyA10));

  const liteGpuActive =
    effectiveProfile === 'realme-note-50' ||
    effectiveProfile === 'galaxy-a10' ||
    effectiveProfile === 'low-ram-2gb' ||
    (effectiveProfile === 'auto' &&
      (isRealmeNote50 ||
        isGalaxyA10 ||
        isUnisocT612OrMaliG57 ||
        isMaliG71OrExynos7884 ||
        isBudgetMobileGpu));

  const osVersionLabel = detectOsVersionLabel(bridge, ua);

  let detectedModelLabel = 'อุปกรณ์ทั่วไป';
  if (isRealmeNote50) {
    detectedModelLabel = 'realme Note 50 (Unisoc T612 · Mali-G57)';
  } else if (isGalaxyA10) {
    detectedModelLabel = 'Samsung Galaxy A10 (Exynos 7884 · Mali-G71 MP2)';
  } else if (showLowRam2GbOption) {
    detectedModelLabel = 'มือถือ RAM ≤ 2 GB (โหมดประหยัดแรมพิเศษ)';
  } else if (isMaliG71OrExynos7884) {
    detectedModelLabel = 'ตรวจพบชิป Exynos 7884 / ARM Mali-G71';
  } else if (isUnisocT612OrMaliG57) {
    detectedModelLabel = 'ตรวจพบชิป Unisoc T612 / ARM Mali-G57';
  } else if (isBudgetMobileGpu) {
    detectedModelLabel = 'มือถือโหมดประหยัดพลังงานอัตโนมัติ';
  }

  const rawModelDisplay =
    bridge?.model ||
    cachedHighEntropyModel ||
    (isRealmeNote50
      ? 'realme Note 50'
      : isGalaxyA10
        ? 'Samsung Galaxy A10'
        : isMobileUa
          ? 'Android Device'
          : 'Desktop / Web Browser');

  const ramPart =
    bridge?.totalRamMb && bridge.totalRamMb > 0
      ? `${(bridge.totalRamMb / 1024).toFixed(1)} GB RAM`
      : navigatorMemGb !== null
        ? `${navigatorMemGb} GB RAM`
        : `${hardwareThreads} Threads`;

  const gpuShort = gpuRendererName
    ? gpuRendererName.replace(/^ANGLE\s*\([^,]+,\s*/i, '').replace(/\)\s*$/, '').slice(0, 38)
    : isGalaxyA10
      ? 'ARM Mali-G71 MP2'
      : isRealmeNote50
        ? 'ARM Mali-G57'
        : 'WebGL GPU';

  const hardwareSpecSummary = `${rawModelDisplay} · ${ramPart} · ${gpuShort}`;

  return {
    detectedModelLabel,
    hardwareSpecSummary,
    osVersionLabel,
    isRealmeNote50,
    isGalaxyA10,
    isUnisocT612OrMaliG57,
    isMaliG71OrExynos7884,
    isBudgetMobileGpu,
    isDetected2GbRam,
    isUltraLowRam,
    liteGpuActive,
    showRealmeNote50Option,
    showGalaxyA10Option,
    showLowRam2GbOption,
    effectiveProfile,
    gpuRendererName,
    hardwareThreads,
    deviceMemoryGb,
    nativeDisplayHz: bridge?.displayHz ?? null,
    gameBoosterReady: Boolean(bridge?.gameModeSupported) || isMobileUa,
  };
}

export function getRealmeNote50Preset(
  maxDisplayHz: DisplayRefreshRate = 90,
): Partial<GameSettings> {
  const idealFps: TargetFps = clampTargetFpsToDisplay(90, maxDisplayHz);
  return {
    optimizationProfile: 'realme-note-50',
    graphicsQuality: 'medium',
    resolutionScale: 'hd-plus',
    shadowsEnabled: true,
    antialiasEnabled: false,
    particlesEnabled: true,
    targetFps: idealFps,
  };
}

export function getGalaxyA10Preset(
  maxDisplayHz: DisplayRefreshRate = 60,
): Partial<GameSettings> {
  const idealFps: TargetFps = clampTargetFpsToDisplay(60, maxDisplayHz);
  return {
    optimizationProfile: 'galaxy-a10',
    graphicsQuality: 'low',
    resolutionScale: 'hd',
    shadowsEnabled: false,
    antialiasEnabled: false,
    particlesEnabled: false,
    targetFps: idealFps,
  };
}

export function getLowRam2GbPreset(
  maxDisplayHz: DisplayRefreshRate = 60,
): Partial<GameSettings> {
  const idealFps: TargetFps = clampTargetFpsToDisplay(60, maxDisplayHz);
  return {
    optimizationProfile: 'low-ram-2gb',
    graphicsQuality: 'low',
    resolutionScale: 'hd',
    shadowsEnabled: false,
    antialiasEnabled: false,
    particlesEnabled: false,
    targetFps: idealFps,
  };
}

export function applyDomPerformanceClass(
  liteGpuActive: boolean,
  ultraLowRam = false,
): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('perf-lite', liteGpuActive);
  document.documentElement.classList.toggle('ram-2gb', ultraLowRam);
}
