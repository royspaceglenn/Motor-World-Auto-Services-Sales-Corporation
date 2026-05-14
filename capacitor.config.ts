import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.efcp.motorparts.viewer',
  appName: 'EFCP Viewer',
  webDir: 'dist-viewer',
  android: {
    allowMixedContent: false,
  },
};

export default config;
