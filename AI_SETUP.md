# Memzy Flashcard App - FREE AI Configuration

## Setup Instructions

This app uses **Google's Gemini API** which is **100% FREE** with generous limits (1,500 requests/day)!

### 1. Get a FREE Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account (or create one - it's free!)
3. Click "Create API Key"
4. Copy the key

**No credit card required! Completely free!**

### 2. Configure Your API Key

Create a file named `.env.local` in the root of this project:

```bash
GEMINI_API_KEY=your-actual-key-here
```

**Important:** 
- Replace `your-actual-key-here` with your actual Gemini API key
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Restart the dev server after adding the key

### 3. Restart the Dev Server

After creating `.env.local`:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
pnpm dev
```

### 4. Test the Feature

1. Go to http://localhost:3000
2. Click "Create Your Flashcard"
3. Upload an image (e.g., a picture of a dog, car, house, etc.)
4. Click "Analyze Image & Generate Flashcard"
5. The AI will detect what's in the image and create a bilingual flashcard!

## Troubleshooting

**Error: "Failed to analyze image"**
- Make sure you created `.env.local` in the project root
- Verify your API key is correct
- Restart the dev server after adding the key

**Image not uploading**
- Make sure the file is an image (jpg, png, gif, etc.)
- Try a smaller image (< 5MB)

## Free Tier Limits

- **1,500 requests per day** - plenty for personal use!
- **15 requests per minute**
- No credit card required
- No automatic charges

You can monitor your usage at: https://aistudio.google.com/app/apikey
