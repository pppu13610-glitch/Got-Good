import React, {useState} from 'react';
import {BookOpen, Coffee, Sparkles} from 'lucide-react';
import {getUnlockedTeas, getXpProgress} from '../data/progression';
import {TEAS} from '../data/teas';
import {GameMode} from '../types/tea';
import {PWAInstallButton} from './PWAInstallButton';

interface TitleScreenProps {
  xp: number;
  level: number;
  totalCups: number;
  warmthPoints: number;
  onStart: (mode: GameMode) => void;
  onOpenJournal: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  xp,
  level,
  totalCups,
  warmthPoints,
  onStart,
  onOpenJournal,
}) => {
  const [bgFailed, setBgFailed] = useState(false);
  const xpInfo = getXpProgress(xp);
  const unlockedCount = getUnlockedTeas(level).length;

  return (
    <div className="mx-auto max-w-[1200px] safe-px py-3 sm:py-5 lg:py-8">
      <div className="relative overflow-hidden rounded-2xl border border-[#1F2823]/10 bg-[#233029] shadow-sm">
        <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[460px] flex items-end">
          {!bgFailed ? (
            <img
              src="/src/assets/images/tea_house_backdrop_1795626509107.jpg"
              alt="บรรยากาศห้องชงชาไม้ริมสวนไผ่ในแสงเช้า"
              referrerPolicy="no-referrer"
              onError={() => setBgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2A3B31] via-[#3B4E40] to-[#1F2823]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#18201B]/95 via-[#18201B]/65 to-[#18201B]/20" />

          <div className="relative z-10 w-full p-4 sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#D6E0D2] tracking-wide">
                {TEAS.length} ชนิดชา 3 มิติ · เล่นแนวนอนสบายตา · ออฟไลน์ได้
              </p>

              <h1
                className="mt-1.5 sm:mt-2 font-display text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#F8F7F3] leading-tight"
                style={{textWrap: 'balance'}}
              >
                บ้านชาอุ่นใจ 3D
              </h1>

              <p className="mt-2 text-xs sm:text-base text-[#E4E8DF] leading-relaxed max-w-xl">
                หมุนชมโต๊ะชงชา 3 มิติท่ามกลางสวนไผ่ ชงชามัทฉะ ชาเขียว อู่หลง และชาดำแบบเรียบง่ายเพื่อสะสมเลเวลปลดล็อกใบชาใหม่
              </p>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onStart('guest')}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#2E6F40] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-transform active:scale-[0.97] hover:bg-[#255A33] whitespace-nowrap shrink-0"
                >
                  <Coffee className="h-4 w-4" aria-hidden="true" />
                  <span>เปิดร้านรับรองแขก</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStart('free')}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#F3F1EC] px-5 py-2.5 text-sm font-medium text-[#1F2823] transition-transform active:scale-[0.97] hover:bg-[#E4E0D6] whitespace-nowrap shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-[#C9822B]" aria-hidden="true" />
                  <span>ชงดื่มเองตามใจ</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/30 bg-[#1F2823]/70 px-4 py-2.5 text-sm font-medium text-[#F3F1EC] transition-transform active:scale-[0.97] hover:bg-[#1F2823]/90 whitespace-nowrap shrink-0"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  <span>
                    สมุดชา ({unlockedCount}/{TEAS.length})
                  </span>
                </button>

                <PWAInstallButton />
              </div>

              <p className="mt-3 text-xs text-[#C7D0C3] font-mono-num">
                Lv. {xpInfo.level} ({xpInfo.title}) · ชงแล้ว {totalCups} ถ้วย ·{' '}
                {warmthPoints} แต้ม
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Landscape 3-column summary */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#1F2823]/10 bg-white/85 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs font-medium text-[#5A655D]">
            01. โต๊ะชา 3 มิติ
          </p>
          <h2 className="mt-0.5 font-display text-sm sm:text-base font-semibold text-[#1F2823]">
            ภาชนะเปลี่ยนตามชา
          </h2>
          <p className="mt-1 hidden sm:block text-xs sm:text-sm text-[#4A534D] leading-relaxed">
            มัทฉะเสิร์ฟในถ้วยชะวันพร้อมแปรงไม้ไผ่ สมุนไพรเสิร์ฟในแก้วใส หมุนดูได้รอบทิศ
          </p>
        </div>

        <div className="rounded-xl border border-[#1F2823]/10 bg-white/85 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs font-medium text-[#5A655D]">
            02. สะสมเลเวล
          </p>
          <h2 className="mt-0.5 font-display text-sm sm:text-base font-semibold text-[#1F2823]">
            ปลดล็อกชา 14 ชนิด
          </h2>
          <p className="mt-1 hidden sm:block text-xs sm:text-sm text-[#4A534D] leading-relaxed">
            รวมชามัทฉะ 3 สายพันธุ์ ชาเขียว อู่หลง ชาดำ และสมุนไพร ปลดล็อกเพิ่มขึ้นเรื่อยๆ
          </p>
        </div>

        <div className="rounded-xl border border-[#1F2823]/10 bg-white/85 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs font-medium text-[#5A655D]">
            03. เล่นออฟไลน์ได้
          </p>
          <h2 className="mt-0.5 font-display text-sm sm:text-base font-semibold text-[#1F2823]">
            ถนัดมือในแนวนอน
          </h2>
          <p className="mt-1 hidden sm:block text-xs sm:text-sm text-[#4A534D] leading-relaxed">
            ปุ่มใหญ่กดง่ายด้วยนิ้วโป้ง พร้อมเสียงฝนตกและบันทึกในเครื่องอัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  );
};
