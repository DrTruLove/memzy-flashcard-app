import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Auth caching singleton to reduce redundant auth checks
 * Caches the current user for 1 minute to avoid repeated Supabase queries
 */
class AuthCache {
  private user: User | null = null
  private lastCheck: number = 0
  private readonly TTL = 60000 // 1 minute cache

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

    // Fetch fresh user data
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      this.user = null
      this.lastCheck = now
      return null
    }

    // Update cache
    this.user = user
    this.lastCheck = now
    return user
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

// Listen for auth state changes to clear cache
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    authCache.clearCache()
  }
})
