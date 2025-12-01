import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: {
    url: 'http://localhost:3001',
    cleartext: true
  }
};

export default config;
