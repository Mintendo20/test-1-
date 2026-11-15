import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personallifeos.app',
  appName: 'Personal Life OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#F8FAFC',
    allowMixedContent: false,
  },
};

export default config;
