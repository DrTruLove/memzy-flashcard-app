'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from './supabase'
import { authCache } from './auth-cache'
import type { Deck } from './database'

interface DeckWithInfo extends Deck {
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

/**
 * Optimized fetcher - single query to get decks with card counts
 */
async function fetchDecksWithInfo(): Promise<DeckWithInfo[]> {
  console.time('[DecksContext] fetchDecksWithInfo')
  
  try {
    const user = await authCache.getUser()
    if (!user) {
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    // Single optimized query: get decks with card count using left join
    const { data: decks, error } = await supabase
      .from('decks')
      .select(`
        *,
        deck_cards(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DecksContext] Error fetching decks:', error)
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    if (!decks || decks.length === 0) {
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    // Get cover images for decks that have cards (separate query for efficiency)
    const deckIds = decks.map(d => d.id)
    const { data: coverData } = await supabase
      .from('deck_cards')
      .select('deck_id, flashcards(image_url)')
      .in('deck_id', deckIds)
      .eq('position', 0) // Only get the first card (cover)
      .limit(deckIds.length)

    // Build cover image map
    const coverMap = new Map<string, string>()
    coverData?.forEach((dc: any) => {
      if (dc.flashcards?.image_url && !coverMap.has(dc.deck_id)) {
        coverMap.set(dc.deck_id, dc.flashcards.image_url)
      }
    })

    // Map decks to include info
    const result: DeckWithInfo[] = decks.map((d: any) => {
      // Extract card count from the aggregated result
      const cardCount = d.deck_cards?.[0]?.count || 0
      const isAiGenerated = d.name?.toLowerCase().includes('ai') || 
                            d.description?.toLowerCase().includes('ai') ||
                            d.name?.toLowerCase().includes('generated')
      
      return {
        id: d.id,
        name: d.name,
        description: d.description,
        user_id: d.user_id,
        created_at: d.created_at,
        updated_at: d.updated_at,
        is_sample: d.is_sample,
        cardCount,
        coverImage: coverMap.get(d.id) || undefined,
        isAiGenerated
      }
    })

    // Sort Favorites to top
    result.sort((a, b) => {
      if (a.name === 'Favorites') return -1
      if (b.name === 'Favorites') return 1
      return 0
    })
    
    console.timeEnd('[DecksContext] fetchDecksWithInfo')
    return result
  } catch (error) {
    console.error('[DecksContext] Error fetching decks:', error)
    console.timeEnd('[DecksContext] fetchDecksWithInfo')
    return []
  }
}

/**
 * Provider component that wraps the app and provides deck data via SWR
 */
export function DecksProvider({ children }: { children: ReactNode }) {
  const { data, error, mutate, isValidating } = useSWR<DeckWithInfo[]>(
    'user-decks',
    fetchDecksWithInfo,
    {
      revalidateOnFocus: false, // Don't refetch every time window regains focus (causes lag)
      revalidateOnMount: true, // Fetch fresh data on initial mount
      revalidateOnReconnect: true, // Refetch when internet reconnects
      dedupingInterval: 5000, // Longer interval (5s) to prevent duplicate requests
      refreshInterval: 0, // Don't auto-refresh (manual only via mutate)
      keepPreviousData: true, // Keep showing old data while revalidating (prevents flash)
      errorRetryCount: 3, // Retry failed requests up to 3 times
      errorRetryInterval: 1000, // Wait 1s between retries
      loadingTimeout: 10000, // Show loading for 10s max before error
      onError: (err) => {
        console.error('[DecksContext] SWR Error:', err)
      }
    }
  )

  // Refresh decks when user signs in or out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        mutate()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [mutate])

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

/**
 * Hook to access deck data from anywhere in the app
 * Must be used within DecksProvider
 */
export function useDecks() {
  const context = useContext(DecksContext)
  if (!context) {
    throw new Error('useDecks must be used within DecksProvider')
  }
  return context
}
