export type TeaCategory = 'green' | 'matcha' | 'oolong' | 'black' | 'herbal';

export type WaterTemp = 'warm' | 'hot' | 'boiling';

export type ToppingId = 'honey' | 'milk' | 'ice' | 'lemon' | 'osmanthus';

export type AmbienceMode = 'none' | 'rain' | 'breeze';

export type GameMode = 'guest' | 'free';

export type ScreenView = 'TITLE_MENU' | 'BREWING' | 'JOURNAL' | 'HOW_TO_PLAY';

export type CameraPreset = 'table' | 'cup' | 'overhead';

export type BrewStep =
  | 'SELECT_TEA'
  | 'POUR_WATER'
  | 'STEEP_TEA'
  | 'ADD_TOPPING'
  | 'SERVED';

export interface TeaFlavorProfile {
  aroma: number; // 1..5
  sweetness: number; // 1..5
  body: number; // 1..5
}

export interface TeaType {
  id: string;
  name: string;
  englishName: string;
  category: TeaCategory;
  categoryLabel: string;
  unlockLevel: number;
  origin: string;
  harvestSeason: string;
  caffeineLevel: 'ไม่มี' | 'อ่อน' | 'ปานกลาง' | 'เข้ม';
  idealTemp: WaterTemp;
  idealTempLabel: string;
  idealSteepMin: number; // seconds
  idealSteepMax: number; // seconds
  lightColor: string;
  richColor: string;
  deepColor: string;
  milkColor?: string;
  lemonColor?: string;
  aromaNote: string;
  description: string;
  flavorProfile: TeaFlavorProfile;
  recommendedToppings: ToppingId[];
  leafShape: 'powder' | 'needle' | 'rolled' | 'broken' | 'blossom';
  vesselStyle: 'chawan' | 'ceramic' | 'glass';
}

export interface ToppingOption {
  id: ToppingId;
  name: string;
  shortNote: string;
  swatch: string;
}

export interface GuestCharacter {
  id: string;
  name: string;
  role: string;
  portraitUrl: string;
  fallbackInitial: string;
  accentBg: string;
}

export interface GuestOrder {
  id: string;
  guest: GuestCharacter;
  requestText: string;
  preferredCategories?: TeaCategory[];
  preferredTeaIds?: string[];
  preferredTemp?: 'hot' | 'iced';
  preferredToppings?: ToppingId[];
  happyReply: string;
  gentleReply: string;
}

export interface BrewResult {
  tea: TeaType;
  waterTemp: WaterTemp;
  steepSeconds: number;
  strengthLabel: 'อ่อนละมุน' | 'กลมกล่อมลงตัว' | 'เข้มข้นถึงใจ';
  toppings: ToppingId[];
  harmonyScore: number;
  harmonyTitle: string;
  harmonyMessage: string;
  guestMatched?: boolean;
  guestReply?: string;
  guestName?: string;
  warmthEarned: number;
  xpEarned: number;
  leveledUpTo?: number;
  newlyUnlockedTeas: TeaType[];
  brewedAt: string;
}

export interface JournalRecord {
  id: string;
  teaId: string;
  teaName: string;
  waterTemp: WaterTemp;
  steepSeconds: number;
  strengthLabel: string;
  toppings: ToppingId[];
  harmonyTitle: string;
  guestName?: string;
  xpEarned: number;
  brewedAt: string;
}

export interface TeaHouseSaveData {
  xp: number;
  level: number;
  warmthPoints: number;
  totalCups: number;
  teaCounts: Record<string, number>;
  history: JournalRecord[];
}
