import React, {useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  GitCompareArrows,
  History,
  RefreshCw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import {
  AppVersionEntry,
  ChangeCategory,
  CURRENT_APP_VERSION,
  VERSION_HISTORY,
} from '../data/changelog';
import {soundEngine} from '../utils/soundEngine';
import {loadLastSeenVersion, saveLastSeenVersion} from '../utils/storage';

interface UpdateCheckScreenProps {
  onClose: () => void;
}

type UpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'update-ready'
  | 'offline';

const TAP_SPRING = {type: 'spring' as const, stiffness: 430, damping: 26};

const CATEGORY_FILTERS: ('ทั้งหมด' | ChangeCategory)[] = [
  'ทั้งหมด',
  'ฟีเจอร์ใหม่',
  'เมนูชาและสูตร',
  'ภาพและ 3 มิติ',
  'ประสิทธิภาพ',
];

export const UpdateCheckScreen: React.FC<UpdateCheckScreenProps> = ({
  onClose,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(
    CURRENT_APP_VERSION,
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'ทั้งหมด' | ChangeCategory
  >('ทั้งหมด');
  const [status, setStatus] = useState<UpdateCheckStatus>('up-to-date');
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );
  const [upgradedFrom] = useState<string | null>(() => {
    const prev = loadLastSeenVersion();
    return prev && prev !== CURRENT_APP_VERSION ? prev : null;
  });

  useEffect(() => {
    saveLastSeenVersion(CURRENT_APP_VERSION);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundEngine.playTap();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleCheckForUpdates = async () => {
    soundEngine.playTap();
    setStatus('checking');

    const nowLabel = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLastCheckedAt(nowLabel);
      setStatus('offline');
      return;
    }

    try {
      if (
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator
      ) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setLastCheckedAt(nowLabel);
            setStatus('update-ready');
            return;
          }
        }
      }
      setLastCheckedAt(nowLabel);
      setStatus('up-to-date');
    } catch {
      setLastCheckedAt(nowLabel);
      setStatus('up-to-date');
    }
  };

  const handleApplyUpdate = () => {
    soundEngine.playTap();
    if (waitingWorker) {
      waitingWorker.postMessage({type: 'SKIP_WAITING'});
    }
    window.location.reload();
  };

  const activeEntry: AppVersionEntry = useMemo(
    () =>
      VERSION_HISTORY.find((v) => v.version === selectedVersion) ??
      VERSION_HISTORY[0],
    [selectedVersion],
  );

  const filteredChanges = useMemo(() => {
    if (categoryFilter === 'ทั้งหมด') return activeEntry.changes;
    return activeEntry.changes.filter((c) => c.category === categoryFilter);
  }, [activeEntry, categoryFilter]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-screen-title"
      initial={{opacity: 0, y: 24}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      transition={{type: 'spring', stiffness: 360, damping: 30}}
      className="fixed inset-0 z-50 flex flex-col bg-[#F5F2EB] text-[#1F2823]"
    >
      {/* Full-Screen Sticky Header with Top-Left Back Button */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F2823]/10 bg-[#FAF8F3]/96 safe-px py-2.5 sm:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            type="button"
            whileHover={{scale: 1.03}}
            whileTap={{scale: 0.92}}
            transition={TAP_SPRING}
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            aria-label="ย้อนกลับ"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#1F2823]/15 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#1F2823] shadow-2xs hover:bg-[#EFECE4] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>ย้อนกลับ</span>
          </motion.button>

          <div className="min-w-0">
            <h1
              id="update-screen-title"
              className="font-display text-base sm:text-xl font-bold text-[#1F2823] truncate"
            >
              เช็คอัปเดตเวอร์ชั่นและสิ่งใหม่
            </h1>
            <p className="hidden sm:block text-xs text-[#5A655D] truncate">
              เวอร์ชั่นปัจจุบัน{' '}
              <span className="font-mono-num font-semibold text-[#2E6F40]">
                v{CURRENT_APP_VERSION}
              </span>{' '}
              · เปรียบเทียบฟีเจอร์ที่เพิ่มจากเวอร์ชั่นเดิม
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          disabled={status === 'checking'}
          whileHover={{scale: 1.03}}
          whileTap={{scale: 0.93}}
          transition={TAP_SPRING}
          onClick={() => void handleCheckForUpdates()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2E6F40] px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-white hover:bg-[#245732] disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 shrink-0 ${
              status === 'checking' ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          <span>
            {status === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบอัปเดต'}
          </span>
        </motion.button>
      </header>

      {/* Scrollable Landscape-Friendly Body */}
      <div className="flex-1 overflow-y-auto safe-px py-4 sm:py-6 safe-pb">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-12 sm:gap-5">
          {/* Left Column: Current Status + Version Timeline */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Live Version Check Status Card */}
            <section className="rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#5A655D]">เวอร์ชั่นที่ติดตั้ง</p>
                  <p className="mt-0.5 font-mono-num text-2xl font-bold text-[#1F2823]">
                    v{CURRENT_APP_VERSION}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#5A655D]">ตรวจล่าสุด</p>
                  <p className="font-mono-num text-xs font-medium text-[#1F2823]">
                    {lastCheckedAt} น.
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-[#1F2823]/8 pt-3">
                {status === 'update-ready' && (
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-[#255F30]">
                      <Sparkles
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        พบแพ็กเกจเวอร์ชั่นใหม่พร้อมใช้งานแล้ว
                        แตะปุ่มด้านล่างเพื่อรีเฟรชและอัปเดตทันที
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{scale: 0.95}}
                      onClick={handleApplyUpdate}
                      className="w-full min-h-[44px] rounded-xl bg-[#2E6F40] px-4 text-xs sm:text-sm font-semibold text-white hover:bg-[#245732]"
                    >
                      รีเฟรชเพื่อใช้เวอร์ชั่นใหม่
                    </motion.button>
                  </div>
                )}

                {status === 'up-to-date' && (
                  <div className="flex items-start gap-2 text-xs text-[#255F30]">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {upgradedFrom
                        ? `อัปเดตจาก v${upgradedFrom} เป็น v${CURRENT_APP_VERSION} เรียบร้อยแล้ว`
                        : `คุณกำลังใช้งานเวอร์ชั่นล่าสุด (v${CURRENT_APP_VERSION}) แล้ว`}
                    </span>
                  </div>
                )}

                {status === 'offline' && (
                  <div className="flex items-start gap-2 text-xs text-[#7D5A3C]">
                    <WifiOff
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      ขณะนี้ออฟไลน์อยู่ จึงไม่สามารถเช็กเซิร์ฟเวอร์ได้
                      แต่ยังดูสิ่งที่เพิ่มเข้ามาในแต่ละเวอร์ชั่นได้ครบถ้วน
                    </span>
                  </div>
                )}

                {status === 'checking' && (
                  <p className="text-xs text-[#5A655D]">
                    กำลังตรวจสอบไฟล์แคชและเวอร์ชั่นล่าสุด...
                  </p>
                )}
              </div>
            </section>

            {/* Version Timeline Selector */}
            <section className="rounded-2xl border border-[#1F2823]/10 bg-white p-4">
              <div className="flex items-center gap-2 border-b border-[#1F2823]/8 pb-2.5 mb-2.5">
                <History
                  className="h-4 w-4 text-[#2E6F40] shrink-0"
                  aria-hidden="true"
                />
                <h2 className="font-display text-sm font-bold text-[#1F2823]">
                  เลือกดูแต่ละเวอร์ชั่น ({VERSION_HISTORY.length})
                </h2>
              </div>

              <div className="space-y-1.5">
                {VERSION_HISTORY.map((item) => {
                  const isActive = item.version === activeEntry.version;
                  const isCurrent = item.version === CURRENT_APP_VERSION;
                  return (
                    <motion.button
                      key={item.version}
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.playTap();
                        setSelectedVersion(item.version);
                        setCategoryFilter('ทั้งหมด');
                      }}
                      className={`flex min-h-[52px] w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                        isActive
                          ? 'border-[#2E6F40] bg-[#EDF5EE]'
                          : 'border-[#1F2823]/10 bg-[#FAF9F6] hover:bg-[#EFECE4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1F2823]">
                          <span className="font-mono-num">v{item.version}</span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-[#2E6F40]">
                              · ล่าสุด
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5A655D] truncate">
                          {item.releaseTitle}
                        </p>
                      </div>
                      <span className="font-mono-num text-[11px] text-[#5A655D] whitespace-nowrap shrink-0">
                        {item.changes.length} รายการ
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Detailed Comparison vs Previous Version */}
          <section className="lg:col-span-8 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-6 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEntry.version}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -8}}
                transition={{duration: 0.18}}
                className="flex flex-col flex-1"
              >
                {/* Comparison Header */}
                <div className="border-b border-[#1F2823]/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A655D]">
                    <GitCompareArrows
                      className="h-4 w-4 text-[#2E6F40] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-mono-num font-semibold text-[#2E6F40]">
                      {activeEntry.previousVersion
                        ? `เปรียบเทียบ v${activeEntry.version} เทียบกับ v${activeEntry.previousVersion}`
                        : `เวอร์ชั่นเริ่มต้น v${activeEntry.version}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeEntry.releaseDate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      เพิ่มและปรับปรุง {activeEntry.changes.length} รายการ
                    </span>
                  </div>

                  <h2
                    className="mt-1.5 font-display text-lg sm:text-2xl font-bold text-[#1F2823]"
                    style={{textWrap: 'balance'}}
                  >
                    {activeEntry.releaseTitle}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#4A534D] leading-relaxed">
                    {activeEntry.summary}
                  </p>

                  {/* Interactive Category Filter Bar */}
                  <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-[#EFECE4] p-1 touch-pan-x">
                    {CATEGORY_FILTERS.map((cat) => {
                      const active = categoryFilter === cat;
                      return (
                        <motion.button
                          key={cat}
                          type="button"
                          whileTap={{scale: 0.94}}
                          onClick={() => {
                            soundEngine.playTap();
                            setCategoryFilter(cat);
                          }}
                          className="relative min-h-[40px] rounded-lg px-3 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          {active && (
                            <motion.span
                              layoutId="update-cat-pill"
                              transition={{
                                type: 'spring',
                                stiffness: 420,
                                damping: 30,
                              }}
                              className="absolute inset-0 rounded-lg bg-white shadow-xs"
                            />
                          )}
                          <span
                            className={`relative z-10 ${
                              active
                                ? 'font-semibold text-[#1F2823]'
                                : 'text-[#5A655D]'
                            }`}
                          >
                            {cat}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Additions & Improvements List */}
                <div className="mt-2 divide-y divide-[#1F2823]/8">
                  {filteredChanges.length > 0 ? (
                    filteredChanges.map((change, idx) => (
                      <motion.div
                        key={`${activeEntry.version}-${change.title}`}
                        initial={{opacity: 0, x: 8}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: idx * 0.03, duration: 0.18}}
                        className="py-3.5 sm:py-4"
                      >
                        <div className="flex flex-wrap items-baseline gap-2 text-xs text-[#2E6F40] font-semibold">
                          <span className="font-mono-num">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span>{change.category}</span>
                        </div>
                        <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-[#1F2823]">
                          {change.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-[#4A534D] leading-relaxed">
                          {change.detail}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-sm text-[#5A655D]">
                      ไม่มีรายการในหมวดหมู่นี้สำหรับเวอร์ชั่น v{activeEntry.version}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
