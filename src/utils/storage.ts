import {getLevelFromXp} from '../data/progression';
import {
  GameSettings,
  JournalRecord,
  TeaHouseSaveData,
} from '../types/tea';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  DEFAULT_SAVE,
  DEFAULT_SETTINGS,
  migrateSaveDataPayload,
  migrateSettingsPayload,
} from './versionMigration';

const STORAGE_KEY = 'baan_cha_save_v2';
const LEGACY_KEY = 'baan_cha_save_v1';
const SETTINGS_KEY = 'baan_cha_settings_v1';
const SCHEMA_VERSION_KEY = 'baan_cha_schema_version_v1';
const LAST_VERSION_KEY = 'baan_cha_last_version_v1';

export {DEFAULT_SETTINGS};

export function loadSaveData(): TeaHouseSaveData {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateSaveDataPayload(parsed);

    // Upgrade legacy v1 saves seamlessly to v2 storage key
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_DATA_SCHEMA_VERSION));
    return migrated;
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
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_DATA_SCHEMA_VERSION));
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
          optimizationProfile: 'auto',
        };
      }
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateSettingsPayload(parsed);
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_DATA_SCHEMA_VERSION));
    return migrated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_DATA_SCHEMA_VERSION));
  } catch {
    // Ignore storage errors
  }
}

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
