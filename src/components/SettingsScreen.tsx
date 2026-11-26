import React, {useEffect} from 'react';
import {motion} from 'motion/react';
import {
  ArrowLeft,
  CloudRain,
  Gauge,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCcw,
  Smartphone,
  Sparkles,
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
  ResolutionScale,
  TargetFps,
} from '../types/tea';
import {
  getRealmeNote50Preset,
  probeDeviceOptimization,
} from '../utils/deviceOptimizer';
import {soundEngine} from '../utils/soundEngine';

interface SettingsScreenProps {
  settings: GameSettings;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  onClose: () => void;
}

const TAP_SPRING = {type: 'spring' as const, stiffness: 430, damping: 26};

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

const RESOLUTION_OPTIONS: {value: ResolutionScale; label: string}[] = [
  {value: '0.75', label: '0.75x'},
  {value: '1.0', label: '1.0x'},
  {value: '1.5', label: '1.5x'},
  {value: 'native', label: 'เต็มจอ'},
];

const AMBIENCE_OPTIONS: {id: AmbienceMode; label: string}[] = [
  {id: 'none', label: 'เงียบสงบ'},
  {id: 'rain', label: 'ฝนตก'},
  {id: 'breeze', label: 'ลมสวนไผ่'},
];

const OPTIMIZATION_OPTIONS: {value: OptimizationProfile; label: string}[] = [
  {value: 'auto', label: 'อัตโนมัติ'},
  {value: 'realme-note-50', label: 'realme Note 50'},
  {value: 'standard', label: 'มาตรฐาน'},
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  isFullscreen,
  onToggleFullscreen,
  onUpdateSettings,
  onResetSettings,
  onClose,
}) => {
  const deviceReport = probeDeviceOptimization(settings.optimizationProfile);
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
        resolutionScale: '0.75',
        shadowsEnabled: false,
        antialiasEnabled: false,
        particlesEnabled: false,
      });
    } else if (quality === 'medium') {
      onUpdateSettings({
        graphicsQuality: 'medium',
        resolutionScale: '1.0',
        shadowsEnabled: true,
        antialiasEnabled: true,
        particlesEnabled: true,
      });
    } else {
      onUpdateSettings({
        graphicsQuality: 'high',
        resolutionScale: 'native',
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
      initial={{opacity: 0, y: 24}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      transition={{type: 'spring', stiffness: 360, damping: 30}}
      className="fixed inset-0 z-50 flex flex-col bg-[#F5F2EB] text-[#1F2823]"
    >
      {/* Full-Screen Sticky Header with Back Button on Top-Left */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F2823]/10 bg-[#FAF8F3]/96 safe-px py-2.5 sm:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            type="button"
            whileHover={{scale: 1.03}}
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
              ปรับแต่งเสียง ระบบภาพ 3 มิติ และความลื่นไหลสูงสุด 120 FPS
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{scale: 1.03}}
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
          <motion.section
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.04, duration: 0.22}}
            className="flex flex-col gap-4 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 shadow-2xs"
          >
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
          </motion.section>

          {/* SECTION 2: GRAPHICS & 120 FPS REFRESH RATE */}
          <motion.section
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.08, duration: 0.22}}
            className="flex flex-col gap-4 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 shadow-2xs"
          >
            <div className="flex items-center gap-2 border-b border-[#1F2823]/8 pb-3">
              <Monitor className="h-5 w-5 text-[#2E6F40]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#1F2823]">
                  กราฟิกและความลื่นไหล (FPS)
                </h2>
                <p className="text-xs text-[#5A655D]">
                  ปรับคุณภาพฉาก 3 มิติ และอัตรารีเฟรชสูงสุด 120 เฟรมต่อวินาที
                </p>
              </div>
            </div>

            {/* Refresh Rate / Frame Rate Target up to 120 FPS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F2823]">
                  <Gauge className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                  <span>ค่ารีเฟรชเรท (Max FPS)</span>
                </span>
                <span className="font-mono-num text-xs font-bold text-[#2E6F40]">
                  {settings.targetFps} FPS
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
                {FPS_OPTIONS.map((fps) => {
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
                รองรับการแสดงผลสูงสุด 120 เฟรมต่อวินาที ตามอัตราการรีเฟรชหน้าจอของอุปกรณ์
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

            {/* Render Resolution Scale */}
            <div className="space-y-1.5">
              <span className="block text-xs sm:text-sm font-medium text-[#1F2823]">
                ความคมชัดในการเรนเดอร์
              </span>
              <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
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
                      className="relative min-h-[42px] rounded-lg px-2 text-xs font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-res-pill"
                          transition={{type: 'spring', stiffness: 420, damping: 30}}
                          className="absolute inset-0 rounded-lg bg-white shadow-xs"
                        />
                      )}
                      <span
                        className={`relative z-10 font-mono-num ${
                          active ? 'text-[#1F2823] font-semibold' : 'text-[#5A655D]'
                        }`}
                      >
                        {res.label}
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

            {/* Device Optimization Profile (realme Note 50 Mali-G57 90Hz) */}
            <div className="space-y-2.5 border-t border-[#1F2823]/8 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F2823]">
                  <Smartphone className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                  <span>โหมดเร่งประสิทธิภาพมือถือ (realme Note 50)</span>
                </span>
                <span className="text-[11px] font-medium text-[#2E6F40]">
                  {deviceReport.detectedModelLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#EFECE4] p-1">
                {OPTIMIZATION_OPTIONS.map((opt) => {
                  const active = settings.optimizationProfile === opt.value;
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

              <motion.button
                type="button"
                whileTap={{scale: 0.95}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.playTap();
                  onUpdateSettings(getRealmeNote50Preset());
                }}
                className="flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border border-[#2E6F40]/30 bg-[#EDF5EE] px-3.5 text-xs font-semibold text-[#1F2823] hover:bg-[#E1EEE3]"
              >
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                  <span>ใช้ค่าแนะนำสำหรับ realme Note 50 (90Hz · Mali-G57)</span>
                </span>
                <span className="text-[11px] font-bold text-[#2E6F40] shrink-0">
                  ปรับทันที
                </span>
              </motion.button>
              <p className="text-[11px] text-[#5A655D] leading-relaxed">
                ลดภาระการเรนเดอร์แก้ว 2 ชั้น แคชเงา 512px ลดรอยหยักที่กินสเปก และปรับความคมชัดอัตโนมัติเพื่อให้รัน 60–90 FPS ได้นิ่งบน Unisoc T612
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
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};
