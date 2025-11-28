import type { CapacitorConfig } from '@capacitor/cli';

// Set to true for development with live reload, false for production builds
const isDevelopment = true;

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: isDevelopment ? {
    url: 'http://100.78.18.16:3001',
    cleartext: true
  } : undefined
};

export default config;
