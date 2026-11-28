import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  CloudRain,
  Coffee,
  Compass,
  History,
  Home,
  Maximize2,
  Menu,
  MessageSquarePlus,
  Minimize2,
  Power,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import {CURRENT_APP_VERSION} from '../data/changelog';
import {getUnlockedTeas, getXpProgress} from '../data/progression';
import {TEAS} from '../data/teas';
import {AmbienceMode, GameMode, ScreenView} from '../types/tea';
import {exitAppCompletely, isNativeMobileApp} from '../utils/appLifecycle';
import {soundEngine} from '../utils/soundEngine';
import {PWAInstallButton} from './PWAInstallButton';

interface CornerMenuProps {
  screen: ScreenView;
  xp: number;
  level: number;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  ambience: AmbienceMode;
  onAmbienceChange: (mode: AmbienceMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onNavigate: (target: ScreenView) => void;
  onOpenSettings: () => void;
  onOpenUpdates: () => void;
  onOpenRequest: () => void;
  updateAvailable?: boolean;
  latestBrowserVersion?: string | null;
}

const TAP_SPRING = {type: 'spring' as const, stiffness: 440, damping: 28};
const DRAWER_TRANSITION = {
  duration: 0.24,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const CornerMenu: React.FC<CornerMenuProps> = React.memo(({
  screen,
  xp,
  level,
  mode,
  onModeChange,
  ambience,
  onAmbienceChange,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onNavigate,
  onOpenSettings,
  onOpenUpdates,
  onOpenRequest,
  updateAvailable = false,
  latestBrowserVersion = null,
}) => {
  const [open, setOpen] = useState(false);
  const xpInfo = getXpProgress(xp);
  const unlockedCount = getUnlockedTeas(level).length;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleToggleOpen = () => {
    soundEngine.unlock();
    soundEngine.playTap();
    setOpen(true);
  };

  const handleClose = () => {
    soundEngine.playTap();
    setOpen(false);
  };

  const go = (target: ScreenView) => {
    setOpen(false);
    onNavigate(target);
  };

  return (
    <>
      {/* Single 3-Bar Hamburger Trigger at Top-Right Corner (solid surface, zero WebGL blur overhead) */}
      <motion.button
        type="button"
        onClick={handleToggleOpen}
        whileTap={{scale: 0.92}}
        transition={TAP_SPRING}
        aria-label="เปิดเมนู"
        aria-expanded={open}
        style={{right: 'max(0.75rem, env(safe-area-inset-right))'}}
        className="fixed top-2.5 sm:top-3.5 z-40 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6]/96 text-[#1F2823] shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40] will-change-transform"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        {updateAvailable && (
          <span
            aria-label="มีอัปเดตใหม่"
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#2E6F40]"
          />
        )}
      </motion.button>

      {/* Right-Side Slide-Over Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18, ease: 'easeOut'}}
            className="fixed inset-0 z-50 flex justify-end bg-black/42"
            onClick={handleClose}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="เมนูและตั้งค่าเรือนชา"
              initial={{x: '100%'}}
              animate={{x: 0}}
              exit={{x: '100%'}}
              transition={DRAWER_TRANSITION}
              onClick={(e) => e.stopPropagation()}
              className="flex h-dvh w-full max-w-[320px] sm:max-w-[360px] flex-col border-l border-[#1F2823]/12 bg-[#FAF8F3] text-[#1F2823] shadow-2xl will-change-transform"
              style={{contain: 'layout style paint'}}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1F2823]/10 px-4 py-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#1F2823]">
                    บ้านชาอุ่นใจ
                  </h2>
                  <p className="text-[11px] text-[#5A655D]">
                    Lv. {xpInfo.level} ({xpInfo.title}) · ชา{' '}
                    <span className="font-mono-num">
                      {unlockedCount}/{TEAS.length}
                    </span>
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileTap={{scale: 0.92}}
                  transition={TAP_SPRING}
                  aria-label="ปิดเมนู"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#4A534D] hover:bg-[#EFECE4] hover:text-[#1F2823]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Main & Enter Game Navigation */}
                <div>
                  <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                    หน้าหลักและเข้าเล่น
                  </h3>
                  <nav className="grid grid-cols-2 gap-2" aria-label="เมนูหลัก">
                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => go('TITLE_MENU')}
                      className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 text-xs sm:text-sm font-medium ${
                        screen === 'TITLE_MENU'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#F3F0E8]'
                      }`}
                    >
                      <Home className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                      <span>หน้าเข้าเกม</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => go('BREWING')}
                      className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 text-xs sm:text-sm font-medium ${
                        screen === 'BREWING'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#F3F0E8]'
                      }`}
                    >
                      <Coffee className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                      <span>มุมชงชา 3D</span>
                    </motion.button>
                  </nav>
                </div>

                {/* Separated Tea Journal & How To Brew Section */}
                <div className="border-t border-[#1F2823]/10 pt-3">
                  <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                    สมุดชงชาและวิธีชง
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => go('JOURNAL')}
                      className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 text-xs sm:text-sm font-medium ${
                        screen === 'JOURNAL'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#F3F0E8]'
                      }`}
                    >
                      <BookOpen className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                      <span>สมุดชงชา</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => go('HOW_TO_PLAY')}
                      className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 text-xs sm:text-sm font-medium ${
                        screen === 'HOW_TO_PLAY'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#F3F0E8]'
                      }`}
                    >
                      <Compass className="h-4 w-4 text-[#7D5A3C] shrink-0" aria-hidden="true" />
                      <span>วิธีชง</span>
                    </motion.button>
                  </div>
                </div>

