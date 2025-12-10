"use client"

import { useState, useEffect } from "react"
import { User, LogIn, UserPlus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { supabase, signOut } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"

export function ProfileDropdown() {
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const t = {
    settings: primaryLanguage === 'es' ? 'Ajustes' : 'Settings',
    signOut: primaryLanguage === 'es' ? 'Cerrar Sesión' : 'Sign Out',
    signIn: primaryLanguage === 'es' ? 'Iniciar Sesión' : 'Sign In',
    createAccount: primaryLanguage === 'es' ? 'Crear Cuenta' : 'Create Account'
  }

  useEffect(() => {
    let isMounted = true
    
    // Get initial user from session (cached, fast)
    const getInitialUser = async () => {
      try {
        console.log('[ProfileDropdown] Getting initial session...')
        
        // First try getSession (uses cached localStorage session - fast)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[ProfileDropdown] Session error:', sessionError)
        }
        
        if (session?.user) {
          console.log('[ProfileDropdown] Found user from session:', session.user.email)
          if (isMounted) {
            setUser(session.user)
            setLoading(false)
          }
          return
        }
        
        // Fallback to getUser if no session
        console.log('[ProfileDropdown] No session, trying getUser...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('[ProfileDropdown] getUser error:', error)
        }
        
        if (isMounted) {
          setUser(user)
          setLoading(false)
          console.log('[ProfileDropdown] User set to:', user?.email || 'null')
        }
      } catch (error) {
        console.error('[ProfileDropdown] Error getting user:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    getInitialUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ProfileDropdown] Auth state change:', event, session?.user?.email || 'no user')
      if (isMounted) {
        // Always update user from session
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <User className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 touch-manipulation">
        {user ? (
          <>
            <div className="px-2 py-1.5 text-sm font-medium">{user.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer touch-manipulation"
              onClick={() => router.push("/settings")}
            >
              <User className="mr-2 h-4 w-4" />
              {t.settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 touch-manipulation" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t.signOut}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem 
              className="cursor-pointer touch-manipulation"
              onClick={() => router.push("/login")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t.signIn}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer touch-manipulation"
              onClick={() => router.push("/create-account")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t.createAccount}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
