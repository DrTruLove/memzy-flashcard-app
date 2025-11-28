-- Create table for user customizations of sample deck cards
-- This allows signed-in users to replace images in sample decks and have those changes persist

CREATE TABLE IF NOT EXISTS user_sample_card_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  card_index INTEGER NOT NULL,
  custom_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure one customization per user per card
  UNIQUE(user_id, deck_id, card_index)
);

-- Create index for faster lookups
CREATE INDEX idx_sample_customizations_user_deck 
  ON user_sample_card_customizations(user_id, deck_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_sample_card_customizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own customizations
CREATE POLICY "Users can view their own sample card customizations"
  ON user_sample_card_customizations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own customizations
CREATE POLICY "Users can insert their own sample card customizations"
  ON user_sample_card_customizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own customizations
CREATE POLICY "Users can update their own sample card customizations"
  ON user_sample_card_customizations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own customizations
CREATE POLICY "Users can delete their own sample card customizations"
  ON user_sample_card_customizations
  FOR DELETE
  USING (auth.uid() = user_id);
