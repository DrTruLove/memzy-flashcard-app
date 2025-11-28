#!/bin/bash
# Switch Capacitor config to Android emulator mode

cat > capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: {
    // For Android emulator: 10.0.2.2 is the host machine
    url: 'http://10.0.2.2:3001',
    cleartext: true
  }
};

export default config;
EOF

echo "✅ Switched to Android mode (http://10.0.2.2:3001)"
echo "Run: npx cap sync android"
