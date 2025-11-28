# Debugging Guide for iPhone Issues

## Issue 1: Camera "Load Failed"

### What was added:
- Better error logging in `/app/api/analyze-image/route.ts`
- API token validation check
- Translation API timeout (10 seconds)
- Detailed error messages in response

### How to debug:
1. Connect iPhone to Mac
2. Open Safari on Mac
3. Go to: Develop > [Your iPhone Name] > localhost
4. Open Web Inspector Console
5. Try taking a photo and look for console logs starting with `[v0]`

### Possible causes:
- `REPLICATE_API_TOKEN` not set in environment
- Network timeout (API call taking too long)
- Image too large
- CORS issues with base64 image

### Quick fix to test:
If API is the issue, try commenting out the Replicate call and return dummy data:
```typescript
// For testing only
return Response.json({
  englishWord: "Test",
  spanishTranslation: "Prueba",
})
```

## Issue 2: Download Stuck

### What was added:
- 10 second timeout for image loading
- Better error logging with console.log statements
- More descriptive error messages
- Error details in alerts

### How to debug:
1. Open Safari Web Inspector (same as above)
2. Try downloading cards
3. Look for console logs:
   - "Starting download..."
   - "Selected cards: X"
   - "Downloading as JPG..." or "Downloading as PDF..."
   - Any "Image load error" or "Image load timeout" messages

### Possible causes:
- Images stored in Supabase have CORS issues on iOS
- Image URLs are broken or inaccessible
- Canvas API not working properly on iOS Safari
- Images taking too long to load (now have 10s timeout)

### Quick test:
1. Try downloading just 1 card first (not 8)
2. Try both JPG and PDF formats
3. Check if it works in Safari on Mac first before iPhone

## How to check environment variables:

Your Replicate API token should be set in `.env.local`:
```
REPLICATE_API_TOKEN=your_token_here
```

Make sure to restart the dev server after adding it!

## Next steps:

1. **Check Safari Web Inspector console** - This is the most important step!
2. Look for the specific error messages
3. Share the console output so we can see exactly what's failing
