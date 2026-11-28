import {getLevelFromXp} from '../data/progression';
import {
  GameSettings,
  JournalRecord,
  OptimizationProfile,
  PlayerCharacterId,
  ResolutionScale,
  TeaHouseSaveData,
} from '../types/tea';

export const CURRENT_DATA_SCHEMA_VERSION = 3;

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 85,
  sfxVolume: 90,
  ambienceVolume: 75,
  musicVolume: 70,
  musicTrack: 'just-the-two-of-us',
  playerCharacter: 'tea-artisan',
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

export const DEFAULT_SAVE: TeaHouseSaveData = {
  xp: 0,
  level: 1,
  warmthPoints: 0,
  totalCups: 0,
  teaCounts: {},
  history: [],
};

export function normalizeResolutionScale(raw: unknown): ResolutionScale {
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

export function normalizeOptimizationProfile(raw: unknown): OptimizationProfile {
  switch (raw) {
    case 'auto':
    case 'realme-note-50':
    case 'galaxy-a10':
    case 'low-ram-2gb':
    case 'standard':
      return raw;
    // Legacy aliases compatibility
    case 'mali-g57':
    case 'unisoc-t612':
      return 'realme-note-50';
    case 'mali-g71':
    case 'exynos-7884':
      return 'galaxy-a10';
    case '2gb':
    case 'low-ram':
      return 'low-ram-2gb';
    default:
      return DEFAULT_SETTINGS.optimizationProfile;
  }
}

export function normalizePlayerCharacter(_raw: unknown): PlayerCharacterId {
  return 'tea-artisan';
}

function sanitizeJournalRecord(raw: unknown): JournalRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<JournalRecord>;
  if (typeof r.teaId !== 'string' || typeof r.teaName !== 'string') {
    return null;
  }
  const waterTemp =
    r.waterTemp === 'warm' || r.waterTemp === 'hot' || r.waterTemp === 'boiling'
      ? r.waterTemp
      : 'hot';
  return {
    id:
      typeof r.id === 'string' && r.id.length > 0
        ? r.id
        : `cup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    teaId: r.teaId,
    teaName: r.teaName,
    waterTemp,
    steepSeconds:
      typeof r.steepSeconds === 'number' && Number.isFinite(r.steepSeconds)
        ? Math.max(0, Math.min(60, r.steepSeconds))
        : 4,
    strengthLabel:
      typeof r.strengthLabel === 'string' && r.strengthLabel.length > 0
        ? r.strengthLabel
        : 'กลมกล่อมลงตัว',
    toppings: Array.isArray(r.toppings) ? r.toppings.slice(0, 3) : [],
    harmonyTitle:
      typeof r.harmonyTitle === 'string' && r.harmonyTitle.length > 0
        ? r.harmonyTitle
        : 'อบอุ่นเรียบง่าย',
    guestName: typeof r.guestName === 'string' ? r.guestName : undefined,
    xpEarned:
      typeof r.xpEarned === 'number' && Number.isFinite(r.xpEarned)
        ? Math.max(0, Math.round(r.xpEarned))
        : 25,
    brewedAt:
      typeof r.brewedAt === 'string' && r.brewedAt.length > 0
        ? r.brewedAt
        : new Date().toISOString(),
  };
}

export function migrateSaveDataPayload(raw: unknown): TeaHouseSaveData {
  if (!raw || typeof raw !== 'object') return DEFAULT_SAVE;
  const parsed = raw as Partial<TeaHouseSaveData>;
  const totalCups =
    typeof parsed.totalCups === 'number' && Number.isFinite(parsed.totalCups)
      ? Math.max(0, Math.round(parsed.totalCups))
      : 0;
  const xp =
    typeof parsed.xp === 'number' && Number.isFinite(parsed.xp)
      ? Math.max(0, Math.round(parsed.xp))
      : totalCups * 30;
  const level = getLevelFromXp(xp);

  const safeTeaCounts: Record<string, number> = {};
  if (parsed.teaCounts && typeof parsed.teaCounts === 'object') {
    for (const [key, val] of Object.entries(parsed.teaCounts)) {
      if (typeof key === 'string' && typeof val === 'number' && Number.isFinite(val)) {
        safeTeaCounts[key] = Math.max(0, Math.round(val));
      }
    }
  }

  const history: JournalRecord[] = Array.isArray(parsed.history)
    ? parsed.history
        .map(sanitizeJournalRecord)
        .filter((item): item is JournalRecord => item !== null)
        .slice(0, 30)
    : [];

  return {
    xp,
    level,
    warmthPoints:
      typeof parsed.warmthPoints === 'number' && Number.isFinite(parsed.warmthPoints)
        ? Math.max(0, Math.round(parsed.warmthPoints))
        : 0,
    totalCups,
    teaCounts: safeTeaCounts,
    history,
  };
}

export function migrateSettingsPayload(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const parsed = raw as Partial<GameSettings> & {
    resolutionScale?: unknown;
    optimizationProfile?: unknown;
  };

  return {
    masterVolume:
      typeof parsed.masterVolume === 'number' && Number.isFinite(parsed.masterVolume)
        ? Math.max(0, Math.min(100, parsed.masterVolume))
        : DEFAULT_SETTINGS.masterVolume,
    sfxVolume:
      typeof parsed.sfxVolume === 'number' && Number.isFinite(parsed.sfxVolume)
        ? Math.max(0, Math.min(100, parsed.sfxVolume))
        : DEFAULT_SETTINGS.sfxVolume,
    ambienceVolume:
      typeof parsed.ambienceVolume === 'number' && Number.isFinite(parsed.ambienceVolume)
        ? Math.max(0, Math.min(100, parsed.ambienceVolume))
        : DEFAULT_SETTINGS.ambienceVolume,
    musicVolume:
      typeof parsed.musicVolume === 'number' && Number.isFinite(parsed.musicVolume)
        ? Math.max(0, Math.min(100, parsed.musicVolume))
        : DEFAULT_SETTINGS.musicVolume,
    musicTrack:
      parsed.musicTrack === 'none' ||
      parsed.musicTrack === 'just-the-two-of-us' ||
      parsed.musicTrack === 'rainy-teahouse' ||
      parsed.musicTrack === 'twilight-lantern' ||
      parsed.musicTrack === 'smoke-in-the-glass'
        ? parsed.musicTrack
        : DEFAULT_SETTINGS.musicTrack,
    playerCharacter: normalizePlayerCharacter(parsed.playerCharacter),
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
    optimizationProfile: normalizeOptimizationProfile(
      parsed.optimizationProfile,
    ),
  };
}
