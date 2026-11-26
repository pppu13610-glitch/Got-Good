import React, {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Download} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{compact?: boolean}> = ({compact}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <motion.button
        type="button"
        onClick={install}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.95}}
        transition={{type: 'spring', stiffness: 420, damping: 24}}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2E6F40] px-4 py-2 text-sm font-medium text-white hover:bg-[#255933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40] whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>{compact ? 'ติดตั้งเล่นออฟไลน์' : 'ติดตั้งไว้เล่นออฟไลน์'}</span>
      </motion.button>
    );
  }

  if (isIOS) {
    return (
      <>
        <motion.button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.95}}
          transition={{type: 'spring', stiffness: 420, damping: 24}}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#1F2823]/20 bg-white px-4 py-2 text-sm font-medium text-[#1F2823] hover:bg-[#EAE7DF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40] whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>ติดตั้งบน iOS</span>
        </motion.button>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.18}}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowIOSGuide(false)}
            >
              <motion.div
                initial={{opacity: 0, scale: 0.9, y: 18}}
                animate={{opacity: 1, scale: 1, y: 0}}
                exit={{opacity: 0, scale: 0.92, y: 14}}
                transition={{type: 'spring', stiffness: 380, damping: 26}}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-[#F3F1EC] p-6 shadow-xl border border-[#1F2823]/10"
              >
                <h3 className="font-display text-lg font-semibold text-[#1F2823]">
                  ติดตั้งลงหน้าจอโฮม (iOS)
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4A534D]">
                  1. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือของ Safari
                  <br />
                  2. เลื่อนลงแล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                </p>
                <motion.button
                  type="button"
                  whileTap={{scale: 0.96}}
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 w-full min-h-[44px] rounded-lg bg-[#233029] py-2.5 text-sm font-medium text-white hover:bg-[#1A241F]"
                >
                  ปิดหน้าต่าง
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};
