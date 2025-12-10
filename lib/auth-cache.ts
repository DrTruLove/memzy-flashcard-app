import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Auth caching singleton to reduce redundant auth checks
 * Caches the current user for 30 seconds to avoid repeated Supabase queries
 */
class AuthCache {
  private user: User | null = null
  private lastCheck: number = 0
  private readonly TTL = 30000 // 30 second cache (shorter to catch session issues faster)
  private isFetching: boolean = false
  private fetchPromise: Promise<User | null> | null = null

  /**
   * Get the current user, using cache if available
   * @returns The current user or null if not authenticated
   */
  async getUser(): Promise<User | null> {
    const now = Date.now()
    
    // Return cached user if still valid
    if (this.user && now - this.lastCheck < this.TTL) {
      return this.user
    }

    // If already fetching, wait for that request
    if (this.isFetching && this.fetchPromise) {
      return this.fetchPromise
    }

    // Fetch fresh user data
    this.isFetching = true
    this.fetchPromise = this.fetchUser()
    
    try {
      const user = await this.fetchPromise
      return user
    } finally {
      this.isFetching = false
      this.fetchPromise = null
    }
  }

  private async fetchUser(): Promise<User | null> {
    const now = Date.now()
    
    try {
      // First try getSession (faster, uses cached session)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[AuthCache] Session error:', sessionError)
        this.user = null
        this.lastCheck = now
        return null
      }

      if (session?.user) {
        this.user = session.user
        this.lastCheck = now
        return session.user
      }

      // If no session, try getUser as fallback
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('[AuthCache] Auth error:', error)
        this.user = null
        this.lastCheck = now
        return null
      }

      this.user = user
      this.lastCheck = now
      return user
    } catch (error) {
      console.error('[AuthCache] Unexpected error:', error)
      this.user = null
      this.lastCheck = now
      return null
    }
  }

  /**
   * Update the cached user (called when auth state changes)
   */
  setUser(user: User | null): void {
    this.user = user
    this.lastCheck = Date.now()
  }

  /**
   * Clear the cached user (useful after logout or auth state changes)
   */
  clearCache(): void {
    this.user = null
    this.lastCheck = 0
  }

  /**
   * Get cached user without fetching (returns null if cache expired)
   */
  getCachedUser(): User | null {
    const now = Date.now()
    if (this.user && now - this.lastCheck < this.TTL) {
      return this.user
    }
    return null
  }
}

// Export singleton instance
export const authCache = new AuthCache()

// Listen for auth state changes to update cache
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[AuthCache] Auth state changed:', event)
  if (event === 'SIGNED_OUT') {
    authCache.clearCache()
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
    if (session?.user) {
      authCache.setUser(session.user)
    }
  }
})
