# Supabase Query Optimization Report

## Executive Summary

After analyzing your project, I found several areas where Supabase queries can be optimized to reduce Disk IO consumption. The main issues are:

1. **N+1 Query Problem in `addCardToDecks()`** - Most Critical
2. **Repeated `getUserDecks()` calls** across multiple pages
3. **Multiple `supabase.auth.getUser()` calls** in every function
4. **Sequential position updates** in deck card management
5. **Redundant favorite status checks** on every card navigation

---

## 🔴 Critical Issues

### 1. N+1 Query Problem in `addCardToDecks()` - MOST EXPENSIVE

**Location:** `lib/database.ts` lines 165-230

**Current Implementation:**
```typescript
export async function addCardToDecks(cardId: string, deckIds: string[]): Promise<boolean> {
  // ... auth check ...
  
  // For each deck, shift all existing cards down
  for (const deckId of validDeckIds) {
    const { data: existingCards } = await supabase
      .from('deck_cards')
      .select('id, position')
      .eq('deck_id', deckId)
      .order('position', { ascending: true })

    if (existingCards && existingCards.length > 0) {
      const updates = existingCards.map((card) => ({
        id: card.id,
        position: card.position + 1
      }))

      // PROBLEM: Sequential updates - one query per card!
      for (const update of updates) {
        await supabase
          .from('deck_cards')
          .update({ position: update.position })
          .eq('id', update.id)
      }
    }
  }
  
  // ... insert logic ...
}
```

**Problem:** If you add 1 card to 3 decks with 50 cards each:
- 3 SELECT queries (one per deck)
- 150 UPDATE queries (50 cards × 3 decks)
- **Total: 153 queries + 1 final INSERT = 154 database operations!**

**Disk IO Impact:** Each UPDATE query writes to disk, causing massive IO consumption.

**Optimized Solution:**
```typescript
export async function addCardToDecks(cardId: string, deckIds: string[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in')
  }

  // Verify all decks belong to user
  const { data: userDecks } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', user.id)
    .in('id', deckIds)

  const validDeckIds = userDecks?.map(d => d.id) || []

  if (validDeckIds.length === 0) {
    return false
  }

  // OPTIMIZATION 1: Use PostgreSQL's batch update with CASE statements
  // Get all cards that need position updates in ONE query
  const { data: existingCards } = await supabase
    .from('deck_cards')
    .select('id, position, deck_id')
    .in('deck_id', validDeckIds)

  if (existingCards && existingCards.length > 0) {
    // OPTIMIZATION 2: Use RPC function for atomic batch update
    // Create this PostgreSQL function in Supabase:
    const { error: updateError } = await supabase.rpc('increment_deck_card_positions', {
      p_deck_ids: validDeckIds
    })

    if (updateError) {
      console.error('Error updating positions:', updateError)
      return false
    }
  }

  // Insert new cards at position 0
  const insertData = validDeckIds.map((deckId) => ({
    deck_id: deckId,
    card_id: cardId,
    position: 0,
  }))

  const { error } = await supabase
    .from('deck_cards')
    .insert(insertData)

  if (error) {
    console.error('Error adding card to decks:', error)
    return false
  }

  return true
}
```

**Required SQL Function (Add to Supabase Dashboard → SQL Editor):**
```sql
CREATE OR REPLACE FUNCTION increment_deck_card_positions(p_deck_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE deck_cards
  SET position = position + 1
  WHERE deck_id = ANY(p_deck_ids);
END;
$$ LANGUAGE plpgsql;
```

**Impact:** Reduces 150+ UPDATE queries to **1 RPC call**
**Disk IO Savings:** ~99% reduction in write operations

---

## 🟡 High Priority Issues

### 2. Redundant `supabase.auth.getUser()` Calls

**Problem:** Every database function calls `supabase.auth.getUser()` separately, causing repeated auth checks.

**Current Pattern (seen 20+ times):**
```typescript
export async function getUserFlashcards(): Promise<Flashcard[]> {
  const { data: { user } } = await supabase.auth.getUser()  // AUTH CALL
  if (!user) return []
  // ... query ...
}

export async function getUserDecks(): Promise<Deck[]> {
  const { data: { user } } = await supabase.auth.getUser()  // DUPLICATE AUTH CALL
  if (!user) return []
  // ... query ...
}
```

**Optimized Solution - Add Context/Singleton:**

Create `lib/auth-context.ts`:
```typescript
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

class AuthCache {
  private user: User | null = null
  private lastCheck: number = 0
  private TTL = 60000 // 1 minute cache

  async getUser(): Promise<User | null> {
    const now = Date.now()
    
    // Return cached user if still valid
    if (this.user && now - this.lastCheck < this.TTL) {
      return this.user
    }

    // Fetch fresh user
    const { data: { user } } = await supabase.auth.getUser()
    this.user = user
    this.lastCheck = now
    
    return user
  }

  invalidate() {
    this.user = null
    this.lastCheck = 0
  }
}

export const authCache = new AuthCache()
```

