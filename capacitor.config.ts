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
  },
  // Deep link configuration for Supabase auth callback
  // When users tap email confirmation links, the app opens with memzy://auth/callback
  plugins: {
    App: {
      // iOS URL schemes (Android uses intent-filters in AndroidManifest.xml)
      // This enables memzy:// URLs to open the app
    }
  }
};

export default config;
