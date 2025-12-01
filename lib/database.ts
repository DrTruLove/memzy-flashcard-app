import { supabase } from './supabase'
import { authCache } from './auth-cache'

// Types
export interface Flashcard {
  id: string
  user_id: string
  english_word: string
  spanish_word: string
  image_url: string | null
  is_ai_generated?: boolean
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface DeckWithCards extends Deck {
  cards: Flashcard[]
}

// Flashcard Functions
export async function createFlashcard(
  englishWord: string,
  spanishWord: string,
  imageUrl: string | null,
  isAiGenerated: boolean = false
): Promise<Flashcard | null> {
  const user = await authCache.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to create flashcards')
  }

  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: user.id,
      english_word: englishWord,
      spanish_word: spanishWord,
      image_url: imageUrl,
      is_ai_generated: isAiGenerated,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating flashcard:', error)
    console.error('Error details:', error.message, error.details, error.hint)
    return null
  }

  return data
}

export async function getUserFlashcards(): Promise<Flashcard[]> {
  const user = await authCache.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching flashcards:', error)
    return []
  }

  return data || []
}

// Deck Functions
export async function createDeck(name: string, description?: string): Promise<Deck | null> {
  const user = await authCache.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to create decks')
  }

  const { data, error } = await supabase
    .from('decks')
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating deck:', error)
    return null
  }

  return data
}

export async function getUserDecks(): Promise<Deck[]> {
  const user = await authCache.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching decks:', error)
    return []
  }

  const decks = data || []
  
  // Sort Favorites deck to the top
  return decks.sort((a, b) => {
    if (a.name === 'Favorites') return -1
    if (b.name === 'Favorites') return 1
    return 0
  })
}

