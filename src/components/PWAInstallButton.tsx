import React, {useState} from 'react';
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
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-[#2E6F40] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#255933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40] whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>{compact ? 'ติดตั้งเล่นออฟไลน์' : 'ติดตั้งไว้เล่นออฟไลน์'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#1F2823]/20 bg-white px-4 py-2 text-sm font-medium text-[#1F2823] transition-colors hover:bg-[#EAE7DF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E6F40] whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#F3F1EC] p-6 shadow-xl border border-[#1F2823]/10">
              <h3 className="font-display text-lg font-semibold text-[#1F2823]">
                ติดตั้งลงหน้าจอโฮม (iOS)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4A534D]">
                1. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือของ Safari
                <br />
                2. เลื่อนลงแล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#233029] py-2.5 text-sm font-medium text-white hover:bg-[#1A241F] transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
