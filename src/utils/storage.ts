import {getLevelFromXp} from '../data/progression';
import {
  GameSettings,
  JournalRecord,
  TeaHouseSaveData,
} from '../types/tea';

const STORAGE_KEY = 'baan_cha_save_v2';
const LEGACY_KEY = 'baan_cha_save_v1';
const SETTINGS_KEY = 'baan_cha_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 85,
  sfxVolume: 90,
  ambienceVolume: 75,
  isMuted: false,
  ambience: 'none',
  graphicsQuality: 'high',
  resolutionScale: 'hd-plus',
  shadowsEnabled: true,
  antialiasEnabled: true,
  particlesEnabled: true,
  targetFps: 60,
  autoFullscreen: true,
  optimizationProfile: 'auto',
};

const DEFAULT_SAVE: TeaHouseSaveData = {
  xp: 0,
  level: 1,
  warmthPoints: 0,
  totalCups: 0,
  teaCounts: {},
  history: [],
};

export function loadSaveData(): TeaHouseSaveData {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<TeaHouseSaveData>;
    const totalCups =
      typeof parsed.totalCups === 'number' ? parsed.totalCups : 0;
    const xp =
      typeof parsed.xp === 'number' ? parsed.xp : totalCups * 30;
    const level = getLevelFromXp(xp);
    return {
      xp,
      level,
      warmthPoints:
        typeof parsed.warmthPoints === 'number' ? parsed.warmthPoints : 0,
      totalCups,
      teaCounts:
        parsed.teaCounts && typeof parsed.teaCounts === 'object'
          ? parsed.teaCounts
          : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

export function saveBrewRecord(
  current: TeaHouseSaveData,
  record: JournalRecord,
  warmthEarned: number,
  xpEarned: number,
): TeaHouseSaveData {
  const nextXp = current.xp + xpEarned;
  const nextLevel = getLevelFromXp(nextXp);
  const next: TeaHouseSaveData = {
    xp: nextXp,
    level: nextLevel,
    warmthPoints: current.warmthPoints + warmthEarned,
    totalCups: current.totalCups + 1,
    teaCounts: {
      ...current.teaCounts,
      [record.teaId]: (current.teaCounts[record.teaId] ?? 0) + 1,
    },
    history: [record, ...current.history].slice(0, 30),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors cleanly
  }

  return next;
}

export function clearSaveData(): TeaHouseSaveData {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_SAVE;
}

function normalizeResolutionScale(raw: unknown): GameSettings['resolutionScale'] {
  switch (raw) {
    case 'hd':
    case '0.75':
      return 'hd';
    case 'hd-plus':
    case '1.0':
      return 'hd-plus';
    case 'fhd':
    case '1.5':
      return 'fhd';
    case 'fhd-plus':
    case 'native':
      return 'fhd-plus';
    default:
      return DEFAULT_SETTINGS.resolutionScale;
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const memGb =
        typeof navigator !== 'undefined' &&
        'deviceMemory' in navigator &&
        typeof (navigator as Navigator & {deviceMemory?: number})
          .deviceMemory === 'number'
          ? (navigator as Navigator & {deviceMemory?: number}).deviceMemory ??
            null
          : null;
      if (memGb !== null && memGb <= 2) {
        return {
          ...DEFAULT_SETTINGS,
          graphicsQuality: 'low',
          resolutionScale: 'hd',
          shadowsEnabled: false,
          antialiasEnabled: false,
          particlesEnabled: false,
          optimizationProfile: 'low-ram-2gb',
        };
      }
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<GameSettings> & {
      resolutionScale?: unknown;
    };
    return {
      masterVolume:
        typeof parsed.masterVolume === 'number'
          ? Math.max(0, Math.min(100, parsed.masterVolume))
          : DEFAULT_SETTINGS.masterVolume,
      sfxVolume:
        typeof parsed.sfxVolume === 'number'
          ? Math.max(0, Math.min(100, parsed.sfxVolume))
          : DEFAULT_SETTINGS.sfxVolume,
      ambienceVolume:
        typeof parsed.ambienceVolume === 'number'
          ? Math.max(0, Math.min(100, parsed.ambienceVolume))
          : DEFAULT_SETTINGS.ambienceVolume,
      isMuted:
        typeof parsed.isMuted === 'boolean'
          ? parsed.isMuted
          : DEFAULT_SETTINGS.isMuted,
      ambience:
        parsed.ambience === 'rain' ||
        parsed.ambience === 'breeze' ||
        parsed.ambience === 'none'
          ? parsed.ambience
          : DEFAULT_SETTINGS.ambience,
      graphicsQuality:
        parsed.graphicsQuality === 'low' ||
        parsed.graphicsQuality === 'medium' ||
        parsed.graphicsQuality === 'high'
          ? parsed.graphicsQuality
          : DEFAULT_SETTINGS.graphicsQuality,
      resolutionScale: normalizeResolutionScale(parsed.resolutionScale),
      shadowsEnabled:
        typeof parsed.shadowsEnabled === 'boolean'
          ? parsed.shadowsEnabled
          : DEFAULT_SETTINGS.shadowsEnabled,
      antialiasEnabled:
        typeof parsed.antialiasEnabled === 'boolean'
          ? parsed.antialiasEnabled
          : DEFAULT_SETTINGS.antialiasEnabled,
      particlesEnabled:
        typeof parsed.particlesEnabled === 'boolean'
          ? parsed.particlesEnabled
          : DEFAULT_SETTINGS.particlesEnabled,
      targetFps:
        parsed.targetFps === 30 ||
        parsed.targetFps === 60 ||
        parsed.targetFps === 90 ||
        parsed.targetFps === 120
          ? parsed.targetFps
          : DEFAULT_SETTINGS.targetFps,
      autoFullscreen:
        typeof parsed.autoFullscreen === 'boolean'
          ? parsed.autoFullscreen
          : DEFAULT_SETTINGS.autoFullscreen,
      optimizationProfile:
        parsed.optimizationProfile === 'auto' ||
        parsed.optimizationProfile === 'realme-note-50' ||
        parsed.optimizationProfile === 'low-ram-2gb' ||
        parsed.optimizationProfile === 'standard'
          ? parsed.optimizationProfile
          : DEFAULT_SETTINGS.optimizationProfile,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

const LAST_VERSION_KEY = 'baan_cha_last_version_v1';

export function loadLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_VERSION_KEY);
  } catch {
    return null;
  }
}

export function saveLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(LAST_VERSION_KEY, version);
  } catch {
    // Ignore storage errors
  }
}