                {/* Game Mode */}
                <div>
                  <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                    โหมดการชง
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.unlock();
                        soundEngine.playTap();
                        onModeChange('guest');
                      }}
                      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium ${
                        mode === 'guest'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                      }`}
                    >
                      <Coffee className="h-3.5 w-3.5 text-[#2E6F40]" aria-hidden="true" />
                      <span>รับรองแขก</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.unlock();
                        soundEngine.playTap();
                        onModeChange('free');
                      }}
                      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium ${
                        mode === 'free'
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#B87324]" aria-hidden="true" />
                      <span>ชงตามใจ</span>
                    </motion.button>
                  </div>
                </div>

                {/* Sound & Ambience */}
                <div>
                  <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                    เสียงและบรรยากาศ
                  </h3>
                  <div className="space-y-2.5 rounded-xl border border-[#1F2823]/10 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium text-[#1F2823]">
                        เสียงเอฟเฟกต์
                      </span>
                      <motion.button
                        type="button"
                        whileTap={{scale: 0.95}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          soundEngine.unlock();
                          onToggleMute();
                        }}
                        className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium ${
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

                    <div className="grid grid-cols-3 gap-1.5 border-t border-[#1F2823]/8 pt-2.5">
                      {(
                        [
                          {id: 'none', label: 'เงียบสงบ', icon: null},
                          {id: 'rain', label: 'ฝนตก', icon: 'rain'},
                          {id: 'breeze', label: 'ลมไผ่', icon: 'breeze'},
                        ] as const
                      ).map((opt) => (
                        <motion.button
                          key={opt.id}
                          type="button"
                          whileTap={{scale: 0.95}}
                          onClick={() => {
                            soundEngine.unlock();
                            soundEngine.playTap();
                            onAmbienceChange(opt.id);
                          }}
                          className="relative inline-flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium"
                        >
                          {ambience === opt.id && (
                            <motion.span
                              layoutId="drawer-ambience-pill"
                              transition={{type: 'spring', stiffness: 420, damping: 32}}
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

                {/* Full Screen Quick Toggle */}
                <motion.button
                  type="button"
                  whileTap={{scale: 0.96}}
                  transition={TAP_SPRING}
                  onClick={() => {
                    soundEngine.playTap();
                    onToggleFullscreen();
                  }}
                  className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs sm:text-sm font-medium ${
                    isFullscreen
                      ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                      : 'border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#F3F0E8]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                    )}
                    <span>{isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'ขยายเต็มหน้าจอ'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#2E6F40]">
                    {isFullscreen ? 'Full Screen' : 'เปิด'}
                  </span>
                </motion.button>

                <PWAInstallButton compact />

                {/* Full-Screen Update Check & Settings Entries */}
                <div className="border-t border-[#1F2823]/10 pt-3 space-y-2">
                  <motion.button
                    type="button"
                    whileTap={{scale: 0.96}}
                    transition={TAP_SPRING}
                    onClick={() => {
                      soundEngine.unlock();
                      soundEngine.playTap();
                      setOpen(false);
                      onOpenUpdates();
                    }}
                    className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left ${
                      updateAvailable
                        ? 'border-[#2E6F40]/40 bg-[#EDF5EE] hover:bg-[#E2EFE4]'
                        : 'border-[#1F2823]/12 bg-white hover:bg-[#F3F0E8]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFECE4] text-[#2E6F40] shrink-0">
                        <History className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#1F2823] truncate">
                          {updateAvailable && latestBrowserVersion
                            ? `อัปเดตใหม่ v${latestBrowserVersion}`
                            : 'เช็คอัปเดตเวอร์ชั่น'}
                        </span>
                        <span className="block text-[11px] text-[#5A655D] truncate">
                          {updateAvailable
                            ? 'แตะเพื่ออัปเดตให้ตรงกับ Browser ทันที'
                            : `เวอร์ชั่น v${CURRENT_APP_VERSION} · ดูสิ่งที่เพิ่มใหม่`}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#5A655D] shrink-0" aria-hidden="true" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{scale: 0.96}}
                    transition={TAP_SPRING}
                    onClick={() => {
                      soundEngine.unlock();
                      soundEngine.playTap();
                      setOpen(false);
                      onOpenRequest();
                    }}
                    className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#1F2823]/12 bg-white px-3.5 py-2 text-left hover:bg-[#F3F0E8]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFECE4] text-[#7D5A3C] shrink-0">
                        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#1F2823] truncate">
                          หน้าร้องขอถึงผู้สร้าง
                        </span>
                        <span className="block text-[11px] text-[#5A655D] truncate">
                          ส่งคำร้องขอทุกชนิดทาง Gmail · GitHub
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#5A655D] shrink-0" aria-hidden="true" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{scale: 0.96}}
                    transition={TAP_SPRING}
                    onClick={() => {
                      soundEngine.unlock();
                      soundEngine.playTap();
                      setOpen(false);
                      onOpenSettings();
                    }}
                    className="flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl border border-[#2E6F40]/25 bg-[#EDF5EE] px-3.5 py-2.5 text-left hover:bg-[#E2EFE4]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2E6F40] text-white shrink-0">
                        <Settings className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#1F2823] truncate">
                          การตั้งค่า
                        </span>
                        <span className="block text-[11px] text-[#4A5E4E] truncate">
                          เสียง กราฟิก 3 มิติ & ค่ารีเฟรชเรทตามจอ
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                  </motion.button>

                  {isNativeMobileApp() && (
                    <motion.button
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        setOpen(false);
                        exitAppCompletely();
                      }}
                      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#8E3535]/25 bg-[#FDF2F2] px-3.5 text-xs sm:text-sm font-semibold text-[#8E3535] hover:bg-[#F9E4E4]"
                    >
                      <Power className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>ปิดแอปและออกจากเกมทั้งหมด</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
