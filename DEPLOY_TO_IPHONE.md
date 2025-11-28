# Deploy Memzy to iPhone - Step by Step Guide

## Prerequisites ✅
- ✅ Mac with macOS
- ✅ Xcode installed (from App Store)
- ✅ Apple Developer account (free account works for testing on your own device)
- ✅ iPhone with USB cable
- ✅ Capacitor iOS platform already set up

---

## 🚀 Quick Start - Deploy to Your iPhone

### Step 1: Build the Next.js App for Production
```bash
# Make sure you're in the project directory
cd /Users/dawnclarke/Downloads/memzy-flashcard-app

# Build the production version
npm run build
```

### Step 2: Update Capacitor Config for Production
You need to change the capacitor.config.ts to use the production build instead of localhost.

Open `capacitor.config.ts` and change it to:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  // Remove the server config to use the built app
  // server: {
  //   url: 'http://localhost:3001',
  //   cleartext: true
  // }
};

export default config;
```

**WAIT!** There's an issue - you need to export static files. Update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Step 3: Build and Copy to iOS
```bash
# Build the Next.js app with static export
npm run build

# Copy the build to iOS project
npx cap copy ios

# Sync any native changes
npx cap sync ios
```

### Step 4: Open Project in Xcode
```bash
npx cap open ios
```

### Step 5: Configure Xcode for Your iPhone

Once Xcode opens:

1. **Connect Your iPhone** via USB cable

2. **Trust Your Mac** - On your iPhone, you may see a popup "Trust This Computer?" - tap "Trust"

3. **Select Your iPhone as Target**:
   - At the top of Xcode, click the device dropdown (next to the play/stop buttons)
   - Select your iPhone from the list (it will show your iPhone's name)

4. **Sign the App**:
   - Click on the "App" project in the left sidebar (blue icon)
   - Select "App" under TARGETS
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your **Team** (your Apple ID)
   - If you don't see a team:
     - Click "Add Account..."
     - Sign in with your Apple ID
     - Select that account as your team

5. **Change Bundle Identifier** (if needed):
   - If you get a signing error, change the Bundle Identifier to something unique
   - Example: `com.yourname.memzy` (must be unique)

### Step 6: Build and Run on iPhone
1. Click the **Play button** (▶️) in the top-left of Xcode, or press `Cmd + R`
2. Xcode will build the app and install it on your iPhone
3. Wait for the build to complete (can take 1-2 minutes first time)

### Step 7: Trust Developer on iPhone

When the app first tries to run, you'll see an error on your iPhone:

1. Go to **Settings** on your iPhone
2. Go to **General** → **VPN & Device Management** (or **Profiles & Device Management**)
3. Find your Apple ID developer profile
4. Tap **Trust "[Your Apple ID]"**
5. Tap **Trust** again to confirm

### Step 8: Launch the App!
- Go back to Xcode and click Play (▶️) again, OR
- Open the Memzy app from your iPhone home screen

🎉 **Your app should now be running on your iPhone!**

---

## 🐛 Troubleshooting

### Issue: "Failed to verify code signature"
**Solution:** Make sure you've selected your Team in Xcode Signing & Capabilities

### Issue: "No devices available"
**Solution:** 
- Make sure iPhone is connected via USB
- Unlock your iPhone
- Trust the computer when prompted

### Issue: "Could not find module for target"
**Solution:** 
```bash
cd ios/App
pod install
```

### Issue: Dynamic routes not working
**Solution:** This is expected with static export. Dynamic routes like `/deck/[deckId]` won't work in the exported version. You have two options:

**Option A: Use Dev Server Mode (Recommended for Testing)**
Keep your current capacitor.config.ts with localhost server, then:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open Xcode
npx cap open ios
```
Your iPhone must be on the same WiFi network as your Mac. Change localhost to your Mac's IP address:
```typescript
server: {
  url: 'http://192.168.1.XXX:3001', // Replace with your Mac's IP
  cleartext: true
}
```

**Option B: Deploy to Production** (Recommended for final version)
1. Deploy your Next.js app to Vercel/Netlify/etc.
2. Update capacitor.config.ts:
```typescript
const config: CapacitorConfig = {
  appId: 'com.memzy.flashcards',
  appName: 'Memzy',
  webDir: 'out',
  server: {
    url: 'https://your-app.vercel.app', // Your production URL
  }
};
```

### Issue: Camera not working
**Solution:** Make sure permissions are set in `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Memzy needs camera access to take photos of objects for flashcards</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Memzy needs photo library access to upload images for flashcards</string>
```

---

## 📱 Testing Checklist

After deploying to your iPhone, test these features:

- [ ] App launches without crashing
- [ ] Home page loads correctly
- [ ] Navigate to Browse Decks
- [ ] Navigate to My Decks
- [ ] Navigate to Settings
- [ ] Toggle between English/Spanish
- [ ] Toggle between Light/Dark mode
- [ ] Open Tutorial page
- [ ] Camera functionality (if using dev server mode)
- [ ] Create a flashcard
- [ ] View deck cards
- [ ] Flip cards
- [ ] Download cards feature

---

## 🔄 Making Updates

When you make code changes:

1. **If using dev server mode:** Changes will hot-reload automatically
2. **If using built version:**
   ```bash
   npm run build
   npx cap copy ios
   ```
   Then click Run (▶️) in Xcode again

---

## 📦 Production Deployment (App Store)

For publishing to the App Store (future):

1. **Get Apple Developer Program membership** ($99/year)
2. **Create App Store listing** in App Store Connect
3. **Archive the app** in Xcode (Product → Archive)
4. **Submit for review** via App Store Connect
5. **Wait for Apple approval** (typically 1-3 days)

---

## 💡 Recommended Approach for Now

Since you have dynamic routes, I recommend using **Dev Server Mode** for testing on your iPhone:

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR-MAC-IP:3001', // e.g., http://192.168.1.100:3001
     cleartext: true
   }
   ```

3. Start dev server and sync:
   ```bash
   npm run dev
   npx cap sync ios
   npx cap open ios
   ```

4. Make sure your iPhone is on the same WiFi network as your Mac

5. Build and run from Xcode

This way all features including dynamic routes will work, and you can make changes that hot-reload!

---

## 🎯 Quick Command Summary

```bash
# Option 1: Dev Server Mode (Recommended)
npm run dev                    # Terminal 1: Keep running
npx cap sync ios              # Terminal 2: Sync changes
npx cap open ios              # Open Xcode

# Option 2: Built Version
npm run build
npx cap copy ios
npx cap open ios
```

---

**Need help?** Check the troubleshooting section above or the MOBILE_APP_INSTRUCTIONS.md file.