export async function getDeckWithCards(deckId: string): Promise<DeckWithCards | null> {
  const user = await authCache.getUser()
  
  if (!user) return null

  // Get deck
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (deckError || !deck) {
    console.error('Error fetching deck:', deckError)
    return null
  }

  // Get cards in deck ordered by position, then by created_at DESC (newest first)
  const { data: deckCards, error: cardsError } = await supabase
    .from('deck_cards')
    .select(`
      position,
      created_at,
      flashcards (*)
    `)
    .eq('deck_id', deckId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (cardsError) {
    console.error('Error fetching deck cards:', cardsError)
    return { ...deck, cards: [] }
  }

  const cards = (deckCards?.map((dc: any) => dc.flashcards).filter(Boolean) || []) as Flashcard[]

  return { ...deck, cards }
}

// Add card to deck(s)
export async function addCardToDecks(cardId: string, deckIds: string[]): Promise<boolean> {
  const user = await authCache.getUser()
  
  if (!user) {
    throw new Error('User must be logged in')
  }

  // Verify all decks belong to user
  
  const { data: userDecks, error: verifyError } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', user.id)
    .in('id', deckIds)

  if (verifyError) {
    console.error(`[addCardToDecks] Error verifying decks:`, verifyError)
    return false
  }

  const validDeckIds = userDecks?.map(d => d.id) || []

  if (validDeckIds.length === 0) {
    console.error(`[addCardToDecks] FAILED - No valid decks found for user ${user.id}`)
    console.error(`[addCardToDecks] Requested deck IDs:`, deckIds)
    console.error(`[addCardToDecks] This usually means the deck was just created and hasn't committed yet`)
    return false
  }

  // DIRECTLY increment positions without RPC - update each deck's cards
  
  for (const deckId of validDeckIds) {
    
    // Get all cards in this deck, ordered by position
    const { data: existingCards, error: fetchError } = await supabase
      .from('deck_cards')
      .select('card_id, position')
      .eq('deck_id', deckId)
      .order('position', { ascending: true })
    
    if (fetchError) {
      console.error(`[addCardToDecks] Error fetching cards for deck ${deckId}:`, fetchError)
      return false
    }
    
    
    if (existingCards && existingCards.length > 0) {
      
      // Update each card's position individually using UPDATE (not upsert)
      // This avoids RLS policy issues with upsert creating new rows
      
      for (let i = 0; i < existingCards.length; i++) {
        const card = existingCards[i]
        const newPosition = i + 1  // New positions: 1, 2, 3, 4...
        
        const { error: updateError } = await supabase
          .from('deck_cards')
          .update({ position: newPosition })
          .eq('deck_id', deckId)
          .eq('card_id', card.card_id)
        
        if (updateError) {
          console.error(`[addCardToDecks] Error updating position for card ${card.card_id}:`, updateError)
          console.error(`[addCardToDecks] Update error details:`, updateError.message, updateError.details)
          return false
        }
      }
      
    } else {
    }
  }

  // Insert new cards at position 0
  const insertData = validDeckIds.map((deckId) => ({
    deck_id: deckId,
    card_id: cardId,
    position: 0,
  }))

  const { error: insertError } = await supabase
    .from('deck_cards')
    .insert(insertData)

  if (insertError) {
    console.error('[addCardToDecks] Error inserting card at position 0:', insertError)
    console.error('[addCardToDecks] Insert error details:', insertError.message, insertError.details, insertError.hint)
    return false
  }

  return true
}

// Remove card from deck
export async function removeCardFromDeck(deckId: string, cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('deck_cards')
    .delete()
    .eq('deck_id', deckId)
    .eq('card_id', cardId)

  if (error) {
    console.error('Error removing card from deck:', error)
    return false
  }

  return true
}

// Move card from any deck to Uncategorized (instead of deleting)
export async function moveCardToUncategorized(deckId: string, cardId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    // First, remove the card from the current deck
    const { error: removeError } = await supabase
      .from('deck_cards')
      .delete()
      .eq('deck_id', deckId)
      .eq('card_id', cardId)

    if (removeError) {
      console.error('Error removing card from deck:', removeError)
      return false
    }

    // Get or create Uncategorized deck
    let uncategorizedDeckId: string | null = null
    
    const { data: existingUncategorized } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Uncategorized')
      .limit(1)

    if (existingUncategorized && existingUncategorized.length > 0) {
      uncategorizedDeckId = existingUncategorized[0].id
    } else {
      // Create Uncategorized deck
      const { data: newDeck, error: createError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: 'Uncategorized',
          description: 'Cards removed from other decks'
        })
        .select()
        .single()

      if (createError || !newDeck) {
        console.error('Error creating Uncategorized deck:', createError)
        return false
      }

      uncategorizedDeckId = newDeck.id
    }

    // Check if card is already in Uncategorized deck
    const { data: existingInUncategorized } = await supabase
      .from('deck_cards')
      .select('card_id')
      .eq('deck_id', uncategorizedDeckId)
      .eq('card_id', cardId)
      .limit(1)

    if (!existingInUncategorized || existingInUncategorized.length === 0) {
      // Add card to Uncategorized at position 0
      const { error: addError } = await supabase
        .from('deck_cards')
        .insert({
          deck_id: uncategorizedDeckId,
          card_id: cardId,
          position: 0
        })

      if (addError) {
        console.error('Error adding card to Uncategorized:', addError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error moving card to Uncategorized:', error)
    return false
  }
}

// Copy a sample deck card to Uncategorized (creates a new flashcard for the user)
export async function copySampleCardToUncategorized(
  englishWord: string,
  spanishWord: string,
  imageUrl: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    // Check if flashcard already exists for this user
    const { data: existingFlashcard } = await supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', user.id)
      .eq('english_word', englishWord)
      .eq('spanish_word', spanishWord)
      .limit(1)

    let flashcardId: string

    if (existingFlashcard && existingFlashcard.length > 0) {
      flashcardId = existingFlashcard[0].id
    } else {
      // Create new flashcard for user
      const { data: newFlashcard, error: createError } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          english_word: englishWord,
          spanish_word: spanishWord,
          image_url: imageUrl,
          is_ai_generated: false
        })
        .select()
        .single()

      if (createError || !newFlashcard) {
        console.error('Error creating flashcard:', createError)
        return false
      }

      flashcardId = newFlashcard.id
    }

    // Get or create Uncategorized deck
    let uncategorizedDeckId: string | null = null
    
    const { data: existingUncategorized } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Uncategorized')
      .limit(1)

    if (existingUncategorized && existingUncategorized.length > 0) {
      uncategorizedDeckId = existingUncategorized[0].id
    } else {
      // Create Uncategorized deck
      const { data: newDeck, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: 'Uncategorized',
          description: 'Cards removed from other decks'
        })
        .select()
        .single()

      if (deckError || !newDeck) {
        console.error('Error creating Uncategorized deck:', deckError)
        return false
      }

      uncategorizedDeckId = newDeck.id
    }

    // Check if card is already in Uncategorized deck
    const { data: existingInUncategorized } = await supabase
      .from('deck_cards')
      .select('card_id')
      .eq('deck_id', uncategorizedDeckId)
      .eq('card_id', flashcardId)
      .limit(1)

    if (!existingInUncategorized || existingInUncategorized.length === 0) {
      // Add card to Uncategorized at position 0
      const { error: addError } = await supabase
        .from('deck_cards')
        .insert({
          deck_id: uncategorizedDeckId,
          card_id: flashcardId,
          position: 0
        })

      if (addError) {
        console.error('Error adding card to Uncategorized:', addError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error copying sample card to Uncategorized:', error)
    return false
  }
}

// Delete flashcard
export async function deleteFlashcard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId)

  if (error) {
    console.error('Error deleting flashcard:', error)
    return false
  }

  return true
}

