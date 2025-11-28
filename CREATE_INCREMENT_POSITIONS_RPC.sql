-- RPC function to increment all card positions in specified decks
-- This is used to make room at position 0 for new cards

CREATE OR REPLACE FUNCTION increment_deck_card_positions(p_deck_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE deck_cards
  SET position = position + 1
  WHERE deck_id = ANY(p_deck_ids);
END;
$$ LANGUAGE plpgsql;
