type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  const el = document.documentElement as FullscreenElement;
  return Boolean(
    doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      el.requestFullscreen ||
      el.webkitRequestFullscreen,
  );
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export async function requestAppFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (isFullscreenActive()) return true;

  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen({navigationUI: 'hide'});
      } catch {
        await el.requestFullscreen();
      }
    } else if (el.webkitRequestFullscreen) {
      await Promise.resolve(el.webkitRequestFullscreen());
    } else {
      return false;
    }

    const orientation = screen?.orientation as
      | (ScreenOrientation & {lock?: (type: string) => Promise<void>})
      | undefined;
    if (orientation?.lock) {
      orientation.lock('landscape').catch(() => {});
    }

    return isFullscreenActive();
  } catch {
    return false;
  }
}

export async function exitAppFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!isFullscreenActive()) return;

  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await Promise.resolve(doc.webkitExitFullscreen());
    }
  } catch {
    // Ignore errors when exiting fullscreen
  }
}

export async function toggleAppFullscreen(): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitAppFullscreen();
    return false;
  }
  return requestAppFullscreen();
}

export function subscribeFullscreenChange(
  callback: (active: boolean) => void,
): () => void {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    callback(isFullscreenActive());
  };

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
  };
}
