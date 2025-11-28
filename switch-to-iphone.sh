#!/bin/bash
# Switch Capacitor config to iPhone mode

cat > capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: {
    // For iPhone: use your Mac's IP address
    url: 'http://192.168.1.242:3001',
    cleartext: true
  }
};

export default config;
EOF

echo "✅ Switched to iPhone mode (http://192.168.1.242:3001)"
echo "Run: npx cap sync ios"
