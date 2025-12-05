"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { supabase } from "@/lib/supabase"
import MemzyLogo from "@/components/memzy-logo"
import { useLanguage } from "@/lib/language-context"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { primaryLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [rememberUsername, setRememberUsername] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Translations
  const t = {
    back: primaryLanguage === 'es' ? 'Atrás' : 'Back',
    title: primaryLanguage === 'es' ? 'Bienvenido de Nuevo a Memzy' : 'Welcome Back to Memzy',
    subtitle: primaryLanguage === 'es' ? 'Inicia sesión para acceder a tus tarjetas' : 'Sign in to access your flashcards',
    email: primaryLanguage === 'es' ? 'Correo Electrónico' : 'Email Address',
    password: primaryLanguage === 'es' ? 'Contraseña' : 'Password',
    passwordPlaceholder: primaryLanguage === 'es' ? 'Ingresa tu contraseña' : 'Enter your password',
    rememberUsername: primaryLanguage === 'es' ? 'Recordar usuario' : 'Remember username',
    signIn: primaryLanguage === 'es' ? 'Iniciar Sesión' : 'Sign In',
    signingIn: primaryLanguage === 'es' ? 'Iniciando Sesión...' : 'Signing In...',
    noAccount: primaryLanguage === 'es' ? '¿No tienes cuenta?' : "Don't have an account?",
    createOne: primaryLanguage === 'es' ? 'Crear una' : 'Create one',
    invalidCredentials: primaryLanguage === 'es' ? 'Correo o contraseña inválidos' : 'Invalid email or password',
  }

  // Load remembered username on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }))
      setRememberUsername(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Save or clear remembered email based on checkbox
      if (rememberUsername) {
        localStorage.setItem('rememberedEmail', formData.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Get redirect URL and card index from query params
        const redirectUrl = searchParams.get('redirect')
        const cardIndex = searchParams.get('cardIndex')
        
        if (redirectUrl && cardIndex) {
          // Redirect to specific deck and card position
          router.push(`${redirectUrl}?cardIndex=${cardIndex}`)
        } else if (redirectUrl) {
          // Redirect to URL without card index
          router.push(redirectUrl)
        } else {
          // Default redirect to home
          router.push("/")
        }
      }
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(err.message || t.invalidCredentials)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 pt-safe">
          <div className="mt-2">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <MemzyLogo size={64} />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Login Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  {t.email}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  {t.password}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberUsername}
                  onCheckedChange={(checked) => setRememberUsername(checked as boolean)}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  {t.rememberUsername}
                </Label>
              </div>

              {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? t.signingIn : t.signIn}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t.noAccount}{" "}
              <button onClick={() => router.push("/create-account")} className="font-medium text-purple-600 hover:underline">
                {t.createOne}
              </button>
            </div>
          </Card>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
