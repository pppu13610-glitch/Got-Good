import React from 'react';
import {LEVEL_TABLE} from '../data/progression';
import {TEAS} from '../data/teas';

interface HowToPlayProps {
  onStartBrewing: () => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({onStartBrewing}) => {
  return (
    <div className="mx-auto max-w-[1200px] safe-px py-4 sm:py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#1F2823]/10 pb-4">
        <div>
          <p className="text-xs text-[#5A655D]">คู่มือฉบับย่อ</p>
          <h1 className="mt-1 font-display text-xl sm:text-3xl font-semibold text-[#1F2823]">
            วิธีชงชา 3 มิติและระบบเลเวล
          </h1>
        </div>

        <button
          type="button"
          onClick={onStartBrewing}
          className="min-h-[44px] rounded-xl bg-[#2E6F40] px-4 py-2 text-sm font-medium text-white transition-transform active:scale-[0.97] hover:bg-[#245732] whitespace-nowrap shrink-0"
        >
          กลับไปชงชา
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#1F2823]/10 bg-white p-5">
          <p className="text-xs font-medium text-[#2E6F40]">01. ควบคุมฉาก 3 มิติ</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[#1F2823]">
            หมุนดูและคลิกชงได้ตรงๆ
          </h2>
          <p className="mt-2 text-sm text-[#4A534D] leading-relaxed">
            ลากนิ้วหรือเมาส์เพื่อหมุนรอบโต๊ะชงชา ซูมเข้าใกล้ถ้วยชาได้ กดปุ่ม H หรือแตะแถบด้านล่างเพื่อซ่อนเมนูชมฉากเต็มตา และคลิกกาน้ำชา 3 มิติเพื่อรินน้ำได้ทันที
          </p>
        </div>

        <div className="rounded-xl border border-[#1F2823]/10 bg-white p-5">
          <p className="text-xs font-medium text-[#2E6F40]">02. สะสมเลเวล</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[#1F2823]">
            ชงชาเพื่อปลดล็อกใบชาใหม่
          </h2>
          <p className="mt-2 text-sm text-[#4A534D] leading-relaxed">
            ทุกแก้วที่ชงเสร็จจะได้รับ XP เพื่อเพิ่มเลเวลตั้งแต่ Lv. 1 จนถึง Lv. 6 และปลดล็อกชาใหม่ๆ เช่น มัทฉะคั่วอุจิ เกียวคุโระ อัญชันมินต์ และมัทฉะซากุระ
          </p>
        </div>

        <div className="rounded-xl border border-[#1F2823]/10 bg-white p-5">
          <p className="text-xs font-medium text-[#2E6F40]">03. ออฟไลน์เต็มรูปแบบ</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[#1F2823]">
            เล่นได้ทุกที่ไม่มีเน็ต
          </h2>
          <p className="mt-2 text-sm text-[#4A534D] leading-relaxed">
            ข้อมูลชา เลเวล เสียงฝนตก และกราฟิก 3 มิติทั้งหมดทำงานบนอุปกรณ์ของคุณโดยตรง สามารถติดตั้งลงหน้าจอโฮมไว้เล่นแบบออฟไลน์ได้
          </p>
        </div>
      </div>

      {/* Level Progression Table */}
      <div className="mt-8 rounded-xl border border-[#1F2823]/10 bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-[#1F2823]">
          ระดับเลเวลและการปลดล็อกใบชา
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_TABLE.map((row) => {
            const unlockedHere = TEAS.filter((t) => t.unlockLevel === row.level);
            return (
              <div
                key={row.level}
                className="rounded-xl border border-[#1F2823]/10 bg-[#FAF9F6] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-[#1F2823]">
                    Lv. {row.level} · {row.title}
                  </span>
                  <span className="font-mono-num text-xs text-[#5A655D]">
                    {row.minXp} XP
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#4A534D]">
                  {unlockedHere.length > 0
                    ? `ปลดล็อก: ${unlockedHere.map((t) => t.name).join(', ')}`
                    : 'ระดับเกียรติยศสูงสุดของบ้านชา'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cheat Sheet Table */}
      <div className="mt-8 rounded-xl border border-[#1F2823]/10 bg-white overflow-hidden">
        <div className="border-b border-[#1F2823]/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[#1F2823]">
            ตารางข้อมูลใบชาทั้งหมด ({TEAS.length} ชนิด)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F6] text-xs text-[#5A655D]">
              <tr>
                <th className="px-5 py-3 font-medium">ชื่อชา</th>
                <th className="px-5 py-3 font-medium">หมวดหมู่</th>
                <th className="px-5 py-3 font-medium">ปลดล็อก</th>
                <th className="px-5 py-3 font-medium">อุณหภูมิแนะนำ</th>
                <th className="px-5 py-3 font-medium">เวลาแช่พอดี</th>
                <th className="px-5 py-3 font-medium">เอกลักษณ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2823]/10">
              {TEAS.map((tea) => (
                <tr key={tea.id} className="hover:bg-[#FAF9F6]">
                  <td className="px-5 py-3 font-medium text-[#1F2823] whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{backgroundColor: tea.richColor}}
                        aria-hidden="true"
                      />
                      {tea.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#4A534D] whitespace-nowrap">
                    {tea.categoryLabel}
                  </td>
                  <td className="px-5 py-3 font-mono-num text-[#2E6F40] whitespace-nowrap">
                    Lv. {tea.unlockLevel}
                  </td>
                  <td className="px-5 py-3 font-mono-num text-[#1F2823] whitespace-nowrap">
                    {tea.idealTempLabel}
                  </td>
                  <td className="px-5 py-3 font-mono-num text-[#4A534D] whitespace-nowrap">
                    {tea.idealSteepMin}–{tea.idealSteepMax} วินาที
                  </td>
                  <td className="px-5 py-3 text-[#4A534D]">{tea.aromaNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
