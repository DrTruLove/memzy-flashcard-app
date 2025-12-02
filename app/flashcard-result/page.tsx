"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, Plus, ArrowLeft } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

function FlashcardResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [imageUrl, setImageUrl] = useState("/airplane-in-flight.png")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const englishWord = searchParams.get("english") || "Airplane"
  const spanishWord = searchParams.get("spanish") || "Avión"

  // Check auth and get image from sessionStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
    
    if (typeof window !== 'undefined') {
      const storedImage = sessionStorage.getItem('flashcard-image')
      if (storedImage) {
        setImageUrl(storedImage)
      }
    }
  }, [])

  const handleSave = () => {
    if (!isLoggedIn) {
      setShowAccountPrompt(true)
    } else {
      // Save flashcard logic here
    }
  }

  const handleCreateAccount = () => {
    router.push("/create-account")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with back button */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 pt-safe">
          <div className="mt-2">
            <Button variant="ghost" onClick={() => router.push("/")} className="gap-2 touch-manipulation">
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Your Flashcard is Ready!</h1>
            <p className="text-muted-foreground">Review your flashcard and choose what to do next</p>
          </div>

          {/* Generated Flashcard */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="aspect-[3/4] border-[10px] border-black bg-white p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-between">
                  {/* English Word */}
                  <div className="text-center">
                    <h3 className="text-balance text-4xl font-bold text-black">{englishWord}</h3>
                  </div>

                  {/* Image Circle - auto-resized to fit */}
                                    <div className="relative h-52 w-52 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src="/simple-wooden-chair.png"
                      alt="Chair"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Spanish Translation */}
                  <div className="text-center">
                    <h3 className="text-balance text-4xl font-bold text-[#8B4513]">{spanishWord}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleSave} size="lg" className="touch-manipulation bg-purple-600 hover:bg-purple-700">
              <Save className="h-5 w-5" />
              <span className="sr-only">Save</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="touch-manipulation bg-transparent"
              onClick={() => router.push("/")}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="sr-only">Replace Image</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="touch-manipulation bg-transparent"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add to Deck</span>
            </Button>
          </div>
        </div>
      </main>

      <FloatingNav />

      {/* Account Creation Prompt Dialog */}
      <Dialog open={showAccountPrompt} onOpenChange={setShowAccountPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an Account to Save</DialogTitle>
            <DialogDescription>
              To save your flashcards and access them later, you'll need to create a free Memzy account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={handleCreateAccount} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Create Account
            </Button>
            <Button onClick={() => setShowAccountPrompt(false)} variant="outline" className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FlashcardResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlashcardResultContent />
    </Suspense>
  )
}
