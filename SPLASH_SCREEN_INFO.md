# Splash Screen Implementation

## ⚠️ IMPORTANT: Do NOT add splash screen to individual pages!

The splash screen is **ALREADY IMPLEMENTED** in `app/layout.tsx` and appears **ONLY on initial app load**.

## Current Implementation

### Location
- **File**: `app/layout.tsx`
- **Component**: `<SplashScreen />`
- **Placement**: Root layout (renders once for entire app)

### Behavior
✅ **Shows**: Only on first app load (uses `sessionStorage`)  
❌ **Does NOT show**: When navigating between pages within the app

### How It Works
```tsx
// In app/layout.tsx
<SplashScreen />
<LanguageProvider>
  {children}
</LanguageProvider>
```

The `SplashScreen` component:
1. Checks `sessionStorage` for 'memzy_splash_shown' key
2. If NOT shown yet → displays splash for 5 seconds
3. If already shown in session → returns `null` (no render)
4. Sets `sessionStorage` flag after first display

## Testing the Splash Screen

### Quick Test
1. Go to: `http://localhost:3001/test-splash`
2. Click "Clear & Test Splash Screen" button
3. You'll be redirected to home with splash screen showing
4. Navigate away and back - NO splash (correct behavior)

### Manual Test
1. Open browser DevTools (F12)
2. Go to Application → Session Storage
3. Delete `memzy_splash_shown` key
4. Refresh page - splash should appear
5. Refresh again - NO splash (correct behavior)

### Expected Console Logs
```
[SplashScreen] Checking if splash shown: null
[SplashScreen] First load - showing splash screen
```

On subsequent page loads:
```
[SplashScreen] Checking if splash shown: true
[SplashScreen] Already shown in this session, skipping
```

## DO NOT:
- ❌ Add `<SplashScreen />` to individual page components
- ❌ Add it to `page.tsx`, `deck/[deckId]/page.tsx`, etc.
- ❌ Modify the existing implementation without updating this doc
- ❌ Use `localStorage` instead of `sessionStorage` (splash should show each new browser session)

## IF Issues Occur:
1. Check browser console for `[SplashScreen]` logs
2. Verify `sessionStorage` has correct key: `memzy_splash_shown`
3. Use test page: `http://localhost:3001/test-splash`
4. Verify `app/layout.tsx` has `<SplashScreen />` before `<LanguageProvider>`

## Code Location
- **Component**: `/components/splash-screen.tsx`
- **Layout**: `/app/layout.tsx` (line 47)
- **Test Page**: `/app/test-splash/page.tsx`
