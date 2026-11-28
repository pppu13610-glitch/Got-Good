import React, {useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Coffee, ScrollText, Sparkles, X} from 'lucide-react';
import {getLevelInfo, getUnlockedTeas} from '../data/progression';
import {getEquipmentInfo} from '../data/teas';
import {TeaCategory, TeaType} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';
import {getTeaRewardPreview, TeaVesselIcon} from './TeaSelectorModal';

interface TeaMenuBoardModalProps {
  playerLevel: number;
  orderedTeaId?: string | null;
  orderedGuestName?: string;
  onQuickBrewTea?: (tea: TeaType) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: {id: 'all' | TeaCategory; label: string}[] = [
  {id: 'all', label: 'ทั้งหมด'},
  {id: 'matcha', label: 'มัทฉะ'},
  {id: 'latte', label: 'ลาเต้'},
  {id: 'green', label: 'ชาเขียว'},
  {id: 'oolong', label: 'อู่หลง'},
  {id: 'black', label: 'ชาดำ'},
  {id: 'herbal', label: 'สมุนไพร'},
];

const TAP_SPRING = {type: 'spring' as const, stiffness: 420, damping: 26};
const MODAL_EASE = [0.16, 1, 0.3, 1] as const;

export const TeaMenuBoardModal: React.FC<TeaMenuBoardModalProps> = React.memo(
  ({playerLevel, orderedTeaId, orderedGuestName, onQuickBrewTea, onClose}) => {
    const [categoryFilter, setCategoryFilter] = useState<'all' | TeaCategory>(
      'all',
    );

    const unlockedTeas = useMemo(
      () => getUnlockedTeas(playerLevel),
      [playerLevel],
    );
    const levelInfo = useMemo(() => getLevelInfo(playerLevel), [playerLevel]);

    const availableCategories = useMemo(() => {
      const present = new Set(unlockedTeas.map((t) => t.category));
      return CATEGORY_LABELS.filter(
        (cat) => cat.id === 'all' || present.has(cat.id),
      );
    }, [unlockedTeas]);

    // Ensure selected category still exists if playerLevel changed
    useEffect(() => {
      if (
        categoryFilter !== 'all' &&
        !availableCategories.some((c) => c.id === categoryFilter)
      ) {
        setCategoryFilter('all');
      }
    }, [availableCategories, categoryFilter]);

    const visibleTeas = useMemo(() => {
      const list =
        categoryFilter === 'all'
          ? unlockedTeas
          : unlockedTeas.filter((t) => t.category === categoryFilter);
      if (!orderedTeaId) return list;
      return [...list].sort((a, b) => {
        if (a.id === orderedTeaId && b.id !== orderedTeaId) return -1;
        if (b.id === orderedTeaId && a.id !== orderedTeaId) return 1;
        return 0;
      });
    }, [categoryFilter, unlockedTeas, orderedTeaId]);

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.16, ease: 'easeOut'}}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/52 p-3 sm:p-5"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tea-menu-board-title"
          initial={{opacity: 0, scale: 0.96, y: 12}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.96, y: 8}}
          transition={{duration: 0.22, ease: MODAL_EASE}}
          onClick={(e) => e.stopPropagation()}
          style={{contain: 'layout style paint'}}
          className="flex w-full max-w-3xl max-h-[88dvh] flex-col overflow-hidden rounded-2xl border-2 border-[#C8A66A] bg-[#FAF6EC] text-[#1F2823] shadow-2xl will-change-transform"
        >
          {/* Wooden-Framed Café Menu Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#C8A66A]/45 bg-[#24392A] px-4 py-3 sm:px-6 text-[#FAF6EC]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C89D54]/20 text-[#E6C78B] shrink-0">
                <ScrollText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id="tea-menu-board-title"
                  className="font-display text-lg sm:text-xl font-bold tracking-tight truncate"
                >
                  ป้ายเมนูชาประจำร้าน
                </h2>
                <p className="text-xs text-[#D6DFCE] truncate">
                  พร้อมชงเสิร์ฟให้ลูกค้าเลือก{' '}
                  <span className="font-mono-num font-semibold text-[#F4D99E]">
                    {unlockedTeas.length}
                  </span>{' '}
                  เมนู · ระดับร้าน Lv.{playerLevel} ({levelInfo.title})
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{scale: 0.92}}
              transition={TAP_SPRING}
              onClick={() => {
                soundEngine.playTap();
                onClose();
              }}
              aria-label="ปิดป้ายเมนูชา"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FAF6EC] hover:bg-white/20 shrink-0"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Unlocked-Only Category Filter Strip */}
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#1F2823]/10 bg-[#F3EDE0] px-4 py-2 sm:px-6 touch-pan-x">
            {availableCategories.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{scale: 0.95}}
                  onClick={() => {
                    soundEngine.playTap();
                    setCategoryFilter(cat.id);
                  }}
                  className="relative min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  {active && (
                    <motion.span
                      layoutId="menu-board-category-pill"
                      transition={{type: 'spring', stiffness: 440, damping: 32}}
                      className="absolute inset-0 rounded-xl bg-[#2E6F40]"
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      active ? 'text-white' : 'text-[#444E47]'
                    }`}
                  >
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Unlocked Tea Cards Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={categoryFilter}
                initial={{opacity: 0, y: 6}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -4}}
                transition={{duration: 0.18, ease: MODAL_EASE}}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {visibleTeas.map((tea) => {
                  const isOrdered = Boolean(
                    orderedTeaId && tea.id === orderedTeaId,
                  );
                  const reward = getTeaRewardPreview(tea);
                  const equipment = getEquipmentInfo(tea.equipmentId);

                  return (
                    <div
                      key={tea.id}
                      className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 transition-colors ${
                        isOrdered
                          ? 'border-[#2E6F40] bg-[#ECF5ED] shadow-sm'
                          : 'border-[#1F2823]/12 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-[#1F2823]/8 bg-[#FAF7EE] p-1 shrink-0">
                          <TeaVesselIcon tea={tea} locked={false} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display text-base font-bold text-[#1F2823] leading-snug">
                              {tea.name}
                            </h3>
                            <span className="font-mono-num text-xs font-bold text-[#2E6F40] whitespace-nowrap shrink-0">
                              +{reward.warmth} แต้ม
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs font-medium text-[#5A655D]">
                            {tea.categoryLabel} · {tea.idealTempLabel} · แช่{' '}
                            {tea.idealSteepMin}–{tea.idealSteepMax} วิ
                          </p>

                          <p className="mt-1 text-xs text-[#3C463F] line-clamp-2 leading-relaxed">
                            {tea.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1F2823]/8 pt-2 text-[11px]">
                        <div className="min-w-0 flex-1 text-[#4A534D]">
                          <p className="truncate">
                            อุปกรณ์: {equipment.name} · วัตถุดิบ:{' '}
                            {tea.baseIngredients.join(' · ')}
                          </p>
                          {isOrdered && (
                            <p className="mt-0.5 flex items-center gap-1 font-bold text-[#215A31]">
                              <Sparkles
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span>
                                {orderedGuestName
                                  ? `${orderedGuestName} กำลังสั่งเมนูนี้`
                                  : 'ลูกค้ากำลังสั่งเมนูนี้'}
                              </span>
                            </p>
                          )}
                        </div>

                        {onQuickBrewTea && (
                          <motion.button
                            type="button"
                            whileTap={{scale: 0.94}}
                            transition={TAP_SPRING}
                            onClick={() => {
                              soundEngine.unlock();
                              soundEngine.playTap();
                              onQuickBrewTea(tea);
                            }}
                            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                              isOrdered
                                ? 'bg-[#2E6F40] text-white hover:bg-[#235632]'
                                : 'border border-[#2E6F40]/35 bg-[#F2F7F2] text-[#255F30] hover:bg-[#E4EFE4]'
                            }`}
                          >
                            <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>ชงเมนูนี้เลย</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quiet Footer Note */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#1F2823]/10 bg-[#F3EDE0] px-4 py-2.5 sm:px-6 text-xs text-[#5A655D]">
            <span>
              บนป้ายเมนูร้านจะแสดงเฉพาะชาที่ปลดล็อกและชงได้แล้วในระดับปัจจุบันเท่านั้น
            </span>
            <span className="font-mono-num font-semibold text-[#2E6F40] whitespace-nowrap">
              {unlockedTeas.length} เมนูพร้อมเสิร์ฟ
            </span>
          </div>
        </motion.div>
      </motion.div>
    );
  },
);
