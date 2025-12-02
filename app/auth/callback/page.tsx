"use client"

/**
 * AUTH CALLBACK PAGE - SUPABASE DEEP LINK HANDLER
 * 
 * This page handles the Supabase email confirmation deep link callback.
 * When a user taps "Confirm your email" on their phone, the link opens
 * the Memzy app with the URL: memzy://auth/callback?access_token=...&refresh_token=...
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

  useEffect(() => {
    const handleAuthCallback = async () => {
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

        // Check for errors from Supabase
        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed. Please try again.')
          return
        }

        // If we have tokens, set the session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Error setting session:', sessionError)
            setStatus('error')
            setMessage('Failed to complete sign in. Please try again.')
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Email confirmed! Redirecting...')
            
            // Short delay to show success message, then redirect to home
            setTimeout(() => {
              router.replace('/')
            }, 1500)
            return
          }
        }

        // If type is 'signup' or 'recovery', Supabase might handle it differently
        // Try to get the session that may have been set automatically
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus('success')
          setMessage('You are signed in! Redirecting...')
          setTimeout(() => {
            router.replace('/')
          }, 1500)
          return
        }

        // No tokens and no session - might be an invalid or expired link
        setStatus('error')
        setMessage('Invalid or expired confirmation link. Please try signing up again.')
        
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
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
              <button
                onClick={() => router.push('/create-account')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