**Update all database functions:**
```typescript
import { authCache } from './auth-context'

export async function getUserFlashcards(): Promise<Flashcard[]> {
  const user = await authCache.getUser()
  if (!user) return []
  // ... query ...
}
```

**Impact:** Reduces auth calls from 20+ per page load to **1-2**
**Disk IO Savings:** ~90% reduction in auth-related queries

---

### 3. Repeated `getUserDecks()` Calls Across Pages

**Problem:** Multiple pages/components call `getUserDecks()` independently:

- `app/deck/[deckId]/page.tsx` - Line 220 (loads decks for modal)
- `app/deck/[deckId]/page.tsx` - Line 526 (reloads after adding card)
- `app/deck/[deckId]/page.tsx` - Line 604 (reloads for another modal)
- `app/page.tsx` - Line 235
- `app/my-decks/page.tsx` - Line 82
- `app/browse-decks/page.tsx` - Line 96
- `components/print-cards-dialog.tsx` - Line 92

**Each call fetches ALL user decks from database!**

**Optimized Solution - React Context with SWR:**

Install SWR for caching:
```bash
pnpm add swr
```

Create `lib/decks-context.tsx`:
```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'
import { getUserDecks, getAllDecksInfo } from './database'

interface DeckWithInfo {
  id: string
  name: string
  description?: string
  cardCount: number
  coverImage?: string
  isAiGenerated?: boolean
}

interface DecksContextType {
  decks: DeckWithInfo[]
  isLoading: boolean
  error: any
  mutate: () => void
}

const DecksContext = createContext<DecksContextType | undefined>(undefined)

async function fetchDecksWithInfo() {
  const decks = await getUserDecks()
  const deckIds = decks.map(d => d.id)
  const decksInfoMap = await getAllDecksInfo(deckIds)
  
  return decks.map(d => {
    const deckInfo = decksInfoMap.get(d.id)
    const isAiGenerated = d.name.toLowerCase().includes('ai') || 
                          d.description?.toLowerCase().includes('ai') ||
                          d.name.toLowerCase().includes('generated')
    return {
      id: d.id,
      name: d.name,
      description: d.description || "Your custom deck",
      cardCount: deckInfo?.cardCount || 0,
      coverImage: deckInfo?.coverImage || undefined,
      isAiGenerated
    }
  })
}

export function DecksProvider({ children }: { children: ReactNode }) {
  const { data, error, mutate } = useSWR(
    'user-decks',
    fetchDecksWithInfo,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 second deduplication
    }
  )

  return (
    <DecksContext.Provider
      value={{
        decks: data || [],
        isLoading: !error && !data,
        error,
        mutate
      }}
    >
      {children}
    </DecksContext.Provider>
  )
}

export function useDecks() {
  const context = useContext(DecksContext)
  if (!context) {
    throw new Error('useDecks must be used within DecksProvider')
  }
  return context
}
```

**Update `app/layout.tsx`:**
```typescript
import { DecksProvider } from '@/lib/decks-context'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LanguageProvider>
          <DecksProvider>
            {children}
          </DecksProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
```

**Update all pages to use context:**
```typescript
// Before:
const decks = await getUserDecks()

// After:
const { decks, mutate } = useDecks()

// After adding/removing cards:
mutate() // Triggers revalidation instead of full reload
```

**Impact:** Reduces deck queries from **7+ per user session** to **1-2**
**Disk IO Savings:** ~85% reduction in deck queries

---

## 🟢 Medium Priority Issues

### 4. Favorite Status Check on Every Card View

**Problem:** `app/deck/[deckId]/page.tsx` line 283 calls `isCardInFavorites()` every time user navigates to a card.

**Current:**
```typescript
useEffect(() => {
  const checkFavoriteStatus = async () => {
    if (!user || !cards[currentCardIndex]) {
      setIsFavorited(false)
      return
    }
    
    const isFav = await isCardInFavorites(cards[currentCardIndex].id!)
    setIsFavorited(isFav)
  }
  
  checkFavoriteStatus()
}, [currentCardIndex, user, cards])
```

**Optimized Solution - Batch Load:**
```typescript
// Load favorite status for ALL cards once when deck loads
useEffect(() => {
  const loadAllFavoriteStatuses = async () => {
    if (!user || cards.length === 0) return
    
    const cardIds = cards.filter(c => c.id).map(c => c.id!)
    
    // New batch function
    const favorites = await getCardFavoritesStatus(cardIds)
    setFavoritesMap(favorites) // Store as Map<cardId, boolean>
  }
  
  loadAllFavoriteStatuses()
}, [user, cards])

// Then check from cache:
const isFavorited = favoritesMap.get(cards[currentCardIndex].id!) || false
```

**Add to `lib/database.ts`:**
```typescript
export async function getCardFavoritesStatus(
  cardIds: string[]
): Promise<Map<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || cardIds.length === 0) return new Map()

  // Get favorites deck
  const { data: favoritesDeck } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Favorites')
    .single()

  if (!favoritesDeck) return new Map()

  // Get all cards in favorites deck in ONE query
  const { data: favoriteCards } = await supabase
    .from('deck_cards')
    .select('card_id')
    .eq('deck_id', favoritesDeck.id)
    .in('card_id', cardIds)

  const favoritesSet = new Set(favoriteCards?.map(fc => fc.card_id) || [])
  
  // Build result map
  const result = new Map<string, boolean>()
  cardIds.forEach(id => {
    result.set(id, favoritesSet.has(id))
  })
  
  return result
}
```

