import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motorworld.auto.viewer',
  appName: 'Motor World Viewer',
  webDir: 'dist-viewer',
  android: {
    allowMixedContent: false,
  },
};

export default config;
