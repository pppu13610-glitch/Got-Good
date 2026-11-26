import React, {useEffect} from 'react';
import {motion} from 'motion/react';
import {
  ArrowLeft,
  CloudRain,
  Cpu,
  Gamepad2,
  Gauge,
  Maximize2,
  Minimize2,
  Monitor,
  Music,
  RotateCcw,
  Smartphone,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import {
  AmbienceMode,
  GameSettings,
  GraphicsQuality,
  OptimizationProfile,
  PlayerCharacterId,
  ResolutionScale,
  TargetFps,
} from '../types/tea';
import {
  getGalaxyA10Preset,
  getLowRam2GbPreset,
  getRealmeNote50Preset,
  probeDeviceOptimization,
} from '../utils/deviceOptimizer';
import {
  DisplayRefreshRate,
  getAllowedFpsOptions,
} from '../utils/refreshRate';
import {CHILL_MUSIC_TRACKS, soundEngine} from '../utils/soundEngine';

interface SettingsScreenProps {
  settings: GameSettings;
  isFullscreen: boolean;
  detectedRefreshRate: DisplayRefreshRate;
  rawRefreshRate?: number;
  onRecheckRefreshRate?: () => void;
  onToggleFullscreen: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  onClose: () => void;
}

const TAP_SPRING = {type: 'spring' as const, stiffness: 430, damping: 26};
const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

const FPS_OPTIONS: {value: TargetFps; label: string; hint: string}[] = [
  {value: 30, label: '30 FPS', hint: 'ประหยัดแบต'},
  {value: 60, label: '60 FPS', hint: 'มาตรฐาน'},
  {value: 90, label: '90 FPS', hint: 'ลื่นไหล'},
  {value: 120, label: '120 FPS', hint: 'สูงสุด'},
];

const QUALITY_OPTIONS: {value: GraphicsQuality; label: string}[] = [
  {value: 'low', label: 'ประหยัด'},
  {value: 'medium', label: 'สมดุล'},
  {value: 'high', label: 'คมชัดสูง'},
];

const RESOLUTION_OPTIONS: {
  value: ResolutionScale;
  label: string;
  hint: string;
}[] = [
  {value: 'hd', label: 'HD', hint: '720p'},
  {value: 'hd-plus', label: 'HD+', hint: '900p'},
  {value: 'fhd', label: 'Full HD', hint: '1080p'},
  {value: 'fhd-plus', label: 'Full HD+', hint: '1080p+'},
];

const AMBIENCE_OPTIONS: {id: AmbienceMode; label: string}[] = [
  {id: 'none', label: 'เงียบสงบ'},
  {id: 'rain', label: 'ฝนตก'},
  {id: 'breeze', label: 'ลมสวนไผ่'},
];

const CHARACTER_MODELS: {
  id: PlayerCharacterId;
  name: string;
  creator: string;
  accentColor: string;
}[] = [
  {
    id: 'tea-master',
    name: 'เจ้าบ้านชา (ต้นตำรับ)',
    creator: 'โมเดลประจำเรือนชา',
    accentColor: '#2E6F40',
  },
  {
    id: 'spirit-blossom-kindred',
    name: 'Spirit Blossom Kindred',
    creator: 'Retronous (@Retronous) [85187f9]',
    accentColor: '#8B82CB',
  },
  {
    id: 'diego-body',
    name: 'Body (Trench/Suit)',
    creator: 'Diego_P3D_XD (@Diego_P3D_XD) [74b47ca]',
    accentColor: '#8D212C',
  },
  {
    id: 'cicada-suit-v2',
    name: 'Ultimate CICADA Suit V2',
    creator: 'rendysix (@rendysix) [21122d8]',
    accentColor: '#242B35',
  },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  isFullscreen,
  detectedRefreshRate,
  rawRefreshRate,
  onRecheckRefreshRate,
  onToggleFullscreen,
  onUpdateSettings,
  onResetSettings,
  onClose,
}) => {
  const deviceReport = probeDeviceOptimization(settings.optimizationProfile);
  const visibleOptimizationOptions: {
    value: OptimizationProfile;
    label: string;
  }[] = [{value: 'auto', label: 'อัตโนมัติ'}];
  if (deviceReport.showRealmeNote50Option) {
    visibleOptimizationOptions.push({
      value: 'realme-note-50',
      label: 'realme Note 50',
    });
  }
  if (deviceReport.showGalaxyA10Option) {
    visibleOptimizationOptions.push({
      value: 'galaxy-a10',
      label: 'Galaxy A10',
    });
  }
  if (deviceReport.showLowRam2GbOption) {
    visibleOptimizationOptions.push({
      value: 'low-ram-2gb',
      label: 'RAM 2 GB',
    });
  }
  visibleOptimizationOptions.push({value: 'standard', label: 'มาตรฐาน'});

  const optGridColsClass =
    visibleOptimizationOptions.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';

  const allowedFpsValues = getAllowedFpsOptions(detectedRefreshRate);
  const visibleFpsOptions = FPS_OPTIONS.filter((opt) =>
    allowedFpsValues.includes(opt.value),
  );
  const fpsGridColsClass =
    visibleFpsOptions.length <= 2
      ? 'grid-cols-2'
      : visibleFpsOptions.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-4';
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundEngine.playTap();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const applyQualityPreset = (quality: GraphicsQuality) => {
    soundEngine.playTap();
    if (quality === 'low') {
      onUpdateSettings({
        graphicsQuality: 'low',
        resolutionScale: 'hd',
        shadowsEnabled: false,
        antialiasEnabled: false,
        particlesEnabled: false,
      });
    } else if (quality === 'medium') {
      onUpdateSettings({
        graphicsQuality: 'medium',
        resolutionScale: 'hd-plus',
        shadowsEnabled: true,
        antialiasEnabled: false,
        particlesEnabled: true,
      });
    } else {
      onUpdateSettings({
        graphicsQuality: 'high',
        resolutionScale: 'fhd-plus',
        shadowsEnabled: true,
        antialiasEnabled: true,
        particlesEnabled: true,
      });
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-screen-title"
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 10}}
      transition={{duration: 0.2, ease: PANEL_EASE}}
      style={{contain: 'layout style paint'}}
      className="fixed inset-0 z-50 flex flex-col bg-[#F5F2EB] text-[#1F2823] will-change-transform"
    >
      {/* Full-Screen Sticky Header with Back Button on Top-Left */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F2823]/10 bg-[#FAF8F3] safe-px py-2.5 sm:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            type="button"
            whileTap={{scale: 0.92}}
            transition={TAP_SPRING}
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            aria-label="ย้อนกลับ"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#1F2823]/15 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#1F2823] shadow-2xs hover:bg-[#EFECE4] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>ย้อนกลับ</span>
          </motion.button>

          <div className="min-w-0">
            <h1
              id="settings-screen-title"
              className="font-display text-base sm:text-xl font-bold text-[#1F2823] truncate"
            >
              การตั้งค่าเกม
            </h1>
            <p className="hidden sm:block text-xs text-[#5A655D] truncate">
              ปรับแต่งเสียง ระบบภาพ 3 มิติ และค่า FPS สูงสุดตามหน้าจอเครื่อง ({detectedRefreshRate} Hz)
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{scale: 0.93}}
          transition={TAP_SPRING}
          onClick={() => {
            soundEngine.playTap();
            onResetSettings();
          }}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-white px-3 sm:px-3.5 text-xs font-medium text-[#4A534D] hover:bg-[#EFECE4] hover:text-[#1F2823] whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
          <span className="sm:hidden">รีเซ็ต</span>
        </motion.button>
      </header>

      {/* Scrollable Full-Screen Settings Content */}
      <div className="flex-1 overflow-y-auto safe-px py-4 sm:py-6 safe-pb">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
          {/* SECTION 1: SOUND & AMBIENCE */}
          <section className="flex flex-col gap-4 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-[#1F2823]/8 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-[#2E6F40]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-[#1F2823]">
                    ตั้งค่าเสียงและบรรยากาศ
                  </h2>
                  <p className="text-xs text-[#5A655D]">
                    ควบคุมระดับเสียงเอฟเฟกต์และเสียงธรรมชาติในสวนไผ่
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{scale: 0.93}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.unlock();
                  onUpdateSettings({isMuted: !settings.isMuted});
                }}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                  settings.isMuted
                    ? 'border border-[#1F2823]/15 bg-[#F3F1EC] text-[#5A655D]'
                    : 'bg-[#2E6F40] text-white'
                }`}
              >
                {settings.isMuted ? (
                  <>
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                    <span>ปิดเสียงอยู่</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    <span>เปิดเสียง</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Master Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="slider-master-vol" className="font-medium text-[#1F2823]">
                  ระดับเสียงหลัก
                </label>
                <span className="font-mono-num font-semibold text-[#2E6F40]">
                  {settings.isMuted ? 'ปิดเสียง' : `${settings.masterVolume}%`}
                </span>
              </div>
              <input
                id="slider-master-vol"
                type="range"
                min={0}
                max={100}
                value={settings.masterVolume}
                disabled={settings.isMuted}
                onChange={(e) => {
                  soundEngine.unlock();
                  onUpdateSettings({masterVolume: Number(e.target.value)});
                }}
                className="h-3 w-full cursor-pointer accent-[#2E6F40] disabled:opacity-40"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="slider-sfx-vol" className="font-medium text-[#1F2823]">
                  เสียงชงชา กาต้มน้ำ และปุ่มกด
                </label>
                <span className="font-mono-num font-semibold text-[#2E6F40]">
                  {settings.sfxVolume}%
                </span>
              </div>
              <input
                id="slider-sfx-vol"
                type="range"
                min={0}
                max={100}
                value={settings.sfxVolume}
                disabled={settings.isMuted}
                onChange={(e) => {
                  soundEngine.unlock();
                  onUpdateSettings({sfxVolume: Number(e.target.value)});
                }}
                className="h-3 w-full cursor-pointer accent-[#2E6F40] disabled:opacity-40"
              />
            </div>

            {/* Ambience Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="slider-amb-vol" className="font-medium text-[#1F2823]">
                  ระดับเสียงบรรยากาศ
                </label>
                <span className="font-mono-num font-semibold text-[#2E6F40]">
                  {settings.ambienceVolume}%
                </span>
              </div>
              <input
                id="slider-amb-vol"
                type="range"
                min={0}
                max={100}
                value={settings.ambienceVolume}
                disabled={settings.isMuted}
                onChange={(e) => {
                  soundEngine.unlock();
                  onUpdateSettings({ambienceVolume: Number(e.target.value)});
                }}
                className="h-3 w-full cursor-pointer accent-[#2E6F40] disabled:opacity-40"
              />
            </div>

            {/* Music Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="slider-music-vol" className="font-medium text-[#1F2823]">
                  ระดับเสียงเพลงประกอบ (ชิวๆ)
                </label>
                <span className="font-mono-num font-semibold text-[#2E6F40]">
                  {settings.musicTrack === 'none' ? 'ปิดเพลง' : `${settings.musicVolume}%`}
                </span>
              </div>
              <input
                id="slider-music-vol"
                type="range"
                min={0}
                max={100}
                value={settings.musicVolume}
                disabled={settings.isMuted || settings.musicTrack === 'none'}
                onChange={(e) => {
                  soundEngine.unlock();
                  onUpdateSettings({musicVolume: Number(e.target.value)});
                }}
                className="h-3 w-full cursor-pointer accent-[#2E6F40] disabled:opacity-40"
              />
            </div>

            {/* Chill Music Track Selector (3 Cozy Tracks + Off) */}
            <div className="space-y-2 border-t border-[#1F2823]/8 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#1F2823]">
                  <Music className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                  <span>เลือกเพลงดนตรีสไตล์ชิวๆ (4 เพลง)</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {CHILL_MUSIC_TRACKS.map((track) => {
                  const active = settings.musicTrack === track.id;
                  return (
                    <motion.button
                      key={track.id}
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.unlock();
                        soundEngine.playTap();
                        onUpdateSettings({musicTrack: track.id});
                      }}
                      className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                        active
                          ? 'border-[#2E6F40] bg-[#EDF5EE] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-[#FAF9F6] text-[#4A534D] hover:bg-[#EFECE4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1F2823] truncate">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-[#5A655D] truncate">
                          {track.subtitle}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono-num text-[10px] font-semibold shrink-0 ${
                          active
                            ? 'bg-[#2E6F40] text-white'
                            : 'bg-[#E2DFD7] text-[#5A655D]'
                        }`}
                      >
                        {track.bpmLabel}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Ambience Mode */}
            <div className="space-y-2 border-t border-[#1F2823]/8 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-medium text-[#1F2823]">
                  เสียงบรรยากาศพื้นหลัง
                </span>
                <motion.button
                  type="button"
                  whileTap={{scale: 0.94}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playSweetSpotChime();
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#2E6F40]/30 bg-[#EFF6EE] px-3 text-xs font-semibold text-[#255F30]"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ทดสอบเสียง</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
                {AMBIENCE_OPTIONS.map((opt) => {
                  const active = settings.ambience === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      whileTap={{scale: 0.94}}
                      onClick={() => {
                        soundEngine.unlock();
                        soundEngine.playTap();
                        onUpdateSettings({ambience: opt.id});
                      }}
                      className="relative inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-ambience-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-[#2E6F40]"
                        />
                      )}
                      <span
                        className={`relative z-10 inline-flex items-center gap-1.5 ${
                          active ? 'text-white' : 'text-[#4A534D]'
                        }`}
                      >
                        {opt.id === 'rain' && (
                          <CloudRain className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        {opt.id === 'breeze' && (
                          <Wind className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>{opt.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 2: GRAPHICS & DISPLAY-SYNCED FPS */}
          <section className="flex flex-col gap-4 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#1F2823]/8 pb-3">
              <Monitor className="h-5 w-5 text-[#2E6F40]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#1F2823]">
                  กราฟิกและความลื่นไหล (FPS)
                </h2>
                <p className="text-xs text-[#5A655D]">
                  หน้าจอของคุณรองรับ {detectedRefreshRate} Hz · ปรับได้สูงสุด {detectedRefreshRate} FPS
                </p>
              </div>
            </div>

            {/* Refresh Rate / Frame Rate Target matched to device display Hz */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F2823]">
                  <Gauge className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                  <span>ค่ารีเฟรชเรท (หน้าจอ {detectedRefreshRate} Hz)</span>
                </span>
                <div className="flex items-center gap-2">
                  {onRecheckRefreshRate && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTap();
                        onRecheckRefreshRate();
                      }}
                      className="text-[11px] font-medium text-[#5A655D] underline underline-offset-2 hover:text-[#1F2823]"
                    >
                      วัด Hz ใหม่{rawRefreshRate ? ` (${rawRefreshRate}Hz)` : ''}
                    </button>
                  )}
                  <span className="font-mono-num text-xs font-bold text-[#2E6F40]">
                    {settings.targetFps} FPS
                  </span>
                </div>
              </div>

              <div className={`grid ${fpsGridColsClass} gap-1.5 rounded-xl bg-[#EFECE4] p-1`}>
                {visibleFpsOptions.map((fps) => {
                  const active = settings.targetFps === fps.value;
                  return (
                    <motion.button
                      key={fps.value}
                      type="button"
                      whileTap={{scale: 0.94}}
                      onClick={() => {
                        soundEngine.playTap();
                        onUpdateSettings({targetFps: fps.value});
                      }}
                      className="relative flex min-h-[48px] flex-col items-center justify-center rounded-lg px-1.5 py-1"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-fps-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-[#233029]"
                        />
                      )}
                      <span
                        className={`relative z-10 font-mono-num text-xs sm:text-sm font-bold ${
                          active ? 'text-white' : 'text-[#1F2823]'
                        }`}
                      >
                        {fps.label}
                      </span>
                      <span
                        className={`relative z-10 text-[10px] ${
                          active ? 'text-[#C8DFC2]' : 'text-[#5A655D]'
                        }`}
                      >
                        {fps.hint}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#5A655D]">
                {deviceReport.isGalaxyA10
                  ? 'ตรวจพบ Samsung Galaxy A10 (จอ 60 Hz) · ล็อคตัวเลือกเฉพาะ 30 / 60 FPS เพื่อความลื่นไหลสูงสุด'
                  : detectedRefreshRate >= 120
                    ? 'ตรวจพบจอ 120 Hz · สามารถปรับได้ครบ 30 / 60 / 90 / 120 FPS'
                    : detectedRefreshRate >= 90
                      ? 'ตรวจพบจอ 90 Hz · ปรับได้สูงสุด 90 FPS (30 / 60 / 90 FPS)'
                      : 'ตรวจพบจอ 60 Hz · ปรับได้สูงสุด 60 FPS (30 / 60 FPS)'}
              </p>
            </div>

            {/* Graphics Quality Preset */}
            <div className="space-y-1.5">
              <span className="block text-xs sm:text-sm font-medium text-[#1F2823]">
                ระดับคุณภาพกราฟิก 3 มิติ
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
                {QUALITY_OPTIONS.map((q) => {
                  const active = settings.graphicsQuality === q.value;
                  return (
                    <motion.button
                      key={q.value}
                      type="button"
                      whileTap={{scale: 0.94}}
                      onClick={() => applyQualityPreset(q.value)}
                      className="relative min-h-[44px] rounded-lg px-2 text-xs sm:text-sm font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-quality-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-[#2E6F40]"
                        />
                      )}
                      <span
                        className={`relative z-10 ${
                          active ? 'text-white' : 'text-[#4A534D]'
                        }`}
                      >
                        {q.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Render Resolution Preset (HD / HD+ / Full HD / Full HD+) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-xs sm:text-sm font-medium text-[#1F2823]">
                  ความละเอียดหน้าจอ 3 มิติ
                </span>
                <span className="text-[11px] font-semibold text-[#2E6F40]">
                  {RESOLUTION_OPTIONS.find((r) => r.value === settings.resolutionScale)
                    ?.label ?? 'HD+'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
                {RESOLUTION_OPTIONS.map((res) => {
                  const active = settings.resolutionScale === res.value;
                  return (
                    <motion.button
                      key={res.value}
                      type="button"
                      whileTap={{scale: 0.94}}
                      onClick={() => {
                        soundEngine.playTap();
                        onUpdateSettings({resolutionScale: res.value});
                      }}
                      className="relative flex min-h-[46px] flex-col items-center justify-center rounded-lg px-1.5 py-1 text-xs font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-res-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-white shadow-xs"
                        />
                      )}
                      <span
                        className={`relative z-10 leading-tight ${
                          active ? 'text-[#1F2823] font-bold' : 'text-[#4A534D]'
                        }`}
                      >
                        {res.label}
                      </span>
                      <span
                        className={`relative z-10 font-mono-num text-[10px] leading-tight ${
                          active ? 'text-[#2E6F40] font-semibold' : 'text-[#6A736D]'
                        }`}
                      >
                        {res.hint}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Individual Visual Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#1F2823]/8 pt-3">
              {(
                [
                  {
                    key: 'shadowsEnabled',
                    label: 'เงา 3 มิติ',
                    value: settings.shadowsEnabled,
                  },
                  {
                    key: 'antialiasEnabled',
                    label: 'ลดรอยหยักขอบ',
                    value: settings.antialiasEnabled,
                  },
                  {
                    key: 'particlesEnabled',
                    label: 'ไอน้ำและละอองแสง',
                    value: settings.particlesEnabled,
                  },
                ] as const
              ).map((toggle) => (
                <motion.button
                  key={toggle.key}
                  type="button"
                  whileTap={{scale: 0.94}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.playTap();
                    onUpdateSettings({[toggle.key]: !toggle.value});
                  }}
                  className={`flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium ${
                    toggle.value
                      ? 'border-[#2E6F40] bg-[#EDF5EE] text-[#1F2823]'
                      : 'border-[#1F2823]/12 bg-[#FAF9F6] text-[#5A655D]'
                  }`}
                >
                  <span className="truncate">{toggle.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                      toggle.value
                        ? 'bg-[#2E6F40] text-white'
                        : 'bg-[#E2DFD7] text-[#5A655D]'
                    }`}
                  >
                    {toggle.value ? 'เปิด' : 'ปิด'}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Hardware + OS Detection & Strict Device-Exclusive Optimizer */}
            <div className="space-y-2.5 border-t border-[#1F2823]/8 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F2823]">
                  <Smartphone className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                  <span>ปรับจูนตามฮาร์ดแวร์และซอฟต์แวร์เครื่อง</span>
                </span>
                <span className="text-[11px] font-medium text-[#2E6F40]">
                  {deviceReport.detectedModelLabel}
                </span>
              </div>

              {/* Detected Hardware + OS Software Summary Card */}
              <div className="rounded-xl border border-[#1F2823]/10 bg-[#FAF9F6] px-3 py-2 text-[11px] text-[#39423C] space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-semibold text-[#1F2823]">
                    ฮาร์ดแวร์: {deviceReport.hardwareSpecSummary}
                  </span>
                  <span className="font-mono-num font-semibold text-[#2E6F40]">
                    {deviceReport.osVersionLabel}
                  </span>
                </div>
                {deviceReport.gameBoosterReady && (
                  <div className="flex items-center gap-1.5 text-[#255F30]">
                    <Gamepad2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      รองรับ Game Booster / Game Space อัตโนมัติบนแอปเกมมือถือทุกรุ่น
                    </span>
                  </div>
                )}
              </div>

              <div className={`grid ${optGridColsClass} gap-1.5 rounded-xl bg-[#EFECE4] p-1`}>
                {visibleOptimizationOptions.map((opt) => {
                  const active =
                    deviceReport.effectiveProfile === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{scale: 0.94}}
                      onClick={() => {
                        soundEngine.playTap();
                        onUpdateSettings({optimizationProfile: opt.value});
                      }}
                      className="relative min-h-[42px] rounded-lg px-2 text-xs font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-opt-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-[#233029]"
                        />
                      )}
                      <span
                        className={`relative z-10 ${
                          active ? 'text-white font-semibold' : 'text-[#5A655D]'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Strict Device-Exclusive Quick Optimization Presets */}
              {deviceReport.showRealmeNote50Option && (
                <motion.button
                  type="button"
                  whileTap={{scale: 0.95}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.playTap();
                    onUpdateSettings(getRealmeNote50Preset(detectedRefreshRate));
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-[#2E6F40]/30 bg-[#EDF5EE] px-3.5 text-xs font-semibold text-[#1F2823] hover:bg-[#E1EEE3]"
                >
                  <span className="inline-flex items-center gap-2 text-left">
                    <Zap className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                    <span>
                      บูสต์ความแรง realme Note 50 (Unisoc T612 · Mali-G57 · 90 FPS นิ่งขึ้น)
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[#2E6F40] shrink-0">
                    บูสต์ทันที
                  </span>
                </motion.button>
              )}

              {deviceReport.showGalaxyA10Option && (
                <motion.button
                  type="button"
                  whileTap={{scale: 0.95}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.playTap();
                    onUpdateSettings(getGalaxyA10Preset());
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-[#2B4E72]/30 bg-[#EDF3FA] px-3.5 text-xs font-semibold text-[#1F2823] hover:bg-[#E0EAF5]"
                >
                  <span className="inline-flex items-center gap-2 text-left">
                    <Zap className="h-4 w-4 text-[#2B4E72] shrink-0" aria-hidden="true" />
                    <span>
                      บูสต์ความลื่น Samsung Galaxy A10 (Exynos 7884 · ล็อค 60 Hz / 60 FPS)
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[#2B4E72] shrink-0">
                    บูสต์ทันที
                  </span>
                </motion.button>
              )}

              {deviceReport.showLowRam2GbOption && (
                <motion.button
                  type="button"
                  whileTap={{scale: 0.95}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.playTap();
                    onUpdateSettings(getLowRam2GbPreset(detectedRefreshRate));
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-[#7D5A3C]/30 bg-[#FAF4EC] px-3.5 text-xs font-semibold text-[#1F2823] hover:bg-[#F3E9DB]"
                >
                  <span className="inline-flex items-center gap-2 text-left">
                    <Cpu className="h-4 w-4 text-[#7D5A3C] shrink-0" aria-hidden="true" />
                    <span>
                      โหมดประหยัดแรมพิเศษสำหรับเครื่อง RAM ≤ 2 GB (ความละเอียด HD)
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[#7D5A3C] shrink-0">
                    ปรับทันที
                  </span>
                </motion.button>
              )}

              <p className="text-[11px] text-[#5A655D] leading-relaxed">
                ระบบจะตรวจสเปกเครื่องและเวอร์ชั่นซอฟต์แวร์อัตโนมัติ ตัวเลือกจูนเฉพาะรุ่นจะแสดงเฉพาะเครื่องที่ตรงรุ่นเท่านั้น เพื่อความเสถียรและไม่เกิดบั๊กเทกซ์เจอร์หาย
              </p>
            </div>

            {/* Full Screen Mode Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[#1F2823]/8 pt-3">
              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.playTap();
                  onToggleFullscreen();
                }}
                className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3.5 text-xs sm:text-sm font-semibold ${
                  isFullscreen
                    ? 'border-[#2E6F40] bg-[#2E6F40] text-white'
                    : 'border-[#1F2823]/15 bg-[#FAF9F6] text-[#1F2823] hover:bg-[#EFECE4]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="h-4 w-4 shrink-0 text-[#2E6F40]" aria-hidden="true" />
                  )}
                  <span>{isFullscreen ? 'กำลังแสดงเต็มหน้าจอ' : 'ขยายเต็มหน้าจอ (Full Screen)'}</span>
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isFullscreen ? 'bg-white/20 text-white' : 'bg-[#2E6F40] text-white'
                  }`}
                >
                  {isFullscreen ? 'ออก' : 'เปิด'}
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.playTap();
                  onUpdateSettings({autoFullscreen: !settings.autoFullscreen});
                }}
                className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium ${
                  settings.autoFullscreen
                    ? 'border-[#2E6F40] bg-[#EDF5EE] text-[#1F2823]'
                    : 'border-[#1F2823]/12 bg-[#FAF9F6] text-[#5A655D]'
                }`}
              >
                <span className="truncate">เข้าเต็มจออัตโนมัติเมื่อเริ่มเกม</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold shrink-0 ${
                    settings.autoFullscreen
                      ? 'bg-[#2E6F40] text-white'
                      : 'bg-[#E2DFD7] text-[#5A655D]'
                  }`}
                >
                  {settings.autoFullscreen ? 'เปิด' : 'ปิด'}
                </span>
              </motion.button>
            </div>
          </section>

          {/* SECTION 3: 3D PLAYER CHARACTER MODEL SELECTOR */}
          <section className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2823]/8 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#2E6F40]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-[#1F2823]">
                    ตัวละครผู้เล่น 3 มิติ (เลือกโมเดล 3D)
                  </h2>
                  <p className="text-xs text-[#5A655D]">
                    เปลี่ยนโมเดลตัวละคร 3 มิติที่ใช้เดินสำรวจในร้านน้ำชาได้ทันที
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-[#EDF5EE] px-2.5 py-1 text-xs font-semibold text-[#2E6F40]">
                {CHARACTER_MODELS.find((m) => m.id === settings.playerCharacter)?.name ??
                  'เจ้าบ้านชา'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {CHARACTER_MODELS.map((charModel) => {
                const active = settings.playerCharacter === charModel.id;
                return (
                  <motion.button
                    key={charModel.id}
                    type="button"
                    whileTap={{scale: 0.96}}
                    transition={TAP_SPRING}
                    onClick={() => {
                      soundEngine.playTap();
                      onUpdateSettings({playerCharacter: charModel.id});
                    }}
                    className={`flex min-h-[60px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-[#2E6F40] bg-[#EDF5EE] text-[#1F2823] shadow-2xs'
                        : 'border-[#1F2823]/12 bg-[#FAF9F6] text-[#4A534D] hover:bg-[#EFECE4]'
                    }`}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg border border-black/10 flex items-center justify-center text-xs font-bold text-white"
                      style={{backgroundColor: charModel.accentColor}}
                      aria-hidden="true"
                    >
                      3D
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-[#1F2823] truncate">
                        {charModel.name}
                      </p>
                      <p className="text-[10px] text-[#5A655D] truncate">
                        {charModel.creator}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
