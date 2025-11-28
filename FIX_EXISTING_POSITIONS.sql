-- COMPREHENSIVE FIX FOR CARD POSITIONS
-- Run this entire script in Supabase SQL Editor

-- Step 1: Show current broken positions (optional - comment out if you want)
DO $$
BEGIN
  RAISE NOTICE '=== BEFORE FIX ===';
  RAISE NOTICE 'Checking Favorites deck positions...';
END $$;

SELECT d.name, d.id, dc.position, dc.card_id, dc.created_at
FROM deck_cards dc
JOIN decks d ON dc.deck_id = d.id
WHERE d.name = 'Favorites'
ORDER BY dc.position, dc.created_at;

-- Step 2: Fix ALL positions in ALL decks - renumber sequentially by creation date
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  RAISE NOTICE '=== FIXING POSITIONS ===';
  
  WITH numbered_cards AS (
    SELECT 
      deck_id,
      card_id,
      ROW_NUMBER() OVER (PARTITION BY deck_id ORDER BY created_at) - 1 AS new_position
    FROM deck_cards
  )
  UPDATE deck_cards dc
  SET position = nc.new_position
  FROM numbered_cards nc
  WHERE dc.deck_id = nc.deck_id 
    AND dc.card_id = nc.card_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % card positions', rows_updated;
END $$;

-- Step 3: Verify the fix - show Favorites deck positions after fix
DO $$
BEGIN
  RAISE NOTICE '=== AFTER FIX ===';
  RAISE NOTICE 'Favorites deck should now have positions 0, 1, 2, 3...';
END $$;

SELECT d.name, d.id, dc.position, dc.card_id, dc.created_at
FROM deck_cards dc
JOIN decks d ON dc.deck_id = d.id
WHERE d.name = 'Favorites'
ORDER BY dc.position;

-- Step 4: Final validation - check for any duplicate positions (should be NONE)
SELECT 
  deck_id,
  position,
  COUNT(*) as duplicate_count
FROM deck_cards
GROUP BY deck_id, position
HAVING COUNT(*) > 1;
