/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, MotionConfig} from 'motion/react';
import {BrewingStation} from './components/BrewingStation';
import {CornerMenu} from './components/CornerMenu';
import {HowToPlay} from './components/HowToPlay';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OrientationGuard} from './components/OrientationGuard';
import {RequestScreen} from './components/RequestScreen';
import {SettingsScreen} from './components/SettingsScreen';
import {TeaJournal} from './components/TeaJournal';
import {TitleScreen} from './components/TitleScreen';
import {UpdateCheckScreen} from './components/UpdateCheckScreen';
import {
  AmbienceMode,
  GameMode,
  GameSettings,
  JournalRecord,
  ScreenView,
  TeaHouseSaveData,
} from './types/tea';
import {
  checkLiveBrowserVersion,
  UpdateCheckResult,
} from './utils/appUpdater';
import {initAppLifecycle} from './utils/appLifecycle';
import {
  applyDomPerformanceClass,
  probeDeviceOptimization,
  sanitizeProfileForDevice,
  warmHighEntropyDeviceInfo,
} from './utils/deviceOptimizer';
import {
  isFullscreenActive,
  requestAppFullscreen,
  subscribeFullscreenChange,
  toggleAppFullscreen,
} from './utils/fullscreen';
import {
  clampTargetFpsToDisplay,
  DisplayRefreshRate,
  probeDisplayRefreshRate,
  resolveEffectiveRefreshRate,
} from './utils/refreshRate';
import {soundEngine} from './utils/soundEngine';
import {
  clearSaveData,
  DEFAULT_SETTINGS,
  loadSaveData,
  loadSettings,
  saveBrewRecord,
  saveSettings,
} from './utils/storage';

