import React from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Lock, X} from 'lucide-react';
import {isTeaUnlocked} from '../data/progression';
import {getEquipmentInfo, TEAS} from '../data/teas';
import {TeaCategory, TeaType} from '../types/tea';

interface TeaSelectorModalProps {
  playerLevel: number;
  selectedTeaId: string;
  categoryFilter: 'all' | TeaCategory;
  onCategoryChange: (cat: 'all' | TeaCategory) => void;
  recommendedTeaIds?: string[];
  onSelectAndStart: (tea: TeaType) => void;
  onClose: () => void;
}

const CATEGORIES: {id: 'all' | TeaCategory; label: string; modalTitle: string}[] = [
  {id: 'all', label: 'ทั้งหมด', modalTitle: 'เลือกชงชา'},
  {id: 'matcha', label: 'มัทฉะ', modalTitle: 'ทำมัทฉะ'},
  {id: 'latte', label: 'ลาเต้', modalTitle: 'ทำลาเต้'},
  {id: 'green', label: 'ชาเขียว', modalTitle: 'ชงชาเขียว'},
  {id: 'oolong', label: 'อู่หลง', modalTitle: 'ชงอู่หลง'},
  {id: 'black', label: 'ชาดำ', modalTitle: 'ชงชาดำ'},
  {id: 'herbal', label: 'สมุนไพร', modalTitle: 'ชงสมุนไพร'},
];

export function getTeaRewardPreview(tea: TeaType): {warmth: number; xp: number} {
  const tierBonus = (tea.unlockLevel - 1) * 5;
  return {
    warmth: 15 + tierBonus,
    xp: 25 + tierBonus,
  };
}

