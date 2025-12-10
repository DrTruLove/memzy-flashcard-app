// Test script to check Supabase query performance
// Run with: node test-db-performance.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPerformance() {
  console.log('Testing Supabase query performance...\n');

  // Test 1: Get decks query
  console.log('Test 1: Query decks table');
  console.time('decks query');
  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, name, user_id')
    .limit(10);
  console.timeEnd('decks query');
  
  if (decksError) {
    console.error('Decks error:', decksError);
  } else {
    console.log(`Found ${decks?.length || 0} decks\n`);
  }

  // Test 2: Get deck_cards query
  console.log('Test 2: Query deck_cards table');
  console.time('deck_cards query');
  const { data: deckCards, error: cardsError } = await supabase
    .from('deck_cards')
    .select('deck_id, flashcards(image_url)')
    .limit(50);
  console.timeEnd('deck_cards query');
  
  if (cardsError) {
    console.error('Cards error:', cardsError);
  } else {
    console.log(`Found ${deckCards?.length || 0} deck_cards\n`);
  }

  // Test 3: Count total rows
  console.log('Test 3: Count total rows in deck_cards');
  console.time('count query');
  const { count, error: countError } = await supabase
    .from('deck_cards')
    .select('*', { count: 'exact', head: true });
  console.timeEnd('count query');
  
  if (countError) {
    console.error('Count error:', countError);
  } else {
    console.log(`Total deck_cards rows: ${count}\n`);
  }

  // Test 4: Check if indexes exist
  console.log('Test 4: Check existing indexes');
  console.time('indexes query');
  const { data: indexes, error: indexError } = await supabase
    .rpc('get_indexes_info')
    .select('*');
  console.timeEnd('indexes query');
  
  if (indexError) {
    // RPC might not exist, that's ok
    console.log('Could not check indexes (RPC not set up)\n');
  } else {
    console.log('Indexes:', indexes);
  }

  console.log('\n=== SUMMARY ===');
  console.log('If queries take more than 500ms, you need to add database indexes.');
  console.log('Run this SQL in Supabase SQL Editor:');
  console.log('');
  console.log('CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);');
  console.log('CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);');
  console.log('CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);');
}

testPerformance().catch(console.error);
