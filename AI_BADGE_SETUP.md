# AI Badge Setup Instructions

## Step 1: Add Database Field

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **memzy-flashcards** project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from `ADD_AI_FIELD.sql`:

```sql
-- Add is_ai_generated column to flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Create index for better performance when filtering AI cards
CREATE INDEX IF NOT EXISTS idx_flashcards_is_ai_generated ON flashcards(is_ai_generated);
```

6. Click **Run** to execute the migration

## Step 2: Test the Feature

1. Restart your dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   # or
   pnpm dev
   ```

2. Sync with iOS (if testing on iPhone):
   ```bash
   npx cap sync ios
   ```

3. Test AI badge visibility:
   - Go to home page and generate a new AI flashcard
   - Click the Plus (+) button to save it to a deck
   - Go to "My Decks" - the deck should show the purple gem badge
   - Open the deck and view the card - it should have the purple gem badge in top-left corner
   - The badge appears on both front and back of the card

## What Changed

1. **Database**: Added `is_ai_generated` boolean field to track AI-generated cards
2. **Home Page**: When saving AI-generated cards, they're now marked with `is_ai_generated: true`
3. **Deck View**: Cards with `is_ai_generated: true` show the purple Gem icon badge
4. **My Decks**: Decks containing AI cards show the badge on the cover image (based on deck name/description)

## Note

- Existing cards in your database will have `is_ai_generated: false` by default
- Only newly generated AI cards (created after running this migration) will show the badge
- The badge uses the same purple Gem icon from the Memzy logo
