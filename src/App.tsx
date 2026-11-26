/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect, useState} from 'react';
import {AnimatePresence, motion, MotionConfig} from 'motion/react';
import {BrewingStation} from './components/BrewingStation';
import {CornerMenu} from './components/CornerMenu';
import {HowToPlay} from './components/HowToPlay';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OrientationGuard} from './components/OrientationGuard';
import {SettingsScreen} from './components/SettingsScreen';
import {TeaJournal} from './components/TeaJournal';
import {TitleScreen} from './components/TitleScreen';
import {UpdateCheckScreen} from './components/UpdateCheckScreen';
import {
  AmbienceMode,
  CameraPreset,
  GameMode,
  GameSettings,
  JournalRecord,
  ScreenView,
  TeaHouseSaveData,
} from './types/tea';
import {
  applyDomPerformanceClass,
  probeDeviceOptimization,
} from './utils/deviceOptimizer';
import {
  isFullscreenActive,
  requestAppFullscreen,
  subscribeFullscreenChange,
  toggleAppFullscreen,
} from './utils/fullscreen';
import {soundEngine} from './utils/soundEngine';
import {
  clearSaveData,
  DEFAULT_SETTINGS,
  loadSaveData,
  loadSettings,
  saveBrewRecord,
  saveSettings,
} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('guest');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('table');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [updatesOpen, setUpdatesOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    isFullscreenActive(),
  );
  const [saveData, setSaveData] = useState<TeaHouseSaveData>(() =>
    loadSaveData(),
  );

  useEffect(() => {
    return subscribeFullscreenChange(setIsFullscreen);
  }, []);

  useEffect(() => {
    const report = probeDeviceOptimization(settings.optimizationProfile);
    applyDomPerformanceClass(report.liteGpuActive);
  }, [settings.optimizationProfile]);

  useEffect(() => {
    soundEngine.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.ambienceVolume,
    );
    soundEngine.setMuted(settings.isMuted);
    soundEngine.setAmbience(settings.ambience);
  }, [
    settings.masterVolume,
    settings.sfxVolume,
    settings.ambienceVolume,
    settings.isMuted,
    settings.ambience,
  ]);

  const updateSettings = (patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = {...prev, ...patch};
      saveSettings(next);
      return next;
    });
  };

  const handleResetSettings = () => {
    const reset = {...DEFAULT_SETTINGS};
    saveSettings(reset);
    setSettings(reset);
  };

  const handleToggleFullscreen = () => {
    void toggleAppFullscreen().then((active) => {
      setIsFullscreen(active);
    });
  };

  const handleStartBrewing = (chosenMode?: GameMode) => {
    soundEngine.unlock();
    soundEngine.playTap();
    if (settings.autoFullscreen && !isFullscreenActive()) {
      void requestAppFullscreen().then((active) => {
        if (active) setIsFullscreen(true);
      });
    }
    if (chosenMode) {
      setMode(chosenMode);
    }
    setScreen('BREWING');
  };

  const handleAmbienceChange = (nextMode: AmbienceMode) => {
    updateSettings({ambience: nextMode});
  };

  const handleToggleMute = () => {
    updateSettings({isMuted: !settings.isMuted});
  };

  const handleBrewComplete = (
    record: JournalRecord,
    warmthEarned: number,
    xpEarned: number,
  ) => {
    setSaveData((prev) =>
      saveBrewRecord(prev, record, warmthEarned, xpEarned),
    );
  };

  const handleResetJournal = () => {
    soundEngine.playTap();
    setSaveData(clearSaveData());
  };

  const navigateTo = (target: ScreenView) => {
    soundEngine.unlock();
    soundEngine.playTap();
    setScreen(target);
  };

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
          {screen !== 'TITLE_MENU' && !settingsOpen && !updatesOpen && (
            <CornerMenu
              key="corner-menu"
              screen={screen}
              xp={saveData.xp}
              level={saveData.level}
              mode={mode}
              onModeChange={setMode}
              cameraPreset={cameraPreset}
              onCameraPresetChange={setCameraPreset}
              ambience={settings.ambience}
              onAmbienceChange={handleAmbienceChange}
              isMuted={settings.isMuted}
              onToggleMute={handleToggleMute}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              onNavigate={navigateTo}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenUpdates={() => setUpdatesOpen(true)}
            />
          )}
        </AnimatePresence>

        {/* Main Content with Smooth Screen Transitions */}
        <main className={isViewportLocked ? 'h-full w-full flex-1 overflow-hidden' : 'flex-1'}>
          <AnimatePresence mode="wait">
            {screen === 'TITLE_MENU' && (
              <motion.div
                key="screen-title"
                className="h-full w-full"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0, scale: 0.985}}
                transition={{duration: 0.22}}
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
                />
              </motion.div>
            )}

            {screen === 'BREWING' && (
              <motion.div
                key="screen-brewing"
                className="h-full w-full"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.24}}
              >
                <BrewingStation
                  playerXp={saveData.xp}
                  playerLevel={saveData.level}
                  mode={mode}
                  onModeChange={setMode}
                  cameraPreset={cameraPreset}
                  settings={settings}
                  onBrewComplete={handleBrewComplete}
                />
              </motion.div>
            )}

            {screen === 'JOURNAL' && (
              <motion.div
                key="screen-journal"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -10}}
                transition={{duration: 0.2}}
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
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -10}}
                transition={{duration: 0.2}}
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
              onClose={() => setUpdatesOpen(false)}
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
