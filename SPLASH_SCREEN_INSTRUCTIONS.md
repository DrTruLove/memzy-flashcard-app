# Splash Screen Configuration Instructions

## Current Setup

The splash screen is configured to show **every time** the app is opened on Android/iOS devices.

## Key Configuration Details

### Location
- Component: `components/splash-screen.tsx`
- Imported in: `app/layout.tsx` (line 47)

### Current Behavior
- ✅ Shows on **Android devices** every time the app launches
- ✅ Shows on **iOS devices** every time the app launches  
- ❌ Does **NOT** show in web browsers (intentional)
- Duration: 4.5 seconds with fade-out animation
- Display: Purple background (#8B2FFB) with Memzy logo and random quote

### Testing Instructions

**To see the splash screen on Android:**
1. Sync changes to Android:
   ```bash
   npx cap sync android
   ```

2. Open in Android Studio and run on physical device

3. **Important**: Completely close the app (swipe away from recent apps)

4. Reopen the app → splash screen will appear

5. Every time you close and reopen the app, splash will show again

**Why it doesn't show in browser:**
The splash screen uses `Capacitor.isNativePlatform()` to detect if running on a native device. Web browsers will skip the splash screen.

## Code Configuration

### components/splash-screen.tsx

The splash screen has the following key logic:

```typescript
useEffect(() => {
  // Check if we're on native platform
  const isNative = Capacitor.isNativePlatform()
  
  if (!isNative) {
    // Don't show on web browser
    setShowContent(false)
    return
  }
  
  // Show splash EVERY TIME on native Android/iOS
  setShowContent(true)
  
  // ... animation and timer logic
}, [])
```

**Key Points:**
- No sessionStorage check (shows every time, not just once)
- Only displays on native platforms (Android/iOS)
- Skips display in web browsers automatically

## Troubleshooting

### "I don't see the splash screen"

**Check these:**
1. Are you testing on an Android/iOS device? (Won't show in browser)
2. Did you sync to Android? (`npx cap sync android`)
3. Did you completely close and reopen the app? (Not just reload)
4. Is the component properly imported in `app/layout.tsx`?

### "Splash screen shows every time I navigate"

That's not the current behavior. The splash only shows when you:
- Launch the app fresh
- Completely close and reopen the app

It does NOT show on page navigation within the app.

## Important Files

1. **components/splash-screen.tsx** - The splash screen component
2. **app/layout.tsx** (line 47) - Where splash screen is rendered
3. **capacitor.config.ts** - Capacitor configuration for native apps

## DO NOT MODIFY

The following settings should remain unchanged:
- `Capacitor.isNativePlatform()` check (keeps splash native-only)
- Component import in `layout.tsx`
- Animation duration (4.5 seconds)

## Last Updated

This configuration was set up to show splash screen on every app launch for Android/iOS devices only.
