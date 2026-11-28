import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  GitCompareArrows,
  Globe,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import {
  AppVersionEntry,
  ChangeCategory,
  CURRENT_APP_VERSION,
  OLDEST_APP_VERSION,
  VERSION_1_TO_3_COMPARISONS,
  VERSION_HISTORY,
} from '../data/changelog';
import {GUESTS} from '../data/guests';
import {EQUIPMENTS, TEAS} from '../data/teas';
import {
  applyInAppUpdate,
  checkLiveBrowserVersion,
  compareSemver,
  UpdateCheckResult,
} from '../utils/appUpdater';
import {
  CREATOR_GITHUB_PROFILE_URL,
  CREATOR_GITHUB_REPO_URL,
  CREATOR_GITHUB_USERNAME,
  runAppSecurityAudit,
  sanitizeExternalUrl,
} from '../utils/security';
import {CHILL_MUSIC_TRACKS, soundEngine} from '../utils/soundEngine';
import {loadLastSeenVersion, saveLastSeenVersion} from '../utils/storage';

interface UpdateCheckScreenProps {
  initialUpdateResult?: UpdateCheckResult | null;
  onUpdateResult?: (result: UpdateCheckResult) => void;
  onClose: () => void;
}

type UpdateCheckStatus =
  | 'checking'
  | 'up-to-date'
  | 'update-ready'
  | 'offline';

const TAP_SPRING = {type: 'spring' as const, stiffness: 430, damping: 26};
const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

const CATEGORY_FILTERS: ('ทั้งหมด' | ChangeCategory)[] = [
  'ทั้งหมด',
  'ฟีเจอร์ใหม่',
  'เมนูชาและสูตร',
  'ภาพและ 3 มิติ',
  'ประสิทธิภาพ',
];

