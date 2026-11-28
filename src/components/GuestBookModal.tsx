import React, {useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {ArrowLeft, CheckCircle2, Lock, Users, X} from 'lucide-react';
import {GUESTS} from '../data/guests';
import {GuestCharacter, JournalRecord} from '../types/tea';
import {soundEngine} from '../utils/soundEngine';

type GuestFilter = 'all' | 'visited' | 'unvisited';

interface GuestBookModalProps {
  visitedGuestIds: string[];
  history: JournalRecord[];
  onClose: () => void;
}

const TAP_SPRING = {type: 'spring' as const, stiffness: 420, damping: 26};
const MODAL_EASE = [0.16, 1, 0.3, 1] as const;

const MysterySilhouetteCardArt: React.FC = () => (
  <div
    className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#DFDDD4] via-[#CFCBC0] to-[#BFBAA9] select-none"
    aria-hidden="true"
  >
    {/* Subtle shoji lattice lines behind silhouette */}
    <svg
      viewBox="0 0 160 160"
      className="absolute inset-0 h-full w-full text-[#1F2823]/10"
      fill="none"
    >
      <path
        d="M40 0V160M80 0V160M120 0V160M0 40H160M0 80H160M0 120H160"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>

    {/* Closed mystery character bust silhouette */}
    <svg
      viewBox="0 0 160 160"
      className="relative h-[86%] w-[86%] text-[#3A433D]/55"
      fill="currentColor"
    >
      <circle cx="80" cy="56" r="24" />
      <path d="M36 144c0-25 19.7-44 44-44s44 19 44 44H36z" />
    </svg>

    {/* Centered '?' mystery emblem */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-display text-4xl sm:text-5xl font-bold text-[#FAF8F3] drop-shadow-[0_2px_6px_rgba(31,40,35,0.45)]">
        ?
      </span>
    </div>
  </div>
);

export const GuestBookModal: React.FC<GuestBookModalProps> = ({
  visitedGuestIds,
  history,
  onClose,
}) => {
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [selectedGuest, setSelectedGuest] = useState<GuestCharacter | null>(
    null,
  );
  const [portraitFailed, setPortraitFailed] = useState<Record<string, boolean>>(
    {},
  );
  const [lockedHintId, setLockedHintId] = useState<string | null>(null);

  const visitedSet = useMemo(() => new Set(visitedGuestIds), [visitedGuestIds]);

  const servedCountByName = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of history) {
      if (item.guestName) {
        counts[item.guestName] = (counts[item.guestName] ?? 0) + 1;
      }
    }
    return counts;
  }, [history]);

  const visitedCount = useMemo(
    () => GUESTS.filter((g) => visitedSet.has(g.id)).length,
    [visitedSet],
  );
  const unvisitedCount = GUESTS.length - visitedCount;

  const filteredGuests = useMemo(() => {
    if (filter === 'visited') {
      return GUESTS.filter((g) => visitedSet.has(g.id));
    }
    if (filter === 'unvisited') {
      return GUESTS.filter((g) => !visitedSet.has(g.id));
    }
    // Sort visited first when viewing all so revealed portraits appear cleanly at the top
    return [...GUESTS].sort((a, b) => {
      const aVis = visitedSet.has(a.id) ? 0 : 1;
      const bVis = visitedSet.has(b.id) ? 0 : 1;
      return aVis - bVis;
    });
  }, [filter, visitedSet]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedGuest) {
          setSelectedGuest(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedGuest]);

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.16, ease: 'easeOut'}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-3 sm:p-5"
      onClick={() => {
        soundEngine.playTap();
        onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-book-heading"
        initial={{opacity: 0, scale: 0.96, y: 12}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 8}}
        transition={{duration: 0.2, ease: MODAL_EASE}}
        onClick={(e) => e.stopPropagation()}
        style={{contain: 'layout style paint'}}
        className="flex w-full max-w-4xl max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-[#1F2823]/15 bg-[#FAF8F3] text-[#1F2823] shadow-2xl will-change-transform"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1F2823]/10 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F1E8] text-[#2E6F40] shrink-0">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id="guest-book-heading"
                className="font-display text-lg sm:text-xl font-semibold text-[#1F2823] truncate"
              >
                สมุดแขกประจำเรือนชา
              </h2>
              <p className="mt-0.5 text-xs text-[#5A655D]">
                เคยมาแล้ว{' '}
                <span className="font-mono-num font-semibold text-[#2E6F40]">
                  {visitedCount}/{GUESTS.length}
                </span>{' '}
                คน · ยังไม่เคยมา{' '}
                <span className="font-mono-num font-semibold text-[#4A534D]">
                  {unvisitedCount}
                </span>{' '}
                คน
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{scale: 1.07}}
            whileTap={{scale: 0.9}}
            transition={TAP_SPRING}
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            aria-label="ปิดสมุดแขกประจำเรือนชา"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#4A534D] hover:bg-[#EFECE4] hover:text-[#1F2823] shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {/* Filter Controls */}
        {!selectedGuest && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2823]/8 bg-[#F4F1EA] px-4 py-2.5 sm:px-6">
            <div
              className="flex items-center gap-1 rounded-lg bg-[#E6E2D8] p-1"
              role="tablist"
              aria-label="กรองรายชื่อลูกค้า"
            >
              {(
                [
                  {id: 'all', label: `ทั้งหมด (${GUESTS.length})`},
                  {id: 'visited', label: `เคยมาแล้ว (${visitedCount})`},
                  {id: 'unvisited', label: `ยังไม่เคยมา (${unvisitedCount})`},
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      soundEngine.playTap();
                      setFilter(tab.id);
                    }}
                    className={`min-h-[38px] rounded-md px-3 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-white text-[#1F2823] shadow-xs'
                        : 'text-[#4A534D] hover:text-[#1F2823]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-[#5A655D]">
              ลูกค้าที่เข้ามาในโหมดรับรองแขกจะเปิดเผยใบหน้าอัตโนมัติ
            </p>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedGuest ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setSelectedGuest(null);
                }}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#1F2823]/12 bg-white px-3.5 text-xs sm:text-sm font-medium text-[#1F2823] hover:bg-[#EFECE4]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>กลับไปหน้ารายชื่อทั้งหมด</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-5 items-start rounded-2xl border border-[#1F2823]/12 bg-white p-4 sm:p-5">
                <div
                  className="aspect-square w-full overflow-hidden rounded-xl border border-[#1F2823]/10 flex items-center justify-center font-display text-4xl font-semibold text-[#1F2823]"
                  style={{backgroundColor: selectedGuest.accentBg}}
                >
                  {!portraitFailed[selectedGuest.id] ? (
                    <img
                      src={selectedGuest.portraitUrl}
                      alt={selectedGuest.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPortraitFailed((prev) => ({
                          ...prev,
                          [selectedGuest.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{selectedGuest.fallbackInitial}</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#2E6F40]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>เปิดเผยข้อมูลแล้ว · เคยแวะมาเยือนเรือนชา</span>
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-[#1F2823]">
                      {selectedGuest.name}
                    </h3>
                    <p className="text-sm text-[#5A655D]">{selectedGuest.role}</p>
                  </div>

                  <div className="border-t border-[#1F2823]/10 pt-3 text-xs sm:text-sm text-[#39423C] space-y-1">
                    <p>
                      จำนวนถ้วยที่เคยชงให้:{' '}
                      <span className="font-mono-num font-semibold text-[#1F2823]">
                        {servedCountByName[selectedGuest.name] ?? 0}
                      </span>{' '}
                      ถ้วย
                    </p>
                    <p className="text-xs text-[#5A655D]">
                      สามารถต้อนรับและชงชาให้คุณ{selectedGuest.name.replace(/^คุณ/, '')}
                      ได้อีกครั้งในโหมดรับรองแขก
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="rounded-xl border border-[#1F2823]/10 bg-white p-8 text-center">
              <p className="text-sm text-[#4A534D]">
                {filter === 'visited'
                  ? 'ยังไม่มีลูกค้าที่เคยมาร้านเลย ลองเปิดร้านในโหมดรับรองแขกเพื่อต้อนรับแขกคนแรกดูสิ'
                  : 'ยอดเยี่ยมมาก! คุณได้พบและเปิดเผยใบหน้าลูกค้าครบทุกคนแล้ว'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredGuests.map((guest) => {
                const isVisited = visitedSet.has(guest.id);
                const servedCount = servedCountByName[guest.name] ?? 0;
                const showingHint = lockedHintId === guest.id;

                if (isVisited) {
                  return (
                    <motion.button
                      key={guest.id}
                      type="button"
                      whileHover={{y: -2}}
                      whileTap={{scale: 0.97}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.playTap();
                        setSelectedGuest(guest);
                      }}
                      className="group flex flex-col overflow-hidden rounded-xl border border-[#1F2823]/12 bg-white text-left shadow-2xs hover:border-[#2E6F40]/45 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40]"
                    >
                      <div
                        className="relative aspect-square w-full overflow-hidden border-b border-[#1F2823]/8 flex items-center justify-center font-display text-2xl font-semibold text-[#1F2823]"
                        style={{backgroundColor: guest.accentBg}}
                      >
                        {!portraitFailed[guest.id] ? (
                          <img
                            src={guest.portraitUrl}
                            alt={guest.name}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={() =>
                              setPortraitFailed((prev) => ({
                                ...prev,
                                [guest.id]: true,
                              }))
                            }
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span>{guest.fallbackInitial}</span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                        <div>
                          <h3 className="font-display text-sm font-semibold text-[#1F2823] truncate">
                            {guest.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-[#5A655D] line-clamp-1">
                            {guest.role}
                          </p>
                        </div>

                        <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#2E6F40]">
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate font-mono-num">
                            {servedCount > 0
                              ? `เคยมา · ชงให้ ${servedCount} แก้ว`
                              : 'เคยมาร้านแล้ว'}
                          </span>
                        </p>
                      </div>
                    </motion.button>
                  );
                }

                // Unvisited customer: closed mystery card with silhouette '?' art
                return (
                  <motion.button
                    key={guest.id}
                    type="button"
                    whileTap={{scale: 0.97}}
                    transition={TAP_SPRING}
                    onClick={() => {
                      soundEngine.playTap();
                      setLockedHintId((prev) =>
                        prev === guest.id ? null : guest.id,
                      );
                    }}
                    aria-label="ลูกค้าปริศนา ยังไม่เคยมาร้าน"
                    className="flex flex-col overflow-hidden rounded-xl border border-[#1F2823]/12 bg-[#ECE9E0] text-left opacity-92 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden border-b border-[#1F2823]/10">
                      <MysterySilhouetteCardArt />
                      <div className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F2823]/75 text-[#FAF8F3]">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-[#39423C]">
                          ลูกค้าปริศนา
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#636C65] line-clamp-2">
                          {showingHint
                            ? 'เปิดโหมดรับรองแขกเพื่อรอต้อนรับลูกค้าคนนี้'
                            : 'ปิดผนึก · ยังไม่เคยมาร้าน'}
                        </p>
                      </div>

                      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#5A655D]">
                        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>รอการพบเจอ</span>
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Subtle Exit Bar for Quick Dismiss */}
        <AnimatePresence>
          {lockedHintId && !selectedGuest && (
            <motion.div
              initial={{opacity: 0, y: 6}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 6}}
              transition={{duration: 0.16}}
              className="border-t border-[#1F2823]/10 bg-[#F4F1EA] px-4 py-2 text-center text-xs text-[#4A534D]"
            >
              เมื่อลูกค้าใหม่เดินผ่านประตูเข้ามาในโหมดรับรองแขก ระบบจะบันทึกและเปิดเผยรูปภาพอัตโนมัติ
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
