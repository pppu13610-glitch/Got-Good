import React, {useEffect, useState} from 'react';
import {Smartphone} from 'lucide-react';

export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });
  const [lockAttempted, setLockAttempted] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  const handleTryLockLandscape = async () => {
    setLockAttempted(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
      }
    } catch {
      // Browser does not allow programmatic orientation lock outside fullscreen/PWA;
      // user can simply rotate their device physically.
    }
  };

  if (!isPortrait) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-guard-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#233029] px-6 py-8 text-center text-[#F3F1EC]"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/15 bg-[#2E3E35]">
        <Smartphone
          className="h-12 w-12 text-[#E5B24C] animate-rotate-phone"
          aria-hidden="true"
        />
      </div>

      <h2
        id="landscape-guard-title"
        className="font-display text-2xl font-semibold text-[#F8F7F3]"
        style={{textWrap: 'balance'}}
      >
        กรุณาหมุนหน้าจอเป็นแนวนอน
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#D2DDD0]">
        เกมบ้านชาอุ่นใจ 3D ออกแบบมาสำหรับเล่นในแนวนอนเท่านั้น
        เพื่อให้เห็นโต๊ะชงชาได้เต็มตาและใช้นิ้วสัมผัสปุ่มต่างๆ ได้ถนัดที่สุด
      </p>

      <button
        type="button"
        onClick={handleTryLockLandscape}
        className="mt-7 min-h-[48px] rounded-xl bg-[#2E6F40] px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-[0.97] hover:bg-[#245732]"
      >
        หมุนเป็นแนวนอนอัตโนมัติ
      </button>

      {lockAttempted && (
        <p className="mt-3 max-w-xs text-xs text-[#AEBCAE]">
          หากหน้าจอยังไม่หมุนอัตโนมัติ ให้ปลดล็อกการหมุนจอแล้วตะแคงมือถือในแนวนอนได้เลยครับ
        </p>
      )}
    </div>
  );
};