export const UpdateCheckScreen: React.FC<UpdateCheckScreenProps> = ({
  initialUpdateResult = null,
  onUpdateResult,
  onClose,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(
    CURRENT_APP_VERSION,
  );
  const [compareWithOldest, setCompareWithOldest] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<
    'ทั้งหมด' | ChangeCategory
  >('ทั้งหมด');
  const [status, setStatus] = useState<UpdateCheckStatus>(
    initialUpdateResult?.status ?? 'checking',
  );
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(
    initialUpdateResult,
  );
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>(
    () =>
      initialUpdateResult?.checkedAtLabel ??
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

  const runLiveCheck = useCallback(
    async (withSound = false) => {
      if (withSound) {
        soundEngine.playTap();
      }
      setStatus('checking');
      const result = await checkLiveBrowserVersion();
      setUpdateResult(result);
      setStatus(result.status);
      setLastCheckedAt(result.checkedAtLabel);
      onUpdateResult?.(result);
    },
    [onUpdateResult],
  );

  // Automatically check live browser version when screen opens
  useEffect(() => {
    void runLiveCheck(false);
  }, [runLiveCheck]);

  const handleApplyUpdate = async () => {
    soundEngine.playTap();
    setIsApplyingUpdate(true);
    await applyInAppUpdate(updateResult);
  };

  const activeEntry: AppVersionEntry = useMemo(
    () =>
      VERSION_HISTORY.find((v) => v.version === selectedVersion) ??
      VERSION_HISTORY[0],
    [selectedVersion],
  );

  const oldestEntry: AppVersionEntry = useMemo(
    () =>
      VERSION_HISTORY.find((v) => v.version === OLDEST_APP_VERSION) ??
      VERSION_HISTORY[VERSION_HISTORY.length - 1],
    [],
  );

  const filteredChanges = useMemo(() => {
    if (categoryFilter === 'ทั้งหมด') return activeEntry.changes;
    return activeEntry.changes.filter((c) => c.category === categoryFilter);
  }, [activeEntry, categoryFilter]);

  const filteredOldestComparisons = useMemo(() => {
    if (categoryFilter === 'ทั้งหมด') return VERSION_1_TO_3_COMPARISONS;
    return VERSION_1_TO_3_COMPARISONS.filter((c) => c.area === categoryFilter);
  }, [categoryFilter]);

  const cumulativeMilestones = useMemo(() => {
    return VERSION_HISTORY.filter(
      (entry) =>
        compareSemver(entry.version, OLDEST_APP_VERSION) > 0 &&
        compareSemver(entry.version, activeEntry.version) <= 0,
    )
      .map((entry) => ({
        ...entry,
        matchedChanges:
          categoryFilter === 'ทั้งหมด'
            ? entry.changes
            : entry.changes.filter((c) => c.category === categoryFilter),
      }))
      .filter((entry) => entry.matchedChanges.length > 0);
  }, [activeEntry.version, categoryFilter]);

  const latestBrowserVersion =
    updateResult?.latestVersion ?? CURRENT_APP_VERSION;
  const hasNewerBrowserVersion =
    compareSemver(latestBrowserVersion, CURRENT_APP_VERSION) > 0;
  const securityAudit = useMemo(() => runAppSecurityAudit(), []);
  const safeGithubProfileUrl = sanitizeExternalUrl(
    updateResult?.analysis.githubProfileUrl ?? CREATOR_GITHUB_PROFILE_URL,
    CREATOR_GITHUB_PROFILE_URL,
  );
  const safeGithubRepoUrl = sanitizeExternalUrl(
    updateResult?.analysis.githubRepoUrl ?? CREATOR_GITHUB_REPO_URL,
    CREATOR_GITHUB_REPO_URL,
  );

  const isViewingLatestVsOldest =
    activeEntry.version === CURRENT_APP_VERSION;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-screen-title"
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 10}}
      transition={{duration: 0.2, ease: PANEL_EASE}}
      style={{contain: 'layout style paint'}}
      className="fixed inset-0 z-50 flex flex-col bg-[#F5F2EB] text-[#1F2823] will-change-transform"
    >
      {/* Full-Screen Sticky Header with Top-Left Back Button */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F2823]/10 bg-[#FAF8F3] safe-px py-2.5 sm:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            type="button"
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
              เช็คอัปเดตเวอร์ชั่นและซิงก์กับ Browser
            </h1>
            <p className="hidden sm:block text-xs text-[#5A655D] truncate">
              เวอร์ชั่นในตัวเกม{' '}
              <span className="font-mono-num font-semibold text-[#2E6F40] tabular-nums">
                v{CURRENT_APP_VERSION}
              </span>{' '}
              · ตรวจสอบและอัปเดตให้ตรงกับ Browser ปัจจุบันได้ทันที
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          disabled={status === 'checking' || isApplyingUpdate}
          whileTap={{scale: 0.93}}
          transition={TAP_SPRING}
          onClick={() => void runLiveCheck(true)}
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
          {/* Left Column: Current Status + Live Browser Sync + Version Timeline */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Live Version Check Status Card */}
            <section className="rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/game-icon.png"
                    alt="ไอคอนเกมบ้านชาอุ่นใจ"
                    width={44}
                    height={44}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-xl object-cover shadow-xs ring-1 ring-[#1F2823]/10 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-[#5A655D]">เวอร์ชั่นในตัวเกม</p>
                    <p className="mt-0.5 font-mono-num text-2xl font-bold text-[#1F2823] tabular-nums">
                      v{CURRENT_APP_VERSION}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#5A655D]">เวอร์ชั่น Browser ล่าสุด</p>
                  <p className="font-mono-num text-base font-bold text-[#2E6F40] tabular-nums">
                    v{latestBrowserVersion}
                  </p>
                  <p className="font-mono-num text-[11px] text-[#5A655D] tabular-nums">
                    ตรวจเมื่อ {lastCheckedAt} น.
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
                        {hasNewerBrowserVersion
                          ? `พบเวอร์ชั่นใหม่ v${latestBrowserVersion} บน Browser! กดปุ่มด้านล่างเพื่ออัปเดตภายในแอปให้ตรงกันทันที`
                          : 'พบแพ็กเกจอัปเดตใหม่บน Browser พร้อมใช้งานแล้ว แตะปุ่มด้านล่างเพื่ออัปเดตทันที'}
                      </span>
                    </div>

                    {updateResult?.remoteManifest?.highlights &&
                      updateResult.remoteManifest.highlights.length > 0 && (
                        <ul className="space-y-1 rounded-xl bg-[#EDF5EE] p-2.5 text-[11px] text-[#224B2B]">
                          {updateResult.remoteManifest.highlights.map(
                            (line) => (
                              <li key={line}>• {line}</li>
                            ),
                          )}
                        </ul>
                      )}

                    <motion.button
                      type="button"
                      disabled={isApplyingUpdate}
                      whileTap={{scale: 0.95}}
                      onClick={() => void handleApplyUpdate()}
                      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E6F40] px-4 text-xs sm:text-sm font-semibold text-white hover:bg-[#245732] disabled:opacity-60"
                    >
                      <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isApplyingUpdate
                          ? 'กำลังอัปเดต...'
                          : `อัปเดตเป็น v${latestBrowserVersion} ทันที`}
                      </span>
                    </motion.button>
                  </div>
                )}

                {status === 'up-to-date' && (
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-[#255F30]">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {upgradedFrom
                          ? `อัปเดตจาก v${upgradedFrom} เป็น v${CURRENT_APP_VERSION} ตรงกับ Browser เรียบร้อยแล้ว`
                          : `ตัวเกมของคุณ (v${CURRENT_APP_VERSION}) ตรงกับเวอร์ชั่นบน Browser ปัจจุบันแล้ว`}
                      </span>
                    </div>

                    <motion.button
                      type="button"
                      disabled={isApplyingUpdate}
                      whileTap={{scale: 0.95}}
                      onClick={() => void handleApplyUpdate()}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1F2823]/12 bg-[#FAF9F6] px-3 text-xs font-medium text-[#1F2823] hover:bg-[#EFECE4]"
                    >
                      <Globe className="h-3.5 w-3.5 text-[#2E6F40]" aria-hidden="true" />
                      <span>
                        {isApplyingUpdate
                          ? 'กำลังรีโหลดเวอร์ชั่นล่าสุด...'
                          : 'ล้างแคช & โหลดเวอร์ชั่น Browser ซ้ำ'}
                      </span>
                    </motion.button>
                  </div>
                )}

                {status === 'offline' && (
                  <div className="flex items-start gap-2 text-xs text-[#7D5A3C]">
                    <WifiOff
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      ขณะนี้ออฟไลน์อยู่ จึงไม่สามารถเทียบเวอร์ชั่นกับเซิร์ฟเวอร์ Browser ได้
                      แต่ยังดูสิ่งที่เพิ่มเข้ามาในแต่ละเวอร์ชั่นได้ครบถ้วน
                    </span>
                  </div>
                )}

                {status === 'checking' && (
                  <p className="text-xs text-[#5A655D]">
                    กำลังเชื่อมต่อเช็คเวอร์ชั่นล่าสุดจาก Browser และ GitHub ผู้สร้างเกม...
                  </p>
                )}

                {updateResult && (
                  <div className="mt-3 rounded-xl border border-[#1F2823]/10 bg-[#FAF9F6] p-2.5 text-[11px] text-[#39423C] space-y-1.5">
                    <div className="flex items-center justify-between gap-2 font-semibold text-[#1F2823]">
                      <span>ผลวิเคราะห์การอัปเดต</span>
                      <span className="text-[#2E6F40]">{updateResult.sourceLabel}</span>
                    </div>
                    <p className="leading-snug text-[#4A534D]">
                      {updateResult.analysis.comparisonSummary}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px] font-medium text-[#255F30]">
                      <span>
                        ฟีเจอร์ +{updateResult.analysis.categoryBreakdown['ฟีเจอร์ใหม่']}
                      </span>
                      <span>·</span>
                      <span>
                        ภาพ 3D +{updateResult.analysis.categoryBreakdown['ภาพและ 3 มิติ']}
                      </span>
                      <span>·</span>
                      <span>
                        ประสิทธิภาพ +{updateResult.analysis.categoryBreakdown['ประสิทธิภาพ']}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Creator GitHub Account & Security Scan Verification Card */}
            <section className="rounded-2xl border border-[#1F2823]/10 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-[#5A655D]">
                    บัญชี GitHub ผู้สร้าง / ผู้พัฒนาเกม
                  </p>
                  <p className="font-mono-num text-xs font-bold text-[#1F2823]">
                    {CREATOR_GITHUB_USERNAME}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={safeGithubProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#233029] px-3 text-xs font-semibold text-white hover:bg-[#19231E] whitespace-nowrap"
                  >
                    <span>โปรไฟล์ GitHub</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={safeGithubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-2.5 text-xs font-medium text-[#1F2823] hover:bg-[#EFECE4] whitespace-nowrap"
                  >
                    <span>โค้ดเกม</span>
                  </a>
                </div>
              </div>

              <div className="border-t border-[#1F2823]/8 pt-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#255F30]">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{securityAudit.summaryText}</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#4A534D]">
                  {securityAudit.checks.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5">
                      <span className="text-[#2E6F40] font-bold">✓</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Version Timeline Selector (exact original selector) */}
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
                  const isOldest = item.version === OLDEST_APP_VERSION;
                  return (
                    <motion.button
                      key={item.version}
                      type="button"
                      whileTap={{scale: 0.96}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.playTap();
                        setSelectedVersion(item.version);
                        if (item.version === OLDEST_APP_VERSION) {
                          setCompareWithOldest(false);
                        }
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
                          <span className="font-mono-num tabular-nums">
                            v{item.version}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-[#2E6F40]">
                              · ล่าสุด
                            </span>
                          )}
                          {isOldest && (
                            <span className="text-[11px] font-semibold text-[#7D5A3C]">
                              · เก่าที่สุด
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5A655D] truncate">
                          {item.releaseTitle}
                        </p>
                      </div>
                      <span className="font-mono-num text-[11px] text-[#5A655D] whitespace-nowrap shrink-0 tabular-nums">
                        {item.changes.length} รายการ
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Original Version Detail + Simple Toggle to Compare with Oldest Version */}
          <section className="lg:col-span-8 rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-6 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeEntry.version}-${compareWithOldest ? 'oldest' : 'prev'}`}
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -6}}
                transition={{duration: 0.16, ease: PANEL_EASE}}
                className="flex flex-col flex-1"
              >
                {/* Comparison Header */}
                <div className="border-b border-[#1F2823]/10 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A655D]">
                      <GitCompareArrows
                        className="h-4 w-4 text-[#2E6F40] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-mono-num font-semibold text-[#2E6F40] tabular-nums">
                        {compareWithOldest &&
                        activeEntry.version !== OLDEST_APP_VERSION
                          ? `เปรียบเทียบ v${activeEntry.version} เทียบกับเวอร์ชั่นเก่าที่สุด v${OLDEST_APP_VERSION}`
                          : activeEntry.previousVersion
                            ? `เปรียบเทียบ v${activeEntry.version} เทียบกับ v${activeEntry.previousVersion}`
                            : `เวอร์ชั่นเริ่มต้น v${activeEntry.version}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {compareWithOldest &&
                        activeEntry.version !== OLDEST_APP_VERSION
                          ? `${oldestEntry.releaseDate} → ${activeEntry.releaseDate}`
                          : activeEntry.releaseDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num tabular-nums">
                        {compareWithOldest &&
                        activeEntry.version !== OLDEST_APP_VERSION
                          ? `พัฒนาต่อเนื่อง ${cumulativeMilestones.length} รุ่น`
                          : `เพิ่มและปรับปรุง ${activeEntry.changes.length} รายการ`}
                      </span>
                    </div>

                    {activeEntry.version !== OLDEST_APP_VERSION && (
                      <motion.button
                        type="button"
                        whileTap={{scale: 0.95}}
                        transition={TAP_SPRING}
                        onClick={() => {
                          soundEngine.playTap();
                          setCompareWithOldest((prev) => !prev);
                        }}
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          compareWithOldest
                            ? 'border-[#2E6F40] bg-[#2E6F40] text-white'
                            : 'border-[#1F2823]/15 bg-[#FAF9F6] text-[#2E6F40] hover:bg-[#EDF5EE]'
                        }`}
                      >
                        <GitCompareArrows className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {compareWithOldest
                            ? `กลับไปดูเฉพาะ v${activeEntry.version}`
                            : `เทียบกับเวอร์ชั่นเก่าที่สุด (v${OLDEST_APP_VERSION})`}
                        </span>
                      </motion.button>
                    )}
                  </div>

                  <h2
                    className="mt-1.5 font-display text-lg sm:text-2xl font-bold text-[#1F2823]"
                    style={{textWrap: 'balance'}}
                  >
                    {compareWithOldest &&
                    activeEntry.version !== OLDEST_APP_VERSION
                      ? `สรุปความแตกต่างระหว่าง v${OLDEST_APP_VERSION} (เก่าที่สุด) กับ v${activeEntry.version}`
                      : activeEntry.releaseTitle}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#4A534D] leading-relaxed">
                    {compareWithOldest &&
                    activeEntry.version !== OLDEST_APP_VERSION
                      ? `เทียบพัฒนาการตั้งแต่เวอร์ชั่นเปิดตัวแรกสุด v${OLDEST_APP_VERSION} (${oldestEntry.releaseDate}) มาจนถึง v${activeEntry.version} (${activeEntry.releaseDate})`
                      : activeEntry.summary}
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

                {/* Body: Oldest Comparison Mode OR Original Per-Version Additions List */}
                {compareWithOldest &&
                activeEntry.version !== OLDEST_APP_VERSION ? (
                  <div className="mt-3 space-y-5">
                    {isViewingLatestVsOldest && (
                      <>
                        {/* Quantitative Overview Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#1F2823]/10 pb-3.5">
                          <div>
                            <p className="text-[11px] text-[#5A655D]">เมนูชาทั้งหมด</p>
                            <p className="mt-0.5 font-mono-num text-base font-bold text-[#1F2823] tabular-nums">
                              9 → {TEAS.length} เมนู
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#5A655D]">ตัวละครลูกค้า</p>
                            <p className="mt-0.5 font-mono-num text-base font-bold text-[#1F2823] tabular-nums">
                              0 → {GUESTS.length} ตัวละคร
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#5A655D]">เพลงประกอบ</p>
                            <p className="mt-0.5 font-mono-num text-base font-bold text-[#1F2823] tabular-nums">
                              0 → {CHILL_MUSIC_TRACKS.length} เพลง
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#5A655D]">อุปกรณ์ 3 มิติ</p>
                            <p className="mt-0.5 font-mono-num text-base font-bold text-[#1F2823] tabular-nums">
                              1 → {Object.keys(EQUIPMENTS).length} ชุด
                            </p>
                          </div>
                        </div>

                        {/* Side-by-Side Comparison Matrix */}
                        <div className="divide-y divide-[#1F2823]/10">
                          {filteredOldestComparisons.map((item, idx) => (
                            <div key={item.aspect} className="py-3.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h3 className="font-display text-sm sm:text-base font-bold text-[#1F2823]">
                                  <span className="font-mono-num text-[#2E6F40] mr-1.5 tabular-nums">
                                    {String(idx + 1).padStart(2, '0')}.
                                  </span>
                                  {item.aspect}
                                </h3>
                                <span className="text-[11px] font-medium text-[#5A655D]">
                                  {item.area}
                                </span>
                              </div>

                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="rounded-xl bg-[#F7F5EE] p-3">
                                  <p className="font-mono-num text-[11px] font-semibold text-[#7D5A3C] tabular-nums">
                                    เวอร์ชั่นเก่าที่สุด (v{OLDEST_APP_VERSION})
                                  </p>
                                  <p className="mt-1 text-xs sm:text-sm text-[#4A534D] leading-relaxed">
                                    {item.oldestText}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-[#EDF5EE] p-3">
                                  <p className="font-mono-num text-[11px] font-semibold text-[#255F30] tabular-nums">
                                    เวอร์ชั่นใหม่ (v{CURRENT_APP_VERSION})
                                  </p>
                                  <p className="mt-1 text-xs sm:text-sm font-medium text-[#1F2823] leading-relaxed">
                                    {item.latestText}
                                  </p>
                                </div>
                              </div>

                              <p className="mt-1.5 text-xs font-medium text-[#2E6F40]">
                                สิ่งที่เปลี่ยนไป: {item.impactNote}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Chronological Cumulative List from v1.0.0 up to activeEntry */}
                    <div className="border-t border-[#1F2823]/10 pt-4">
                      <h3 className="font-display text-sm sm:text-base font-bold text-[#1F2823] mb-2">
                        รายการที่เพิ่มและเปลี่ยนแปลงทั้งหมดตั้งแต่หลัง v{OLDEST_APP_VERSION} ถึง v{activeEntry.version}
                      </h3>
                      <div className="divide-y divide-[#1F2823]/8">
                        {cumulativeMilestones.map((entry) => (
                          <div key={entry.version} className="py-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-mono-num text-xs sm:text-sm font-bold text-[#2E6F40] tabular-nums">
                                v{entry.version} — {entry.releaseTitle}
                              </span>
                              <span className="text-[11px] text-[#5A655D]">
                                {entry.releaseDate}
                              </span>
                            </div>
                            <ul className="mt-1.5 space-y-1 text-xs text-[#3D4640]">
                              {entry.matchedChanges.map((ch) => (
                                <li key={`${entry.version}-${ch.title}`}>
                                  • <span className="font-semibold text-[#1F2823]">{ch.title}</span>{' '}
                                  <span className="text-[#5A655D]">({ch.category})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 divide-y divide-[#1F2823]/8">
                    {filteredChanges.length > 0 ? (
                      filteredChanges.map((change, idx) => (
                        <div
                          key={`${activeEntry.version}-${change.title}`}
                          className="py-3.5 sm:py-4"
                        >
                          <div className="flex flex-wrap items-baseline gap-2 text-xs text-[#2E6F40] font-semibold">
                            <span className="font-mono-num tabular-nums">
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
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-sm text-[#5A655D]">
                        ไม่มีรายการในหมวดหมู่นี้สำหรับเวอร์ชั่น v{activeEntry.version}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
