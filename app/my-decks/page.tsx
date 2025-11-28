"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, BookOpen, Loader2, Download, Trash2 } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { useState, useEffect } from "react"
import { deleteDeck } from "@/lib/database"
import { useDecks } from "@/lib/decks-context"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { DownloadCardsDialog } from "@/components/print-cards-dialog"
import { useLanguage } from "@/lib/language-context"
import AiBadge from "@/components/ai-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MyDecksPage() {
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const { decks: contextDecks, isLoading: loading, mutate: mutateDecks } = useDecks()
  
  const t = {
    myDecks: primaryLanguage === 'es' ? 'Mis Mazos' : 'My Decks',
    createYourOwn: primaryLanguage === 'es' 
      ? 'Crea tus propios mazos de tarjetas personalizados'
      : 'Create your own custom flashcard decks',
    createNewDeck: primaryLanguage === 'es' ? 'Crear Nuevo Mazo' : 'Create New Deck',
    downloadAll: primaryLanguage === 'es' ? 'Descargar Todas' : 'Download All',
    yourCustomDeck: primaryLanguage === 'es' ? 'Tu mazo personalizado' : 'Your custom deck',
    cards: primaryLanguage === 'es' ? 'tarjetas' : 'cards',
    deleteDeck: primaryLanguage === 'es' ? '¿Eliminar Mazo?' : 'Delete Deck?',
    deleteConfirmation: primaryLanguage === 'es'
      ? 'Esta acción no se puede deshacer. El mazo y todas sus tarjetas serán eliminados permanentemente.'
      : 'This action cannot be undone. The deck and all its cards will be permanently deleted.',
    cancel: primaryLanguage === 'es' ? 'Cancelar' : 'Cancel',
    delete: primaryLanguage === 'es' ? 'Eliminar' : 'Delete',
    noDecksYet: primaryLanguage === 'es' ? '¡Aún no tienes mazos!' : 'No decks yet!',
    startCreating: primaryLanguage === 'es'
      ? 'Comienza a crear mazos de tarjetas personalizados para aprender español.'
      : 'Start creating custom flashcard decks to learn Spanish.',
  }
  
  const [userDecks, setUserDecks] = useState<Array<{
    id: string
    name: string
    description?: string
    cardCount: number
    coverImage?: string
    isAiGenerated?: boolean
  }>>([])
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    // Transform context decks for display
    setUserDecks(contextDecks.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description || t.yourCustomDeck,
      cardCount: d.cardCount,
      coverImage: d.coverImage || undefined,
      isAiGenerated: d.isAiGenerated || false
    })))
  }, [contextDecks, t.yourCustomDeck])

  const handleDeleteClick = (e: React.MouseEvent, deck: { id: string; name: string }) => {
    e.stopPropagation() // Prevent card click navigation
    setDeckToDelete(deck)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deckToDelete) return

    const success = await deleteDeck(deckToDelete.id)
    if (success) {
      // Remove from local state
      setUserDecks(prev => prev.filter(d => d.id !== deckToDelete.id))
      setDeleteDialogOpen(false)
      setDeckToDelete(null)
    } else {
      alert('Failed to delete deck. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Centered Header */}
          <div className="text-center space-y-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">{t.myDecks}</h1>
              <p className="text-muted-foreground">
                {primaryLanguage === 'es' 
                  ? 'Organiza tus tarjetas en mazos'
                  : 'Organize your flashcards into decks'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              {userDecks.length > 0 && (
                <Button 
                  onClick={() => setDownloadDialogOpen(true)}
                  variant="outline"
                  className="gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4" />
                  {primaryLanguage === 'es' ? 'Descargar Tarjetas' : 'Download Cards'}
                </Button>
              )}
              <Button 
                onClick={() => router.push("/")} 
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                {primaryLanguage === 'es' ? 'Crear Tarjeta' : 'Create Flashcard'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="relative aspect-[3/2] bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : userDecks.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {primaryLanguage === 'es'
                  ? '¡Aún no tienes ningún mazo! ¡Crea tu primera tarjeta para comenzar!'
                  : "You don't have any decks yet. Create your first flashcard to get started!"}
              </p>
              <Button onClick={() => router.push("/")} className="mt-4 bg-purple-600 hover:bg-purple-700">
                Create Flashcard
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {userDecks.map((deck, index) => {
                // Check if this is a special deck (Favorites or Uncategorized)
                const isSpecialDeck = deck.name === 'Favorites' || deck.name === 'Uncategorized'
                
                return (
                <Card
                  key={deck.id}
                  onClick={() => router.push(`/deck/${deck.id}`)}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-purple-400"
                >
                  <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700">
                    {deck.coverImage ? (
                      <Image
                        src={deck.coverImage}
                        alt={deck.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={index < 6}
                        loading={index < 6 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    {/* AI Badge */}
                    {deck.isAiGenerated && (
                      <AiBadge size={32} className="absolute left-3 top-3 z-10 pointer-events-none drop-shadow-md" />
                    )}
                    {/* Delete button overlay - only show for non-special decks */}
                    {!isSpecialDeck && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(e, deck)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-xl font-bold text-foreground">{deck.name}</h3>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {deck.description === "My custom deck" 
                        ? t.yourCustomDeck 
                        : (deck.description || t.yourCustomDeck)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <BookOpen className="h-4 w-4" />
                      <span>{deck.cardCount} {deck.cardCount !== 1 ? t.cards : (primaryLanguage === 'es' ? 'tarjeta' : 'card')}</span>
                    </div>
                  </div>
                </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <FloatingNav />
      
      <DownloadCardsDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDeck}</AlertDialogTitle>
            <AlertDialogDescription>
              {primaryLanguage === 'es'
                ? `¿Estás seguro de que quieres eliminar permanentemente "${deckToDelete?.name}"?`
                : `Are you sure you want to permanently delete "${deckToDelete?.name}"?`}
              <span className="block mt-2 font-semibold text-foreground">
                {primaryLanguage === 'es' 
                  ? 'Esta acción no se puede deshacer.'
                  : 'This action cannot be undone.'}
              </span>
              <span className="block mt-2">
                {primaryLanguage === 'es'
                  ? 'Todas las tarjetas en este mazo permanecerán en tu colección.'
                  : 'All cards in this deck will remain in your collection.'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
