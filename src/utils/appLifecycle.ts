import {Capacitor} from '@capacitor/core';
import {soundEngine} from './soundEngine';

interface HardwareLifecycleBridge {
  exitAppCompletely?: () => void;
}

declare global {
  interface Window {
    __baanchaAppPause?: () => void;
    __baanchaAppResume?: () => void;
    __baanchaAppExit?: () => void;
    BaanChaHardwareBridge?: HardwareLifecycleBridge;
  }
}

export function isNativeMobileApp(): boolean {
  return Capacitor.isNativePlatform();
}

function isMobileOrNativeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarsePointer || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Registers mobile, browser, and Capacitor/Android lifecycle listeners so audio
 * stops immediately whenever the user leaves, minimizes, locks screen, or closes
 * the game — while preserving in-memory state if the app is only backgrounded.
 */
export function initAppLifecycle(onForegroundResume?: () => void): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const handleBackground = () => {
    soundEngine.pauseForBackground();
  };

  const handleForeground = () => {
    if (document.hidden || document.visibilityState === 'hidden') return;
    soundEngine.resumeFromForeground();
    onForegroundResume?.();
  };

  const handleHardExit = () => {
    soundEngine.hardStopForExit();
  };

  const onVisibilityChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      handleBackground();
    } else {
      handleForeground();
    }
  };

  const onPageHide = (e: PageTransitionEvent) => {
    if (e.persisted) {
      handleBackground();
    } else {
      handleHardExit();
    }
  };

  const onBlur = () => {
    // Cut audio on mobile / APK immediately when another app or system shade takes focus
    if (isMobileOrNativeEnvironment()) {
      handleBackground();
    }
  };

  const onFocus = () => {
    if (!document.hidden && document.visibilityState === 'visible') {
      handleForeground();
    }
  };

  window.__baanchaAppPause = handleBackground;
  window.__baanchaAppResume = handleForeground;
  window.__baanchaAppExit = handleHardExit;

  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('pause', handleBackground);
  document.addEventListener('resume', handleForeground);
  document.addEventListener('freeze', handleBackground);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('beforeunload', handleHardExit);
  window.addEventListener('unload', handleHardExit);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('pause', handleBackground);
    document.removeEventListener('resume', handleForeground);
    document.removeEventListener('freeze', handleBackground);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('beforeunload', handleHardExit);
    window.removeEventListener('unload', handleHardExit);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    delete window.__baanchaAppPause;
    delete window.__baanchaAppResume;
    delete window.__baanchaAppExit;
  };
}

/**
 * Completely closes the app and cuts background execution (on Android APK)
 * while tearing down all audio streams immediately.
 */
export function exitAppCompletely(): void {
  soundEngine.hardStopForExit();
  if (typeof window === 'undefined') return;

  const bridge = window.BaanChaHardwareBridge;
  if (bridge && typeof bridge.exitAppCompletely === 'function') {
    bridge.exitAppCompletely();
    return;
  }

  // Fallback for standalone web/PWA windows
  try {
    window.close();
  } catch {
    // Browsers restrict window.close() for non-script-opened tabs
  }
}
