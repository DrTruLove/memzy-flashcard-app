# Sample Deck Customization Setup

This feature allows signed-in users to replace images in sample decks and have those changes persist across sessions.

## Database Setup

You need to create a new table in your Supabase database to store user customizations.

### Steps:

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to the **SQL Editor** (in the left sidebar)
3. Click **"New query"**
4. Copy the entire contents of `ADD_SAMPLE_CUSTOMIZATIONS_TABLE.sql` 
5. Paste it into the SQL editor
6. Click **"Run"** to execute the query

This will create:
- A new table: `user_sample_card_customizations`
- Indexes for fast lookups
- Row Level Security (RLS) policies to ensure users can only see their own customizations

## How It Works

### For Users:
1. **Sign in** to your account
2. Navigate to any **sample deck** (Animals, Body Parts, etc.)
3. **Replace an image** on any card (camera or upload)
4. The **word stays the same**, only the image changes
5. **Sign out and sign back in** - your custom image is still there!

### Technical Details:

- **Sample deck cards** (no database ID): Customizations saved to `user_sample_card_customizations` table
- **User deck cards** (has database ID): Image changes saved directly to the `flashcards` table
- Each user has their own customizations - replacing an image in a sample deck doesn't affect other users
- Customizations are indexed by: `user_id`, `deck_id`, and `card_index`

## Testing

After running the SQL migration:

1. Sign in to the app
2. Go to "Animals" deck  
3. Replace the image on the "Cat" card with your own photo
4. Navigate away and come back - your photo should still be there
5. Sign out and sign in again - your photo should persist
6. Check from a different account - they should see the original cat image

## Code Changes Made

1. **lib/database.ts**: Added functions for saving/loading sample card customizations
2. **app/deck/[deckId]/page.tsx**: Updated to load and apply user customizations to sample decks
3. **ADD_SAMPLE_CUSTOMIZATIONS_TABLE.sql**: SQL migration for the new table
