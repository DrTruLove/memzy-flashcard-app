# 🎯 Memzy Flashcard App - Quick Start Guide

## 🚀 Getting Started (1-2 minutes)

### Step 1: Get Your FREE Gemini API Key

1. **Visit**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account (completely free!)
3. **Click** "Create API Key" button
4. **Copy** your new API key

### Step 2: Set Up Your Environment

Create a file named `.env.local` in the project root:

```bash
GEMINI_API_KEY=paste-your-actual-key-here
```

### Step 3: Start the Server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser

---

## 📱 How to Use Memzy

### 🏠 Home Page - Create Flashcards

**Main Features:**
- 📸 **Camera Capture**: Click camera icon to take photo directly
- 🖼️ **Upload Image**: Click upload button to select image from device
- 🤖 **AI Translation**: Gemini automatically detects object and translates to Spanish
- ✏️ **Edit & Regenerate**: Click edit icon next to any word to modify or regenerate
- 💾 **Save to Deck**: Add card to existing deck or create new deck
- 📥 **Download Card**: Save single card as PDF or JPG (no login required)

**How to Create a Card:**
1. Upload/capture an image
2. AI detects the object and translates automatically
3. Review the English and Spanish words
4. Edit if needed using the edit buttons
5. Download or save to a deck

### 🗂️ Browse Decks

**Sample Decks Available:**
- Common Objects (15 cards)
- Animals (15 cards)
- Food & Drinks (15 cards)
- Body Parts (15 cards) - AI-generated realistic images
- Colors & Shapes (15 cards)

**Features:**
- Click any deck to view and study cards
- Your custom decks appear in "My Decks" section
- Each deck shows card count and cover image
- 📥 Download Cards button (select up to 8 cards)

### 📚 Deck View - Study Cards

**Card Features:**
- **Flip Card**: Click "Tap to Reveal" to see Spanish translation
- **Navigation**: Use ◀ Previous and Next ▶ buttons to move through cards
- **Card Counter**: Shows current position (e.g., "5 / 15")
- **Edit**: Click pencil icon to edit English or Spanish text
- 🗑️ **Delete Card**: Hover over card for trash icon (user decks only)

**Action Buttons:**
- 📥 **Download**: Save current card as PDF or JPG
- 🖼️ **Replace Image**: Upload new image or use camera
- ➕ **Add to Deck**: Add current card to another deck
- 📥 **Download Cards**: Select up to 8 cards from entire deck

### 📂 My Decks

**Features:**
- View all your custom decks with cover images
- Each deck shows card count
- Click deck to open and study
- 🗑️ **Delete Deck**: Hover over deck for trash icon
- 📥 **Download Cards**: Select cards from all your decks

### 📥 Download Cards Dialog

**Multi-Deck Selection:**
- Select up to 8 cards from ANY deck
- Choose between PDF or JPG format
- Cards organized in collapsible sections (accordion view)
- Shows card preview with image
- Download button at top (sticky header)
- All 8 cards fit on one page (landscape, 4×2 grid)

### ⚙️ Settings

**Available Options:**
- 🌐 **Language**: Choose preferred language
- 🎨 **Appearance**: Toggle between Light ☀️ and Dark 🌙 mode

**How to Switch Theme:**
1. Go to Settings
2. Click "Customize" on Appearance
3. Toggle the switch
4. Theme changes instantly across entire app
5. Your preference is saved automatically

### 👤 Account

**Authentication:**
- Sign up / Login with Supabase
- Profile dropdown in top right
- Logout option available
- Login required only for saving decks

**What You Can Do:**
- ✅ Create and save custom decks
- ✅ Add cards to multiple decks
- ✅ View and manage all your decks
- ✅ Delete cards from your decks
- ✅ Delete entire decks

**No Login Needed For:**
- ✅ Viewing sample decks
- ✅ Creating flashcards with AI
- ✅ Downloading cards as PDF/JPG
- ✅ Browsing all content

---

## � Key Features Summary

### AI-Powered
- **Gemini 2.0 Flash**: Fast, accurate image recognition
- **Automatic Translation**: English to Spanish
- **Smart Detection**: Recognizes objects, animals, food, body parts, etc.

### Deck Management
- **Sample Decks**: 5 pre-made decks with 75 total cards
- **Custom Decks**: Create and organize your own
- **Multi-Deck Selection**: Select cards from any deck for download
- **Cover Images**: Decks show first card's image

### Download System
- **Format Options**: PDF or JPG
- **Batch Download**: Up to 8 cards at once
- **Landscape Layout**: All 8 cards fit perfectly on one page
- **No Login Required**: Download without account

### User Experience
- **Dark/Light Mode**: Toggle theme with instant switching
- **Responsive Design**: Works on mobile and desktop
- **Camera Support**: Capture images directly in-app
- **Edit & Regenerate**: Full control over flashcard content
- **Delete Options**: Remove cards or entire decks

---

## 🆓 Completely Free

- **No credit card** required
- **1,500 API calls per day** (Gemini free tier)
- **No hidden costs**
- **Open source**

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **AI**: Google Gemini 2.0 Flash Exp
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Image Generation**: Pollinations.ai (body parts deck)

---

## 📝 Need Help?

- **Server Issues**: Run `./restart-server.sh` if you get connection errors
- **AI Setup**: See `AI_SETUP.md` for detailed Gemini configuration
- **Database**: See `DATABASE_SETUP.md` for Supabase setup
- **Body Parts Images**: See `BODY_PARTS_IMAGES.md` for image generation info

---

**Happy Learning! 🎉**
