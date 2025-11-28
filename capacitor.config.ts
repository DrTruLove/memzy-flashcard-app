import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: {
    url: 'https://memzy-flashcard-app.vercel.app',
  }
};

export default config;
