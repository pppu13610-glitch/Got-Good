import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  Droplets,
  Footprints,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {createRandomGuestOrder} from '../data/guests';
import {
  getLevelFromXp,
  getNewlyUnlockedTeas,
  getUnlockedTeas,
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
  CustomerPhase,
  GameMode,
  GameSettings,
  GuestOrder,
  JournalRecord,
  PlayerMoveInput,
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
  settings: GameSettings;
  onOpenTeaMenu?: () => void;
  onActiveOrderChange?: (info: {teaId: string; guestName: string} | null) => void;
  quickBrewRequest?: {tea: TeaType; requestKey: number} | null;
  onGuestVisited: (guestId: string) => void;
  onBrewComplete: (
    record: JournalRecord,
    warmthEarned: number,
    xpEarned: number,
    guestId?: string,
  ) => void;
}

const MAX_STEEP_DISPLAY = 8;

export const BrewingStation: React.FC<BrewingStationProps> = ({
  playerXp,
  playerLevel,
  mode,
  onModeChange,
  settings,
  onOpenTeaMenu,
  onActiveOrderChange,
  quickBrewRequest,
  onGuestVisited,
  onBrewComplete,
}) => {
  const [step, setStep] = useState<BrewStep>('EXPLORE_SHOP');
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
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
  const [customerSequenceKey, setCustomerSequenceKey] = useState<number>(1);
  const [customerPhase, setCustomerPhase] = useState<CustomerPhase>('ENTERING');
  const [arrivalAlertVisible, setArrivalAlertVisible] = useState<boolean>(false);
  const [isNearTeaTable, setIsNearTeaTable] = useState<boolean>(false);
  const [portraitFailed, setPortraitFailed] = useState<Record<string, boolean>>(
    {},
  );
  const [brewResult, setBrewResult] = useState<BrewResult | null>(null);

  // Free-walking movement state (ref avoids React re-render per frame)
  const playerMoveRef = useRef<PlayerMoveInput>({x: 0, y: 0});
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);
  const joystickPointerIdRef = useRef<number | null>(null);

  const sweetSpotChimedRef = useRef(false);
  const pourIntervalRef = useRef<number | null>(null);
  const steepIntervalRef = useRef<number | null>(null);
  const arrivalTimerRef = useRef<number | null>(null);

  const xpInfo = useMemo(() => getXpProgress(playerXp), [playerXp]);
  const unlockedTeas = useMemo(
    () => getUnlockedTeas(playerLevel),
    [playerLevel],
  );
  const lastHandledQuickBrewKeyRef = useRef<number>(0);

  const orderedTeaId = useMemo(() => {
    const primaryId = guestOrder.preferredTeaIds?.[0];
    const match = primaryId ? TEAS.find((t) => t.id === primaryId) : undefined;
    if (match && isTeaUnlocked(match, playerLevel)) {
      return match.id;
    }
    return unlockedTeas[0]?.id ?? TEAS[0].id;
  }, [guestOrder.preferredTeaIds, playerLevel, unlockedTeas]);

  const recommendedTeaIds = useMemo(() => {
    if (mode !== 'guest') return undefined;
    return [orderedTeaId];
  }, [mode, orderedTeaId]);

  // Safeguard if save progress resets below the currently displayed tea/order level
  useEffect(() => {
    const orderedTeaObj = guestOrder.preferredTeaIds?.[0]
      ? TEAS.find((t) => t.id === guestOrder.preferredTeaIds![0])
      : undefined;
    if (!orderedTeaObj || !isTeaUnlocked(orderedTeaObj, playerLevel)) {
      setGuestOrder((prev) => createRandomGuestOrder(playerLevel, prev.guest.id));
    }
    if (!isTeaUnlocked(selectedTea, playerLevel)) {
      setSelectedTea(TEAS[0]);
      setWaterTemp(TEAS[0].idealTemp);
    }
  }, [guestOrder.preferredTeaIds, playerLevel, selectedTea]);

  // Keep parent App synchronized with current single ordered tea for Menu Board highlighting
  useEffect(() => {
    if (!onActiveOrderChange) return;
    if (mode === 'guest') {
      onActiveOrderChange({
        teaId: orderedTeaId,
        guestName: guestOrder.guest.name,
      });
    } else {
      onActiveOrderChange(null);
    }
  }, [mode, orderedTeaId, guestOrder.guest.name, onActiveOrderChange]);

  useEffect(() => {
    return () => {
      onActiveOrderChange?.(null);
    };
  }, [onActiveOrderChange]);

  // Allow quick-starting a brew directly from the Tea Menu Board modal
  useEffect(() => {
    if (!quickBrewRequest) return;
    if (quickBrewRequest.requestKey === lastHandledQuickBrewKeyRef.current) {
      return;
    }
    lastHandledQuickBrewKeyRef.current = quickBrewRequest.requestKey;
    const tea = quickBrewRequest.tea;
    if (!isTeaUnlocked(tea, playerLevel)) return;

    if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);
    if (steepIntervalRef.current) window.clearInterval(steepIntervalRef.current);
    soundEngine.unlock();
    soundEngine.playLeafDrop();
    playerMoveRef.current = {x: 0, y: 0};
    setIsPouring(false);
    setWaterLevel(0);
    setSteepSeconds(0);
    setToppings([]);
    setBrewResult(null);
    setSelectedTea(tea);
    setWaterTemp(tea.idealTemp);
    setSelectorOpen(false);
    setStep('POUR_WATER');
  }, [quickBrewRequest, playerLevel]);

  // Explicit single unlocked ordered menu item shown cleanly in Customer Order card
  const orderedMenuSummary = useMemo(() => {
    const orderedTea =
      TEAS.find((t) => t.id === orderedTeaId) ?? unlockedTeas[0] ?? TEAS[0];

    const orderedToppings = (guestOrder.preferredToppings ?? [])
      .map((id) => TOPPINGS.find((t) => t.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    const tempLabel =
      guestOrder.preferredTemp === 'iced'
        ? 'เสิร์ฟเย็น (ใส่น้ำแข็ง)'
        : guestOrder.preferredTemp === 'hot'
          ? 'เสิร์ฟร้อน'
          : 'ร้อนหรือเย็นก็ได้';

    return {
      teaName: orderedTea.name,
      toppingNames: orderedToppings,
      tempLabel,
    };
  }, [orderedTeaId, unlockedTeas, guestOrder.preferredToppings, guestOrder.preferredTemp]);

  const handleOpenBrewingFromTable = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playTap();
    playerMoveRef.current = {x: 0, y: 0};
    setStep('SELECT_TEA');
    setSelectorOpen(true);
  }, []);

  const handleReturnToShopExplore = useCallback(() => {
    soundEngine.playTap();
    setSelectorOpen(false);
    setStep('EXPLORE_SHOP');
  }, []);

  const handleCustomerEnteredDoor = useCallback(() => {
    soundEngine.playTap();
    onGuestVisited(guestOrder.guest.id);
    setArrivalAlertVisible(true);
    if (arrivalTimerRef.current) {
      window.clearTimeout(arrivalTimerRef.current);
    }
    arrivalTimerRef.current = window.setTimeout(() => {
      setArrivalAlertVisible(false);
    }, 3600);
  }, [guestOrder.guest.id, onGuestVisited]);

  // Also ensure seated guests in guest mode are always recorded as visited
  useEffect(() => {
    if (mode === 'guest' && customerPhase !== 'ENTERING') {
      onGuestVisited(guestOrder.guest.id);
    }
  }, [mode, customerPhase, guestOrder.guest.id, onGuestVisited]);

  // Desktop keyboard movement (WASD / Arrow keys) + E/Enter at table
  useEffect(() => {
    const syncKeyboardVector = () => {
      if (joystickPointerIdRef.current !== null) return;
      const keys = pressedKeysRef.current;
      let kx = 0;
      let ky = 0;
      if (keys.has('a') || keys.has('arrowleft')) kx -= 1;
      if (keys.has('d') || keys.has('arrowright')) kx += 1;
      if (keys.has('w') || keys.has('arrowup')) ky += 1;
      if (keys.has('s') || keys.has('arrowdown')) ky -= 1;
      playerMoveRef.current = {x: kx, y: ky};
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'h' && document.activeElement?.tagName !== 'INPUT') {
        setDockCollapsed((prev) => !prev);
        return;
      }
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          k,
        )
      ) {
        pressedKeysRef.current.add(k);
        syncKeyboardVector();
      }
      if ((k === 'e' || k === ' ') && step === 'EXPLORE_SHOP' && isNearTeaTable) {
        e.preventDefault();
        handleOpenBrewingFromTable();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (pressedKeysRef.current.delete(k)) {
        syncKeyboardVector();
      }
    };

    const clearKeys = () => {
      pressedKeysRef.current.clear();
      if (joystickPointerIdRef.current === null) {
        playerMoveRef.current = {x: 0, y: 0};
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);
      if (steepIntervalRef.current)
        window.clearInterval(steepIntervalRef.current);
      if (arrivalTimerRef.current) window.clearTimeout(arrivalTimerRef.current);
    };
  }, [step, isNearTeaTable, handleOpenBrewingFromTable]);

  // Clear movement immediately when leaving explore mode
  useEffect(() => {
    if (step !== 'EXPLORE_SHOP') {
      pressedKeysRef.current.clear();
      joystickPointerIdRef.current = null;
      playerMoveRef.current = {x: 0, y: 0};
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    }
  }, [step]);

  // Hide arrival banner when leaving guest mode
  useEffect(() => {
    if (mode !== 'guest') {
      setArrivalAlertVisible(false);
    }
  }, [mode]);

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    const knob = joystickKnobRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(22, rect.width * 0.30);

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 0.001 ? Math.cos(angle) * clampedDist : 0;
    const ky = dist > 0.001 ? Math.sin(angle) * clampedDist : 0;

    if (knob) {
      knob.style.transform = `translate3d(${kx.toFixed(1)}px, ${ky.toFixed(1)}px, 0px)`;
    }
    // Screen Y up is negative dy, world forward inputY is positive
    playerMoveRef.current = {
      x: kx / maxR,
      y: -ky / maxR,
    };
  };

  const handleJoystickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    joystickPointerIdRef.current = e.pointerId;
    soundEngine.unlock();
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joystickPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joystickPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    joystickPointerIdRef.current = null;
    playerMoveRef.current = {x: 0, y: 0};
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  };

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
    onBrewComplete(
      journalRecord,
      warmthEarned,
      xpEarned,
      mode === 'guest' ? guestOrder.guest.id : undefined,
    );
  };

  const handleResetCup = (advanceGuest = true, backToShop = true) => {
    soundEngine.playTap();
    if (pourIntervalRef.current) window.clearInterval(pourIntervalRef.current);
    if (steepIntervalRef.current) window.clearInterval(steepIntervalRef.current);
    setIsPouring(false);
    setWaterLevel(0);
    setSteepSeconds(0);
    setToppings([]);
    setBrewResult(null);
    if (backToShop) {
      setSelectorOpen(false);
      setStep('EXPLORE_SHOP');
    } else {
      setStep('SELECT_TEA');
      setSelectorOpen(true);
    }
    if (mode === 'guest' && advanceGuest) {
      const nextLvl = getLevelFromXp(playerXp);
      setCustomerPhase('ENTERING');
      setGuestOrder((prev) => createRandomGuestOrder(nextLvl, prev.guest.id));
      setCustomerSequenceKey((k) => k + 1);
    }
  };

  const handleSwapGuest = () => {
    soundEngine.playTap();
    setCustomerPhase('ENTERING');
    setGuestOrder((prev) => createRandomGuestOrder(playerLevel, prev.guest.id));
    setCustomerSequenceKey((k) => k + 1);
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
      {/* Full-Viewport 3D Tea Shop */}
      <div className="absolute inset-0">
        <TeaScene3D
          tea={selectedTea}
          step={step}
          mode={mode}
          playerLevel={playerLevel}
          orderedTeaId={mode === 'guest' ? orderedTeaId : null}
          guestId={guestOrder.guest.id}
          customerSequenceKey={customerSequenceKey}
          waterLevel={waterLevel}
          steepSeconds={steepSeconds}
          toppings={toppings}
          isPouring={isPouring}
          settings={settings}
          playerMoveRef={playerMoveRef}
          onProximityChange={setIsNearTeaTable}
          onBrewAtTableClick={handleOpenBrewingFromTable}
          onCustomerEnteredDoor={handleCustomerEnteredDoor}
          onCustomerPhaseChange={setCustomerPhase}
          onKettleClick={handlePourWater}
          onVesselClick={handleFinishSteep}
          onMenuBoardClick={onOpenTeaMenu}
        />
      </div>

      {/* Simple Customer Arrival Notification Banner */}
      <AnimatePresence>
        {mode === 'guest' && arrivalAlertVisible && (
          <motion.div
            key="guest-arrival-toast"
            initial={{opacity: 0, y: -14, scale: 0.94}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -12, scale: 0.95}}
            transition={{type: 'spring', stiffness: 400, damping: 28}}
            className="pointer-events-none fixed inset-x-0 top-3 z-30 flex justify-center px-4"
          >
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#2E6F40]/35 bg-[#FAF9F6] px-4 py-2 text-xs sm:text-sm font-bold text-[#1F2823] shadow-lg">
              <Bell className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
              <span>มีลูกค้าเข้ามาในร้าน</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Landscape HUD Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-3.5 pr-16 safe-px">
        {/* Top-Left: Compact Level + Mode + Guest Directory Button + Customer Ordered Menu Card */}
        <div className="pointer-events-auto flex flex-col items-start gap-1 max-w-[330px] sm:max-w-[360px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex w-fit items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 px-2 py-1 shadow-xs">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[11px] sm:text-xs font-semibold text-[#1F2823] whitespace-nowrap">
                    Lv.{xpInfo.level}
                  </span>
                  <span className="hidden xl:inline text-[11px] font-medium text-[#2E6F40] truncate">
                    {xpInfo.title}
                  </span>
                  <span className="font-mono-num text-[10px] text-[#5A655D] whitespace-nowrap">
                    {xpInfo.nextLevelXp !== null
                      ? `${xpInfo.currentLevelXp}/${xpInfo.nextLevelXp}`
                      : 'MAX'}
                  </span>
                </div>
                <div className="mt-0.5 h-1 w-14 sm:w-20 overflow-hidden rounded-full bg-[#1F2823]/12">
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-[#2E6F40]"
                    animate={{scaleX: Math.max(0.02, xpInfo.progressRatio)}}
                    transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
                  />
                </div>
              </div>

              <div className="flex items-center gap-0.5 rounded-lg bg-[#EAE6DC] p-0.5">
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
                      if (m.id === 'guest') {
                        setCustomerPhase('ENTERING');
                        setCustomerSequenceKey((k) => k + 1);
                      }
                    }}
                    className="relative min-h-[32px] sm:min-h-[34px] rounded-md px-2 text-[11px] font-medium whitespace-nowrap shrink-0"
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
          </div>

          {/* Customer Ordered Menu Card (compact top-left footprint so center 3D view stays clear) */}
          <AnimatePresence mode="wait">
            {mode === 'guest' && customerPhase !== 'ENTERING' && (
              <motion.div
                key={`${guestOrder.guest.id}-${guestOrder.requestText}-${brewResult?.guestReply ?? 'idle'}`}
                initial={{opacity: 0, x: -16, scale: 0.96}}
                animate={{opacity: 1, x: 0, scale: 1}}
                exit={{opacity: 0, x: 12, scale: 0.96}}
                transition={{type: 'spring', stiffness: 360, damping: 28}}
                className="flex w-full max-w-[235px] sm:max-w-[258px] flex-col gap-1 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 p-1.5 sm:p-2 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-lg border border-[#1F2823]/10 flex items-center justify-center font-display text-xs font-semibold text-[#1F2823]"
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
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display text-[11px] font-semibold text-[#1F2823] truncate">
                        {guestOrder.guest.name}
                      </span>
                      {step !== 'SERVED' && (
                        <motion.button
                          type="button"
                          whileHover={{scale: 1.05}}
                          whileTap={{scale: 0.9}}
                          onClick={handleSwapGuest}
                          aria-label="เปลี่ยนแขก"
                          className="inline-flex min-h-[24px] min-w-[24px] items-center justify-center gap-0.5 rounded-md px-1.5 text-[10px] font-medium text-[#4A534D] hover:bg-[#EAE6DC] hover:text-[#1F2823] whitespace-nowrap shrink-0"
                        >
                          <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>เปลี่ยน</span>
                        </motion.button>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[10.5px] text-[#27312B] leading-tight line-clamp-2">
                      “{brewResult?.guestReply ?? guestOrder.requestText}”
                    </p>
                  </div>
                </div>

                {/* Compact Single-Tea Ordered Menu Summary */}
                <div className="border-t border-[#1F2823]/8 pt-1 text-[10px] leading-tight text-[#224B2B]">
                  <p className="font-semibold text-[#2E6F40] line-clamp-1">
                    สั่ง: {orderedMenuSummary.teaName}
                  </p>
                  <p className="text-[#4A534D] truncate">
                    {orderedMenuSummary.tempLabel}
                    {orderedMenuSummary.toppingNames.length > 0
                      ? ` · เพิ่ม: ${orderedMenuSummary.toppingNames.join(', ')}`
                      : ''}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* THIRD-PERSON EXPLORATION CONTROLS (Analog Joystick + Table Prompt Helper) */}
      <AnimatePresence>
        {step === 'EXPLORE_SHOP' && (
          <>
            {/* Bottom-Left Touch Analog Joystick (shifted right for thumb comfort & bigger green stick) */}
            <motion.div
              key="explore-joystick"
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.9}}
              transition={{duration: 0.18}}
              className="fixed bottom-3.5 left-10 sm:left-16 z-20 flex flex-col items-center gap-1 safe-pb select-none"
            >
              <div
                ref={joystickBaseRef}
                onPointerDown={handleJoystickDown}
                onPointerMove={handleJoystickMove}
                onPointerUp={handleJoystickUp}
                onPointerCancel={handleJoystickUp}
                aria-label="ก้านบังคับเดินรอบร้าน"
                className="relative flex h-24 w-24 sm:h-28 sm:w-28 touch-none items-center justify-center rounded-full border-2 border-[#1F2823]/20 bg-[#FAF9F6]/86 shadow-lg"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-[#1F2823]/12 bg-[#EAE6DC]/60" />
                <div
                  ref={joystickKnobRef}
                  className="pointer-events-none absolute h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white bg-[#2E6F40] shadow-md"
                />
              </div>
              <span className="rounded-lg bg-[#FAF9F6]/88 px-2 py-0.5 text-[10px] font-medium text-[#39423C] shadow-2xs">
                เดินในร้าน (WASD)
              </span>
            </motion.div>

            {/* Bottom-Center Subtle Hint */}
            {!isNearTeaTable && (
              <motion.div
                key="walk-hint"
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 8}}
                className="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4 safe-pb"
              >
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/92 px-3.5 py-2 text-xs font-medium text-[#27312B] shadow-sm">
                  <Footprints
                    className="h-3.5 w-3.5 text-[#2E6F40]"
                    aria-hidden="true"
                  />
                  <span>เดินไปที่โต๊ะชงชาเพื่อกดปุ่มทำชา</span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* STEP 1 (FIRST-PERSON AT TABLE): Floating Recipe Selector Card */}
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

      {/* First-Person Recipe Reopen & Return-to-Walk Buttons */}
      <AnimatePresence>
        {step === 'SELECT_TEA' && !selectorOpen && (
          <motion.div
            key="reopen-tea-selector"
            initial={{opacity: 0, y: 20, scale: 0.94}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 16, scale: 0.94}}
            transition={{type: 'spring', stiffness: 380, damping: 28}}
            className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex flex-wrap justify-center gap-2 safe-px safe-pb"
          >
            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              onClick={handleReturnToShopExplore}
              className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-[#1F2823]/18 bg-[#FAF9F6]/96 px-4 text-sm font-semibold text-[#1F2823] shadow-lg hover:bg-white"
            >
              <Footprints className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
              <span>เดินรอบร้าน</span>
            </motion.button>

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

      {/* Collapsible Bottom Thumb Dock for First-Person Steps 2–5 */}
      <AnimatePresence>
        {step !== 'EXPLORE_SHOP' && step !== 'SELECT_TEA' && (
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

              <div className="pointer-events-auto w-full max-w-[740px] rounded-2xl border border-[#1F2823]/12 bg-[#FAF9F6]/96 px-3 py-2 sm:px-4 sm:py-3 shadow-md overflow-hidden">
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

                  {step === 'SERVED' && brewResult && (
                    <motion.div
                      key="step-served"
                      initial={{opacity: 0, scale: 0.96, y: 10}}
                      animate={{opacity: 1, scale: 1, y: 0}}
                      exit={{opacity: 0, scale: 0.96, y: -10}}
                      transition={{type: 'spring', stiffness: 380, damping: 26}}
                      className="mt-2.5 flex items-center justify-between gap-2 sm:gap-3"
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button
                          type="button"
                          whileTap={{scale: 0.94}}
                          onClick={() => handleResetCup(true, true)}
                          className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#1F2823]/15 bg-white px-3.5 text-xs sm:text-sm font-medium text-[#1F2823] hover:bg-[#EFECE4] whitespace-nowrap"
                        >
                          <Footprints
                            className="h-4 w-4 text-[#2E6F40]"
                            aria-hidden="true"
                          />
                          <span>เดินในร้าน</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.94}}
                          transition={{type: 'spring', stiffness: 420, damping: 24}}
                          onClick={() => handleResetCup(true, false)}
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#233029] px-4 sm:px-5 text-xs sm:text-sm font-medium text-white hover:bg-[#19231E] whitespace-nowrap"
                        >
                          <Coffee className="h-4 w-4" aria-hidden="true" />
                          <span>ชงถ้วยถัดไป</span>
                        </motion.button>
                      </div>
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
