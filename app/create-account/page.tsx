"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { supabase } from "@/lib/supabase"
import MemzyLogo from "@/components/memzy-logo"

export default function CreateAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      // Create account with Supabase
      // The emailRedirectTo points to our web callback page, which will then
      // redirect to the app using the memzy:// custom scheme on mobile devices.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          emailRedirectTo: 'https://memzy-flashcard-app.vercel.app/auth/callback',
        },
      })

      if (signUpError) throw signUpError

      // Success! Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists")
        setLoading(false)
        return
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        alert("Account created! Please check your email to confirm your account.")
        // Pass along redirect params to login page
        const redirectUrl = searchParams.get('redirect')
        const cardIndex = searchParams.get('cardIndex')
        
        if (redirectUrl && cardIndex) {
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&cardIndex=${cardIndex}`)
        } else if (redirectUrl) {
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
        } else {
          router.push("/login")
        }
      } else {
        // Auto-signed in
        alert("Account created successfully!")
        
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
      console.error("Sign up error:", err)
      setError(err.message || "Failed to create account. Please try again.")
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
            <h1 className="mb-2 text-3xl font-bold text-foreground">Create Your Memzy Account</h1>
            <p className="text-muted-foreground">Start saving and organizing your flashcards today</p>
          </div>

          {/* Account Creation Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

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
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => router.push("/login")} className="font-medium text-purple-600 hover:underline">
                Sign in
              </button>
            </div>
          </Card>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
