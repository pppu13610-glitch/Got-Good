import {getLevelFromXp} from '../data/progression';
import {JournalRecord, TeaHouseSaveData} from '../types/tea';

const STORAGE_KEY = 'baan_cha_save_v2';
const LEGACY_KEY = 'baan_cha_save_v1';

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
