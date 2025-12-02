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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [rememberUsername, setRememberUsername] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
      setError(err.message || "Invalid email or password")
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
              Back
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
            <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome Back to Memzy</h1>
            <p className="text-muted-foreground">Sign in to access your flashcards</p>
          </div>

          {/* Login Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email Address
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
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
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
                  Remember username
                </Label>
              </div>

              {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={() => router.push("/create-account")} className="font-medium text-purple-600 hover:underline">
                Create one
              </button>
            </div>
          </Card>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
