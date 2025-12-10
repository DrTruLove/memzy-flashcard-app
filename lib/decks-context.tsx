'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import useSWR from 'swr'
import { getUserDecks, getAllDecksInfo } from './database'
import { supabase } from './supabase'
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
 * Fetcher function for SWR that loads decks with their info
 */
async function fetchDecksWithInfo(): Promise<DeckWithInfo[]> {
  console.time('[DecksContext] fetchDecksWithInfo')
  
  try {
    const decks = await getUserDecks()
    
    if (decks.length === 0) {
      console.timeEnd('[DecksContext] fetchDecksWithInfo')
      return []
    }

    const deckIds = decks.map(d => d.id)
    const decksInfoMap = await getAllDecksInfo(deckIds)
    
    // Map decks to include info
    const nonEmptyDecks: DeckWithInfo[] = decks.map(d => {
      const deckInfo = decksInfoMap.get(d.id)
      const cardCount = deckInfo?.cardCount || 0
      const isAiGenerated = d.name.toLowerCase().includes('ai') || 
                            d.description?.toLowerCase().includes('ai') ||
                            d.name.toLowerCase().includes('generated')
      
      return {
        ...d,
        cardCount,
        coverImage: deckInfo?.coverImage || undefined,
        isAiGenerated
      }
    })
    
    console.timeEnd('[DecksContext] fetchDecksWithInfo')
    return nonEmptyDecks
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
