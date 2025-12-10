"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FloatingNav } from "@/components/floating-nav"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { BookOpen, User, Download, Trash2, ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useDecks } from "@/lib/decks-context"
import { supabase } from "@/lib/supabase"
import { DownloadCardsDialog } from "@/components/print-cards-dialog"
import { useLanguage } from "@/lib/language-context"
import { deleteDeck } from "@/lib/database"
import MemzyLogo from "@/components/memzy-logo"
import { Skeleton } from "@/components/ui/skeleton"
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

const sampleDecks = [
  {
    id: "common-objects",
    title: "Common Objects",
    titleEs: "Objetos Comunes",
    description: "Learn everyday items in Spanish",
    descriptionEs: "Aprende objetos cotidianos en español",
    cardCount: 15,
    coverImage: "/everyday-household-objects.jpg",
  },
  {
    id: "animals",
    title: "Animals",
    titleEs: "Animales",
    description: "Discover animal names in Spanish",
    descriptionEs: "Descubre nombres de animales en español",
    cardCount: 15,
    coverImage: "/cute-animals-collection.jpg",
  },
  {
    id: "food-drinks",
    title: "Food & Drinks",
    titleEs: "Comida y Bebidas",
    description: "Master food vocabulary in Spanish",
    descriptionEs: "Domina el vocabulario de comida en español",
    cardCount: 15,
    coverImage: "/delicious-food-and-beverages.jpg",
  },
  {
    id: "colors-shapes",
    title: "Colors & Shapes",
    titleEs: "Colores y Formas",
    description: "Explore colors and shapes in Spanish",
    descriptionEs: "Explora colores y formas en español",
    cardCount: 15,
    coverImage: "/colorful-geometric-shapes.png",
  },
]

