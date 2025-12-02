"use client"

/**
 * AUTH CALLBACK PAGE - SUPABASE DEEP LINK HANDLER
 * 
 * This page handles the Supabase email confirmation deep link callback.
 * When a user taps "Confirm your email" on their phone, the link opens
 * the Memzy app with the URL: memzy://auth/callback#access_token=...&refresh_token=...
 * 
 * This page:
 * 1. Extracts the tokens from the URL hash or query parameters
 * 2. Uses Supabase to set the session with those tokens
 * 3. Redirects the user to the home page as a logged-in user
 * 
 * For web browsers, this also serves as a fallback callback page.
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
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[MemzyDeepLink] Auth callback page loaded')
      console.log('[MemzyDeepLink] Current URL:', window.location.href)
      console.log('[MemzyDeepLink] Hash:', window.location.hash)
      console.log('[MemzyDeepLink] Search:', window.location.search)
      
      try {
        // Get the URL hash (Supabase sends tokens in the hash fragment)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)
        
        // Try to get tokens from hash first, then query params
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        const type = hashParams.get('type') || queryParams.get('type')
        const error = hashParams.get('error') || queryParams.get('error')
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')

        console.log('[MemzyDeepLink] Parsed params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          error,
          errorDescription
        })

        // Store debug info for display
        setDebugInfo(`Type: ${type || 'none'}, HasTokens: ${!!accessToken}`)

        // Check for errors from Supabase
        if (error) {
          console.error('[MemzyDeepLink] Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed. Please try again.')
          return
        }

        // If we have tokens, set the session
        if (accessToken && refreshToken) {
          console.log('[MemzyDeepLink] Setting session with tokens...')
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('[MemzyDeepLink] Error setting session:', sessionError)
            setStatus('error')
            setMessage('Failed to complete sign in. Please try again.')
            return
          }

          if (data.session) {
            console.log('[MemzyDeepLink] Session set successfully, user:', data.session.user.email)
            setStatus('success')
            setMessage('Email confirmed! Redirecting...')
            
            // Short delay to show success message, then redirect to home
            setTimeout(() => {
              console.log('[MemzyDeepLink] Redirecting to home...')
              router.replace('/')
            }, 1500)
            return
          }
        }

        // If type is 'signup' or 'recovery', try to get existing session
        console.log('[MemzyDeepLink] No tokens found, checking for existing session...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('[MemzyDeepLink] Found existing session, redirecting...')
          setStatus('success')
          setMessage('You are signed in! Redirecting...')
          setTimeout(() => {
            router.replace('/')
          }, 1500)
          return
        }

        // No tokens and no session - might be an invalid or expired link
        console.log('[MemzyDeepLink] No session found, showing error')
        setStatus('error')
        setMessage('Invalid or expired confirmation link. Please try signing up again.')
        
      } catch (err) {
        console.error('[MemzyDeepLink] Auth callback exception:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <MemzyLogo size={80} />
        
        <div className="space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
              <p className="text-lg text-muted-foreground">{message}</p>
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
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <p className="text-xs text-muted-foreground mt-8">{debugInfo}</p>
        )}
      </div>
    </div>
  )
}
