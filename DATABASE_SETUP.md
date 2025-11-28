# Database Setup for Memzy

## Step 1: Access Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **memzy-flashcards** project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Create Database Tables

Copy and paste this entire SQL script into the SQL Editor and click **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  english_word TEXT NOT NULL,
  spanish_word TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deck_cards junction table (many-to-many relationship)
CREATE TABLE deck_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, card_id)
);

-- Create indexes for better performance
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_card_id ON deck_cards(card_id);

-- Enable Row Level Security (RLS)
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for decks
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for flashcards
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for deck_cards
CREATE POLICY "Users can view their own deck cards"
  ON deck_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add cards to their own decks"
  ON deck_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove cards from their own decks"
  ON deck_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Verify Tables Were Created

After running the script, verify the tables in the **Table Editor**:

1. Click on **Table Editor** in the left sidebar
2. You should see three new tables:
   - **decks** - Stores user's flashcard decks
   - **flashcards** - Stores individual flashcards
   - **deck_cards** - Links flashcards to decks (many-to-many)

## Step 4: Enable Storage for Images (Optional)

If you want to store images in Supabase instead of using base64:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `flashcard-images`
4. Make it **Public** (so images can be displayed)
5. Click **Create bucket**

## Database Schema Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   decks     │         │  deck_cards  │         │ flashcards  │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id          │◄────────│ deck_id      │         │ id          │
│ user_id     │         │ card_id      │────────►│ user_id     │
│ name        │         │ position     │         │ english_word│
│ description │         └──────────────┘         │ spanish_word│
│ created_at  │                                   │ image_url   │
│ updated_at  │                                   │ created_at  │
└─────────────┘                                   │ updated_at  │
                                                  └─────────────┘
```

## What This Enables

✅ Users can create custom decks
✅ Users can save flashcards
✅ Users can add flashcards to multiple decks
✅ Each user only sees their own data (Row Level Security)
✅ Flashcards persist across sessions
✅ Full CRUD operations (Create, Read, Update, Delete)

## Next Steps

Once you've run the SQL script, I'll update the app code to:
1. Save flashcards to the database
2. Create and manage custom decks
3. Load user's decks and cards from the database
4. Implement the "My Decks" page with real data
