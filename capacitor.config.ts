import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  // For production/internal testing, use the Vercel URL
  // Comment out the server block below for localhost development
  server: {
    url: 'https://memzy-flashcard-app.vercel.app',
    cleartext: false
  }
};

export default config;
