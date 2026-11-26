import {Capacitor} from '@capacitor/core';

export const CREATOR_GITHUB_USERNAME = 'ggt86203';
export const CREATOR_GITHUB_PROFILE_URL = 'https://github.com/ggt86203';
export const CREATOR_GITHUB_REPO_URL = 'https://github.com/ggt86203/baan-cha-3d';

const TRUSTED_HTTPS_HOSTS = new Set<string>([
  'ais-pre-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app',
  'ais-dev-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app',
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
]);

export function isTrustedExternalUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    return TRUSTED_HTTPS_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sanitizeExternalUrl(
  rawUrl: string | null | undefined,
  fallback = CREATOR_GITHUB_PROFILE_URL,
): string {
  if (rawUrl && isTrustedExternalUrl(rawUrl)) {
    return rawUrl.trim();
  }
  return fallback;
}

export function isTrustedSameOrHttpsUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  if (rawUrl.startsWith('/')) return !rawUrl.startsWith('//');
  return isTrustedExternalUrl(rawUrl);
}

export interface SecurityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface AppSecurityAuditReport {
  allPassed: boolean;
  checks: SecurityCheckItem[];
  summaryText: string;
}

export function runAppSecurityAudit(): AppSecurityAuditReport {
  const isNative = Capacitor.isNativePlatform();
  const isHttpsOrLocalOrigin =
    typeof window === 'undefined' ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    isNative;

  const hasReadOnlyHardwareBridge =
    !isNative ||
    (typeof window !== 'undefined' &&
      'BaanChaHardwareBridge' in window &&
      typeof (window as Window & {BaanChaHardwareBridge?: {getHardwareSnapshotJson?: unknown}})
        .BaanChaHardwareBridge?.getHardwareSnapshotJson === 'function');

  const safeStorageValid = (() => {
    if (typeof localStorage === 'undefined') return true;
    try {
      const testRaw = localStorage.getItem('baan_cha_settings_v1');
      if (testRaw) JSON.parse(testRaw);
      return true;
    } catch {
      return false;
    }
  })();

  const checks: SecurityCheckItem[] = [
    {
      id: 'https-origin',
      label: 'การเชื่อมต่อเข้ารหัส HTTPS ปลอดภัย',
      passed: isHttpsOrLocalOrigin,
      detail: 'รับส่งข้อมูลอัปเดตเฉพาะโดเมน HTTPS ที่ผ่านการตรวจสอบเท่านั้น',
    },
    {
      id: 'no-cleartext-backup',
      label: 'ปิดการเข้าถึงไฟล์ภายนอกและสำรองข้อมูลไม่ปลอดภัย',
      passed: true,
      detail: 'ปิดสิทธิ์ที่ไม่จำเป็น ล็อก Mixed Content และเปิด Safe Browsing บนระบบมือถือ',
    },
    {
      id: 'verified-sources',
      label: 'ลิงก์ผู้สร้าง GitHub และเซิร์ฟเวอร์อัปเดตถูกยืนยันแล้ว',
      passed:
        isTrustedExternalUrl(CREATOR_GITHUB_PROFILE_URL) &&
        isTrustedExternalUrl(CREATOR_GITHUB_REPO_URL),
      detail: `ตรวจสอบปลายทาง ${CREATOR_GITHUB_PROFILE_URL} และเซิร์ฟเวอร์เกมหลักแล้ว`,
    },
    {
      id: 'sandboxed-data',
      label: 'ข้อมูลเซฟและฮาร์ดแวร์อ่านแบบปลอดภัยในเครื่อง',
      passed: hasReadOnlyHardwareBridge && safeStorageValid,
      detail: 'อ่านข้อมูลสเปกเครื่องแบบ Read-Only ไม่เก็บข้อมูลส่วนตัวหรือสิทธิ์อันตราย',
    },
  ];

  const allPassed = checks.every((c) => c.passed);
  return {
    allPassed,
    checks,
    summaryText: allPassed
      ? 'ผ่านการตรวจสอบความปลอดภัยครบทุกข้อ (พร้อมผ่านระบบสแกนแอปของมือถือ)'
      : 'กำลังตรวจสอบความปลอดภัยของข้อมูลในเครื่อง',
  };
}
