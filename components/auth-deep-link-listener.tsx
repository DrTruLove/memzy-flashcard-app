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
   * Process an auth callback URL and navigate to the callback page
   */
  const handleAuthUrl = (url: string) => {
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
      
      // Build the callback URL with hash and/or query params
      let callbackUrl = '/auth/callback'
      
      // Supabase typically sends tokens in the hash fragment
      if (parsedUrl.hash) {
        callbackUrl += parsedUrl.hash
      }
      
      // Sometimes tokens come as query params
      if (parsedUrl.search) {
        // If we already have a hash, append query params with &
        if (parsedUrl.hash) {
          callbackUrl += '&' + parsedUrl.search.substring(1)
        } else {
          callbackUrl += parsedUrl.search
        }
      }
      
      console.log('[MemzyDeepLink] Navigating to callback:', callbackUrl)
      
      // Use replace to avoid back button going to the deep link
      router.replace(callbackUrl)
      return true
    } catch (error) {
      console.error('[MemzyDeepLink] Error parsing URL:', error)
      // On any error, navigate to login page
      router.replace('/login')
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
