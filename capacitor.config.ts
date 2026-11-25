import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baancha.cozyteahouse',
  appName: 'บ้านชาอุ่นใจ 3D',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#233029',
  },
};

export default config;
