import React, {useEffect, useMemo, useState} from 'react';
import {motion} from 'motion/react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Github,
  Mail,
  MessageSquarePlus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {CURRENT_APP_VERSION} from '../data/changelog';
import {isNativeMobileApp} from '../utils/appLifecycle';
import {probeDeviceOptimization} from '../utils/deviceOptimizer';
import {
  buildCreatorGithubIssueUrl,
  buildCreatorGmailComposeUrl,
  buildCreatorMailtoUrl,
  CREATOR_GITHUB_PROFILE_URL,
  CREATOR_GITHUB_USERNAME,
  CREATOR_GMAIL_ADDRESS,
} from '../utils/security';
import {soundEngine} from '../utils/soundEngine';

interface RequestScreenProps {
  playerLevel: number;
  optimizationProfile: 'auto' | 'realme-note-50' | 'galaxy-a10' | 'low-ram-2gb' | 'standard';
  onClose: () => void;
}

type RequestCategoryId =
  | 'general'
  | 'tea'
  | 'character'
  | 'music'
  | 'feature'
  | 'bug'
  | 'custom';

interface RequestCategoryOption {
  id: RequestCategoryId;
  label: string;
}

const REQUEST_CATEGORIES: RequestCategoryOption[] = [
  {id: 'general', label: 'คำร้องขอทั่วไป / อิสระ'},
  {id: 'tea', label: 'ขอเพิ่มเมนูชา & สูตรใหม่'},
  {id: 'character', label: 'ขอเพิ่มตัวละคร / ทรงผม / ชุด 3D'},
  {id: 'music', label: 'ขอเพิ่มเพลง & เสียงบรรยากาศ'},
  {id: 'feature', label: 'เสนอฟีเจอร์ & ระบบเกมใหม่'},
  {id: 'bug', label: 'แจ้งบั๊ก / ปัญหาการเล่น'},
  {id: 'custom', label: 'กำหนดประเภทเอง'},
];

const TAP_SPRING = {type: 'spring' as const, stiffness: 430, damping: 26};
const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