// Get deck info with card count and cover image (efficient version)
export async function getDeckInfo(deckId: string): Promise<{
  cardCount: number
  coverImage: string | null
} | null> {
  // Get card count
  const { count, error: countError } = await supabase
    .from('deck_cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)

  if (countError) {
    console.error('Error counting deck cards:', countError)
    return null
  }

  // Get first card's image
  const { data: firstCard, error: imageError } = await supabase
    .from('deck_cards')
    .select('flashcards(image_url)')
    .eq('deck_id', deckId)
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (imageError && imageError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error getting cover image:', imageError)
  }

  const coverImage = (firstCard as any)?.flashcards?.image_url || null

  return {
    cardCount: count || 0,
    coverImage
  }
}

// Get all decks info in one query (most efficient for loading multiple decks)
export async function getAllDecksInfo(deckIds: string[]): Promise<Map<string, { cardCount: number; coverImage: string | null }>> {
  console.time('[DB] getAllDecksInfo query')
  const result = new Map()
  
  if (deckIds.length === 0) return result

  
  // Get all deck_cards with flashcard images in one query
  // Order by position ASC, then by created_at DESC to get the newest card at position 0 as cover
  const { data: deckCards, error } = await supabase
    .from('deck_cards')
    .select('deck_id, position, created_at, flashcards(image_url)')
    .in('deck_id', deckIds)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  console.timeEnd('[DB] getAllDecksInfo query')
  
  if (error) {
    console.error('Error fetching all deck cards:', error)
    return result
  }

  console.time('[DB] Process results')

  // Process results to group by deck and count cards
  const deckGroups = new Map<string, any[]>()
  deckCards?.forEach((dc: any) => {
    if (!deckGroups.has(dc.deck_id)) {
      deckGroups.set(dc.deck_id, [])
    }
    deckGroups.get(dc.deck_id)!.push(dc)
  })

  // Build result map with card counts and cover images
  // Use the card at position 0 (first in array since ordered by position ASC) as cover
  deckGroups.forEach((cards, deckId) => {
    // Cards are sorted by position ASC, so first card is at position 0
    const firstCardWithImage = cards.find((c: any) => c.flashcards?.image_url)
    result.set(deckId, {
      cardCount: cards.length,
      coverImage: firstCardWithImage?.flashcards?.image_url || null
    })
  })

  // Add empty entries for decks with no cards
  deckIds.forEach(id => {
    if (!result.has(id)) {
      result.set(id, { cardCount: 0, coverImage: null })
    }
  })

  console.timeEnd('[DB] Process results')

  return result
}

// Delete deck
export async function deleteDeck(deckId: string): Promise<boolean> {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)

  if (error) {
    console.error('Error deleting deck:', error)
    return false
  }

  return true
}

