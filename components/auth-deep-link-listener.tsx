"use client"

/**
 * AUTH DEEP LINK LISTENER COMPONENT
 * 
 * This component handles Supabase auth deep links on mobile devices.
 * When the app is opened via a memzy://auth/callback URL (from email confirmation),
 * this listener intercepts the URL and redirects to the auth callback page.
 * 
 * How it works:
 * 1. Uses Capacitor's App plugin to listen for 'appUrlOpen' events
 * 2. When a memzy://auth/callback URL is detected, it extracts the tokens
 * 3. Navigates to /auth/callback with the tokens as query parameters
 * 4. The callback page then completes the Supabase session
 * 
 * This component should be included in the root layout.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Dynamically import Capacitor App plugin
let CapacitorApp: any

export function AuthDeepLinkListener() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client-side and in Capacitor environment
    if (typeof window === 'undefined') return

    const setupDeepLinkListener = async () => {
      try {
        // Dynamically import Capacitor App plugin
        const { App } = await import('@capacitor/app')
        CapacitorApp = App

        // Listen for app URL open events (deep links)
        const listener = await CapacitorApp.addListener('appUrlOpen', (event: { url: string }) => {
          console.log('[AuthDeepLink] App opened with URL:', event.url)
          
          // Check if this is an auth callback URL
          if (event.url.startsWith('memzy://auth/callback')) {
            // Parse the URL to extract tokens
            // The URL format is: memzy://auth/callback#access_token=...&refresh_token=...
            // or memzy://auth/callback?access_token=...&refresh_token=...
            
            const url = new URL(event.url.replace('memzy://', 'https://memzy.app/'))
            
            // Get hash parameters (Supabase typically sends tokens in hash)
            const hashParams = new URLSearchParams(url.hash.substring(1))
            
            // Build the callback URL with parameters
            let callbackUrl = '/auth/callback'
            
            // If there's a hash, append it
            if (url.hash) {
              callbackUrl += url.hash
            }
            
            // If there are query params, append them
            if (url.search) {
              callbackUrl += url.search
            }
            
            console.log('[AuthDeepLink] Navigating to:', callbackUrl)
            router.push(callbackUrl)
          }
        })

        // Store listener for cleanup
        return () => {
          listener.remove()
        }
      } catch (error) {
        // Capacitor not available (running in web browser)
        console.log('[AuthDeepLink] Capacitor App not available:', error)
      }
    }

    setupDeepLinkListener()
  }, [router])

  // This component doesn't render anything
  return null
}
