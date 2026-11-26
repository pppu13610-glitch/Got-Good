import {TargetFps} from '../types/tea';

export type DisplayRefreshRate = 60 | 90 | 120;

const REFRESH_PROBE_SAMPLES = 22;
const WARMUP_FRAMES = 4;

/**
 * Classifies a measured display refresh rate (Hz) into standard mobile tiers:
 * - <= 74 Hz -> 60 Hz (supports 30, 60 FPS)
 * - 75..105 Hz -> 90 Hz (supports 30, 60, 90 FPS)
 * - >= 106 Hz -> 120 Hz (supports 30, 60, 90, 120 FPS)
 */
export function bucketRefreshRate(measuredHz: number): DisplayRefreshRate {
  if (!Number.isFinite(measuredHz) || measuredHz < 74) {
    return 60;
  }
  if (measuredHz < 106) {
    return 90;
  }
  return 120;
}

export function getAllowedFpsOptions(
  maxRefreshRate: DisplayRefreshRate,
): TargetFps[] {
  if (maxRefreshRate >= 120) {
    return [30, 60, 90, 120];
  }
  if (maxRefreshRate >= 90) {
    return [30, 60, 90];
  }
  return [30, 60];
}

export function clampTargetFpsToDisplay(
  targetFps: TargetFps,
  maxRefreshRate: DisplayRefreshRate,
): TargetFps {
  const allowed = getAllowedFpsOptions(maxRefreshRate);
  if (allowed.includes(targetFps)) {
    return targetFps;
  }
  return allowed[allowed.length - 1];
}

/**
 * Resolves the effective display refresh rate for the current hardware.
 * On realme Note 50 (hardware 90Hz LCD panel), enforces 90 Hz immediately so
 * the exact 3 FPS options (30 / 60 / 90 FPS) are always selectable even if
 * browser battery-saver caps rAF momentarily.
 */
export function resolveEffectiveRefreshRate(
  measuredHz: DisplayRefreshRate,
  hardwareHint: {
    isRealmeNote50: boolean;
    nativeDisplayHz?: number | null;
  },
): DisplayRefreshRate {
  const nativeTier =
    hardwareHint.nativeDisplayHz && hardwareHint.nativeDisplayHz > 0
      ? bucketRefreshRate(hardwareHint.nativeDisplayHz)
      : 60;

  let resolved: DisplayRefreshRate =
    nativeTier > measuredHz ? nativeTier : measuredHz;

  if (hardwareHint.isRealmeNote50 && resolved < 90) {
    resolved = 90;
  }
  return resolved;
}

/**
 * Measures the actual hardware vsync refresh rate using median requestAnimationFrame intervals.
 * Resolves with { hz, rawHz } and falls back cleanly to 60 Hz if interrupted or hidden.
 */
export function probeDisplayRefreshRate(): Promise<{
  hz: DisplayRefreshRate;
  rawHz: number;
}> {
  if (
    typeof window === 'undefined' ||
    typeof requestAnimationFrame !== 'function'
  ) {
    return Promise.resolve({hz: 60, rawHz: 60});
  }

  return new Promise((resolve) => {
    const intervals: number[] = [];
    let frameCount = 0;
    let lastTs = 0;
    let rafId = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);

      if (intervals.length < 5) {
        resolve({hz: 60, rawHz: 60});
        return;
      }

      const sorted = [...intervals].sort((a, b) => a - b);
      // Use lower-middle quantile (35th percentile) to avoid occasional JS timer stalls skewing lower
      const idx = Math.max(0, Math.floor(sorted.length * 0.35));
      const representativeMs = sorted[idx];
      const rawHz =
        representativeMs > 2 ? Math.round(1000 / representativeMs) : 60;
      const hz = bucketRefreshRate(rawHz);
      resolve({hz, rawHz});
    };

    const timeoutId = window.setTimeout(finish, 900);

    const step = (ts: number) => {
      if (settled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        finish();
        return;
      }

      if (lastTs > 0) {
        const dt = ts - lastTs;
        // Ignore abnormal pauses or duplicate timestamps
        if (frameCount >= WARMUP_FRAMES && dt >= 4 && dt <= 50) {
          intervals.push(dt);
        }
      }
      lastTs = ts;
      frameCount += 1;

      if (intervals.length >= REFRESH_PROBE_SAMPLES) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  });
}
