import {GameSettings, OptimizationProfile} from '../types/tea';

export interface DeviceOptimizationReport {
  detectedModelLabel: string;
  isRealmeNote50: boolean;
  isBudgetMobileGpu: boolean;
  liteGpuActive: boolean;
  gpuRendererName: string;
  hardwareThreads: number;
  deviceMemoryGb: number | null;
}

const REALME_NOTE_50_UA_RE = /RMX3834|realme\s*note\s*50/i;
const BUDGET_MOBILE_GPU_RE =
  /Mali-G57|Mali-G52|Mali-G51|Mali-G31|Mali-T|PowerVR\s*GE8|Adreno\s*\(TM\)\s*(50[0-9]|610|612)/i;

let cachedGpuName: string | null = null;

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

export function probeDeviceOptimization(
  profile: OptimizationProfile,
): DeviceOptimizationReport {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const hardwareThreads =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGb =
    typeof navigator !== 'undefined' &&
    'deviceMemory' in navigator &&
    typeof (navigator as Navigator & {deviceMemory?: number}).deviceMemory ===
      'number'
      ? ((navigator as Navigator & {deviceMemory?: number}).deviceMemory ??
        null)
      : null;

  const gpuRendererName = readGpuRendererName();
  const isRealmeNote50 = REALME_NOTE_50_UA_RE.test(ua);
  const isMobileUa = /Android|Mobile/i.test(ua);
  const isBudgetGpuString = BUDGET_MOBILE_GPU_RE.test(gpuRendererName);
  const isLowMemoryMobile =
    isMobileUa && deviceMemoryGb !== null && deviceMemoryGb <= 4;

  const isBudgetMobileGpu =
    isRealmeNote50 || isBudgetGpuString || isLowMemoryMobile;

  const liteGpuActive =
    profile === 'realme-note-50' ||
    (profile === 'auto' && (isRealmeNote50 || isBudgetMobileGpu));

  let detectedModelLabel = 'อุปกรณ์ทั่วไป';
  if (profile === 'realme-note-50') {
    detectedModelLabel = 'โหมด realme Note 50 (Mali-G57 · 90Hz)';
  } else if (isRealmeNote50) {
    detectedModelLabel = 'ตรวจพบ realme Note 50 (RMX3834)';
  } else if (isBudgetMobileGpu) {
    detectedModelLabel = 'ตรวจพบมือถือประหยัดพลังงาน (เปิดจูนอัตโนมัติ)';
  }

  return {
    detectedModelLabel,
    isRealmeNote50,
    isBudgetMobileGpu,
    liteGpuActive,
    gpuRendererName,
    hardwareThreads,
    deviceMemoryGb,
  };
}

export function getRealmeNote50Preset(): Partial<GameSettings> {
  return {
    optimizationProfile: 'realme-note-50',
    graphicsQuality: 'medium',
    resolutionScale: '1.0',
    shadowsEnabled: true,
    antialiasEnabled: false,
    particlesEnabled: true,
    targetFps: 90,
  };
}

export function applyDomPerformanceClass(liteGpuActive: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('perf-lite', liteGpuActive);
}
