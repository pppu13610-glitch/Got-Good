import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  BookOpen,
  CloudRain,
  Coffee,
  Compass,
  History,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  Play,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import {CURRENT_APP_VERSION} from '../data/changelog';
import {GUESTS} from '../data/guests';
import {getUnlockedTeas, getXpProgress} from '../data/progression';
import {TEAS} from '../data/teas';
import {AmbienceMode, GameMode} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';
import {PWAInstallButton} from './PWAInstallButton';
import {SunlitParticles} from './SunlitParticles';

interface TitleScreenProps {
  xp: number;
  level: number;
  totalCups: number;
  warmthPoints: number;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  ambience: AmbienceMode;
  onAmbienceChange: (mode: AmbienceMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  particlesEnabled?: boolean;
  onStart: (mode?: GameMode) => void;
  onOpenJournal: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings?: () => void;
  onOpenUpdates?: () => void;
  onOpenRequest?: () => void;
  onOpenGuestBook?: () => void;
  onOpenTeaMenu?: () => void;
  visitedGuestCount?: number;
  isOverlayOpen?: boolean;
  isUltraLowRam?: boolean;
  updateAvailable?: boolean;
  latestBrowserVersion?: string | null;
}

const TAP_SPRING = {type: 'spring' as const, stiffness: 420, damping: 26};
const MODAL_EASE = [0.16, 1, 0.3, 1] as const;

export const TitleScreen: React.FC<TitleScreenProps> = ({
  xp,
  level,
  totalCups,
  warmthPoints,
  mode,
  onModeChange,
  ambience,
  onAmbienceChange,
  isMuted,
  onToggleMute,
  isFullscreen = false,
  onToggleFullscreen,
  particlesEnabled = true,
  onStart,
  onOpenJournal,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenUpdates,
  onOpenRequest,
  onOpenGuestBook,
  onOpenTeaMenu,
  visitedGuestCount = 0,
  isOverlayOpen = false,
  isUltraLowRam = false,
  updateAvailable = false,
  latestBrowserVersion = null,
}) => {
  const [bgFailed, setBgFailed] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const xpInfo = getXpProgress(xp);
  const unlockedCount = getUnlockedTeas(level).length;
  const pauseBackgroundFx = showMenuModal || isOverlayOpen || isUltraLowRam;

  useEffect(() => {
    if (!showMenuModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenuModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMenuModal]);

  const openModal = () => {
    soundEngine.unlock();
    soundEngine.playTap();
    setShowMenuModal(true);
  };

  const closeModal = () => {
    soundEngine.playTap();
    setShowMenuModal(false);
  };

  return (
    <div className="relative h-dvh min-h-[300px] w-full overflow-hidden bg-[#222B24] select-none">
      {/* Full-bleed Wooden Tea Pavilion & Bamboo Garden Artwork */}
      {!bgFailed ? (
        <img
          src="/src/assets/images/tea_house_backdrop_1795626509107.jpg"
          alt="บรรยากาศเรือนชาไม้ท่ามกลางสวนไผ่ในแสงแดดรำไร"
          referrerPolicy="no-referrer"
          decoding="async"
          onError={() => setBgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E31] via-[#475B48] to-[#1D261F]" />
      )}

      {/* Subtle Warm Sunlit Wash & Dappled Light Rays (pure gradient, zero CSS filter:blur for mobile smoothness) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-24 -left-16 h-[75%] w-[60%] opacity-45"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(255, 240, 198, 0.42) 0%, rgba(255, 232, 178, 0.12) 45%, transparent 72%)',
          }}
        />
        <div
          className={`${pauseBackgroundFx ? '' : 'animate-sunbeam-1'} absolute -top-[20%] left-[8%] h-[135%] w-[30%] origin-top`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255, 244, 210, 0.14) 50%, transparent 100%)',
          }}
        />
        <div
          className={`${pauseBackgroundFx ? '' : 'animate-sunbeam-2'} absolute -top-[20%] left-[32%] h-[130%] w-[24%] origin-top`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255, 246, 216, 0.11) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Drifting Sunlit Tea Mist & Golden Dust Motes (paused while menus/settings open or disabled on 2GB RAM) */}
      {particlesEnabled && !isUltraLowRam && (
        <SunlitParticles paused={pauseBackgroundFx} />
      )}

      {/* Edge-only Contrast Scrims */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(22, 27, 22, 0.72) 0%, rgba(22, 27, 22, 0.28) 28%, transparent 56%)',
        }}
      />

      {/* Minimal Foreground UI: Top Separated Knowledge Strip + Bottom Enter-Game Lockup */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between safe-px safe-pt safe-pb pt-3 sm:pt-5 pb-4 sm:pb-6 lg:pb-8">
        {/* Top-Right: Separated สมุดชงชา & วิธีชง (away from cute title lockup & Enter Game CTA) */}
        <motion.div
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.24, ease: MODAL_EASE}}
          className="flex justify-end"
        >
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-[#FAF7F0]/22 bg-[#1E251F]/84 p-1.5 shadow-lg shadow-black/25">
            {onOpenTeaMenu && (
              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playTap();
                  onOpenTeaMenu();
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#C89D54]/18 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#C89D54]/28 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap"
              >
                <ScrollText className="h-4 w-4 text-[#F0D395] shrink-0" aria-hidden="true" />
                <span>ป้ายเมนู ({unlockedCount})</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              transition={TAP_SPRING}
              onClick={() => {
                soundEngine.unlock();
                onOpenJournal();
              }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#FAF8F3]/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#FAF8F3]/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4 text-[#8CD19A] shrink-0" aria-hidden="true" />
              <span>
                สมุดชงชา ({unlockedCount}/{TEAS.length})
              </span>
            </motion.button>

            {onOpenGuestBook && (
              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playTap();
                  onOpenGuestBook();
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#FAF8F3]/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#FAF8F3]/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap"
              >
                <Users className="h-4 w-4 text-[#A7DFB2] shrink-0" aria-hidden="true" />
                <span>
                  ลูกค้า ({visitedGuestCount}/{GUESTS.length})
                </span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              transition={TAP_SPRING}
              onClick={() => {
                soundEngine.unlock();
                onOpenHowToPlay();
              }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#FAF8F3]/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#FAF8F3]/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap"
            >
              <Compass className="h-4 w-4 text-[#DFC48C] shrink-0" aria-hidden="true" />
              <span>วิธีชง</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Bottom-Left: Calm Title Lockup & Primary Start CTA */}
          <motion.div
            initial={{opacity: 0, y: 18}}
            animate={{opacity: 1, y: 0}}
            transition={{type: 'spring', stiffness: 320, damping: 28}}
            className="max-w-md"
          >
            <div className="flex items-center gap-3.5">
              <img
                src="/game-icon.png"
                alt="ไอคอนเกมบ้านชาอุ่นใจ"
                width={56}
                height={56}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-lg shadow-black/35 ring-1 ring-white/30 shrink-0"
              />
              <div>
                <h1
                  className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#FAF7F0] drop-shadow-[0_2px_10px_rgba(18,22,18,0.65)]"
                  style={{textWrap: 'balance'}}
                >
                  บ้านชาอุ่นใจ
                </h1>

                <p className="mt-1 text-xs sm:text-sm font-medium text-[#EDE7D9] drop-shadow-[0_1px_6px_rgba(18,22,18,0.75)]">
                  เรือนชาไม้กลางสวนไผ่ · Lv. {xpInfo.level} ({xpInfo.title}) · ชงแล้ว{' '}
                  <span className="font-mono-num">{totalCups}</span> ถ้วย
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-3">
              <motion.button
                type="button"
                whileHover={{scale: 1.03, y: -1}}
                whileTap={{scale: 0.94}}
                transition={TAP_SPRING}
                onClick={() => onStart(mode)}
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-[#2E6F40] px-6 py-2.5 text-sm sm:text-base font-medium text-[#FAF8F3] shadow-lg shadow-black/25 ring-1 ring-white/15 hover:bg-[#255C34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>เริ่มชงชา</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Bottom-Right: Fullscreen Quick Toggle + Grouped Sub-menu & Settings Trigger */}
          <motion.div
            initial={{opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.24, ease: MODAL_EASE}}
            className="flex items-center gap-2.5 will-change-transform"
          >
            {onToggleFullscreen && (
              <motion.button
                type="button"
                whileTap={{scale: 0.92}}
                transition={TAP_SPRING}
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playTap();
                  onToggleFullscreen();
                }}
                aria-label={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'ขยายเต็มหน้าจอ'}
                title={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'ขยายเต็มหน้าจอ'}
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-[#FAF7F0]/25 bg-[#1E251F]/88 text-[#FAF7F0] shadow-lg shadow-black/25 hover:bg-[#252E26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] shrink-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 text-[#DFC48C]" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-[#DFC48C]" aria-hidden="true" />
                )}
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              transition={TAP_SPRING}
              onClick={openModal}
              className="relative inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#FAF7F0]/25 bg-[#1E251F]/88 px-4 sm:px-5 py-2.5 text-sm font-medium text-[#FAF7F0] shadow-lg shadow-black/25 hover:bg-[#252E26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#DFC48C]" aria-hidden="true" />
              <span>เมนูและตั้งค่า</span>
              {updateAvailable && (
                <span
                  aria-label="มีอัปเดตใหม่"
                  className="h-2 w-2 rounded-full bg-[#6EE787]"
                />
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Separate Modal Window for Grouped Sub-Menus & Audio Settings */}
      <AnimatePresence>
        {showMenuModal && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.16, ease: 'easeOut'}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-3 sm:p-5"
            onClick={closeModal}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="title-submenu-heading"
              initial={{opacity: 0, scale: 0.96, y: 12}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.2, ease: MODAL_EASE}}
              onClick={(e) => e.stopPropagation()}
              style={{contain: 'layout style paint'}}
              className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#1F2823]/15 bg-[#FAF8F3] text-[#1F2823] shadow-2xl p-4 sm:p-6 will-change-transform"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#1F2823]/10 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/game-icon.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-xl object-cover shadow-xs ring-1 ring-[#1F2823]/10 shrink-0"
                  />
                  <div>
                    <h2
                      id="title-submenu-heading"
                      className="font-display text-lg sm:text-xl font-semibold text-[#1F2823]"
                    >
                      เมนูเรือนชาและการตั้งค่า
                    </h2>
                  <p className="mt-0.5 text-xs text-[#5A655D]">
                    Lv. {xpInfo.level} ({xpInfo.title}) · แต้มอุ่นใจ{' '}
                    <span className="font-mono-num">{warmthPoints}</span> · ปลดล็อกชา{' '}
                    <span className="font-mono-num">
                      {unlockedCount}/{TEAS.length}
                    </span>{' '}
                    ชนิด
                  </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={closeModal}
                  whileHover={{scale: 1.07}}
                  whileTap={{scale: 0.9}}
                  transition={TAP_SPRING}
                  aria-label="ปิดหน้าต่างเมนู"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#4A534D] hover:bg-[#EFECE4] hover:text-[#1F2823] shrink-0"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Landscape-friendly 2-column content inside modal */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Column 1: Modes & Tea House Navigation */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                      เลือกโหมดชงชา
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      <motion.button
                        type="button"
                        whileHover={{scale: 1.015}}
                        whileTap={{scale: 0.96}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          onModeChange('guest');
                          setShowMenuModal(false);
                          onStart('guest');
                        }}
                        className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left ${
                          mode === 'guest'
                            ? 'border-[#2E6F40] bg-[#EDF5EE]'
                            : 'border-[#1F2823]/12 bg-white hover:bg-[#F3F0E8]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Coffee className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                          <span>
                            <span className="block text-sm font-medium text-[#1F2823]">
                              เปิดร้านรับรองแขก
                            </span>
                            <span className="block text-[11px] text-[#5A655D]">
                              รับออเดอร์แขกประจำเรือนชา เก็บ XP
                            </span>
                          </span>
                        </span>
                        <span className="text-xs font-medium text-[#2E6F40] shrink-0">
                          เล่นเลย
                        </span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{scale: 1.015}}
                        whileTap={{scale: 0.96}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          onModeChange('free');
                          setShowMenuModal(false);
                          onStart('free');
                        }}
                        className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left ${
                          mode === 'free'
                            ? 'border-[#2E6F40] bg-[#EDF5EE]'
                            : 'border-[#1F2823]/12 bg-white hover:bg-[#F3F0E8]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Sparkles className="h-4 w-4 text-[#B87324] shrink-0" aria-hidden="true" />
                          <span>
                            <span className="block text-sm font-medium text-[#1F2823]">
                              ชงดื่มเองตามใจ
                            </span>
                            <span className="block text-[11px] text-[#5A655D]">
                              ทดลองชงชาทุกชนิดอย่างอิสระ
                            </span>
                          </span>
                        </span>
                        <span className="text-xs font-medium text-[#2E6F40] shrink-0">
                          เล่นเลย
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Audio & Offline Install */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                      เสียงประกอบและบรรยากาศ
                    </h3>
                    <div className="space-y-2.5 rounded-xl border border-[#1F2823]/10 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#1F2823]">
                          เสียงเอฟเฟกต์ในเกม
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{scale: 0.94}}
                          transition={TAP_SPRING}
                          onClick={() => {
                            soundEngine.unlock();
                            onToggleMute();
                          }}
                          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 text-xs sm:text-sm font-medium ${
                            isMuted
                              ? 'border border-[#1F2823]/15 bg-[#F3F1EC] text-[#5A655D]'
                              : 'bg-[#233029] text-white'
                          }`}
                        >
                          {isMuted ? (
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

                      <div className="border-t border-[#1F2823]/8 pt-2.5">
                        <span className="block text-xs text-[#5A655D] mb-2">
                          เสียงบรรยากาศสวนไผ่
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              {id: 'none', label: 'เงียบสงบ', icon: null},
                              {id: 'rain', label: 'ฝนตก', icon: 'rain'},
                              {id: 'breeze', label: 'ลมป่าไผ่', icon: 'breeze'},
                            ] as const
                          ).map((opt) => (
                            <motion.button
                              key={opt.id}
                              type="button"
                              whileTap={{scale: 0.94}}
                              onClick={() => {
                                soundEngine.unlock();
                                soundEngine.playTap();
                                onAmbienceChange(opt.id);
                              }}
                              className="relative inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium"
                            >
                              {ambience === opt.id && (
                                <motion.span
                                  layoutId="title-ambience-pill"
                                  transition={{type: 'spring', stiffness: 420, damping: 30}}
                                  className="absolute inset-0 rounded-lg bg-[#2E6F40]"
                                />
                              )}
                              <span
                                className={`relative z-10 inline-flex items-center gap-1 ${
                                  ambience === opt.id ? 'text-white' : 'text-[#4A534D]'
                                }`}
                              >
                                {opt.icon === 'rain' && (
                                  <CloudRain className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                )}
                                {opt.icon === 'breeze' && (
                                  <Wind className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                )}
                                <span>{opt.label}</span>
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offline / PWA Install Note & Full-Screen Graphics/120 FPS Settings */}
                  <div className="rounded-xl border border-[#1F2823]/10 bg-[#F3F1EC] p-3 space-y-2.5">
                    {onOpenSettings && (
                      <motion.button
                        type="button"
                        whileTap={{scale: 0.95}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          soundEngine.playTap();
                          setShowMenuModal(false);
                          onOpenSettings();
                        }}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E6F40] px-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#245732]"
                      >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        <span>ตั้งค่ากราฟิก 3D · เสียง · FPS ตามจอ</span>
                      </motion.button>
                    )}
                    {onOpenUpdates && (
                      <motion.button
                        type="button"
                        whileTap={{scale: 0.95}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          soundEngine.playTap();
                          setShowMenuModal(false);
                          onOpenUpdates();
                        }}
                        className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs sm:text-sm font-medium ${
                          updateAvailable
                            ? 'border-[#2E6F40] bg-[#EDF5EE] text-[#1D542C] font-semibold'
                            : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#EAE6DC]'
                        }`}
                      >
                        <History className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                        <span>
                          {updateAvailable && latestBrowserVersion
                            ? `อัปเดตใหม่พร้อมใช้งาน (v${latestBrowserVersion})`
                            : `เช็คอัปเดตเวอร์ชั่น (v${CURRENT_APP_VERSION})`}
                        </span>
                      </motion.button>
                    )}
                    {onOpenRequest && (
                      <motion.button
                        type="button"
                        whileTap={{scale: 0.95}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          soundEngine.playTap();
                          setShowMenuModal(false);
                          onOpenRequest();
                        }}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1F2823]/12 bg-white px-3 text-xs sm:text-sm font-medium text-[#1F2823] hover:bg-[#EAE6DC]"
                      >
                        <MessageSquarePlus className="h-4 w-4 text-[#7D5A3C]" aria-hidden="true" />
                        <span>หน้าร้องขอถึงผู้สร้าง (Gmail · GitHub)</span>
                      </motion.button>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[#4A534D]">
                        เล่นแบบออฟไลน์และบันทึกความคืบหน้าในเครื่องอัตโนมัติ
                      </p>
                      <PWAInstallButton compact />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
