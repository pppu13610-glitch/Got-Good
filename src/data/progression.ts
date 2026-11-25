import {TEAS} from '../data/teas';
import {TeaType} from '../types/tea';

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
}

export const LEVEL_TABLE: LevelInfo[] = [
  {level: 1, title: 'ผู้เริ่มต้นชงชา', minXp: 0},
  {level: 2, title: 'คนรักกลิ่นใบชา', minXp: 60},
  {level: 3, title: 'ช่างชงประจำบ้าน', minXp: 150},
  {level: 4, title: 'ผู้รู้ใจใบชา', minXp: 280},
  {level: 5, title: 'ปรมาจารย์บ้านชา', minXp: 450},
  {level: 6, title: 'เจ้าสำนักชาอุ่นใจ', minXp: 700},
];

export function getLevelFromXp(xp: number): number {
  let current = 1;
  for (const row of LEVEL_TABLE) {
    if (xp >= row.minXp) {
      current = row.level;
    }
  }
  return current;
}

export function getLevelInfo(level: number): LevelInfo {
  return (
    LEVEL_TABLE.find((l) => l.level === level) ??
    LEVEL_TABLE[LEVEL_TABLE.length - 1]
  );
}

export function getXpProgress(xp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressRatio: number;
} {
  const level = getLevelFromXp(xp);
  const current = getLevelInfo(level);
  const next = LEVEL_TABLE.find((l) => l.level === level + 1) ?? null;

  if (!next) {
    return {
      level,
      title: current.title,
      currentLevelXp: xp - current.minXp,
      nextLevelXp: null,
      progressRatio: 1,
    };
  }

  const span = next.minXp - current.minXp;
  const gained = xp - current.minXp;
  return {
    level,
    title: current.title,
    currentLevelXp: gained,
    nextLevelXp: span,
    progressRatio: Math.max(0, Math.min(1, gained / span)),
  };
}

export function isTeaUnlocked(tea: TeaType, playerLevel: number): boolean {
  return playerLevel >= tea.unlockLevel;
}

export function getUnlockedTeas(playerLevel: number): TeaType[] {
  return TEAS.filter((tea) => isTeaUnlocked(tea, playerLevel));
}

export function getNewlyUnlockedTeas(
  previousLevel: number,
  newLevel: number,
): TeaType[] {
  if (newLevel <= previousLevel) return [];
  return TEAS.filter(
    (tea) => tea.unlockLevel > previousLevel && tea.unlockLevel <= newLevel,
  );
}
