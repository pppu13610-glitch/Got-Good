import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  Droplets,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {createRandomGuestOrder} from '../data/guests';
import {
  getLevelFromXp,
  getNewlyUnlockedTeas,
  getXpProgress,
  isTeaUnlocked,
} from '../data/progression';
import {
  getEquipmentInfo,
  getStrengthLabel,
  TEAS,
  TOPPINGS,
  WATER_TEMPS,
} from '../data/teas';
import {
  BrewResult,
  BrewStep,
  CameraPreset,
  GameMode,
  GameSettings,
  GuestOrder,
  JournalRecord,
  TeaCategory,
  TeaType,
  ToppingId,
  WaterTemp,
} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';
import {TeaScene3D} from './TeaScene3D';
import {TeaSelectorModal} from './TeaSelectorModal';

interface BrewingStationProps {
  playerXp: number;
  playerLevel: number;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  cameraPreset: CameraPreset;
  settings: GameSettings;
  onBrewComplete: (
    record: JournalRecord,
    warmthEarned: number,
    xpEarned: number,
  ) => void;
}

const MAX_STEEP_DISPLAY = 8;

export const BrewingStation: React.FC<BrewingStationProps> = ({
  playerXp,
  playerLevel,
  mode,
  onModeChange,
  cameraPreset,
  settings,
  onBrewComplete,
}) => {
  const [step, setStep] = useState<BrewStep>('SELECT_TEA');
  const [selectorOpen, setSelectorOpen] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | TeaCategory>(
    'all',
  );
  const [selectedTea, setSelectedTea] = useState<TeaType>(TEAS[0]);
  const [waterTemp, setWaterTemp] = useState<WaterTemp>(TEAS[0].idealTemp);
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [steepSeconds, setSteepSeconds] = useState<number>(0);
  const [toppings, setToppings] = useState<ToppingId[]>([]);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [guestOrder, setGuestOrder] = useState<GuestOrder>(() =>
    createRandomGuestOrder(playerLevel),
  );
  const [portraitFailed, setPortraitFailed] = useState<Record<string, boolean>>(
    {},
  );
  const [brewResult, setBrewResult] = useState<BrewResult | null>(null);

  const sweetSpotChimedRef = useRef(false);
  const pourIntervalRef = useRef<number | null>(null);
  const steepIntervalRef = useRef<number | null>(null);

  const xpInfo = useMemo(() => getXpProgress(playerXp), [playerXp]);

  const recommendedTeaIds = useMemo(() => {
    if (mode !== 'guest') return undefined;
    if (guestOrder.preferredTeaIds && guestOrder.preferredTeaIds.length > 0) {
      return guestOrder.preferredTeaIds;
    }
    if (
      guestOrder.preferredCategories &&
      guestOrder.preferredCategories.length > 0
    ) {
      return TEAS.filter((t) =>
        guestOrder.preferredCategories!.includes(t.category),
      ).map((t) => t.id);
    }
    return undefined;
  }, [mode, guestOrder]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);
      if (steepIntervalRef.current)
        window.clearInterval(steepIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== 'STEEP_TEA') {
      if (steepIntervalRef.current) {
        window.clearInterval(steepIntervalRef.current);
        steepIntervalRef.current = null;
      }
      return;
    }

    sweetSpotChimedRef.current = false;
    const start = performance.now();
    steepIntervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const capped = Math.min(10, Math.round(elapsed * 10) / 10);
      setSteepSeconds((prev) => (prev === capped ? prev : capped));

      if (
        !sweetSpotChimedRef.current &&
        capped >= selectedTea.idealSteepMin &&
        capped <= selectedTea.idealSteepMax
      ) {
        sweetSpotChimedRef.current = true;
        soundEngine.playSweetSpotChime();
      }
    }, 100);

    return () => {
      if (steepIntervalRef.current) {
        window.clearInterval(steepIntervalRef.current);
        steepIntervalRef.current = null;
      }
    };
  }, [step, selectedTea]);

  const handleSelectAndStartTea = useCallback(
    (tea: TeaType) => {
      if (!isTeaUnlocked(tea, playerLevel)) {
        soundEngine.playTap();
        return;
      }
      soundEngine.unlock();
      soundEngine.playLeafDrop();
      setSelectedTea(tea);
      setWaterTemp(tea.idealTemp);
      setSelectorOpen(false);
      setStep('POUR_WATER');
    },
    [playerLevel],
  );

  const handlePourWater = useCallback(() => {
    if (isPouring || step !== 'POUR_WATER') return;
    soundEngine.unlock();
    soundEngine.playPourWater();
    setIsPouring(true);
    setWaterLevel(0.05);
    setSteepSeconds(0);

    const start = performance.now();
    const duration = 1250;
    if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);

    pourIntervalRef.current = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      setWaterLevel(0.05 + progress * 0.95);
      if (progress >= 1) {
        if (pourIntervalRef.current) {
          window.clearInterval(pourIntervalRef.current);
          pourIntervalRef.current = null;
        }
        setIsPouring(false);
        setStep('STEEP_TEA');
      }
    }, 34);
  }, [isPouring, step]);

  const handleFinishSteep = useCallback(() => {
    if (step !== 'STEEP_TEA') return;
    soundEngine.playTap();
    setStep('ADD_TOPPING');
  }, [step]);

  const handleToggleTopping = (id: ToppingId) => {
    soundEngine.playTap();
    setToppings((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], id];
      }
      return [...prev, id];
    });
  };

  const handleApplyRecommendedToppings = () => {
    soundEngine.playTap();
    setToppings(selectedTea.recommendedToppings.slice(0, 3));
  };

  const handleServeCup = () => {
    soundEngine.playServeChime();

    const strengthLabel = getStrengthLabel(selectedTea, steepSeconds);
    const tempMatched = waterTemp === selectedTea.idealTemp;
    const steepMatched =
      steepSeconds >= selectedTea.idealSteepMin &&
      steepSeconds <= selectedTea.idealSteepMax;

    let harmonyScore = 1;
    if (tempMatched) harmonyScore += 1;
    if (steepMatched) harmonyScore += 1;

    let harmonyTitle = 'อบอุ่นเรียบง่าย';
    let harmonyMessage = 'รสชาติสบายๆ เป็นกันเอง ดื่มได้เพลินๆ';
    if (harmonyScore === 3) {
      harmonyTitle = 'กลมกล่อมลงตัว';
      harmonyMessage = 'อุณหภูมิและเวลาแช่พอดีเป๊ะ กลิ่นชาหอมละมุนที่สุด';
    } else if (harmonyScore === 2) {
      harmonyTitle = 'หอมละมุนกำลังดี';
      harmonyMessage = tempMatched
        ? 'อุณหภูมิน้ำเหมาะเจาะ รสชาติดื่มง่ายสบายใจ'
        : 'แช่ชาได้เวลาพอดี สีสวยใสชวนผ่อนคลาย';
    }

    let guestMatched: boolean | undefined;
    let guestReply: string | undefined;
    let guestName: string | undefined;

    if (mode === 'guest') {
      guestName = guestOrder.guest.name;
      const catOk =
        !guestOrder.preferredCategories ||
        guestOrder.preferredCategories.includes(selectedTea.category);
      const idOk =
        !guestOrder.preferredTeaIds ||
        guestOrder.preferredTeaIds.includes(selectedTea.id);
      const tempOk =
        !guestOrder.preferredTemp ||
        (guestOrder.preferredTemp === 'iced'
          ? toppings.includes('ice')
          : !toppings.includes('ice'));
      const toppingOk =
        !guestOrder.preferredToppings ||
        guestOrder.preferredToppings.some((t) => toppings.includes(t));

      guestMatched = catOk && idOk && (tempOk || toppingOk);
      guestReply = guestMatched
        ? guestOrder.happyReply
        : guestOrder.gentleReply;
    }

    const tierBonus = (selectedTea.unlockLevel - 1) * 5;
    const warmthEarned =
      10 + tierBonus + harmonyScore * 5 + (guestMatched ? 10 : 0);
    const xpEarned = 25 + tierBonus + harmonyScore * 5 + (guestMatched ? 15 : 0);
    const nextLevel = getLevelFromXp(playerXp + xpEarned);
    const newlyUnlockedTeas = getNewlyUnlockedTeas(playerLevel, nextLevel);

    const nowIso = new Date().toISOString();
    const result: BrewResult = {
      tea: selectedTea,
      waterTemp,
      steepSeconds: Number(steepSeconds.toFixed(1)),
      strengthLabel,
      toppings,
      harmonyScore,
      harmonyTitle,
      harmonyMessage,
      guestMatched,
      guestReply,
      guestName,
      warmthEarned,
      xpEarned,
      leveledUpTo: nextLevel > playerLevel ? nextLevel : undefined,
      newlyUnlockedTeas,
      brewedAt: nowIso,
    };

    const journalRecord: JournalRecord = {
      id: `cup-${Date.now()}`,
      teaId: selectedTea.id,
      teaName: selectedTea.name,
      waterTemp,
      steepSeconds: Number(steepSeconds.toFixed(1)),
      strengthLabel,
      toppings,
      harmonyTitle,
      guestName,
      xpEarned,
      brewedAt: nowIso,
    };

    setBrewResult(result);
    setStep('SERVED');
    onBrewComplete(journalRecord, warmthEarned, xpEarned);
  };

  const handleResetCup = (advanceGuest = true) => {
    soundEngine.playTap();
    if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);
    if (steepIntervalRef.current) window.clearInterval(steepIntervalRef.current);
    setIsPouring(false);
    setWaterLevel(0);
    setSteepSeconds(0);
    setToppings([]);
    setBrewResult(null);
    setStep('SELECT_TEA');
    setSelectorOpen(true);
    if (mode === 'guest' && advanceGuest) {
      const nextLvl = getLevelFromXp(playerXp);
      setGuestOrder((prev) => createRandomGuestOrder(nextLvl, prev.guest.id));
    }
  };

  const handleSwapGuest = () => {
    soundEngine.playTap();
    setGuestOrder((prev) => createRandomGuestOrder(playerLevel, prev.guest.id));
  };

  const strengthLabel = getStrengthLabel(selectedTea, steepSeconds);
  const activeEquipment = useMemo(
    () => getEquipmentInfo(selectedTea.equipmentId),
    [selectedTea.equipmentId],
  );
  const steepProgressRatio = Math.min(1, steepSeconds / MAX_STEEP_DISPLAY);
  const sweetMinPct = (selectedTea.idealSteepMin / MAX_STEEP_DISPLAY) * 100;
  const sweetMaxPct = (selectedTea.idealSteepMax / MAX_STEEP_DISPLAY) * 100;

  const isColorMagic =
    selectedTea.id === 'butterfly-pea' && toppings.includes('lemon');

  const stepIndex =
    step === 'SELECT_TEA'
      ? 1
      : step === 'POUR_WATER'
        ? 2
        : step === 'STEEP_TEA'
          ? 3
          : step === 'ADD_TOPPING'
            ? 4
            : 5;

  return (
    <div className="relative h-dvh min-h-[290px] w-full overflow-hidden bg-[#D8DFD5]">
      {/* Full-Viewport 3D Tea Pavilion */}
      <div className="absolute inset-0">
        <TeaScene3D
          tea={selectedTea}
          step={step}
          waterLevel={waterLevel}
          steepSeconds={steepSeconds}
          toppings={toppings}
          isPouring={isPouring}
          cameraPreset={cameraPreset}
          settings={settings}
          onKettleClick={handlePourWater}
          onVesselClick={handleFinishSteep}
        />
      </div>

      {/* Top Landscape HUD Bar (Top-left status + guest wish; top-right reserved for 3-bar CornerMenu) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-3.5 pr-16 safe-px">
        {/* Top-Left: Level + Mode + Compact Guest Wish */}
        <div className="pointer-events-auto flex flex-col gap-1.5 max-w-[54vw] sm:max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 px-2.5 py-1 shadow-xs">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-xs sm:text-sm font-semibold text-[#1F2823] whitespace-nowrap">
                  Lv.{xpInfo.level}
                </span>
                <span className="hidden md:inline text-xs font-medium text-[#2E6F40] truncate">
                  {xpInfo.title}
                </span>
                <span className="font-mono-num text-[11px] text-[#5A655D] whitespace-nowrap">
                  {xpInfo.nextLevelXp !== null
                    ? `${xpInfo.currentLevelXp}/${xpInfo.nextLevelXp}`
                    : 'MAX'}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-20 sm:w-28 overflow-hidden rounded-full bg-[#1F2823]/12">
                <motion.div
                  className="h-full w-full origin-left rounded-full bg-[#2E6F40]"
                  animate={{scaleX: Math.max(0.02, xpInfo.progressRatio)}}
                  transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-[#EAE6DC] p-0.5">
              {(
                [
                  {id: 'guest', label: 'รับรองแขก'},
                  {id: 'free', label: 'ชงตามใจ'},
                ] as const
              ).map((m) => (
                <motion.button
                  key={m.id}
                  type="button"
                  whileTap={{scale: 0.94}}
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playTap();
                    onModeChange(m.id);
                  }}
                  className="relative min-h-[38px] sm:min-h-[40px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap shrink-0"
                >
                  {mode === m.id && (
                    <motion.span
                      layoutId="hud-mode-pill"
                      transition={{type: 'spring', stiffness: 420, damping: 30}}
                      className="absolute inset-0 rounded-md bg-white shadow-xs"
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      mode === m.id ? 'text-[#1F2823]' : 'text-[#4A534D]'
                    }`}
                  >
                    {m.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'guest' && (
              <motion.div
                key={`${guestOrder.guest.id}-${guestOrder.requestText}-${brewResult?.guestReply ?? 'idle'}`}
                initial={{opacity: 0, x: -16, scale: 0.96}}
                animate={{opacity: 1, x: 0, scale: 1}}
                exit={{opacity: 0, x: 12, scale: 0.96}}
                transition={{type: 'spring', stiffness: 360, damping: 28}}
                className="flex items-center gap-2.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 p-2 shadow-xs"
              >
                <div
                  className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-lg border border-[#1F2823]/10 flex items-center justify-center font-display text-sm font-semibold text-[#1F2823]"
                  style={{backgroundColor: guestOrder.guest.accentBg}}
                >
                  {!portraitFailed[guestOrder.guest.id] ? (
                    <img
                      src={guestOrder.guest.portraitUrl}
                      alt={guestOrder.guest.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPortraitFailed((prev) => ({
                          ...prev,
                          [guestOrder.guest.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{guestOrder.guest.fallbackInitial}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-semibold text-[#1F2823] truncate">
                      {guestOrder.guest.name}
                    </span>
                    {step !== 'SERVED' && (
                      <motion.button
                        type="button"
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.9}}
                        onClick={handleSwapGuest}
                        aria-label="เปลี่ยนแขก"
                        className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-[#4A534D] hover:bg-[#EAE6DC] hover:text-[#1F2823] whitespace-nowrap shrink-0"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        <span className="hidden sm:inline">เปลี่ยน</span>
                      </motion.button>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#27312B] leading-snug line-clamp-2">
                    “{brewResult?.guestReply ?? guestOrder.requestText}”
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* STEP 1: Floating Cream & Sage Recipe Selector Card (matches reference style) */}
      <AnimatePresence>
        {step === 'SELECT_TEA' && selectorOpen && (
          <TeaSelectorModal
            key="tea-selector-modal"
            playerLevel={playerLevel}
            selectedTeaId={selectedTea.id}
            categoryFilter={categoryFilter}
            onCategoryChange={(cat) => {
              soundEngine.playTap();
              setCategoryFilter(cat);
            }}
            recommendedTeaIds={recommendedTeaIds}
            onSelectAndStart={handleSelectAndStartTea}
            onClose={() => {
              soundEngine.playTap();
              setSelectorOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reopen Recipe Card button when minimized to peek at 3D scene */}
      <AnimatePresence>
        {step === 'SELECT_TEA' && !selectorOpen && (
          <motion.div
            key="reopen-tea-selector"
            initial={{opacity: 0, y: 20, scale: 0.94}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 16, scale: 0.94}}
            transition={{type: 'spring', stiffness: 380, damping: 28}}
            className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center safe-px safe-pb"
          >
            <motion.button
              type="button"
              whileHover={{scale: 1.03, y: -1}}
              whileTap={{scale: 0.94}}
              transition={{type: 'spring', stiffness: 420, damping: 24}}
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playTap();
                setSelectorOpen(true);
              }}
              className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-2 border-[#C5DCBA] bg-[#FDFCF7]/96 px-6 text-sm font-bold text-[#2D6835] shadow-lg hover:bg-white"
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              <span>เลือกใบชาที่จะชง</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Bottom Thumb Dock for Steps 2–5 (Slim & Unobtrusive) */}
      <AnimatePresence>
        {step !== 'SELECT_TEA' && (
          <motion.div
            key="brewing-dock"
            initial={{opacity: 0, y: 28}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 24}}
            transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center safe-px safe-pb will-change-transform"
          >
            <motion.div
              className="flex w-full flex-col items-center will-change-transform"
              animate={{
                y: dockCollapsed ? 'calc(100% - 36px)' : 0,
              }}
              transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
            >
              {/* Collapse Toggle Tab */}
              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                onClick={() => {
                  soundEngine.playTap();
                  setDockCollapsed((prev) => !prev);
                }}
                className="pointer-events-auto inline-flex min-h-[34px] items-center gap-1.5 rounded-t-xl border border-b-0 border-[#1F2823]/12 bg-[#FAF9F6]/96 px-4 text-xs font-medium text-[#39423C] shadow-xs"
              >
                {dockCollapsed ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>เปิดแผงชงชา</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>พับแผงชงชา</span>
                  </>
                )}
              </motion.button>

              {/* Thumb-Ergonomic Dock Panel */}
              <div className="pointer-events-auto w-full max-w-[740px] rounded-2xl border border-[#1F2823]/12 bg-[#FAF9F6]/96 px-3 py-2 sm:px-4 sm:py-3 shadow-md overflow-hidden">
                {/* Compact Info & Stepper Line */}
                <div className="flex items-center justify-between gap-2 border-b border-[#1F2823]/10 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full border border-black/15 shrink-0"
                      style={{backgroundColor: selectedTea.richColor}}
                      aria-hidden="true"
                    />
                    <span className="font-display text-xs sm:text-sm font-semibold text-[#1F2823] truncate">
                      {selectedTea.name}
                    </span>
                    <span className="hidden sm:inline text-xs text-[#5A655D] truncate">
                      {activeEquipment.name} · {selectedTea.idealTempLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs shrink-0">
                    <span className="text-[#68726B]">1.ชา</span>
                    <span className="text-[#C2C7C1]">/</span>
                    <span
                      className={
                        stepIndex === 2
                          ? 'font-semibold text-[#2E6F40]'
                          : 'text-[#68726B]'
                      }
                    >
                      2.น้ำ
                    </span>
                    <span className="text-[#C2C7C1]">/</span>
                    <span
                      className={
                        stepIndex === 3
                          ? 'font-semibold text-[#2E6F40]'
                          : 'text-[#68726B]'
                      }
                    >
                      3.แช่
                    </span>
                    <span className="text-[#C2C7C1]">/</span>
                    <span
                      className={
                        stepIndex >= 4
                          ? 'font-semibold text-[#2E6F40]'
                          : 'text-[#68726B]'
                      }
                    >
                      4.เสิร์ฟ
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {/* STEP 2: POUR WATER */}
                  {step === 'POUR_WATER' && (
                    <motion.div
                      key="step-pour-water"
                      initial={{opacity: 0, x: 16}}
                      animate={{opacity: 1, x: 0}}
                      exit={{opacity: 0, x: -16}}
                      transition={{type: 'spring', stiffness: 380, damping: 28}}
                      className="mt-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x">
                        <motion.button
                          type="button"
                          disabled={isPouring}
                          whileTap={{scale: 0.93}}
                          onClick={() => {
                            soundEngine.playTap();
                            setStep('SELECT_TEA');
                            setSelectorOpen(true);
                          }}
                          aria-label="กลับไปเลือกชา"
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border border-[#1F2823]/15 bg-white px-3 text-xs font-medium text-[#4A534D] disabled:opacity-40 shrink-0"
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                          <span className="hidden sm:inline">เปลี่ยนชา</span>
                        </motion.button>

                        {WATER_TEMPS.map((temp) => {
                          const isSelected = waterTemp === temp.id;
                          const isIdeal = selectedTea.idealTemp === temp.id;
                          return (
                            <motion.button
                              key={temp.id}
                              type="button"
                              disabled={isPouring}
                              whileTap={{scale: 0.94}}
                              onClick={() => {
                                soundEngine.playTap();
                                setWaterTemp(temp.id);
                              }}
                              className={`min-h-[44px] rounded-xl border px-3 text-xs font-medium whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                                  : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                              }`}
                            >
                              {temp.tempC}°C{isIdeal ? ' · แนะนำ' : ''}
                            </motion.button>
                          );
                        })}
                      </div>

                      <motion.button
                        type="button"
                        onClick={handlePourWater}
                        disabled={isPouring}
                        whileHover={!isPouring ? {scale: 1.03} : undefined}
                        whileTap={!isPouring ? {scale: 0.94} : undefined}
                        transition={{type: 'spring', stiffness: 420, damping: 24}}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#2E6F40] px-5 text-sm font-medium text-white hover:bg-[#245732] disabled:bg-[#5B8767] whitespace-nowrap shrink-0"
                      >
                        <Droplets className="h-4 w-4" aria-hidden="true" />
                        <span>{isPouring ? 'กำลังริน...' : 'รินน้ำร้อน'}</span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* STEP 3: STEEP TEA */}
                  {step === 'STEEP_TEA' && (
                    <motion.div
                      key="step-steep-tea"
                      initial={{opacity: 0, x: 16}}
                      animate={{opacity: 1, x: 0}}
                      exit={{opacity: 0, x: -16}}
                      transition={{type: 'spring', stiffness: 380, damping: 28}}
                      className="mt-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[#1F2823] truncate">
                            {strengthLabel} · {activeEquipment.actionLabel}
                          </span>
                          <span className="font-mono-num text-[11px] text-[#5A655D] whitespace-nowrap">
                            {steepSeconds.toFixed(1)}s (พอดี {selectedTea.idealSteepMin}–
                            {selectedTea.idealSteepMax}s)
                          </span>
                        </div>
                        <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-[#1F2823]/12">
                          <div
                            className="absolute inset-y-0 bg-[#2E6F40]/30 border-x border-[#2E6F40]"
                            style={{
                              left: `${sweetMinPct}%`,
                              width: `${sweetMaxPct - sweetMinPct}%`,
                            }}
                          />
                          <div
                            className="h-full w-full origin-left rounded-full bg-[#C9822B] transition-transform duration-100 will-change-transform"
                            style={{transform: `scaleX(${steepProgressRatio})`}}
                          />
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.94}}
                        transition={{type: 'spring', stiffness: 420, damping: 24}}
                        onClick={handleFinishSteep}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#C9822B] px-5 text-sm font-medium text-white hover:bg-[#AF6E1F] whitespace-nowrap shrink-0"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>{activeEquipment.finishSteepLabel}</span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* STEP 4: ADD TOPPINGS */}
                  {step === 'ADD_TOPPING' && (
                    <motion.div
                      key="step-add-topping"
                      initial={{opacity: 0, x: 16}}
                      animate={{opacity: 1, x: 0}}
                      exit={{opacity: 0, x: -16}}
                      transition={{type: 'spring', stiffness: 380, damping: 28}}
                      className="mt-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 touch-pan-x">
                        <motion.button
                          type="button"
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.92}}
                          transition={{type: 'spring', stiffness: 420, damping: 24}}
                          onClick={handleApplyRecommendedToppings}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#2E6F40]/40 bg-[#EFF6EE] px-3 text-xs font-semibold text-[#255F30] whitespace-nowrap shrink-0"
                        >
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>ใส่ตามสูตร</span>
                        </motion.button>

                        {TOPPINGS.map((item) => {
                          const active = toppings.includes(item.id);
                          const isRec =
                            selectedTea.recommendedToppings.includes(item.id);
                          return (
                            <motion.button
                              key={item.id}
                              type="button"
                              whileHover={{scale: 1.03}}
                              whileTap={{scale: 0.92}}
                              animate={{scale: active ? 1.02 : 1}}
                              transition={{type: 'spring', stiffness: 420, damping: 24}}
                              onClick={() => handleToggleTopping(item.id)}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-xs font-medium whitespace-nowrap shrink-0 ${
                                active
                                  ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                                  : isRec
                                    ? 'border-[#8EB889] bg-[#FAFDF8] text-[#27462B]'
                                    : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                              }`}
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-black/15"
                                style={{backgroundColor: item.swatch}}
                                aria-hidden="true"
                              />
                              <span>{item.name}</span>
                            </motion.button>
                          );
                        })}
                        <AnimatePresence>
                          {isColorMagic && (
                            <motion.span
                              initial={{opacity: 0, scale: 0.8}}
                              animate={{opacity: 1, scale: 1}}
                              exit={{opacity: 0, scale: 0.8}}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#7A3F8E] whitespace-nowrap px-1"
                            >
                              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                              สีม่วงแล้ว!
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.94}}
                        transition={{type: 'spring', stiffness: 420, damping: 24}}
                        onClick={handleServeCup}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#2E6F40] px-5 text-sm font-medium text-white hover:bg-[#245732] whitespace-nowrap shrink-0"
                      >
                        <Coffee className="h-4 w-4" aria-hidden="true" />
                        <span>เสิร์ฟชา</span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* STEP 5: SERVED */}
                  {step === 'SERVED' && brewResult && (
                    <motion.div
                      key="step-served"
                      initial={{opacity: 0, scale: 0.96, y: 10}}
                      animate={{opacity: 1, scale: 1, y: 0}}
                      exit={{opacity: 0, scale: 0.96, y: -10}}
                      transition={{type: 'spring', stiffness: 380, damping: 26}}
                      className="mt-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm sm:text-base font-semibold text-[#1F2823]">
                            {brewResult.harmonyTitle}
                          </span>
                          <span className="font-mono-num text-xs font-medium text-[#2E6F40]">
                            +{brewResult.xpEarned} XP · +{brewResult.warmthEarned} แต้ม
                          </span>
                        </div>
                        <p className="text-xs text-[#4A534D] truncate">
                          {brewResult.leveledUpTo
                            ? `เลื่อนระดับเป็น Lv.${brewResult.leveledUpTo}! ${
                                brewResult.newlyUnlockedTeas.length > 0
                                  ? `ปลดล็อก ${brewResult.newlyUnlockedTeas
                                      .map((t) => t.name)
                                      .join(', ')}`
                                  : ''
                              }`
                            : brewResult.harmonyMessage}
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.94}}
                        transition={{type: 'spring', stiffness: 420, damping: 24}}
                        onClick={() => handleResetCup(true)}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#233029] px-5 text-sm font-medium text-white hover:bg-[#19231E] whitespace-nowrap shrink-0"
                      >
                        <Coffee className="h-4 w-4" aria-hidden="true" />
                        <span>ชงถ้วยถัดไป</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
