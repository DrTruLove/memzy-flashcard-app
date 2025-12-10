-- =====================================================
-- ADD MISSING INDEXES TO SPEED UP DECK LOADING
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Index on deck_cards.deck_id (speeds up queries that filter by deck)
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);

-- Index on decks.user_id (speeds up queries that filter by user)
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- Index on flashcards.user_id (speeds up queries that filter by user)
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);

-- Composite index for deck_cards queries that filter by deck and position
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_position ON deck_cards(deck_id, position);

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('decks', 'deck_cards', 'flashcards')
ORDER BY tablename, indexname;