**Impact:** Reduces N queries (one per card) to **1 query per deck view**
**Disk IO Savings:** ~95% reduction for 50-card deck

---

### 5. Print Dialog Loads Each Deck Individually

**Problem:** `components/print-cards-dialog.tsx` line 92-96

**Current:**
```typescript
const userDecks = await getUserDecks()
const decksToDownload = userDecks.map(async (d) => {
  const deck = await getDeckWithCards(d.id)  // N+1 query!
  return deck
})
```

**Optimized Solution:**
```typescript
// Create new batch function in lib/database.ts:
export async function getAllDecksWithCards(
  deckIds: string[]
): Promise<DeckWithCards[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || deckIds.length === 0) return []

  // Fetch all decks in one query
  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .in('id', deckIds)

  if (!decks) return []

  // Fetch all deck_cards for all decks in ONE query
  const { data: allDeckCards } = await supabase
    .from('deck_cards')
    .select(`
      deck_id,
      position,
      flashcards (*)
    `)
    .in('deck_id', deckIds)
    .order('position', { ascending: true })

  // Group cards by deck
  const deckCardsMap = new Map<string, any[]>()
  allDeckCards?.forEach(dc => {
    if (!deckCardsMap.has(dc.deck_id)) {
      deckCardsMap.set(dc.deck_id, [])
    }
    deckCardsMap.get(dc.deck_id)!.push(dc.flashcards)
  })

  // Build result
  return decks.map(deck => ({
    ...deck,
    cards: deckCardsMap.get(deck.id) || []
  }))
}

// Use in print dialog:
const userDecks = await getUserDecks()
const deckIds = userDecks.map(d => d.id)
const decksWithCards = await getAllDecksWithCards(deckIds)
```

**Impact:** Reduces N+1 queries to **2 queries** (decks + all cards)
**Disk IO Savings:** ~98% for 10 decks

---

## 📊 Estimated Savings Summary

| Optimization | Queries Before | Queries After | Savings |
|--------------|----------------|---------------|---------|
| addCardToDecks batch update | 150+ | 1 | 99% |
| Auth caching | 20+ | 1-2 | 90% |
| Decks context/SWR | 7+ | 1-2 | 85% |
| Batch favorite checks | 50 | 1 | 98% |
| Batch deck loads | 11+ | 2 | 82% |

**Total Expected Reduction:** **85-95% reduction in Supabase queries**

---

## 🚀 Implementation Priority

### Phase 1 (Immediate - Highest Impact):
1. ✅ Fix `addCardToDecks()` with RPC function
2. ✅ Implement auth caching
3. ✅ Add SWR for decks context

### Phase 2 (High Value):
4. ✅ Batch favorite status loading
5. ✅ Batch deck loading for print dialog

### Phase 3 (Nice to Have):
6. Add Redis/Upstash cache layer for frequently accessed data
7. Implement optimistic UI updates (update UI before DB confirms)
8. Add request deduplication for rapid-fire queries

---

## 🔧 Additional Recommendations

### Enable Supabase Query Performance Monitoring

Add to `.env.local`:
```env
NEXT_PUBLIC_ENABLE_DB_LOGGING=true
```

Update `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    // Add query logging
    global: {
      headers: {
        'x-client-info': 'memzy-flashcard-app',
      },
    },
  }
)

// Log all queries in development
if (process.env.NEXT_PUBLIC_ENABLE_DB_LOGGING === 'true') {
  const originalFrom = supabase.from.bind(supabase)
  supabase.from = (table: string) => {
    console.log(`[Supabase Query] ${table}`)
    return originalFrom(table)
  }
}
```

### Database Indexing

Ensure these indexes exist in Supabase (SQL Editor):
```sql
-- Index for deck_cards position updates
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_position 
ON deck_cards(deck_id, position);

-- Index for user deck lookups
CREATE INDEX IF NOT EXISTS idx_decks_user_id 
ON decks(user_id);

-- Index for flashcard lookups
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id 
ON flashcards(user_id);

-- Composite index for favorites lookup
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_card 
ON deck_cards(deck_id, card_id);
```

---

## 📈 Monitoring Results

After implementing these changes, monitor:

1. **Supabase Dashboard → Reports → Query Performance**
   - Watch for queries > 100ms
   - Track total query count per hour

2. **Supabase Dashboard → Database → Disk IO**
   - Should see 80-90% reduction
   - Monitor write operations specifically

3. **Application Metrics:**
   - Page load times (should improve 2-3x)
   - Time to interactive
   - Cache hit rates (target >80%)

---

## Questions or Issues?

If you need help implementing any of these optimizations, let me know which one to start with and I'll provide the complete implementation!
