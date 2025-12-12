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
 * Optimized fetcher - simplified queries for reliability
 */
async function fetchDecksWithInfo(): Promise<DeckWithInfo[]> {
  console.time('[DecksContext] fetchDecksWithInfo')
  
  try {
    // Get session directly from Supabase (skip cache to ensure fresh data)
    console.log('[DecksContext] Getting session from Supabase...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[DecksContext] Session error:', sessionError)
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }
    
    if (!session?.user) {
      console.warn('[DecksContext] No session/user found - not logged in')
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }
    
    const user = session.user
    console.log('[DecksContext] User found:', user.id, user.email)

    // Step 1: Get just the decks (fast, simple query)
    console.time('[DecksContext] getDecks')
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select('id, name, description, user_id, created_at, updated_at, is_sample')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    console.timeEnd('[DecksContext] getDecks')
    
    console.log('[DecksContext] Decks query returned:', decks?.length || 0, 'decks')

    if (decksError) {
      console.error('[DecksContext] Error fetching decks:', decksError)
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    if (!decks || decks.length === 0) {
      console.log('[DecksContext] No decks found for user')
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    const deckIds = decks.map((d: any) => d.id)

    // Step 2: Get card counts and cover images
    console.time('[DecksContext] getCardData')
    const { data: deckCards, error: cardsError } = await supabase
      .from('deck_cards')
      .select('deck_id, flashcards(image_url)')
      .in('deck_id', deckIds)
    console.timeEnd('[DecksContext] getCardData')
    
    if (cardsError) {
      console.error('[DecksContext] Error fetching cards:', cardsError)
    }

    // Process card data - count cards and get first image per deck
    const deckInfo = new Map<string, { count: number; coverImage?: string }>()
    ;(deckCards || []).forEach((dc: any) => {
      const existing = deckInfo.get(dc.deck_id) || { count: 0 }
      existing.count++
      // Use first card with image as cover
      if (!existing.coverImage && dc.flashcards?.image_url) {
        existing.coverImage = dc.flashcards.image_url
      }
      deckInfo.set(dc.deck_id, existing)
    })

    // Map decks to include info
    const result: DeckWithInfo[] = decks.map((d: any) => {
      const info = deckInfo.get(d.id)
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
        cardCount: info?.count || 0,
        coverImage: info?.coverImage,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[DecksContext] Auth state changed:', event, 'User:', session?.user?.email || 'none')
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('[DecksContext] Refreshing decks due to auth change...')
        // Clear the auth cache so we get fresh user data
        authCache.clearCache()
        if (session?.user) {
          authCache.setUser(session.user)
        }
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