// Update deck name
export async function updateDeckName(deckId: string, newName: string): Promise<boolean> {
  const user = await authCache.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to update decks')
  }

  const { error } = await supabase
    .from('decks')
    .update({ 
      name: newName,
      updated_at: new Date().toISOString()
    })
    .eq('id', deckId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating deck name:', error)
    return false
  }

  return true
}

// Update flashcard image
export async function updateFlashcardImage(
  cardId: string,
  imageUrl: string
): Promise<boolean> {
  const user = await authCache.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to update flashcards')
  }

  const { error } = await supabase
    .from('flashcards')
    .update({ 
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating flashcard image:', error)
    return false
  }

  return true
}

// Sample Card Customization Functions
export interface SampleCardCustomization {
  id: string
  user_id: string
  deck_id: string
  card_index: number
  custom_image_url: string
  created_at: string
  updated_at: string
}

// Save or update a user's custom image for a sample card
export async function saveSampleCardCustomization(
  deckId: string,
  cardIndex: number,
  imageUrl: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to customize sample cards')
  }

  // Upsert: update if exists, insert if not
  const { error } = await supabase
    .from('user_sample_card_customizations')
    .upsert({
      user_id: user.id,
      deck_id: deckId,
      card_index: cardIndex,
      custom_image_url: imageUrl,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,deck_id,card_index'
    })

  if (error) {
    // If table doesn't exist yet, show helpful error
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.error('Sample card customizations table not created yet!')
      console.error('Please run the SQL migration from ADD_SAMPLE_CUSTOMIZATIONS_TABLE.sql in your Supabase dashboard')
      alert('Database table missing. Please contact the administrator to run the SQL migration.')
      return false
    }
    console.error('Error saving sample card customization:', error)
    return false
  }

  return true
}

// Get all customizations for a user's sample deck
export async function getSampleCardCustomizations(
  deckId: string
): Promise<Record<number, string>> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return {}

  const { data, error } = await supabase
    .from('user_sample_card_customizations')
    .select('card_index, custom_image_url')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)

  if (error) {
    // If table doesn't exist yet, just return empty (don't crash the app)
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.warn('Sample card customizations table not created yet. Run the SQL migration from ADD_SAMPLE_CUSTOMIZATIONS_TABLE.sql')
      return {}
    }
    console.error('Error fetching sample card customizations:', error)
    return {}
  }

  // Convert array to object: { cardIndex: imageUrl }
  const customizations: Record<number, string> = {}
  data?.forEach(item => {
    customizations[item.card_index] = item.custom_image_url
  })

  return customizations
}

// Delete a specific customization
export async function deleteSampleCardCustomization(
  deckId: string,
  cardIndex: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { error } = await supabase
    .from('user_sample_card_customizations')
    .delete()
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .eq('card_index', cardIndex)

  if (error) {
    console.error('Error deleting sample card customization:', error)
    return false
  }

  return true
}

// Get or create the Favorites deck for the current user
export async function getOrCreateFavoritesDeck(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // First, try to find existing Favorites deck
  const { data: existingDecks, error: fetchError } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Favorites')
    .limit(1)

  if (fetchError) {
    console.error('Error fetching Favorites deck:', fetchError)
    return null
  }

  // If Favorites deck exists, return its ID
  if (existingDecks && existingDecks.length > 0) {
    return existingDecks[0].id
  }

  // Otherwise, create a new Favorites deck
  const { data: newDeck, error: createError } = await supabase
    .from('decks')
    .insert({
      user_id: user.id,
      name: 'Favorites',
      description: 'Your favorited cards'
    })
    .select()
    .single()

  if (createError || !newDeck) {
    console.error('Error creating Favorites deck:', createError)
    return null
  }

  
  // Small wait for database to commit the new deck
  await new Promise(resolve => setTimeout(resolve, 300))

  return newDeck.id
}

