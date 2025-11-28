-- Add is_ai_generated column to flashcards table
-- Run this in Supabase SQL Editor

ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Create index for better performance when filtering AI cards
CREATE INDEX IF NOT EXISTS idx_flashcards_is_ai_generated ON flashcards(is_ai_generated);
