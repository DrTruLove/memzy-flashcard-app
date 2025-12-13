import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check .env.local')
}

// Configure Supabase with proper auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Don't set storage explicitly - let Supabase use its default (localStorage in browser)
  },
})

// Initialize auth state - call this on app start
let authInitialized = false
let authInitPromise: Promise<void> | null = null

export async function initializeAuth(): Promise<void> {
  if (authInitialized) return
  if (authInitPromise) return authInitPromise
  
  authInitPromise = new Promise(async (resolve) => {
    // Get the initial session
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('[Supabase] Error initializing auth:', error)
    } else {
      console.log('[Supabase] Auth initialized, session:', session ? 'exists' : 'none')
    }
    authInitialized = true
    resolve()
  })
  
  return authInitPromise
}

// Helper function to check if user is authenticated
export async function getCurrentUser() {
  await initializeAuth()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  authInitialized = false
  authInitPromise = null
  return { error }
}
