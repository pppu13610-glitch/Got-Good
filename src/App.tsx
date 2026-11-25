/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
import {BrewingStation} from './components/BrewingStation';
import {HowToPlay} from './components/HowToPlay';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OrientationGuard} from './components/OrientationGuard';
import {TeaJournal} from './components/TeaJournal';
import {TitleScreen} from './components/TitleScreen';
import {
  AmbienceMode,
  GameMode,
  JournalRecord,
  ScreenView,
  TeaHouseSaveData,
} from './types/tea';
import {soundEngine} from './utils/soundEngine';
import {clearSaveData, loadSaveData, saveBrewRecord} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('guest');
  const [ambience, setAmbience] = useState<AmbienceMode>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [saveData, setSaveData] = useState<TeaHouseSaveData>(() =>
    loadSaveData(),
  );

  const handleStartBrewing = (chosenMode?: GameMode) => {
    soundEngine.unlock();
    soundEngine.playTap();
    if (chosenMode) {
      setMode(chosenMode);
    }
    setScreen('BREWING');
  };

  const handleAmbienceChange = (nextMode: AmbienceMode) => {
    setAmbience(nextMode);
    soundEngine.setAmbience(nextMode);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
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

  return (
    <div className="min-h-dvh flex flex-col bg-[#F3F1EC] text-[#1F2823]">
      {/* Slim 48px Landscape Top Bar (Hidden on serene Title Screen) */}
      {screen !== 'TITLE_MENU' && (
        <header className="h-12 border-b border-[#1F2823]/10 bg-[#FAF9F6]">
          <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 sm:gap-8 safe-px">
            {/* Zone 1: Single text element wordmark */}
            <button
              type="button"
              onClick={() => navigateTo('TITLE_MENU')}
              className="inline-flex min-h-[44px] items-center font-display text-base sm:text-lg font-bold tracking-tight text-[#1F2823] hover:text-[#2E6F40] transition-colors whitespace-nowrap shrink-0 text-left"
            >
              บ้านชาอุ่นใจ
            </button>

            {/* Zone 2: Touch-friendly single-line navigation links */}
            <nav
              aria-label="เมนูหลัก"
              className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-[#4A534D]"
            >
              <button
                type="button"
                onClick={() => navigateTo('TITLE_MENU')}
                className="min-h-[44px] px-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 border-transparent hover:text-[#1F2823]"
              >
                หน้าแรก
              </button>
              <button
                type="button"
                onClick={() => navigateTo('BREWING')}
                className={`min-h-[44px] px-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  screen === 'BREWING'
                    ? 'border-[#2E6F40] text-[#1F2823]'
                    : 'border-transparent hover:text-[#1F2823]'
                }`}
              >
                มุมชงชา 3D
              </button>
              <button
                type="button"
                onClick={() => navigateTo('JOURNAL')}
                className={`min-h-[44px] px-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  screen === 'JOURNAL'
                    ? 'border-[#2E6F40] text-[#1F2823]'
                    : 'border-transparent hover:text-[#1F2823]'
                }`}
              >
                สมุดชา
              </button>
              <button
                type="button"
                onClick={() => navigateTo('HOW_TO_PLAY')}
                className={`min-h-[44px] px-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  screen === 'HOW_TO_PLAY'
                    ? 'border-[#2E6F40] text-[#1F2823]'
                    : 'border-transparent hover:text-[#1F2823]'
                }`}
              >
                วิธีชง
              </button>
            </nav>

            {/* Zone 3: Single primary action */}
            <div className="hidden md:flex items-center shrink-0">
              <button
                type="button"
                onClick={() =>
                  screen === 'BREWING'
                    ? navigateTo('JOURNAL')
                    : handleStartBrewing()
                }
                className="min-h-[38px] rounded-lg bg-[#233029] px-4 text-xs sm:text-sm font-medium text-[#F3F1EC] transition-colors hover:bg-[#19231E] whitespace-nowrap shrink-0"
              >
                {screen === 'BREWING' ? 'เปิดสมุดชา' : 'เริ่มชงชา 3D'}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {screen === 'TITLE_MENU' && (
          <TitleScreen
            xp={saveData.xp}
            level={saveData.level}
            totalCups={saveData.totalCups}
            warmthPoints={saveData.warmthPoints}
            mode={mode}
            onModeChange={setMode}
            ambience={ambience}
            onAmbienceChange={handleAmbienceChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onStart={handleStartBrewing}
            onOpenJournal={() => navigateTo('JOURNAL')}
            onOpenHowToPlay={() => navigateTo('HOW_TO_PLAY')}
          />
        )}

        {screen === 'BREWING' && (
          <BrewingStation
            playerXp={saveData.xp}
            playerLevel={saveData.level}
            mode={mode}
            onModeChange={setMode}
            ambience={ambience}
            onAmbienceChange={handleAmbienceChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onBrewComplete={handleBrewComplete}
          />
        )}

        {screen === 'JOURNAL' && (
          <TeaJournal
            saveData={saveData}
            onStartBrewing={() => handleStartBrewing()}
            onResetJournal={handleResetJournal}
          />
        )}

        {screen === 'HOW_TO_PLAY' && (
          <HowToPlay onStartBrewing={() => handleStartBrewing()} />
        )}
      </main>

      {/* Quiet Footer (Shown only on Journal and HowToPlay screens) */}
      {screen !== 'BREWING' && screen !== 'TITLE_MENU' && (
        <footer className="border-t border-[#1F2823]/10 bg-[#FAF9F6] py-4">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6 text-xs text-[#5A655D]">
            <span>บ้านชาอุ่นใจ · เกมจำลองการชงชา 3 มิติแบบสบายๆ</span>
            <button
              type="button"
              onClick={() => navigateTo('HOW_TO_PLAY')}
              className="hover:text-[#1F2823] transition-colors"
            >
              คู่มือและตารางปลดล็อกชา
            </button>
          </div>
        </footer>
      )}

      <OfflineIndicator />
      <OrientationGuard />
    </div>
  );
}