export default function BrowseDecksPage() {
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const { decks: contextDecks, isLoading: loadingUserDecks, mutate: mutateDecks } = useDecks()
  
  // Memoize translation strings to avoid recalculation on every render
  const t = useMemo(() => ({
    browseDecks: primaryLanguage === 'es' ? 'Explorar Mazos' : 'Browse Decks',
    allDecks: primaryLanguage === 'es' ? 'Todos los Mazos' : 'All Decks',
    sampleDecks: primaryLanguage === 'es' ? 'Mazos de Muestra' : 'Sample Decks',
    yourDecks: primaryLanguage === 'es' ? 'Mis Mazos' : 'My Decks',
    cards: primaryLanguage === 'es' ? 'tarjetas' : 'cards',
    yourCustomDeck: primaryLanguage === 'es' ? 'Tu mazo personalizado' : 'Your custom deck',
    viewDeck: primaryLanguage === 'es' ? 'Ver Mazo' : 'View Deck',
    download: primaryLanguage === 'es' ? 'Descargar' : 'Download',
    favorites: primaryLanguage === 'es' ? 'Favoritos' : 'Favorites',
    favoritesDesc: primaryLanguage === 'es' ? 'Tus tarjetas favoritas' : 'Your favorited cards',
  }), [primaryLanguage])
  
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; title: string; isSampleDeck?: boolean } | null>(null)
  const [hiddenSampleDecks, setHiddenSampleDecks] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  // Check authentication and load hidden sample decks
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Load hidden sample decks from localStorage for this user
      if (user) {
        const hidden = localStorage.getItem(`hiddenSampleDecks_${user.id}`)
        if (hidden) {
          setHiddenSampleDecks(JSON.parse(hidden))
        }
      }
    }
    checkAuth()
  }, [])

  // Memoize user decks transformation to avoid re-running on every render
  const userDecks = useMemo(() => {
    return contextDecks.map((d) => ({
      id: d.id,
      // Translate Favorites deck name
      title: d.name === 'Favorites' ? t.favorites : d.name,
      // Store original name for special deck checks
      originalName: d.name,
      // Translate Favorites deck description
      description: d.name === 'Favorites' ? t.favoritesDesc : (d.description || t.yourCustomDeck),
      cardCount: d.cardCount,
      coverImage: d.coverImage || undefined,
      isUserDeck: true
    }))
  }, [contextDecks, t.favorites, t.favoritesDesc, t.yourCustomDeck])

  // Handle delete button click - first confirmation
  const handleDeleteClick = (e: React.MouseEvent, deck: { id: string; title: string }, isSampleDeck: boolean = false) => {
    e.stopPropagation()
    setDeckToDelete({ ...deck, isSampleDeck })
    setDeleteDialogOpen(true)
  }

  // Handle first confirmation - show second confirmation
  const handleFirstDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    setConfirmDeleteDialogOpen(true)
  }

  // Handle final delete confirmation
  const handleFinalDeleteConfirm = async () => {
    if (!deckToDelete) return
    
    const deckIdToDelete = deckToDelete.id
    const wasSampleDeck = deckToDelete.isSampleDeck
    
    // Close dialog immediately for faster feedback
    setConfirmDeleteDialogOpen(false)
    setDeckToDelete(null)
    
    if (wasSampleDeck) {
      // For sample decks, hide them in localStorage
      const newHidden = [...hiddenSampleDecks, deckIdToDelete]
      setHiddenSampleDecks(newHidden)
      if (user) {
        localStorage.setItem(`hiddenSampleDecks_${user.id}`, JSON.stringify(newHidden))
      }
    } else {
      // For user decks - delete in background, then refresh
      const success = await deleteDeck(deckIdToDelete)
      if (success) {
        mutateDecks()
      } else {
        alert(primaryLanguage === 'es' ? 'Error al eliminar el mazo' : 'Failed to delete deck')
        mutateDecks() // Refresh anyway to show current state
      }
    }
  }

  // Filter out hidden sample decks
  const visibleSampleDecks = sampleDecks.filter(d => !hiddenSampleDecks.includes(d.id))

  // Combine sample decks with user's custom decks
  const allDecks = [...userDecks, ...sampleDecks.map(d => ({ ...d, isUserDeck: false }))]

  return (
    <div className="min-h-screen bg-background pb-20">
      <FloatingNav />

      {/* Back Button Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 pt-safe">
          <div className="mt-2">
            <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-5 w-5" />
              {primaryLanguage === 'es' ? 'Inicio' : 'Home'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <BookOpen className="h-16 w-16 text-purple-600" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-foreground">{t.browseDecks}</h1>
            <p className="text-muted-foreground">
              {primaryLanguage === 'es' 
                ? 'Elige un mazo para comenzar a aprender vocabulario en español'
                : 'Choose a deck to start learning Spanish vocabulary'}
            </p>
            
            <div className="mt-6">
              <Button
                onClick={() => setPrintDialogOpen(true)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {t.download} {primaryLanguage === 'es' ? 'Tarjetas' : 'Cards'}
              </Button>
            </div>
          </div>

          {/* User's Custom Decks Section */}
          {(loadingUserDecks || userDecks.length > 0) && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                <h2 className="text-2xl font-bold text-foreground">{t.yourDecks}</h2>
              </div>
              {/* Show loading indicator while loading */}
              {loadingUserDecks && userDecks.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Image 
                      src="/loading-gem.gif" 
                      alt="Loading" 
                      width={64} 
                      height={64} 
                      className="mx-auto mb-2"
                      unoptimized
                    />
                    <p className="text-muted-foreground">
                      {primaryLanguage === 'es' ? 'Cargando tus mazos...' : 'Loading your decks...'}
                    </p>
                  </div>
                </div>
              ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {userDecks.map((deck) => {
                  const isSpecialDeck = (deck as any).originalName === 'Favorites' || (deck as any).originalName === 'Uncategorized'
                  const isEmpty = deck.cardCount === 0
                  
                  return (
                  <Card
                    key={deck.id}
                    className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-purple-600"
                    onClick={() => router.push(`/deck/${deck.id}`)}
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600">
                      {isEmpty ? (
                        <div className="flex h-full flex-col items-center justify-center">
                          <MemzyLogo size={64} variant="greyed" className="mb-2" />
                          <p className="text-white/60 text-sm">
                            {primaryLanguage === 'es' ? 'Guarda un Memz' : 'Store a Memz'}
                          </p>
                        </div>
                      ) : deck.coverImage ? (
                        <Image
                          src={deck.coverImage}
                          alt={deck.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white opacity-50" />
                        </div>
                      )}
                      {/* Delete button - only show for non-special decks */}
                      {!isSpecialDeck && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => handleDeleteClick(e, deck)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 text-xl font-bold text-foreground">{deck.title}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {deck.description === "My custom deck" 
                          ? t.yourCustomDeck 
                          : (deck.description || t.yourCustomDeck)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <BookOpen className="h-4 w-4" />
                        <span>{deck.cardCount} {t.cards}</span>
                      </div>
                    </div>
                  </Card>
                  )
                })}
              </div>
              )}
            </div>
          )}

          {/* Sample Decks Section */}
          {visibleSampleDecks.length > 0 && (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">{t.sampleDecks}</h2>
                <p className="text-sm text-muted-foreground">
                  {primaryLanguage === 'es' 
                    ? 'Mazos pre-hechos para comenzar'
                    : 'Pre-made decks to get you started'}
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSampleDecks.map((deck) => {
                  const deckTitle = primaryLanguage === 'es' ? deck.titleEs : deck.title
                  const deckDescription = primaryLanguage === 'es' ? deck.descriptionEs : deck.description
                  
                  return (
                  <Card
                    key={deck.id}
                    className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-purple-600"
                    onClick={() => router.push(`/deck/${deck.id}`)}
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                      <Image
                        src={deck.coverImage || "/placeholder.svg"}
                        alt={deckTitle}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Delete button for sample decks - only for signed in users */}
                      {user && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => handleDeleteClick(e, { id: deck.id, title: deckTitle }, true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 text-xl font-bold text-foreground">{deckTitle}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{deckDescription}</p>
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <BookOpen className="h-4 w-4" />
                        <span>{deck.cardCount} {t.cards}</span>
                      </div>
                    </div>
                  </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <DownloadCardsDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
      />

      {/* First Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {primaryLanguage === 'es' ? '¿Eliminar Mazo?' : 'Delete Deck?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {primaryLanguage === 'es' 
                ? `¿Estás seguro de que quieres eliminar "${deckToDelete?.title}"?`
                : `Are you sure you want to delete "${deckToDelete?.title}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {primaryLanguage === 'es' ? 'Guardar Memz' : 'Keep Memz'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFirstDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {primaryLanguage === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {primaryLanguage === 'es' ? '¿Confirmar eliminación permanente?' : 'Confirm permanent deletion?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block font-semibold text-red-600">
                {primaryLanguage === 'es' 
                  ? 'Esta acción no se puede deshacer.'
                  : 'This action cannot be undone.'}
              </span>
              <span className="block mt-2">
                {primaryLanguage === 'es' 
                  ? `El mazo "${deckToDelete?.title}" y todas sus tarjetas serán eliminados permanentemente.`
                  : `The deck "${deckToDelete?.title}" and all its cards will be permanently deleted.`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {primaryLanguage === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {primaryLanguage === 'es' ? 'Eliminar permanentemente' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
