import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baancha.cozyteahouse',
  appName: 'บ้านชาอุ่นใจ 3D',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'ais-pre-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app',
      'ais-dev-mtcwhk4ypdwqid2skp5jiy-4788132701.asia-northeast1.run.app',
    ],
  },
  android: {
    backgroundColor: '#233029',
  },
};

export default config;