const TeaVesselIcon: React.FC<{tea: TeaType; locked: boolean}> = React.memo(({tea, locked}) => {
  const liquid = locked ? '#C5C3B8' : tea.lightColor;
  const liquidEdge = locked ? '#ABA99E' : tea.richColor;

  // White cup on saucer with green rosetta latte art
  if (tea.id === 'matcha-rosetta-latte') {
    const artBase = locked ? '#ABA99E' : '#5F9A46';
    const artCream = locked ? '#DDDAD0' : '#F4F8EC';
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
        <ellipse cx="23" cy="40" rx="16" ry="4.5" fill="#1F2823" opacity="0.1" />
        <ellipse cx="23" cy="36.5" rx="16" ry="4.5" fill="#F4F2EA" stroke="#CECAC0" strokeWidth="1.2" />
        <path
          d="M33.5 23 C38.5 23, 39 30.5, 33 31"
          fill="none"
          stroke="#E5E1D6"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M11 20 C11 31.5, 16 36, 23 36 C30 36, 35 31.5, 35 20 Z"
          fill="#FAF8F2"
          stroke="#CFCAC0"
          strokeWidth="1.2"
        />
        <ellipse cx="23" cy="20" rx="12" ry="4.4" fill="#EAE6DC" stroke="#CFCAC0" strokeWidth="1" />
        <ellipse cx="23" cy="20" rx="10.2" ry="3.3" fill={artBase} />
        <ellipse cx="23" cy="19.8" rx="6.2" ry="2.1" fill={artCream} opacity="0.9" />
        <path
          d="M18.5 19.8 Q23 18 27.5 19.8 M20.5 20.6 Q23 19.3 25.5 20.6"
          fill="none"
          stroke={artBase}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Tall layered matcha latte cups (iced, strawberry, brown sugar, brown sugar cloud)
  if (tea.category === 'latte') {
    const bottomColor = locked
      ? '#C0BEB4'
      : tea.id === 'strawberry-matcha-latte'
        ? '#E37E90'
        : tea.id === 'brown-sugar-matcha-latte'
          ? '#B97E46'
          : tea.id === 'brown-sugar-cloud-latte'
            ? '#A96D39'
            : '#EFECE3';
    const milkColor = locked ? '#D5D2C7' : '#F4F1E8';
    const topMatcha = locked ? '#B2B0A6' : '#659E49';
    const topLight = locked ? '#C5C3B8' : '#85BD66';
    const emblemDot = locked ? '#9E9C92' : '#4C8237';
    const isCloud = tea.id === 'brown-sugar-cloud-latte';

    return (
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
        <ellipse cx="24" cy="42.5" rx="9.5" ry="2.4" fill="#1F2823" opacity="0.12" />
        <defs>
          <clipPath id={`latte-clip-${tea.id}`}>
            <path d="M14.5 12 L33.5 12 L31.2 38.8 C31 40.3 27.8 41.2 24 41.2 C20.2 41.2 17 40.3 16.8 38.8 Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#latte-clip-${tea.id})`}>
          <rect x="14" y="12" width="20" height="30" fill={milkColor} />
          <rect x="14" y="33" width="20" height="9" fill={bottomColor} />
          <rect x="14" y="12" width="20" height="10.5" fill={topMatcha} />
          <circle cx="24" cy="28" r="2.2" fill={emblemDot} />
        </g>
        <path
          d="M14.5 12 L33.5 12 L31.2 38.8 C31 40.3 27.8 41.2 24 41.2 C20.2 41.2 17 40.3 16.8 38.8 Z"
          fill="none"
          stroke="#C2CCC7"
          strokeWidth="1.2"
        />
        <ellipse cx="24" cy="12" rx="9.5" ry="2.6" fill={topLight} stroke="#B8C3BD" strokeWidth="1" />
        {isCloud && (
          <path
            d="M17.5 11.4 Q20.5 9.2 24 10.6 Q27.5 9.2 30.5 11.4"
            fill="none"
            stroke="#F7FBF3"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        )}
        <path d="M18.2 16 L19.2 36" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }

  if (tea.vesselStyle === 'chawan') {
    const isDarkBowl =
      tea.id === 'uji-matcha' ||
      tea.id === 'stone-milled-koicha' ||
      tea.id === 'kintsugi-matcha';
    const isHeritage = tea.id === 'classic-heritage-matcha';
    const isPumpkin = tea.id === 'pumpkin-spice-matcha';
    const isKintsugi = tea.id === 'kintsugi-matcha';

    const bowlBody =
      tea.id === 'uji-roasted-matcha'
        ? '#7B5440'
        : tea.id === 'sakura-matcha'
          ? '#F3E8E2'
          : isHeritage
            ? '#6D2F29'
            : isKintsugi
              ? '#232629'
              : tea.id === 'stone-milled-koicha'
                ? '#363A3E'
                : tea.id === 'uji-matcha'
                  ? '#2C3138'
                  : '#F2EFE6';

    const bowlStroke = isDarkBowl ? '#181B1E' : isHeritage ? '#4D1F1B' : '#CFCAC0';
    const rimFill = isDarkBowl ? '#353A40' : isHeritage ? '#7F3C35' : '#ECE7DC';
    const footFill = isHeritage ? '#D1A347' : isDarkBowl ? '#3E3A36' : '#C9A272';
    const bowlStripe =
      tea.id === 'uji-roasted-matcha'
        ? '#C49A6C'
        : tea.id === 'sakura-matcha'
          ? '#D88E99'
          : isHeritage
            ? '#B9873C'
            : isDarkBowl
              ? '#494F56'
              : '#4E823C';

    return (
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
        <ellipse cx="24" cy="41" rx="11" ry="3" fill="#1F2823" opacity="0.12" />
        <path d="M17 36 L31 36 L29.5 40 L18.5 40 Z" fill={footFill} />
        <path
          d="M8 20 C8 32, 14 37, 24 37 C34 37, 40 32, 40 20 Z"
          fill={bowlBody}
          stroke={bowlStroke}
          strokeWidth="1.2"
        />
        {isKintsugi ? (
          <path
            d="M21 23 L23.5 27.5 L20.8 31.5 L24.5 36.2"
            fill="none"
            stroke="#E3B94E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M9.5 23.5 Q24 27 38.5 23.5"
            fill="none"
            stroke={bowlStripe}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        )}
        <ellipse cx="24" cy="20" rx="16" ry="5.5" fill={rimFill} stroke={bowlStroke} strokeWidth="1" />
        <ellipse
          cx="24"
          cy="20"
          rx="13.5"
          ry="4.1"
          fill={isPumpkin && !locked ? '#4F8B3C' : liquidEdge}
        />
        <ellipse
          cx="24"
          cy="19.7"
          rx="11.5"
          ry="3.2"
          fill={isPumpkin && !locked ? '#E58A35' : liquid}
        />
        {isPumpkin && !locked && (
          <path
            d="M25 18.8 L37.5 14.2"
            stroke="#7A4421"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}
        <ellipse cx="21.5" cy="19.3" rx="4.5" ry="1.2" fill="#FFFFFF" opacity="0.32" />
      </svg>
    );
  }

  if (tea.vesselStyle === 'glass') {
    const showIce = tea.id === 'uji-shizuku-ice';
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
        <ellipse cx="24" cy="42" rx="10" ry="2.6" fill="#1F2823" opacity="0.12" />
        <path
          d="M14 14 L34 14 L31.5 39 C31.3 40.5 28 41.5 24 41.5 C20 41.5 16.7 40.5 16.5 39 Z"
          fill="#F5F8F6"
          stroke="#C2CECA"
          strokeWidth="1.3"
        />
        <path
          d="M15.4 20 L32.6 20 L30.8 38.2 C30.6 39.2 27.6 40 24 40 C20.4 40 17.4 39.2 17.2 38.2 Z"
          fill={liquidEdge}
          opacity="0.92"
        />
        {showIce && (
          <g fill="#E5F4EC" opacity="0.58" stroke="#FFFFFF" strokeWidth="0.6">
            <rect x="18.5" y="21" width="5" height="5" rx="1" transform="rotate(-12 21 23.5)" />
            <rect x="24.5" y="22.5" width="4.8" height="4.8" rx="1" transform="rotate(14 26.9 24.9)" />
          </g>
        )}
        <ellipse cx="24" cy="20" rx="8.6" ry="2.4" fill={liquid} />
        <ellipse cx="24" cy="14" rx="10" ry="2.8" fill="none" stroke="#B7C5C0" strokeWidth="1.3" />
        <path d="M18 17 L19.2 36" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
      <ellipse cx="24" cy="41.5" rx="10" ry="2.8" fill="#1F2823" opacity="0.12" />
      <path
        d="M13 14 L35 14 L33.5 37 C33.2 39.2 29 40.5 24 40.5 C19 40.5 14.8 39.2 14.5 37 Z"
        fill="#F4F1E8"
        stroke="#D0CCC0"
        strokeWidth="1.2"
      />
      <path
        d="M14.3 31.5 Q24 34 33.7 31.5"
        fill="none"
        stroke="#88B07B"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="14" rx="11" ry="3.2" fill="#ECE8DC" stroke="#D0CCC0" strokeWidth="1.1" />
      <ellipse cx="24" cy="14.2" rx="9.2" ry="2.4" fill={liquidEdge} />
      <ellipse cx="24" cy="14" rx="7.6" ry="1.8" fill={liquid} />
    </svg>
  );
});

const MODAL_EASE = [0.16, 1, 0.3, 1] as const;

interface TeaRecipeRowProps {
  tea: TeaType;
  unlocked: boolean;
  isSelected: boolean;
  isGuestMatch: boolean;
  onSelectAndStart: (tea: TeaType) => void;
}

const TeaRecipeRow: React.FC<TeaRecipeRowProps> = React.memo(
  ({tea, unlocked, isSelected, isGuestMatch, onSelectAndStart}) => {
    const reward = getTeaRewardPreview(tea);
    return (
      <motion.button
        type="button"
        disabled={!unlocked}
        onClick={() => onSelectAndStart(tea)}
        whileTap={unlocked ? {scale: 0.97} : {x: [0, -3, 3, 0]}}
        transition={{duration: 0.14}}
        style={{contain: 'layout style paint'}}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] px-3.5 py-2.5 text-left transition-colors ${
          !unlocked
            ? 'border-[#DCD9CE] bg-[#F2EFE6] opacity-78 cursor-not-allowed'
            : isSelected
              ? 'border-[#4D9256] bg-[#F6FBF3] shadow-xs'
              : 'border-[#C9DFBE] bg-white hover:border-[#6EA86F] hover:bg-[#F9FCF7]'
        }`}
      >
        <div className="relative shrink-0">
          <TeaVesselIcon tea={tea} locked={!unlocked} />
          {!unlocked && (
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3A403B] text-white">
              <Lock className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm sm:text-base font-bold text-[#255F30] truncate">
            {tea.name}
          </p>
          <p className="mt-0.5 text-xs text-[#6B736A] truncate">
            {unlocked
              ? `${tea.idealTempLabel} · แช่ ${tea.idealSteepMin}–${tea.idealSteepMax} วิ · ${getEquipmentInfo(tea.equipmentId).name}`
              : `ปลดล็อกที่ Lv.${tea.unlockLevel}`}
          </p>
          {unlocked && (
            <p className="mt-0.5 text-[11px] text-[#4C5C4F] truncate">
              วัตถุดิบ: {tea.baseIngredients.join(' · ')}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            {isGuestMatch ? (
              <span className="inline-block rounded-full bg-[#2E6F40] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                แขกกำลังสั่ง
              </span>
            ) : tea.unlockLevel >= 4 ? (
              <span className="inline-block rounded-full bg-[#B95B24] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                สูตรพิเศษ Lv.{tea.unlockLevel}
              </span>
            ) : (
              <span className="inline-block rounded-full bg-[#2B2E29] px-2.5 py-0.5 text-[11px] font-medium text-[#F3F1EC]">
                {tea.categoryLabel}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 font-display">
          <p className="text-sm sm:text-base font-bold text-[#2E6B38] leading-tight">
            +{reward.warmth} แต้ม
          </p>
          <p className="text-xs sm:text-sm font-bold text-[#2E6B38] leading-tight mt-0.5">
            +{reward.xp} XP
          </p>
        </div>
      </motion.button>
    );
  },
);

export const TeaSelectorModal: React.FC<TeaSelectorModalProps> = React.memo(({
  playerLevel,
  selectedTeaId,
  categoryFilter,
  onCategoryChange,
  recommendedTeaIds,
  onSelectAndStart,
  onClose,
}) => {
  const activeCat = CATEGORIES.find((c) => c.id === categoryFilter) ?? CATEGORIES[0];
  const visibleTeas = React.useMemo(
    () =>
      categoryFilter === 'all'
        ? TEAS
        : TEAS.filter((tea) => tea.category === categoryFilter),
    [categoryFilter],
  );

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.16, ease: 'easeOut'}}
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-4"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tea-selector-title"
        initial={{opacity: 0, scale: 0.94, y: 18}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.95, y: 14}}
        transition={{duration: 0.24, ease: MODAL_EASE}}
        className="pointer-events-auto flex w-full max-w-[440px] max-h-[82dvh] flex-col rounded-[24px] border-2 border-[#C5DCBA] bg-[#FDFCF7]/98 shadow-2xl overflow-hidden will-change-transform"
        style={{contain: 'layout style paint'}}
      >
        {/* Header matching reference card */}
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
          <AnimatePresence mode="wait">
            <motion.h2
              key={activeCat.id}
              id="tea-selector-title"
              initial={{opacity: 0, x: -6}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 6}}
              transition={{duration: 0.14, ease: MODAL_EASE}}
              className="font-display text-lg sm:text-xl font-bold text-[#2D6835]"
            >
              {activeCat.modalTitle}
            </motion.h2>
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{scale: 0.92}}
            transition={{type: 'spring', stiffness: 420, damping: 26}}
            aria-label="ซ่อนหน้าต่างเลือกชา"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E6E4DD] text-[#2A312C] hover:bg-[#DAD7CE] shrink-0"
          >
            <X className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          </motion.button>
        </div>

        {/* Category Filter Strip with Sliding Pill */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2.5 touch-pan-x">
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{scale: 0.95}}
                onClick={() => onCategoryChange(cat.id)}
                className="relative min-h-[36px] rounded-xl px-2.5 text-xs font-medium whitespace-nowrap shrink-0"
              >
                {active && (
                  <motion.span
                    layoutId="tea-selector-category-pill"
                    transition={{type: 'spring', stiffness: 440, damping: 32}}
                    className="absolute inset-0 rounded-xl bg-[#2E6F40]"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? 'text-white' : 'text-[#4A534D]'
                  }`}
                >
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Vertical Scrollable Recipe Cards (single compositor transition per filter switch) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <motion.div
            key={categoryFilter}
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.18, ease: MODAL_EASE}}
            className="space-y-2.5 will-change-transform"
          >
            {visibleTeas.map((tea) => {
              const unlocked = isTeaUnlocked(tea, playerLevel);
              const isSelected = tea.id === selectedTeaId;
              const isGuestMatch =
                unlocked &&
                Boolean(recommendedTeaIds && recommendedTeaIds.includes(tea.id));
              return (
                <TeaRecipeRow
                  key={tea.id}
                  tea={tea}
                  unlocked={unlocked}
                  isSelected={isSelected}
                  isGuestMatch={isGuestMatch}
                  onSelectAndStart={onSelectAndStart}
                />
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});
