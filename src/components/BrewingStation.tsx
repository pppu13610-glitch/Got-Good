import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Coffee,
  Droplets,
  Lock,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import {createRandomGuestOrder} from '../data/guests';
import {
  getLevelFromXp,
  getNewlyUnlockedTeas,
  getXpProgress,
  isTeaUnlocked,
} from '../data/progression';
import {getStrengthLabel, TEAS, TOPPINGS, WATER_TEMPS} from '../data/teas';
import {
  AmbienceMode,
  BrewResult,
  BrewStep,
  CameraPreset,
  GameMode,
  GuestOrder,
  JournalRecord,
  TeaCategory,
  TeaType,
  ToppingId,
  WaterTemp,
} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';
import {PWAInstallButton} from './PWAInstallButton';
import {TeaScene3D} from './TeaScene3D';

interface BrewingStationProps {
  playerXp: number;
  playerLevel: number;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  ambience: AmbienceMode;
  onAmbienceChange: (mode: AmbienceMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBrewComplete: (
    record: JournalRecord,
    warmthEarned: number,
    xpEarned: number,
  ) => void;
}

const CATEGORIES: {id: 'all' | TeaCategory; label: string}[] = [
  {id: 'all', label: 'ทั้งหมด'},
  {id: 'matcha', label: 'มัทฉะ'},
  {id: 'green', label: 'ชาเขียว'},
  {id: 'oolong', label: 'อู่หลง'},
  {id: 'black', label: 'ชาดำ'},
  {id: 'herbal', label: 'สมุนไพร'},
];

const CAMERA_OPTIONS: {id: CameraPreset; label: string}[] = [
  {id: 'table', label: 'โต๊ะชา'},
  {id: 'cup', label: 'ถ้วยชา'},
  {id: 'overhead', label: 'มุมสูง'},
];

const MAX_STEEP_DISPLAY = 8;

export const BrewingStation: React.FC<BrewingStationProps> = ({
  playerXp,
  playerLevel,
  mode,
  onModeChange,
  ambience,
  onAmbienceChange,
  isMuted,
  onToggleMute,
  onBrewComplete,
}) => {
  const [step, setStep] = useState<BrewStep>('SELECT_TEA');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TeaCategory>(
    'all',
  );
  const [selectedTea, setSelectedTea] = useState<TeaType>(TEAS[0]);
  const [waterTemp, setWaterTemp] = useState<WaterTemp>(TEAS[0].idealTemp);
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [steepSeconds, setSteepSeconds] = useState<number>(0);
  const [toppings, setToppings] = useState<ToppingId[]>([]);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('table');
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

  const filteredTeas = useMemo(() => {
    if (categoryFilter === 'all') return TEAS;
    return TEAS.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

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
      const capped = Math.min(10, elapsed);
      setSteepSeconds(capped);

      if (
        !sweetSpotChimedRef.current &&
        capped >= selectedTea.idealSteepMin &&
        capped <= selectedTea.idealSteepMax
      ) {
        sweetSpotChimedRef.current = true;
        soundEngine.playSweetSpotChime();
      }
    }, 80);

    return () => {
      if (steepIntervalRef.current) {
        window.clearInterval(steepIntervalRef.current);
        steepIntervalRef.current = null;
      }
    };
  }, [step, selectedTea]);

  const handleSelectTea = (tea: TeaType) => {
    if (!isTeaUnlocked(tea, playerLevel)) {
      soundEngine.playTap();
      return;
    }
    soundEngine.unlock();
    soundEngine.playLeafDrop();
    setSelectedTea(tea);
    setWaterTemp(tea.idealTemp);
  };

  const handleConfirmTea = () => {
    soundEngine.unlock();
    soundEngine.playTap();
    setStep('POUR_WATER');
  };

  const handlePourWater = () => {
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
    }, 30);
  };

  const handleFinishSteep = () => {
    if (step !== 'STEEP_TEA') return;
    soundEngine.playTap();
    setStep('ADD_TOPPING');
  };

  const handleToggleTopping = (id: ToppingId) => {
    soundEngine.playTap();
    setToppings((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
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

    const warmthEarned = 10 + harmonyScore * 5 + (guestMatched ? 10 : 0);
    const xpEarned = 25 + harmonyScore * 5 + (guestMatched ? 15 : 0);
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
    if (mode === 'guest' && advanceGuest) {
      const nextLvl = getLevelFromXp(playerXp);
      setGuestOrder((prev) => createRandomGuestOrder(nextLvl, prev.guest.id));
    }
  };

  const handleSwapGuest = () => {
    soundEngine.playTap();
    setGuestOrder((prev) => createRandomGuestOrder(playerLevel, prev.guest.id));
  };

  const cycleAmbience = () => {
    soundEngine.unlock();
    const next: AmbienceMode =
      ambience === 'none' ? 'rain' : ambience === 'rain' ? 'breeze' : 'none';
    onAmbienceChange(next);
  };

  const cycleCamera = () => {
    soundEngine.playTap();
    const next: CameraPreset =
      cameraPreset === 'table'
        ? 'cup'
        : cameraPreset === 'cup'
          ? 'overhead'
          : 'table';
    setCameraPreset(next);
  };

  const strengthLabel = getStrengthLabel(selectedTea, steepSeconds);
  const steepProgressPct = Math.min(
    100,
    (steepSeconds / MAX_STEEP_DISPLAY) * 100,
  );
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
    <div className="relative h-[calc(100dvh-48px)] min-h-[290px] w-full overflow-hidden bg-[#D8DFD5]">
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
          onKettleClick={handlePourWater}
          onVesselClick={handleFinishSteep}
        />
      </div>

      {/* Top Landscape HUD Bar (Compact height, touch-friendly >=44px controls, clear center view) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-3.5 safe-px">
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
                <div
                  className="h-full rounded-full bg-[#2E6F40] transition-[width] duration-300"
                  style={{width: `${Math.round(xpInfo.progressRatio * 100)}%`}}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-[#EAE6DC] p-0.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playTap();
                  onModeChange('guest');
                }}
                className={`min-h-[38px] sm:min-h-[40px] rounded-md px-2.5 text-xs font-medium transition-transform active:scale-[0.97] whitespace-nowrap shrink-0 ${
                  mode === 'guest'
                    ? 'bg-white text-[#1F2823] shadow-xs'
                    : 'text-[#4A534D]'
                }`}
              >
                รับรองแขก
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playTap();
                  onModeChange('free');
                }}
                className={`min-h-[38px] sm:min-h-[40px] rounded-md px-2.5 text-xs font-medium transition-transform active:scale-[0.97] whitespace-nowrap shrink-0 ${
                  mode === 'free'
                    ? 'bg-white text-[#1F2823] shadow-xs'
                    : 'text-[#4A534D]'
                }`}
              >
                ชงตามใจ
              </button>
            </div>
          </div>

          {mode === 'guest' && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 p-2 shadow-xs">
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
                    <button
                      type="button"
                      onClick={handleSwapGuest}
                      aria-label="เปลี่ยนแขก"
                      className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-[#4A534D] hover:bg-[#EAE6DC] hover:text-[#1F2823] whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      <span className="hidden sm:inline">เปลี่ยน</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-[#27312B] leading-snug line-clamp-2">
                  “{brewResult?.guestReply ?? guestOrder.requestText}”
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Touch-Friendly Camera + Audio + PWA */}
        <div className="pointer-events-auto flex items-center justify-end gap-1.5">
          {/* Compact 1-tap Camera Cycler on small mobile landscape; full group on md+ */}
          <button
            type="button"
            onClick={cycleCamera}
            className="inline-flex md:hidden min-h-[44px] items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 px-3 text-xs font-medium text-[#1F2823] shadow-xs active:scale-[0.97]"
          >
            <Camera className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
            <span>
              {CAMERA_OPTIONS.find((c) => c.id === cameraPreset)?.label}
            </span>
          </button>

          <div
            className="hidden md:flex items-center gap-0.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 p-1 shadow-xs"
            role="group"
            aria-label="มุมกล้อง 3 มิติ"
          >
            <Camera
              className="mx-1.5 h-3.5 w-3.5 text-[#5A655D] shrink-0"
              aria-hidden="true"
            />
            {CAMERA_OPTIONS.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setCameraPreset(cam.id);
                }}
                className={`min-h-[36px] rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  cameraPreset === cam.id
                    ? 'bg-[#233029] text-[#F3F1EC]'
                    : 'text-[#4A534D] hover:text-[#1F2823]'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Compact 1-tap Ambience Cycler on small mobile landscape; full group on lg+ */}
          <button
            type="button"
            onClick={cycleAmbience}
            aria-label="เปลี่ยนเสียงบรรยากาศ"
            className="inline-flex lg:hidden min-h-[44px] items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 px-3 text-xs font-medium text-[#1F2823] shadow-xs active:scale-[0.97]"
          >
            {ambience === 'rain' ? (
              <CloudRain className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
            ) : ambience === 'breeze' ? (
              <Wind className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#5A655D]" aria-hidden="true" />
            )}
            <span>
              {ambience === 'rain'
                ? 'ฝน'
                : ambience === 'breeze'
                  ? 'ลมไผ่'
                  : 'เงียบ'}
            </span>
          </button>

          <div
            className="hidden lg:flex items-center gap-0.5 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 p-1 shadow-xs"
            role="group"
            aria-label="เสียงบรรยากาศ"
          >
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                onAmbienceChange('none');
              }}
              className={`min-h-[36px] rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                ambience === 'none'
                  ? 'bg-[#233029] text-[#F3F1EC]'
                  : 'text-[#4A534D] hover:text-[#1F2823]'
              }`}
            >
              เงียบ
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                onAmbienceChange('rain');
              }}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                ambience === 'rain'
                  ? 'bg-[#233029] text-[#F3F1EC]'
                  : 'text-[#4A534D] hover:text-[#1F2823]'
              }`}
            >
              <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ฝนตก</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                onAmbienceChange('breeze');
              }}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                ambience === 'breeze'
                  ? 'bg-[#233029] text-[#F3F1EC]'
                  : 'text-[#4A534D] hover:text-[#1F2823]'
              }`}
            >
              <Wind className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ลมไผ่</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6]/94 text-[#1F2823] shadow-xs active:scale-[0.97]"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#6B736D]" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#2E6F40]" />
            )}
          </button>

          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Thumb Dock optimized for Mobile Landscape */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center safe-px safe-pb transition-transform duration-300 ease-out"
        style={{
          transform: dockCollapsed
            ? 'translateY(calc(100% - 36px))'
            : 'translateY(0)',
        }}
      >
        {/* Collapse Toggle Tab */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playTap();
            setDockCollapsed((prev) => !prev);
          }}
          className="pointer-events-auto inline-flex min-h-[34px] items-center gap-1.5 rounded-t-xl border border-b-0 border-[#1F2823]/12 bg-[#FAF9F6]/96 px-4 text-xs font-medium text-[#39423C] shadow-xs active:scale-[0.98]"
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
        </button>

        {/* Thumb-Ergonomic Dock Panel */}
        <div className="pointer-events-auto w-full max-w-[960px] rounded-2xl border border-[#1F2823]/12 bg-[#FAF9F6]/96 px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-md">
          {/* Compact Info & Stepper Line */}
          <div className="flex items-center justify-between gap-2 border-b border-[#1F2823]/10 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-3 w-3 rounded-full border border-black/15 shrink-0"
                style={{backgroundColor: selectedTea.richColor}}
                aria-hidden="true"
              />
              <span className="font-display text-xs sm:text-sm font-semibold text-[#1F2823] truncate">
                {selectedTea.name}
              </span>
              <span className="hidden sm:inline text-xs text-[#5A655D] whitespace-nowrap">
                {selectedTea.categoryLabel} · {selectedTea.idealTempLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs shrink-0">
              <span
                className={
                  stepIndex === 1
                    ? 'font-semibold text-[#2E6F40]'
                    : 'text-[#68726B]'
                }
              >
                1.ชา
              </span>
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

          {/* STEP 1: SELECT TEA (Finger-sized horizontal swipe cards + Thumb CTA) */}
          {step === 'SELECT_TEA' && (
            <div className="mt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#EAE6DC] p-1 touch-pan-x">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playTap();
                        setCategoryFilter(cat.id);
                      }}
                      className={`min-h-[38px] rounded-md px-3 text-xs font-medium transition-transform active:scale-[0.97] whitespace-nowrap shrink-0 ${
                        categoryFilter === cat.id
                          ? 'bg-white text-[#1F2823] shadow-xs'
                          : 'text-[#4A534D]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTea}
                  className="min-h-[44px] rounded-xl bg-[#2E6F40] px-4 sm:px-5 text-xs sm:text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#245732] whitespace-nowrap shrink-0"
                >
                  ใช้ชานี้ →
                </button>
              </div>

              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 snap-x touch-pan-x">
                {filteredTeas.map((tea) => {
                  const unlocked = isTeaUnlocked(tea, playerLevel);
                  const active = selectedTea.id === tea.id;
                  return (
                    <button
                      key={tea.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => handleSelectTea(tea)}
                      className={`snap-start flex min-h-[62px] w-40 sm:w-44 shrink-0 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-transform active:scale-[0.97] ${
                        !unlocked
                          ? 'border-[#1F2823]/10 bg-[#ECE9E0] opacity-75 cursor-not-allowed'
                          : active
                            ? 'border-[#2E6F40] bg-[#E8F1E8]'
                            : 'border-[#1F2823]/10 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{backgroundColor: tea.richColor}}
                          aria-hidden="true"
                        />
                        {unlocked ? (
                          <span className="font-mono-num text-[11px] text-[#5A655D]">
                            {tea.idealTempLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#6B736D]">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Lv.{tea.unlockLevel}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-display text-xs sm:text-sm font-semibold text-[#1F2823] truncate">
                        {tea.name}
                      </p>
                      <p className="text-[11px] text-[#4A534D] truncate">
                        {unlocked
                          ? tea.aromaNote
                          : `ปลดล็อก Lv.${tea.unlockLevel}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: POUR WATER */}
          {step === 'POUR_WATER' && (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x">
                <button
                  type="button"
                  disabled={isPouring}
                  onClick={() => {
                    soundEngine.playTap();
                    setStep('SELECT_TEA');
                  }}
                  aria-label="กลับไปเลือกชา"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border border-[#1F2823]/15 bg-white px-3 text-xs font-medium text-[#4A534D] active:scale-[0.97] disabled:opacity-40 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">เปลี่ยนชา</span>
                </button>

                {WATER_TEMPS.map((temp) => {
                  const isSelected = waterTemp === temp.id;
                  const isIdeal = selectedTea.idealTemp === temp.id;
                  return (
                    <button
                      key={temp.id}
                      type="button"
                      disabled={isPouring}
                      onClick={() => {
                        soundEngine.playTap();
                        setWaterTemp(temp.id);
                      }}
                      className={`min-h-[44px] rounded-xl border px-3 text-xs font-medium transition-transform active:scale-[0.97] whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                      }`}
                    >
                      {temp.tempC}°C{isIdeal ? ' · แนะนำ' : ''}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handlePourWater}
                disabled={isPouring}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#2E6F40] px-5 text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#245732] disabled:bg-[#5B8767] whitespace-nowrap shrink-0"
              >
                <Droplets className="h-4 w-4" aria-hidden="true" />
                <span>{isPouring ? 'กำลังริน...' : 'รินน้ำร้อน'}</span>
              </button>
            </div>
          )}

          {/* STEP 3: STEEP TEA */}
          {step === 'STEEP_TEA' && (
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#1F2823] truncate">
                    {strengthLabel}
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
                    className="h-full rounded-full bg-[#C9822B] transition-[width] duration-75"
                    style={{width: `${steepProgressPct}%`}}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishSteep}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#C9822B] px-5 text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#AF6E1F] whitespace-nowrap shrink-0"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>กรองชา</span>
              </button>
            </div>
          )}

          {/* STEP 4: ADD TOPPINGS */}
          {step === 'ADD_TOPPING' && (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 touch-pan-x">
                {TOPPINGS.map((item) => {
                  const active = toppings.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleTopping(item.id)}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-transform active:scale-[0.97] whitespace-nowrap shrink-0 ${
                        active
                          ? 'border-[#2E6F40] bg-[#E8F1E8] text-[#1F2823]'
                          : 'border-[#1F2823]/12 bg-white text-[#4A534D]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/15"
                        style={{backgroundColor: item.swatch}}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
                {isColorMagic && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A3F8E] whitespace-nowrap px-1">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    สีม่วงแล้ว!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleServeCup}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#2E6F40] px-5 text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#245732] whitespace-nowrap shrink-0"
              >
                <Coffee className="h-4 w-4" aria-hidden="true" />
                <span>เสิร์ฟชา</span>
              </button>
            </div>
          )}

          {/* STEP 5: SERVED */}
          {step === 'SERVED' && brewResult && (
            <div className="mt-2.5 flex items-center justify-between gap-3">
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

              <button
                type="button"
                onClick={() => handleResetCup(true)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#233029] px-5 text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#19231E] whitespace-nowrap shrink-0"
              >
                <Coffee className="h-4 w-4" aria-hidden="true" />
                <span>ชงถ้วยถัดไป</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
