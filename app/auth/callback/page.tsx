"use client"

/**
 * AUTH CALLBACK PAGE - SUPABASE EMAIL CONFIRMATION HANDLER
 * 
 * This page handles the Supabase email confirmation callback.
 * 
 * Flow:
 * 1. User clicks "Confirm your email" in their email
 * 2. Supabase redirects to: https://memzy-flashcard-app.vercel.app/auth/callback#access_token=...
 * 3. This page detects if we're on mobile and redirects to memzy://auth/callback
 * 4. The Android app intercepts the memzy:// URL and opens the app
 * 5. If on desktop, we just complete the auth here on the web
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import MemzyLogo from "@/components/memzy-logo"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your email...')
  const [showOpenAppButton, setShowOpenAppButton] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[MemzyAuth] Auth callback page loaded')
      console.log('[MemzyAuth] Current URL:', window.location.href)
      
      try {
        // Get tokens from URL hash (Supabase sends tokens in hash fragment)
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('[MemzyAuth] Parsed:', { hasTokens: !!accessToken, type, error })

        // Check for errors
        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed.')
          return
        }

        // Detect if user is on mobile
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        console.log('[MemzyAuth] Is mobile:', isMobile)

        if (isMobile && hash) {
          // On mobile, redirect to the app using custom scheme
          // Pass along all the tokens
          const appUrl = `memzy://auth/callback#${hash}`
          console.log('[MemzyAuth] Redirecting to app:', appUrl)
          
          setMessage('Opening Memzy app...')
          
          // Try to open the app
          window.location.href = appUrl
          
          // Show manual button after a delay (in case auto-redirect fails)
          setTimeout(() => {
            setShowOpenAppButton(true)
            setMessage('Tap the button below to open the app')
          }, 2000)
          
          return
        }

        // On desktop/web, complete auth here
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setStatus('error')
            setMessage('Failed to complete sign in.')
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Email confirmed! Redirecting...')
            setTimeout(() => router.replace('/'), 1500)
            return
          }
        }

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          setMessage('You are signed in! Redirecting...')
          setTimeout(() => router.replace('/'), 1500)
          return
        }

        setStatus('error')
        setMessage('Invalid or expired link. Please try again.')
        
      } catch (err) {
        console.error('[MemzyAuth] Error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred.')
      }
    }

    handleAuthCallback()
  }, [router])

  const openApp = () => {
    const hash = window.location.hash.substring(1)
    window.location.href = `memzy://auth/callback#${hash}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <MemzyLogo size={80} />
        
        <div className="space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
              <p className="text-lg text-muted-foreground">{message}</p>
              
              {showOpenAppButton && (
                <button
                  onClick={openApp}
                  className="mt-4 px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-xl hover:bg-purple-700 shadow-lg"
                >
                  Open Memzy App
                </button>
              )}
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-lg text-green-600 font-medium">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto" />
              <p className="text-lg text-red-600">{message}</p>
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => router.push('/create-account')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Sign Up Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
