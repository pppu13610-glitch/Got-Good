import React, {useState} from 'react';
import {motion} from 'motion/react';
import {Lock, Trash2} from 'lucide-react';
import {getUnlockedTeas, getXpProgress, isTeaUnlocked} from '../data/progression';
import {getEquipmentInfo, TEAS, TOPPINGS, WATER_TEMPS} from '../data/teas';
import {TeaCategory, TeaHouseSaveData} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';

interface TeaJournalProps {
  saveData: TeaHouseSaveData;
  onStartBrewing: () => void;
  onResetJournal: () => void;
}

const CATEGORIES: {id: 'all' | TeaCategory; label: string}[] = [
  {id: 'all', label: 'ทั้งหมด'},
  {id: 'matcha', label: 'ชามัทฉะ'},
  {id: 'latte', label: 'ลาเต้'},
  {id: 'green', label: 'ชาเขียว'},
  {id: 'oolong', label: 'อู่หลง'},
  {id: 'black', label: 'ชาดำ'},
  {id: 'herbal', label: 'สมุนไพร'},
];

const TAP_SPRING = {type: 'spring' as const, stiffness: 420, damping: 24};

export const TeaJournal: React.FC<TeaJournalProps> = ({
  saveData,
  onStartBrewing,
  onResetJournal,
}) => {
  const [filter, setFilter] = useState<'all' | TeaCategory>('all');
  const xpInfo = getXpProgress(saveData.xp);
  const unlockedCount = getUnlockedTeas(saveData.level).length;

  const visibleTeas =
    filter === 'all' ? TEAS : TEAS.filter((t) => t.category === filter);

  return (
    <div className="mx-auto max-w-[1200px] safe-px py-4 sm:py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#1F2823]/10 pb-4 pr-14">
        <div>
          <p className="text-xs text-[#5A655D]">
            Lv. {xpInfo.level} ({xpInfo.title}) · ปลดล็อกแล้ว {unlockedCount}/
            {TEAS.length} ชนิด
          </p>
          <h1 className="mt-1 font-display text-xl sm:text-3xl font-semibold text-[#1F2823]">
            สมุดบันทึกชาประจำบ้าน
          </h1>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="text-right font-mono-num">
            <span className="text-xs text-[#5A655D] block">
              {xpInfo.nextLevelXp !== null
                ? `XP ${xpInfo.currentLevelXp}/${xpInfo.nextLevelXp} สู่ Lv. ${xpInfo.level + 1}`
                : 'เลเวลสูงสุด'}
            </span>
            <span className="font-semibold text-[#1F2823]">
              {saveData.totalCups} ถ้วย · {saveData.warmthPoints} แต้ม
            </span>
          </div>
          <motion.button
            type="button"
            whileHover={{scale: 1.03}}
            whileTap={{scale: 0.94}}
            transition={TAP_SPRING}
            onClick={onStartBrewing}
            className="min-h-[44px] rounded-xl bg-[#2E6F40] px-4 py-2 text-sm font-medium text-white hover:bg-[#245732] whitespace-nowrap shrink-0"
          >
            ไปชงชา 3 มิติ
          </motion.button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base sm:text-lg font-semibold text-[#1F2823]">
          สารานุกรมใบชา ({visibleTeas.length})
        </h2>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#E6E3DA] p-1 touch-pan-x">
          {CATEGORIES.map((cat) => {
            const active = filter === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{scale: 0.94}}
                onClick={() => {
                  soundEngine.playTap();
                  setFilter(cat.id);
                }}
                className="relative min-h-[40px] rounded-md px-3 text-xs font-medium whitespace-nowrap shrink-0"
              >
                {active && (
                  <motion.span
                    layoutId="journal-cat-pill"
                    transition={{type: 'spring', stiffness: 420, damping: 30}}
                    className="absolute inset-0 rounded-md bg-white shadow-xs"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active
                      ? 'text-[#1F2823]'
                      : 'text-[#4A534D] hover:text-[#1F2823]'
                  }`}
                >
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tea Collection Grid */}
      <section className="mt-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {visibleTeas.map((tea, idx) => {
            const unlocked = isTeaUnlocked(tea, saveData.level);
            const count = saveData.teaCounts[tea.id] ?? 0;
            return (
              <motion.div
                key={`${filter}-${tea.id}`}
                initial={{opacity: 0, y: 12, scale: 0.97}}
                animate={{opacity: unlocked ? 1 : 0.8, y: 0, scale: 1}}
                transition={{
                  delay: Math.min(idx * 0.03, 0.2),
                  type: 'spring',
                  stiffness: 360,
                  damping: 26,
                }}
                whileHover={unlocked ? {y: -2, scale: 1.01} : undefined}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  unlocked
                    ? 'border-[#1F2823]/10 bg-white shadow-2xs'
                    : 'border-[#1F2823]/10 bg-[#EAE7DF]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-black/15"
                      style={{backgroundColor: tea.richColor}}
                      aria-hidden="true"
                    />
                    {unlocked ? (
                      <span className="text-xs text-[#5A655D] font-mono-num">
                        {tea.categoryLabel} · {tea.idealTempLabel} · คาเฟอีน
                        {tea.caffeineLevel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5A655D]">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        ปลดล็อกที่ Lv. {tea.unlockLevel}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2.5 font-display text-base font-semibold text-[#1F2823]">
                    {tea.name}
                  </h3>
                  <p className="text-xs text-[#5A655D]">
                    {tea.origin} · {tea.harvestSeason}
                  </p>
                  <p className="mt-2 text-xs text-[#4A534D] leading-relaxed">
                    {tea.description}
                  </p>

                  {/* Structured Flavor Profile Bars */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#5A655D]">
                    <div>
                      <span>กลิ่นหอม</span>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2823]/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#2E6F40]"
                          initial={{width: 0}}
                          animate={{width: `${tea.flavorProfile.aroma * 20}%`}}
                          transition={{duration: 0.45, delay: Math.min(idx * 0.03, 0.2)}}
                        />
                      </div>
                    </div>
                    <div>
                      <span>ความหวาน</span>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2823]/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#C9822B]"
                          initial={{width: 0}}
                          animate={{width: `${tea.flavorProfile.sweetness * 20}%`}}
                          transition={{duration: 0.45, delay: Math.min(idx * 0.03, 0.2) + 0.05}}
                        />
                      </div>
                    </div>
                    <div>
                      <span>ความเข้ม</span>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2823]/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#4A534D]"
                          initial={{width: 0}}
                          animate={{width: `${tea.flavorProfile.body * 20}%`}}
                          transition={{duration: 0.45, delay: Math.min(idx * 0.03, 0.2) + 0.1}}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1 border-t border-[#1F2823]/10 pt-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5A655D] truncate">
                      อุปกรณ์: {getEquipmentInfo(tea.equipmentId).name}
                    </span>
                    <span
                      className={`font-mono-num font-medium shrink-0 ${
                        !unlocked
                          ? 'text-[#7C857E]'
                          : count > 0
                            ? 'text-[#2E6F40]'
                            : 'text-[#5A655D]'
                      }`}
                    >
                      {!unlocked
                        ? `ล็อก (Lv.${tea.unlockLevel})`
                        : count > 0
                          ? `ชงแล้ว ${count} แก้ว`
                          : 'พร้อมชง'}
                    </span>
                  </div>
                  <span className="text-[#5A655D] truncate">
                    วัตถุดิบ: {tea.baseIngredients.join(' · ')}
                  </span>
                  <span className="text-[#5A655D] truncate">
                    ท็อปปิงแนะนำ:{' '}
                    {tea.recommendedToppings
                      .map((id) => TOPPINGS.find((t) => t.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Recent History */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[#1F2823]">
            ประวัติถ้วยล่าสุด
          </h2>
          {saveData.history.length > 0 && (
            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              onClick={onResetJournal}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#6B736D] hover:text-[#B43D2D]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ล้างประวัติและเริ่ม Lv. 1 ใหม่</span>
            </motion.button>
          )}
        </div>

        {saveData.history.length === 0 ? (
          <div className="mt-3 rounded-xl border border-[#1F2823]/10 bg-white p-8 text-center">
            <p className="text-sm text-[#4A534D]">
              ยังไม่มีบันทึกการชงชา ลองชงชาถ้วยแรกเพื่อเก็บ XP และปลดล็อกชาใหม่ๆ ดูสิ
            </p>
            <motion.button
              type="button"
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.94}}
              transition={TAP_SPRING}
              onClick={onStartBrewing}
              className="mt-4 min-h-[44px] rounded-lg bg-[#2E6F40] px-4 py-2 text-sm font-medium text-white hover:bg-[#245732]"
            >
              เริ่มชงถ้วยแรก
            </motion.button>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-[#1F2823]/10 rounded-xl border border-[#1F2823]/10 bg-white overflow-hidden">
            {saveData.history.map((item, idx) => {
              const tempLabel =
                WATER_TEMPS.find((w) => w.id === item.waterTemp)?.label ?? '';
              const toppingNames = item.toppings
                .map((id) => TOPPINGS.find((t) => t.id === id)?.name)
                .filter(Boolean)
                .join(' + ');

              return (
                <motion.div
                  key={item.id}
                  initial={{opacity: 0, x: -10}}
                  animate={{opacity: 1, x: 0}}
                  transition={{delay: Math.min(idx * 0.03, 0.18), duration: 0.2}}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold text-[#1F2823]">
                        {item.teaName}
                      </span>
                      <span className="text-xs text-[#5A655D]">
                        {item.harmonyTitle}
                        {item.guestName ? ` · ชงให้ ${item.guestName}` : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#4A534D]">
                      {tempLabel} · {item.strengthLabel} ({item.steepSeconds} วิ)
                      {toppingNames ? ` · เติม ${toppingNames}` : ' · ชาเพียว'}
                    </p>
                  </div>

                  <span className="font-mono-num text-xs text-[#2E6F40]">
                    +{item.xpEarned ?? 25} XP
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
