"use client"

/**
 * AUTH DEEP LINK LISTENER COMPONENT
 * 
 * This component handles Supabase auth deep links on mobile devices.
 * When the app is opened via a memzy://auth/callback URL (from email confirmation),
 * this listener intercepts the URL and redirects to the auth callback page.
 * 
 * How it works:
 * 1. On cold start: Uses App.getLaunchUrl() to check if app was opened via deep link
 * 2. On warm start: Uses App.addListener('appUrlOpen') to catch deep links when app is running
 * 3. When a memzy://auth/callback URL is detected, it navigates to /auth/callback
 * 4. The callback page then completes the Supabase session
 * 
 * This component should be included in the root layout.
 */

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthDeepLinkListener() {
  const router = useRouter()
  const pathname = usePathname()
  const hasHandledInitialUrl = useRef(false)

  /**
   * Process an auth callback URL and complete the authentication directly
   */
  const handleAuthUrl = async (url: string) => {
    console.log('[MemzyDeepLink] Processing URL:', url)
    
    if (!url.startsWith('memzy://auth/callback')) {
      console.log('[MemzyDeepLink] Not an auth callback URL, ignoring')
      return false
    }

    try {
      // Parse the URL - replace custom scheme with https for URL parsing
      const parsedUrl = new URL(url.replace('memzy://', 'https://memzy.app/'))
      
      console.log('[MemzyDeepLink] Parsed URL:', {
        hash: parsedUrl.hash,
        search: parsedUrl.search,
        pathname: parsedUrl.pathname
      })
      
      // Extract tokens from hash
      const hashParams = new URLSearchParams(parsedUrl.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      console.log('[MemzyDeepLink] Tokens found:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken })
      
      if (accessToken && refreshToken) {
        // Import supabase and set session directly
        const { supabase } = await import('@/lib/supabase')
        
        console.log('[MemzyDeepLink] Setting session...')
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (error) {
          console.error('[MemzyDeepLink] Error setting session:', error)
        } else {
          console.log('[MemzyDeepLink] Session set successfully:', data.session?.user?.email)
        }
      }
      
      // Navigate directly to home (skip the callback page entirely)
      console.log('[MemzyDeepLink] Navigating to home...')
      router.replace('/')
      return true
    } catch (error) {
      console.error('[MemzyDeepLink] Error processing URL:', error)
      // On any error, still go to home
      router.replace('/')
      return false
    }
  }

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return

    let cleanupListener: (() => void) | undefined

    const setupDeepLinkHandling = async () => {
      try {
        // Dynamically import Capacitor App plugin
        const { App } = await import('@capacitor/app')
        const { Capacitor } = await import('@capacitor/core')
        
        // Check if we're running in a native app
        if (!Capacitor.isNativePlatform()) {
          console.log('[MemzyDeepLink] Not a native platform, skipping deep link setup')
          return
        }
        
        console.log('[MemzyDeepLink] Setting up deep link handling on native platform')

        // CRITICAL: Check if app was cold-started from a deep link
        // This is necessary because appUrlOpen doesn't fire on cold start
        if (!hasHandledInitialUrl.current) {
          hasHandledInitialUrl.current = true
          
          console.log('[MemzyDeepLink] Checking for launch URL (cold start)...')
          const launchUrl = await App.getLaunchUrl()
          
          if (launchUrl && launchUrl.url) {
            console.log('[MemzyDeepLink] App was launched with URL:', launchUrl.url)
            handleAuthUrl(launchUrl.url)
          } else {
            console.log('[MemzyDeepLink] No launch URL found (normal app start)')
          }
        }

        // Listen for deep links when app is already running (warm start)
        const listener = await App.addListener('appUrlOpen', (event: { url: string }) => {
          console.log('[MemzyDeepLink] appUrlOpen event received:', event.url)
          handleAuthUrl(event.url)
        })

        cleanupListener = () => {
          console.log('[MemzyDeepLink] Removing listener')
          listener.remove()
        }
        
      } catch (error) {
        // Capacitor not available (running in web browser)
        console.log('[MemzyDeepLink] Capacitor not available:', error)
      }
    }

    setupDeepLinkHandling()

    // Cleanup on unmount
    return () => {
      if (cleanupListener) {
        cleanupListener()
      }
    }
  }, [router])

  // This component doesn't render anything
  return null
}
