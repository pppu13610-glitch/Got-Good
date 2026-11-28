export type TeaCategory =
  | 'matcha'
  | 'latte'
  | 'green'
  | 'oolong'
  | 'black'
  | 'herbal';

export type WaterTemp = 'warm' | 'hot' | 'boiling';

export type ToppingId =
  | 'honey'
  | 'milk'
  | 'ice'
  | 'lemon'
  | 'osmanthus'
  | 'strawberry'
  | 'brown-sugar'
  | 'cinnamon'
  | 'milk-foam'
  | 'mint';

export type EquipmentId =
  | 'chasen-whisk'
  | 'milk-frother'
  | 'clay-teapot'
  | 'strainer-kettle'
  | 'herbal-infuser'
  | 'cold-drip';

export interface EquipmentInfo {
  id: EquipmentId;
  name: string;
  actionLabel: string;
  finishSteepLabel: string;
  description: string;
}

export type AmbienceMode = 'none' | 'rain' | 'breeze';

export type GameMode = 'guest' | 'free';

export type ScreenView = 'TITLE_MENU' | 'BREWING' | 'JOURNAL' | 'HOW_TO_PLAY';

export type CameraPerspective = 'third-person' | 'first-person';

export type BrewStep =
  | 'EXPLORE_SHOP'
  | 'SELECT_TEA'
  | 'POUR_WATER'
  | 'STEEP_TEA'
  | 'ADD_TOPPING'
  | 'SERVED';

export type CustomerPhase =
  | 'ENTERING'
  | 'SEATED_ORDERING'
  | 'SERVED_ENJOYING';

export interface PlayerMoveInput {
  x: number;
  y: number;
}

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
  equipmentId: EquipmentId;
  baseIngredients: string[];
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

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type TargetFps = 30 | 60 | 90 | 120;
export type ResolutionScale = 'hd' | 'hd-plus' | 'fhd' | 'fhd-plus';
export type MusicTrackId =
  | 'none'
  | 'just-the-two-of-us'
  | 'rainy-teahouse'
  | 'twilight-lantern'
  | 'smoke-in-the-glass';
export type PlayerCharacterId = 'tea-artisan';
export type OptimizationProfile =
  | 'auto'
  | 'realme-note-50'
  | 'galaxy-a10'
  | 'low-ram-2gb'
  | 'standard';

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  musicVolume: number;
  musicTrack: MusicTrackId;
  playerCharacter: PlayerCharacterId;
  isMuted: boolean;
  ambience: AmbienceMode;
  graphicsQuality: GraphicsQuality;
  resolutionScale: ResolutionScale;
  shadowsEnabled: boolean;
  antialiasEnabled: boolean;
  particlesEnabled: boolean;
  targetFps: TargetFps;
  autoFullscreen: boolean;
  optimizationProfile: OptimizationProfile;
}

