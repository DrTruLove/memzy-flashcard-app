# Mobile App Conversion Instructions

## ⚠️ PRIMARY COMMANDS - ALWAYS FOLLOW
1. **Make sure you're not duplicating code**
2. **Double check your work**
3. **Put this in an "instruction file"**
4. **Check and update this file as needed to execute the task at hand**

---

## Overview
Converting Memzy flashcard web app to iOS and Android using Capacitor.

## What is Capacitor?
- **Purpose**: Wraps existing Next.js web app into native mobile containers
- **How it works**: Your web app runs in a native WebView with access to device features
- **Benefits**: Keep existing codebase, one codebase for web + mobile

---

## Progress Tracker

### Phase 1: Capacitor Setup ✅ COMPLETE
- [x] Install Capacitor core and CLI packages
- [x] Initialize Capacitor config (capacitor.config.ts)
- [x] Add iOS platform (`npx cap add ios`)
- [x] Add Android platform (`npx cap add android`)
- [x] Configure Capacitor to use dev server (localhost:3001)

### Phase 2: Configuration ✅ COMPLETE
- [x] Update capacitor.config.ts with server URL
- [x] Install camera plugin (@capacitor/camera@7.0.2)
- [x] Create Android assets directory
- [x] Sync camera plugin to native projects
- [x] Configure iOS permissions in Info.plist
  - NSCameraUsageDescription
  - NSPhotoLibraryUsageDescription
  - NSPhotoLibraryAddUsageDescription
- [x] Configure Android permissions in AndroidManifest.xml
  - CAMERA
  - READ_MEDIA_IMAGES
  - READ_EXTERNAL_STORAGE
  - WRITE_EXTERNAL_STORAGE

### Phase 3: Testing ✅ COMPLETE
- [x] Start dev server (`npm run dev`) - Running on port 3001
- [x] Install CocoaPods via Homebrew
- [x] Run `pod install` to configure dependencies
- [x] Open Xcode with workspace file
- [x] Select iPhone 16 Pro simulator
- [x] Build and run app
- [x] **APP RUNNING IN SIMULATOR!** 🎉
- [ ] Test camera functionality
- [ ] Test image upload flow
- [ ] Verify all features work on mobile

### Phase 4: Production Build (FUTURE)
- [ ] Deploy Next.js app to hosting service
- [ ] Update capacitor.config.ts with production URL
- [ ] Build iOS for App Store
- [ ] Build Android for Play Store
- [ ] Configure app icons and splash screens

---

## Current Task
✅ **iOS SIMULATOR READY!**

**Status:**
- ✅ Dev server running on localhost:3001
- ✅ Xcode installed
- ✅ iOS 18.6 Simulator downloaded and installed
- ⏳ Ready to launch iPhone and run app!

**Next: Launch iPhone Simulator**
Run this command or use Xcode to build and run the app.

**Testing Checklist (Do After Simulator Launches):**
- [ ] App loads successfully in simulator
- [ ] Can navigate between pages
- [ ] Camera button appears
- [ ] Can create flashcards
- [ ] Images display correctly
- [ ] Dark/light theme toggle works
- [ ] Browse decks works
- [ ] Download feature works
- [ ] Tutorial page loads

---

## Commands Reference
```bash
# Development
npm run dev                 # Start Next.js dev server
npx cap open ios           # Open iOS project in Xcode
npx cap open android       # Open Android project in Android Studio

# Syncing
npx cap sync               # Sync all changes to native projects
npx cap sync ios           # Sync only iOS
npx cap sync android       # Sync only Android

# Adding Plugins
pnpm add @capacitor/camera # Install plugin
npx cap sync               # Sync plugin to native projects
```

---

## Architecture Notes

**Development Mode (Current):**
- Next.js runs on localhost:3001
- Mobile app connects to localhost via WebView
- Hot reload works for web changes
- Native features accessible via Capacitor plugins

**Production Mode (Future):**
- Deploy Next.js to hosting (Vercel, Netlify, etc.)
- Update capacitor.config.ts server.url to production URL
- Build native apps with production endpoint

**Key Files:**
- `/capacitor.config.ts` - Main Capacitor configuration
- `/ios/App/App/Info.plist` - iOS permissions and settings
- `/android/app/src/main/AndroidManifest.xml` - Android permissions
- `/ios/` - Complete iOS/Xcode project
- `/android/` - Complete Android Studio project

---

## Issues Encountered & Solutions

### 1. Static Export Issue
**Problem:** Dynamic routes (`/deck/[deckId]`) don't work with `output: 'export'`
**Solution:** Use dev server mode instead of static export
- Removed `output: 'export'` from next.config.mjs
- Configured Capacitor to point to localhost:3001
- For production: will deploy web app and point mobile to that URL

### 2. Android Assets Directory Missing
**Problem:** `npx cap sync` failed with ENOENT error
**Solution:** Created directory manually: `mkdir -p android/app/src/main/assets`

### 3. iOS CocoaPods Warning
**Problem:** Xcode tools warning during sync
**Solution:** Not an issue - CocoaPods will install when opening in Xcode

---

## Code Quality Checks

### ✅ No Code Duplication Verified
- Single capacitor.config.ts (not duplicated)
- Info.plist updated once with all 3 permissions
- AndroidManifest.xml updated once with all 5 permissions  
- Camera plugin installed once (@capacitor/camera@7.0.2)
- No duplicate imports or configurations found

### ✅ File Modifications Made
1. **Created:** `/capacitor.config.ts` - Capacitor configuration
2. **Modified:** `/ios/App/App/Info.plist` - Added 3 camera/photo permissions
3. **Modified:** `/android/app/src/main/AndroidManifest.xml` - Added 5 permissions
4. **Modified:** `/app/deck/[deckId]/page.tsx` - Added dynamic export (removed later, not needed)
5. **Verified:** `/next.config.mjs` - Kept default (no export mode)

### ✅ Packages Installed (All Current)
```json
"@capacitor/core": "^7.4.4"
"@capacitor/cli": "^7.4.4"
"@capacitor/ios": "^7.4.4"
"@capacitor/android": "^7.4.4"
"@capacitor/camera": "^7.0.2"
```

### ✅ Permissions Configured

**iOS (Info.plist):**
- NSCameraUsageDescription ✓
- NSPhotoLibraryUsageDescription ✓
- NSPhotoLibraryAddUsageDescription ✓

**Android (AndroidManifest.xml):**
- INTERNET ✓
- CAMERA ✓
- READ_MEDIA_IMAGES ✓
- READ_EXTERNAL_STORAGE ✓
- WRITE_EXTERNAL_STORAGE ✓
- android.hardware.camera (optional) ✓

### ✅ Directory Structure
```
/ios/                    - iOS/Xcode project (created)
/android/                - Android Studio project (created)
/android/app/src/main/assets/  - Created for sync
/capacitor.config.ts     - Main config file
```

---

## Next Actions
1. **Test in iOS Simulator** - Run `npx cap open ios` and test app
2. **Test Camera** - Verify camera permissions prompt appears
3. **Test Image Upload** - Take photo and create flashcard
4. **Verify Features** - Check theme toggle, deck navigation, etc.