// Add a card to the Favorites deck (creates Favorites deck if it doesn't exist)
export async function addCardToFavorites(
  englishWord: string,
  spanishWord: string,
  imageUrl: string,
  isAiGenerated: boolean = false
): Promise<boolean> {
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[addCardToFavorites] Auth error:', authError)
      alert('Authentication error: ' + authError.message)
      return false
    }
    
    if (!user) {
      console.error('[addCardToFavorites] No user logged in')
      alert('You must be signed in to add favorites')
      return false
    }
    

    // Get or create Favorites deck
    const favoritesDeckId = await getOrCreateFavoritesDeck()
    
    if (!favoritesDeckId) {
      console.error('[addCardToFavorites] FAILED - Could not get or create Favorites deck')
      return false
    }
    

    // Check if a flashcard with these words already exists
    const { data: existingFlashcards, error: searchError } = await supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', user.id)
      .eq('english_word', englishWord)
      .eq('spanish_word', spanishWord)
      .limit(1)

    if (searchError) {
      console.error('[addCardToFavorites] Error searching flashcards:', searchError)
      return false
    }

    let flashcardId: string

    if (existingFlashcards && existingFlashcards.length > 0) {
      // Use the existing flashcard
      flashcardId = existingFlashcards[0].id

      // Check if it's already in the Favorites deck
      const { data: existingDeckCards, error: checkError } = await supabase
        .from('deck_cards')
        .select('position')
        .eq('deck_id', favoritesDeckId)
        .eq('card_id', flashcardId)
        .limit(1)

      if (checkError) {
        console.error('[addCardToFavorites] Error checking deck_cards:', checkError)
        return false
      }

      if (existingDeckCards && existingDeckCards.length > 0) {
        // Card is already in favorites at position X - need to move it to position 0
        
        // Delete the existing entry first
        const { error: deleteError } = await supabase
          .from('deck_cards')
          .delete()
          .eq('deck_id', favoritesDeckId)
          .eq('card_id', flashcardId)
        
        if (deleteError) {
          console.error('[addCardToFavorites] Error deleting existing favorite:', deleteError)
          return false
        }
        
        
        // Brief wait to ensure deletion propagates
        await new Promise(resolve => setTimeout(resolve, 200))
      } else {
      }
    } else {
      // Create a new flashcard
      
      const flashcard = await createFlashcard(englishWord, spanishWord, imageUrl, isAiGenerated)
      
      if (!flashcard) {
        console.error('[addCardToFavorites] FAILED - Could not create flashcard')
        return false
      }
      
      flashcardId = flashcard.id
    }

    
    // Add the flashcard to the Favorites deck
    const success = await addCardToDecks(flashcardId, [favoritesDeckId])
    
    
    if (!success) {
      console.error('[addCardToFavorites] FAILED - addCardToDecks returned false')
      return false
    }
    
    // Verify the card was added at position 0
    const { data: verifyData, error: verifyError } = await supabase
      .from('deck_cards')
      .select('position')
      .eq('deck_id', favoritesDeckId)
      .eq('card_id', flashcardId)
      .single()
    
    if (verifyError) {
      console.error('[addCardToFavorites] Error verifying card position:', verifyError)
      // Don't return false - the card might still be added successfully
    } else {
    }
    
    // Debug: Show all positions in Favorites deck
    const { data: allPositions } = await supabase
      .from('deck_cards')
      .select('card_id, position')
      .eq('deck_id', favoritesDeckId)
      .order('position', { ascending: true })
    
    
    return true
  } catch (error) {
    console.error('[addCardToFavorites] EXCEPTION:', error)
    if (error instanceof Error) {
      console.error('[addCardToFavorites] Error message:', error.message)
      console.error('[addCardToFavorites] Error stack:', error.stack)
    }
    return false
  }
}