export const RequestScreen: React.FC<RequestScreenProps> = ({
  playerLevel,
  optimizationProfile,
  onClose,
}) => {
  const [category, setCategory] = useState<RequestCategoryId>('general');
  const [customCategory, setCustomCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<'full' | 'email' | null>(null);

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

  const categoryLabel = useMemo(() => {
    if (category === 'custom') {
      return customCategory.trim() || 'คำร้องขออื่นๆ';
    }
    return (
      REQUEST_CATEGORIES.find((c) => c.id === category)?.label ??
      'คำร้องขอทั่วไป'
    );
  }, [category, customCategory]);

  const deviceSummary = useMemo(() => {
    const report = probeDeviceOptimization(optimizationProfile);
    const platform = isNativeMobileApp() ? 'Android App (APK)' : 'Web Browser / PWA';
    return `เวอร์ชั่น: v${CURRENT_APP_VERSION} | แพลตฟอร์ม: ${platform} | เลเวลผู้เล่น: Lv.${playerLevel} | อุปกรณ์: ${report.detectedModelLabel}`;
  }, [optimizationProfile, playerLevel]);

  const formattedSubject = useMemo(() => {
    const cleanSubject = subject.trim();
    const prefix = `[บ้านชาอุ่นใจ 3D - ${categoryLabel}]`;
    return cleanSubject ? `${prefix} ${cleanSubject}` : `${prefix} คำร้องขอจากผู้เล่น`;
  }, [categoryLabel, subject]);

  const formattedBody = useMemo(() => {
    const lines: string[] = [
      `ประเภทคำร้องขอ: ${categoryLabel}`,
      `หัวข้อ: ${subject.trim() || '(ไม่ได้ระบุหัวข้อ)'}`,
      '',
      'รายละเอียดคำร้องขอ:',
      message.trim() || '(ผู้เล่นยังไม่ได้พิมพ์รายละเอียดเพิ่มเติม)',
    ];
    if (senderContact.trim()) {
      lines.push('', `ผู้ส่ง / ช่องทางติดต่อกลับ: ${senderContact.trim()}`);
    }
    if (includeDeviceInfo) {
      lines.push('', '--- ข้อมูลระบบ ---', deviceSummary);
    }
    return lines.join('\n');
  }, [categoryLabel, subject, message, senderContact, includeDeviceInfo, deviceSummary]);

  const mailtoUrl = useMemo(
    () => buildCreatorMailtoUrl(formattedSubject, formattedBody),
    [formattedSubject, formattedBody],
  );

  const gmailComposeUrl = useMemo(
    () => buildCreatorGmailComposeUrl(formattedSubject, formattedBody),
    [formattedSubject, formattedBody],
  );

  const githubIssueUrl = useMemo(
    () => buildCreatorGithubIssueUrl(formattedSubject, formattedBody),
    [formattedSubject, formattedBody],
  );

  const copyText = async (text: string, key: 'full' | 'email', notice: string) => {
    soundEngine.playTap();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setStatusNotice(notice);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2400);
    } catch {
      setStatusNotice('ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาคัดลอกข้อความจากกล่องตัวอย่างด้านล่าง');
    }
  };

  const handleChannelClick = (channelName: string) => {
    soundEngine.playTap();
    if (!message.trim() && !subject.trim()) {
      setStatusNotice(
        `กำลังเปิด ${channelName} (คุณสามารถพิมพ์ข้อความในหน้าต่าง ${channelName} ได้เลย หรือกลับมากรอกรายละเอียดที่นี่ก่อนได้)`,
      );
    } else {
      setStatusNotice(
        `เตรียมข้อความคำร้องขอเรียบร้อยแล้ว กำลังเปิด ${channelName} เพื่อส่งถึงผู้สร้างเกม`,
      );
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-screen-title"
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 18}}
      transition={{duration: 0.24, ease: PANEL_EASE}}
      className="fixed inset-0 z-50 flex flex-col bg-[#F3F1EC] text-[#1F2823] will-change-transform"
    >
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-10 border-b border-[#1F2823]/10 bg-[#FAF9F6]/96 px-4 sm:px-6 py-3">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onClose();
              }}
              whileTap={{scale: 0.92}}
              transition={TAP_SPRING}
              aria-label="ย้อนกลับ"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#1F2823] hover:bg-[#EFECE4] shrink-0"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </motion.button>
            <div className="min-w-0">
              <h1
                id="request-screen-title"
                className="font-display text-lg sm:text-xl font-bold text-[#1F2823] flex items-center gap-2 truncate"
              >
                <MessageSquarePlus
                  className="h-5 w-5 text-[#2E6F40] shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">หน้าร้องขอถึงผู้สร้างเกม</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-[#5A655D] truncate">
                เขียนคำร้องขอได้ทุกชนิด · ส่งถึงผู้สร้างทาง Gmail หรือ GitHub
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            whileTap={{scale: 0.92}}
            transition={TAP_SPRING}
            aria-label="ปิดหน้าร้องขอ"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1F2823]/12 bg-white text-[#4A534D] hover:bg-[#EFECE4] shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mx-auto max-w-[920px] space-y-4 pb-8">
          {/* Creator Channels Card */}
          <section className="rounded-2xl border border-[#2E6F40]/20 bg-[#EDF5EE] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1D4B2A] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>ช่องทางติดต่อผู้สร้างเกมโดยตรง</span>
                </h2>
                <p className="mt-1 text-xs text-[#34593E]">
                  สามารถส่งคำร้องขอได้ทุกเรื่อง ทั้งเมนูชาใหม่ ตัวละคร เพลง ฟีเจอร์ หรือแจ้งปัญหาการใช้งาน
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#2E6F40]/15 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCE8E6] text-[#C5221F] shrink-0">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-[#5A655D]">
                      Gmail ผู้สร้างเกม
                    </span>
                    <span className="block text-xs sm:text-sm font-bold text-[#1F2823] truncate">
                      {CREATOR_GMAIL_ADDRESS}
                    </span>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileTap={{scale: 0.94}}
                  transition={TAP_SPRING}
                  onClick={() =>
                    void copyText(
                      CREATOR_GMAIL_ADDRESS,
                      'email',
                      `คัดลอกอีเมล ${CREATOR_GMAIL_ADDRESS} เรียบร้อยแล้ว`,
                    )
                  }
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#1F2823]/12 bg-[#FAF9F6] px-2.5 text-[11px] font-semibold text-[#1F2823] hover:bg-[#EFECE4] shrink-0"
                >
                  {copiedKey === 'email' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#2E6F40]" aria-hidden="true" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>คัดลอก</span>
                    </>
                  )}
                </motion.button>
              </div>

              <a
                href={CREATOR_GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playTap()}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#2E6F40]/15 bg-white px-3 py-2.5 hover:bg-[#FAF9F6]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#233029] text-white shrink-0">
                    <Github className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-[#5A655D]">
                      GitHub ผู้สร้างเกม
                    </span>
                    <span className="block text-xs sm:text-sm font-bold text-[#1F2823] truncate">
                      {CREATOR_GITHUB_USERNAME}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E6F40] shrink-0">
                  <span>เปิดโปรไฟล์</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
            </div>
          </section>

          {/* Request Form Card */}
          <section className="rounded-2xl border border-[#1F2823]/10 bg-white p-4 sm:p-5 space-y-4">
            {/* Category Selector */}
            <div>
              <span className="block text-xs font-semibold text-[#5A655D] mb-2">
                เลือกประเภทคำร้องขอ (เขียนได้ทุกชนิด)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REQUEST_CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      type="button"
                      whileTap={{scale: 0.95}}
                      transition={TAP_SPRING}
                      onClick={() => {
                        soundEngine.playTap();
                        setCategory(cat.id);
                      }}
                      className={`min-h-[38px] rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#2E6F40] bg-[#2E6F40] text-white'
                          : 'border-[#1F2823]/12 bg-[#FAF9F6] text-[#3E4741] hover:bg-[#EFECE4]'
                      }`}
                    >
                      {cat.label}
                    </motion.button>
                  );
                })}
              </div>

              {category === 'custom' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="ระบุประเภทคำร้องขอที่ต้องการ..."
                    maxLength={60}
                    className="w-full rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1F2823] placeholder:text-[#848E87] focus:border-[#2E6F40] focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="request-subject"
                className="block text-xs font-semibold text-[#5A655D] mb-1.5"
              >
                หัวข้อคำร้องขอ
              </label>
              <input
                id="request-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น อยากให้เพิ่มชาดอกอัญชัน, ขอเพิ่มเพลงใหม่, แจ้งปัญหาการเล่น..."
                maxLength={120}
                className="w-full rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1F2823] placeholder:text-[#848E87] focus:border-[#2E6F40] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="request-message"
                className="block text-xs font-semibold text-[#5A655D] mb-1.5"
              >
                รายละเอียดคำร้องขอ (เขียนได้อิสระทุกชนิด)
              </label>
              <textarea
                id="request-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="พิมพ์สิ่งที่อยากขอหรือแนะนำผู้สร้างเกมได้เลย เช่น สูตรชาที่อยากได้ โมเดลตัวละคร เพลงประกอบ การปรับแต่งระบบ หรือปัญหาที่พบ..."
                maxLength={1500}
                className="w-full resize-y rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm leading-relaxed text-[#1F2823] placeholder:text-[#848E87] focus:border-[#2E6F40] focus:bg-white focus:outline-none"
              />
              <div className="mt-1 flex justify-end text-[11px] text-[#7A847D] font-mono-num">
                {message.length}/1500
              </div>
            </div>

            {/* Optional Contact + Device Info Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label
                  htmlFor="request-sender"
                  className="block text-xs font-semibold text-[#5A655D] mb-1.5"
                >
                  ชื่อผู้ส่ง / ช่องทางติดต่อกลับ (ไม่บังคับ)
                </label>
                <input
                  id="request-sender"
                  type="text"
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  placeholder="ชื่อเล่น หรืออีเมล / GitHub ของคุณ"
                  maxLength={80}
                  className="w-full rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1F2823] placeholder:text-[#848E87] focus:border-[#2E6F40] focus:bg-white focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-[#1F2823]/10 bg-[#FAF9F6] p-3 cursor-pointer sm:mt-5">
                <input
                  type="checkbox"
                  checked={includeDeviceInfo}
                  onChange={(e) => {
                    soundEngine.playTap();
                    setIncludeDeviceInfo(e.target.checked);
                  }}
                  className="mt-0.5 h-4 w-4 rounded accent-[#2E6F40]"
                />
                <span className="text-xs text-[#3E4741] leading-snug">
                  <strong className="block font-semibold text-[#1F2823]">
                    แนบข้อมูลเวอร์ชั่นเกมและอุปกรณ์อัตโนมัติ
                  </strong>
                  <span className="text-[11px] text-[#5A655D]">
                    {deviceSummary}
                  </span>
                </span>
              </label>
            </div>

            {statusNotice && (
              <div className="rounded-xl border border-[#2E6F40]/25 bg-[#EDF5EE] px-3.5 py-2.5 text-xs font-medium text-[#1D4B2A]">
                {statusNotice}
              </div>
            )}

            {/* Send Buttons */}
            <div className="border-t border-[#1F2823]/10 pt-4 space-y-2.5">
              <span className="block text-xs font-semibold text-[#5A655D]">
                เลือกช่องทางส่งคำร้องขอถึงผู้สร้าง
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Native / Default Mailto Gmail App */}
                <a
                  href={mailtoUrl}
                  onClick={() => handleChannelClick('แอป Gmail / อีเมล')}
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl bg-[#2E6F40] px-4 py-2.5 text-white shadow-sm hover:bg-[#245832]"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold truncate">
                        ส่งทางแอป Gmail / อีเมล
                      </span>
                      <span className="block text-[11px] text-white/85 truncate">
                        ถึง {CREATOR_GMAIL_ADDRESS}
                      </span>
                    </span>
                  </span>
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>

                {/* GitHub New Issue */}
                <a
                  href={githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleChannelClick('GitHub Issues (pppu13610-glitch)')}
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl bg-[#233029] px-4 py-2.5 text-white shadow-sm hover:bg-[#1A241E]"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Github className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold truncate">
                        ส่งคำร้องขอทาง GitHub
                      </span>
                      <span className="block text-[11px] text-white/80 truncate">
                        @{CREATOR_GITHUB_USERNAME} · Issues
                      </span>
                    </span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Gmail Web Compose */}
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleChannelClick('Gmail บนเว็บเบราว์เซอร์')}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 text-xs sm:text-sm font-semibold text-[#1F2823] hover:bg-[#EFECE4]"
                >
                  <Mail className="h-4 w-4 text-[#C5221F] shrink-0" aria-hidden="true" />
                  <span>เปิดเขียนใน Gmail (เว็บเบราว์เซอร์)</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#5A655D] shrink-0" aria-hidden="true" />
                </a>

                {/* Copy Full Request */}
                <motion.button
                  type="button"
                  whileTap={{scale: 0.96}}
                  transition={TAP_SPRING}
                  onClick={() =>
                    void copyText(
                      `ส่งถึง: ${CREATOR_GMAIL_ADDRESS}\nหัวข้อ: ${formattedSubject}\n\n${formattedBody}`,
                      'full',
                      'คัดลอกข้อความคำร้องขอทั้งหมดเรียบร้อยแล้ว',
                    )
                  }
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#1F2823]/15 bg-[#FAF9F6] px-3.5 text-xs sm:text-sm font-semibold text-[#1F2823] hover:bg-[#EFECE4]"
                >
                  {copiedKey === 'full' ? (
                    <>
                      <Check className="h-4 w-4 text-[#2E6F40]" aria-hidden="true" />
                      <span className="text-[#2E6F40]">คัดลอกข้อความคำร้องขอแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#5A655D]" aria-hidden="true" />
                      <span>คัดลอกข้อความคำร้องขอทั้งหมด</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
