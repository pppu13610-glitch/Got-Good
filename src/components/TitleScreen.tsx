import React, {useEffect, useState} from 'react';
import {
  BookOpen,
  CloudRain,
  Coffee,
  Compass,
  Play,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
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
  onStart: (mode?: GameMode) => void;
  onOpenJournal: () => void;
  onOpenHowToPlay: () => void;
}

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
  onStart,
  onOpenJournal,
  onOpenHowToPlay,
}) => {
  const [bgFailed, setBgFailed] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const xpInfo = getXpProgress(xp);
  const unlockedCount = getUnlockedTeas(level).length;

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
          onError={() => setBgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E31] via-[#475B48] to-[#1D261F]" />
      )}

      {/* Subtle Warm Sunlit Wash & Dappled Light Rays (keeps center artwork clear) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Warm golden haze at upper-left */}
        <div
          className="absolute -top-24 -left-16 h-[75%] w-[60%] opacity-45"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(255, 240, 198, 0.42) 0%, rgba(255, 232, 178, 0.12) 45%, transparent 72%)',
          }}
        />
        {/* Dappled sunlight beam 1 */}
        <div
          className="animate-sunbeam-1 absolute -top-[20%] left-[10%] h-[135%] w-[24%] origin-top"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 244, 210, 0.24) 0%, rgba(255, 238, 194, 0.08) 55%, transparent 90%)',
            filter: 'blur(18px)',
          }}
        />
        {/* Dappled sunlight beam 2 */}
        <div
          className="animate-sunbeam-2 absolute -top-[20%] left-[34%] h-[130%] w-[18%] origin-top"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 246, 216, 0.18) 0%, rgba(244, 230, 185, 0.06) 50%, transparent 88%)',
            filter: 'blur(22px)',
          }}
        />
      </div>

      {/* Drifting Sunlit Tea Mist & Golden Dust Motes */}
      <SunlitParticles />

      {/* Edge-only Contrast Scrims (center remains unobstructed) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(22, 27, 22, 0.72) 0%, rgba(22, 27, 22, 0.28) 28%, transparent 56%)',
        }}
      />

      {/* Minimal Foreground UI — Edge-anchored so center bamboo garden & teapot shine */}
      <div className="relative z-10 flex h-full w-full flex-col justify-end safe-px safe-pb pb-4 sm:pb-6 lg:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Bottom-Left: Calm Title Lockup & Primary Start CTA */}
          <div className="max-w-md">
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

            <div className="mt-3 sm:mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStart(mode)}
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-[#2E6F40] px-6 py-2.5 text-sm sm:text-base font-medium text-[#FAF8F3] shadow-lg shadow-black/25 ring-1 ring-white/15 transition-transform active:scale-[0.97] hover:bg-[#255C34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>เริ่มชงชา</span>
              </button>
            </div>
          </div>

          {/* Bottom-Right: Single Grouped Sub-menu & Settings Trigger */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#FAF7F0]/25 bg-[#1E251F]/70 backdrop-blur-md px-4 sm:px-5 py-2.5 text-sm font-medium text-[#FAF7F0] shadow-lg shadow-black/20 transition-transform active:scale-[0.97] hover:bg-[#1E251F]/88 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5E7C6] whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#DFC48C]" aria-hidden="true" />
              <span>เมนูและตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>

      {/* Separate Modal Window for Grouped Sub-Menus & Audio Settings */}
      {showMenuModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-3 sm:p-5"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="title-submenu-heading"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#1F2823]/15 bg-[#FAF8F3] text-[#1F2823] shadow-2xl p-4 sm:p-6"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#1F2823]/10 pb-3">
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
              <button
                type="button"
                onClick={closeModal}
                aria-label="ปิดหน้าต่างเมนู"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#4A534D] transition-colors hover:bg-[#EFECE4] hover:text-[#1F2823] active:scale-[0.97] shrink-0"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
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
                    <button
                      type="button"
                      onClick={() => {
                        onModeChange('guest');
                        setShowMenuModal(false);
                        onStart('guest');
                      }}
                      className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-transform active:scale-[0.98] ${
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
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onModeChange('free');
                        setShowMenuModal(false);
                        onStart('free');
                      }}
                      className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-transform active:scale-[0.98] ${
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
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[#5A655D] mb-2">
                    สมุดชาและคู่มือ
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuModal(false);
                        onOpenJournal();
                      }}
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#1F2823]/12 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#1F2823] transition-transform active:scale-[0.97] hover:bg-[#F3F0E8]"
                    >
                      <BookOpen className="h-4 w-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                      <span>
                        สมุดชา ({unlockedCount}/{TEAS.length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuModal(false);
                        onOpenHowToPlay();
                      }}
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#1F2823]/12 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#1F2823] transition-transform active:scale-[0.97] hover:bg-[#F3F0E8]"
                    >
                      <Compass className="h-4 w-4 text-[#7D5A3C] shrink-0" aria-hidden="true" />
                      <span>วิธีชงและปลดล็อก</span>
                    </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.unlock();
                          onToggleMute();
                        }}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 text-xs sm:text-sm font-medium transition-colors active:scale-[0.97] ${
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
                      </button>
                    </div>

                    <div className="border-t border-[#1F2823]/8 pt-2.5">
                      <span className="block text-xs text-[#5A655D] mb-2">
                        เสียงบรรยากาศสวนไผ่
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.unlock();
                            soundEngine.playTap();
                            onAmbienceChange('none');
                          }}
                          className={`min-h-[44px] rounded-lg px-2 text-xs font-medium transition-colors ${
                            ambience === 'none'
                              ? 'bg-[#2E6F40] text-white'
                              : 'bg-[#F3F1EC] text-[#4A534D] hover:bg-[#E7E3D9]'
                          }`}
                        >
                          เงียบสงบ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.unlock();
                            soundEngine.playTap();
                            onAmbienceChange('rain');
                          }}
                          className={`inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors ${
                            ambience === 'rain'
                              ? 'bg-[#2E6F40] text-white'
                              : 'bg-[#F3F1EC] text-[#4A534D] hover:bg-[#E7E3D9]'
                          }`}
                        >
                          <CloudRain className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>ฝนตก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.unlock();
                            soundEngine.playTap();
                            onAmbienceChange('breeze');
                          }}
                          className={`inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors ${
                            ambience === 'breeze'
                              ? 'bg-[#2E6F40] text-white'
                              : 'bg-[#F3F1EC] text-[#4A534D] hover:bg-[#E7E3D9]'
                          }`}
                        >
                          <Wind className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>ลมป่าไผ่</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offline / PWA Install Note */}
                <div className="rounded-xl border border-[#1F2823]/10 bg-[#F3F1EC] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#4A534D]">
                      เล่นแบบออฟไลน์และบันทึกความคืบหน้าในเครื่องอัตโนมัติ
                    </p>
                    <PWAInstallButton compact />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