// Remove a card from Favorites deck
export async function removeCardFromFavorites(
  englishWord: string,
  spanishWord: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    // Get Favorites deck
    const { data: favoritesDecks } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Favorites')
      .limit(1)

    if (!favoritesDecks || favoritesDecks.length === 0) {
      console.error('No Favorites deck found')
      return false
    }

    const favoritesDeckId = favoritesDecks[0].id

    // Find the flashcard with these words
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', user.id)
      .eq('english_word', englishWord)
      .eq('spanish_word', spanishWord)
      .limit(1)

    if (!flashcards || flashcards.length === 0) {
      console.error('Flashcard not found:', englishWord, spanishWord)
      return false
    }

    const flashcardId = flashcards[0].id

    // Remove the card from the Favorites deck
    const { error: deleteError, data: deletedData } = await supabase
      .from('deck_cards')
      .delete()
      .eq('deck_id', favoritesDeckId)
      .eq('card_id', flashcardId)
      .select()

    if (deleteError) {
      console.error('Error removing card from favorites:', deleteError)
      return false
    }


    // Re-number remaining cards in Favorites deck to close the gap
    const { data: remainingCards, error: fetchError } = await supabase
      .from('deck_cards')
      .select('card_id, position')
      .eq('deck_id', favoritesDeckId)
      .order('position', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching remaining cards:', fetchError)
      // Don't return false - removal was successful
    } else if (remainingCards && remainingCards.length > 0) {
      // Update each card's position to be sequential: 0, 1, 2, 3...
      for (let i = 0; i < remainingCards.length; i++) {
        const card = remainingCards[i]
        const newPosition = i  // 0, 1, 2, 3...
        
        const { error: updateError } = await supabase
          .from('deck_cards')
          .update({ position: newPosition })
          .eq('deck_id', favoritesDeckId)
          .eq('card_id', card.card_id)
        
        if (updateError) {
          console.error(`Error updating position for card ${card.card_id}:`, updateError)
          // Continue with other cards even if one fails
        }
      }
    }

    // ALWAYS add unfavorited card to Uncategorized deck
    
    // Get or create Uncategorized deck
    let uncategorizedDeckId: string | null = null
    
    const { data: existingUncategorized } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Uncategorized')
      .limit(1)

    if (existingUncategorized && existingUncategorized.length > 0) {
      uncategorizedDeckId = existingUncategorized[0].id
    } else {
      // Create Uncategorized deck
      const { data: newDeck, error: createError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: 'Uncategorized',
          description: 'Cards without a specific deck'
        })
        .select()
        .single()

      if (createError || !newDeck) {
        console.error('Error creating Uncategorized deck:', createError)
        return true // Still return true since we removed from Favorites successfully
      }

      uncategorizedDeckId = newDeck.id
    }

    // Check if card is already in Uncategorized deck
    const { data: existingInUncategorized } = await supabase
      .from('deck_cards')
      .select('card_id')
      .eq('deck_id', uncategorizedDeckId)
      .eq('card_id', flashcardId)
      .limit(1)

    if (!existingInUncategorized || existingInUncategorized.length === 0) {
      // Card not in Uncategorized yet, add it at position 0
      const { error: addError } = await supabase
        .from('deck_cards')
        .insert({
          deck_id: uncategorizedDeckId,
          card_id: flashcardId,
          position: 0
        })

      if (addError) {
        console.error('Error adding card to Uncategorized:', addError)
        return true // Still return true since we removed from Favorites successfully
      }

    } else {
    }

    return true
  } catch (error) {
    console.error('Error removing card from favorites:', error)
    return false
  }
}

// Check if a card is in the Favorites deck
export async function isCardInFavorites(
  englishWord: string,
  spanishWord: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    // Get Favorites deck
    const { data: favoritesDecks, error: fetchError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Favorites')
      .limit(1)

    if (fetchError || !favoritesDecks || favoritesDecks.length === 0) {
      return false
    }

    const favoritesDeckId = favoritesDecks[0].id

    // Check if a flashcard with these words exists in the Favorites deck
    const { data: flashcards, error: flashcardError } = await supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', user.id)
      .eq('english_word', englishWord)
      .eq('spanish_word', spanishWord)
      .limit(1)

    if (flashcardError || !flashcards || flashcards.length === 0) {
      return false
    }

    const flashcardId = flashcards[0].id

    // Check if this flashcard is in the Favorites deck
    const { data: deckCards, error: deckCardError } = await supabase
      .from('deck_cards')
      .select('id')
      .eq('deck_id', favoritesDeckId)
      .eq('card_id', flashcardId)
      .limit(1)

    if (deckCardError) {
      return false
    }

    return deckCards && deckCards.length > 0
  } catch (error) {
    console.error('Error checking if card is in favorites:', error)
    return false
  }
}