const SCREEN_EASE = [0.16, 1, 0.3, 1] as const;

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('guest');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [updatesOpen, setUpdatesOpen] = useState<boolean>(false);
  const [requestOpen, setRequestOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    isFullscreenActive(),
  );
  const [saveData, setSaveData] = useState<TeaHouseSaveData>(() =>
    loadSaveData(),
  );
  const [, setHwProbeTick] = useState<number>(0);
  const [detectedRefreshRate, setDetectedRefreshRate] =
    useState<DisplayRefreshRate>(() => {
      const initReport = probeDeviceOptimization('auto');
      return resolveEffectiveRefreshRate(60, initReport);
    });
  const [rawRefreshRate, setRawRefreshRate] = useState<number>(() => {
    const initReport = probeDeviceOptimization('auto');
    return resolveEffectiveRefreshRate(60, initReport);
  });
  const [updateCheckResult, setUpdateCheckResult] =
    useState<UpdateCheckResult | null>(null);
  const userExitedFullscreenRef = useRef<boolean>(false);
  const userOverrodeFpsRef = useRef<boolean>(false);

  useEffect(() => {
    return subscribeFullscreenChange(setIsFullscreen);
  }, []);

  const recheckRefreshRate = useCallback(() => {
    void probeDisplayRefreshRate().then(({hz, rawHz}) => {
      const currentReport = probeDeviceOptimization(
        loadSettings().optimizationProfile,
      );
      const effectiveHz = resolveEffectiveRefreshRate(hz, currentReport);
      setDetectedRefreshRate(effectiveHz);
      setRawRefreshRate(
        currentReport.isGalaxyA10
          ? 60
          : currentReport.isRealmeNote50 && rawHz < 85
            ? 90
            : rawHz,
      );
      setSettings((prev) => {
        const sanitizedProfile = sanitizeProfileForDevice(
          prev.optimizationProfile,
          currentReport,
        );
        let nextTargetFps = clampTargetFpsToDisplay(
          prev.targetFps,
          effectiveHz,
        );
        // Auto-unlock 90 FPS immediately on realme Note 50 when running auto/realme profile
        if (
          currentReport.isRealmeNote50 &&
          !userOverrodeFpsRef.current &&
          (sanitizedProfile === 'auto' || sanitizedProfile === 'realme-note-50') &&
          prev.targetFps === 60
        ) {
          nextTargetFps = clampTargetFpsToDisplay(90, effectiveHz);
        } else if (
          currentReport.isGalaxyA10 &&
          !userOverrodeFpsRef.current &&
          (sanitizedProfile === 'auto' || sanitizedProfile === 'galaxy-a10')
        ) {
          nextTargetFps = 60;
        }
        if (
          nextTargetFps === prev.targetFps &&
          sanitizedProfile === prev.optimizationProfile
        ) {
          return prev;
        }
        const next = {
          ...prev,
          optimizationProfile: sanitizedProfile,
          targetFps: nextTargetFps,
        };
        saveSettings(next);
        return next;
      });
    });
  }, []);

  // Warm up high-entropy UA hints & measure actual display refresh rate on startup / resume
  useEffect(() => {
    void warmHighEntropyDeviceInfo().then((changed) => {
      if (changed) {
        setHwProbeTick((n) => n + 1);
      }
      recheckRefreshRate();
    });
    recheckRefreshRate();
    const cleanupLifecycle = initAppLifecycle(recheckRefreshRate);
    return cleanupLifecycle;
  }, [recheckRefreshRate]);

  // Quietly check live browser version in background so update badge is accurate
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkLiveBrowserVersion().then(setUpdateCheckResult);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  // Enter full screen automatically as the default game behavior (immediately if allowed, or on very first gesture)
  useEffect(() => {
    if (!settings.autoFullscreen) return;

    if (!isFullscreenActive() && !userExitedFullscreenRef.current) {
      void requestAppFullscreen().then((active) => {
        if (active) setIsFullscreen(true);
      });
    }

    const handleFirstGesture = () => {
      if (
        settings.autoFullscreen &&
        !userExitedFullscreenRef.current &&
        !isFullscreenActive()
      ) {
        void requestAppFullscreen().then((active) => {
          if (active) setIsFullscreen(true);
        });
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener('keydown', handleFirstGesture, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture, {
        capture: true,
      });
      window.removeEventListener('keydown', handleFirstGesture, {
        capture: true,
      });
    };
  }, [settings.autoFullscreen]);

  const deviceReport = probeDeviceOptimization(settings.optimizationProfile);

  useEffect(() => {
    applyDomPerformanceClass(
      deviceReport.liteGpuActive,
      deviceReport.isUltraLowRam,
    );
  }, [deviceReport.liteGpuActive, deviceReport.isUltraLowRam]);

  useEffect(() => {
    soundEngine.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.ambienceVolume,
      settings.musicVolume,
    );
    soundEngine.setMusicTrack(settings.musicTrack);
    soundEngine.setMuted(settings.isMuted);
    soundEngine.setAmbience(settings.ambience);
  }, [
    settings.masterVolume,
    settings.sfxVolume,
    settings.ambienceVolume,
    settings.musicVolume,
    settings.musicTrack,
    settings.isMuted,
    settings.ambience,
  ]);

  const updateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      if (patch.autoFullscreen === true) {
        userExitedFullscreenRef.current = false;
      }
      if (patch.targetFps !== undefined) {
        userOverrodeFpsRef.current = true;
      }
      setSettings((prev) => {
        const report = probeDeviceOptimization(prev.optimizationProfile);
        const merged = {...prev, ...patch};
        merged.optimizationProfile = sanitizeProfileForDevice(
          merged.optimizationProfile,
          report,
        );
        const maxAllowedHz = report.isGalaxyA10 ? 60 : detectedRefreshRate;
        if (patch.optimizationProfile === 'galaxy-a10' && patch.targetFps === undefined) {
          merged.targetFps = 60;
        }
        merged.targetFps = clampTargetFpsToDisplay(
          merged.targetFps,
          maxAllowedHz,
        );
        saveSettings(merged);
        return merged;
      });
    },
    [detectedRefreshRate],
  );

  const handleResetSettings = useCallback(() => {
    userExitedFullscreenRef.current = false;
    userOverrodeFpsRef.current = false;
    const report = probeDeviceOptimization('auto');
    const resetTargetFps: GameSettings['targetFps'] = report.isRealmeNote50
      ? 90
      : report.isGalaxyA10
        ? 60
        : DEFAULT_SETTINGS.targetFps;
    const reset: GameSettings = {
      ...DEFAULT_SETTINGS,
      graphicsQuality: report.isGalaxyA10 || report.isDetected2GbRam ? 'low' : DEFAULT_SETTINGS.graphicsQuality,
      resolutionScale: report.isGalaxyA10 || report.isDetected2GbRam ? 'hd' : DEFAULT_SETTINGS.resolutionScale,
      shadowsEnabled: report.isGalaxyA10 || report.isDetected2GbRam ? false : DEFAULT_SETTINGS.shadowsEnabled,
      antialiasEnabled: report.liteGpuActive ? false : DEFAULT_SETTINGS.antialiasEnabled,
      particlesEnabled: report.isGalaxyA10 || report.isDetected2GbRam ? false : DEFAULT_SETTINGS.particlesEnabled,
      targetFps: clampTargetFpsToDisplay(
        resetTargetFps,
        report.isGalaxyA10 ? 60 : detectedRefreshRate,
      ),
    };
    saveSettings(reset);
    setSettings(reset);
  }, [detectedRefreshRate]);

  const handleToggleFullscreen = useCallback(() => {
    const currentlyActive = isFullscreenActive();
    void toggleAppFullscreen().then((active) => {
      userExitedFullscreenRef.current = currentlyActive && !active;
      setIsFullscreen(active);
    });
  }, []);

  const handleStartBrewing = useCallback(
    (chosenMode?: GameMode) => {
      soundEngine.unlock();
      soundEngine.playTap();
      if (
        settings.autoFullscreen &&
        !userExitedFullscreenRef.current &&
        !isFullscreenActive()
      ) {
        void requestAppFullscreen().then((active) => {
          if (active) setIsFullscreen(true);
        });
      }
      if (chosenMode) {
        setMode(chosenMode);
      }
      setScreen('BREWING');
    },
    [settings.autoFullscreen],
  );

  const handleAmbienceChange = useCallback(
    (nextMode: AmbienceMode) => {
      updateSettings({ambience: nextMode});
    },
    [updateSettings],
  );

  const handleToggleMute = useCallback(() => {
    setSettings((prev) => {
      const next = {...prev, isMuted: !prev.isMuted};
      saveSettings(next);
      return next;
    });
  }, []);

  const handleBrewComplete = useCallback(
    (record: JournalRecord, warmthEarned: number, xpEarned: number) => {
      setSaveData((prev) =>
        saveBrewRecord(prev, record, warmthEarned, xpEarned),
      );
    },
    [],
  );

  const handleResetJournal = useCallback(() => {
    soundEngine.playTap();
    setSaveData(clearSaveData());
  }, []);

  const navigateTo = useCallback((target: ScreenView) => {
    soundEngine.unlock();
    soundEngine.playTap();
    setScreen(target);
  }, []);

  const isViewportLocked = screen === 'TITLE_MENU' || screen === 'BREWING';

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`w-full flex flex-col bg-[#F3F1EC] text-[#1F2823] ${
          isViewportLocked ? 'h-dvh overflow-hidden' : 'min-h-dvh'
        }`}
      >
        {/* Top-Right 3-Bar Menu consolidating navigation & controls */}
        <AnimatePresence>
          {screen !== 'TITLE_MENU' && !settingsOpen && !updatesOpen && !requestOpen && (
            <CornerMenu
              key="corner-menu"
              screen={screen}
              xp={saveData.xp}
              level={saveData.level}
              mode={mode}
              onModeChange={setMode}
              ambience={settings.ambience}
              onAmbienceChange={handleAmbienceChange}
              isMuted={settings.isMuted}
              onToggleMute={handleToggleMute}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              onNavigate={navigateTo}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenUpdates={() => setUpdatesOpen(true)}
              onOpenRequest={() => setRequestOpen(true)}
              updateAvailable={updateCheckResult?.status === 'update-ready'}
              latestBrowserVersion={updateCheckResult?.latestVersion ?? null}
            />
          )}
        </AnimatePresence>

        {/* Main Content with Overlapping Smooth Screen Transitions (no wait stall) */}
        <main
          className={
            isViewportLocked
              ? 'relative h-full w-full flex-1 overflow-hidden'
              : 'relative flex-1'
          }
        >
          <AnimatePresence initial={false}>
            {screen === 'TITLE_MENU' && (
              <motion.div
                key="screen-title"
                className="absolute inset-0 h-full w-full will-change-transform"
                initial={{opacity: 0, scale: 1.015}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.985}}
                transition={{duration: 0.24, ease: SCREEN_EASE}}
              >
                <TitleScreen
                  xp={saveData.xp}
                  level={saveData.level}
                  totalCups={saveData.totalCups}
                  warmthPoints={saveData.warmthPoints}
                  mode={mode}
                  onModeChange={setMode}
                  ambience={settings.ambience}
                  onAmbienceChange={handleAmbienceChange}
                  isMuted={settings.isMuted}
                  onToggleMute={handleToggleMute}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={handleToggleFullscreen}
                  particlesEnabled={settings.particlesEnabled}
                  onStart={handleStartBrewing}
                  onOpenJournal={() => navigateTo('JOURNAL')}
                  onOpenHowToPlay={() => navigateTo('HOW_TO_PLAY')}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onOpenUpdates={() => setUpdatesOpen(true)}
                  onOpenRequest={() => setRequestOpen(true)}
                  isOverlayOpen={settingsOpen || updatesOpen || requestOpen}
                  isUltraLowRam={deviceReport.isUltraLowRam}
                  updateAvailable={updateCheckResult?.status === 'update-ready'}
                  latestBrowserVersion={updateCheckResult?.latestVersion ?? null}
                />
              </motion.div>
            )}

            {screen === 'BREWING' && (
              <motion.div
                key="screen-brewing"
                className="absolute inset-0 h-full w-full will-change-transform"
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                transition={{duration: 0.26, ease: SCREEN_EASE}}
              >
                <BrewingStation
                  playerXp={saveData.xp}
                  playerLevel={saveData.level}
                  mode={mode}
                  onModeChange={setMode}
                  settings={settings}
                  onBrewComplete={handleBrewComplete}
                />
              </motion.div>
            )}

            {screen === 'JOURNAL' && (
              <motion.div
                key="screen-journal"
                className="w-full will-change-transform"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                transition={{duration: 0.22, ease: SCREEN_EASE}}
              >
                <TeaJournal
                  saveData={saveData}
                  onStartBrewing={() => handleStartBrewing()}
                  onResetJournal={handleResetJournal}
                />
              </motion.div>
            )}

            {screen === 'HOW_TO_PLAY' && (
              <motion.div
                key="screen-howto"
                className="w-full will-change-transform"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                transition={{duration: 0.22, ease: SCREEN_EASE}}
              >
                <HowToPlay onStartBrewing={() => handleStartBrewing()} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Full-Screen Settings Overlay */}
        <AnimatePresence>
          {settingsOpen && (
            <SettingsScreen
              key="settings-screen"
              settings={settings}
              isFullscreen={isFullscreen}
              detectedRefreshRate={detectedRefreshRate}
              rawRefreshRate={rawRefreshRate}
              onRecheckRefreshRate={recheckRefreshRate}
              onToggleFullscreen={handleToggleFullscreen}
              onUpdateSettings={updateSettings}
              onResetSettings={handleResetSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Full-Screen Version Update Check Overlay */}
        <AnimatePresence>
          {updatesOpen && (
            <UpdateCheckScreen
              key="updates-screen"
              initialUpdateResult={updateCheckResult}
              onUpdateResult={setUpdateCheckResult}
              onClose={() => setUpdatesOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Full-Screen Creator Request Overlay */}
        <AnimatePresence>
          {requestOpen && (
            <RequestScreen
              key="request-screen"
              playerLevel={saveData.level}
              optimizationProfile={settings.optimizationProfile}
              onClose={() => setRequestOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Quiet Footer (Shown only on Journal and HowToPlay screens) */}
        {screen !== 'BREWING' && screen !== 'TITLE_MENU' && (
          <footer className="border-t border-[#1F2823]/10 bg-[#FAF9F6] py-4">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6 text-xs text-[#5A655D]">
              <span>บ้านชาอุ่นใจ · เกมจำลองการชงชา 3 มิติแบบสบายๆ</span>
              <motion.button
                type="button"
                whileTap={{scale: 0.94}}
                onClick={() => navigateTo('HOW_TO_PLAY')}
                className="hover:text-[#1F2823] transition-colors"
              >
                คู่มือและตารางปลดล็อกชา
              </motion.button>
            </div>
          </footer>
        )}

        <OfflineIndicator />
        <OrientationGuard />
      </div>
    </MotionConfig>
  );
}
