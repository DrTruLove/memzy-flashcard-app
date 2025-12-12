// Test Supabase auth and data access
// Run with: node test-auth.js [email] [password]

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = process.argv[2];
  const password = process.argv[3];

  console.log('=== Supabase Auth & Data Test ===\n');

  if (email && password) {
    // Try to sign in
    console.log('Signing in as:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Sign in ERROR:', error.message);
      return;
    }

    console.log('Sign in SUCCESS! User ID:', data.user.id);
    console.log('');

    // Now try to query data as authenticated user
    console.log('Querying decks as authenticated user...');
    const { data: decks, error: deckError } = await supabase
      .from('decks')
      .select('id, name')
      .eq('user_id', data.user.id);

    if (deckError) {
      console.log('Decks ERROR:', deckError.message);
    } else {
      console.log('Found', decks.length, 'decks:');
      decks.forEach(d => console.log('  -', d.name));
    }

    // Query flashcards
    console.log('\nQuerying flashcards...');
    const { data: cards, error: cardError } = await supabase
      .from('flashcards')
      .select('id, english, spanish')
      .eq('user_id', data.user.id)
      .limit(5);

    if (cardError) {
      console.log('Flashcards ERROR:', cardError.message);
    } else {
      console.log('Found', cards.length, 'flashcards');
      cards.forEach(c => console.log('  -', c.english, '/', c.spanish));
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\nSigned out.');

  } else {
    console.log('Usage: node test-auth.js <email> <password>');
    console.log('\nWithout credentials, checking anonymous access...');
    
    const { data: decks } = await supabase.from('decks').select('id').limit(5);
    console.log('Anonymous query returned:', decks?.length || 0, 'decks');
    console.log('(This should be 0 because RLS requires authentication)');
  }
}

testAuth().catch(console.error);
