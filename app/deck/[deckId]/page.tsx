"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FloatingNav } from "@/components/floating-nav"
import Image from "next/image"
import { ChevronRight, Save, ImageIcon, Pencil, Plus, Upload, Camera, X, Loader2, Check, Download, Trash2, ChevronLeft, Volume2, Heart, Crown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getDeckWithCards, createFlashcard, createDeck, addCardToDecks, removeCardFromDeck, deleteFlashcard, updateFlashcardImage, getSampleCardCustomizations, saveSampleCardCustomization, addCardToFavorites, removeCardFromFavorites, isCardInFavorites, deleteDeck, moveCardToUncategorized, copySampleCardToUncategorized, updateDeckName } from "@/lib/database"
import type { DeckWithCards } from "@/lib/database"
import { useDecks } from "@/lib/decks-context"
import { useSubscription } from "@/lib/subscription-context"
import MemzyLogo from "@/components/memzy-logo"
import { supabase } from "@/lib/supabase"
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
import { Camera as CapacitorCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import { GemLoader } from "@/components/gem-loader"
import { Capacitor } from '@capacitor/core'

// Export dynamic to prevent static generation issues with Capacitor
export const dynamic = 'force-dynamic'

// Mock deck data - in a real app, this would come from a database
const deckData: Record<string, { title: string; cards: Array<{ english: string; spanish: string; image: string }> }> = {
  "common-objects": {
    title: "Common Objects",
    cards: [
      { english: "Chair", spanish: "Silla", image: "/simple-wooden-chair.png" },
      { english: "Table", spanish: "Mesa", image: "/elegant-dining-table.png" },
      { english: "Book", spanish: "Libro", image: "/open-book.png" },
      { english: "Pen", spanish: "Bolígrafo", image: "/pen-writing.jpg" },
      { english: "Cup", spanish: "Taza", image: "/coffee-cup.png" },
      { english: "Phone", spanish: "Teléfono", image: "/modern-smartphone.png" },
      { english: "Door", spanish: "Puerta", image: "/rustic-wooden-door.png" },
      { english: "Window", spanish: "Ventana", image: "/window-with-view.jpg" },
      { english: "Clock", spanish: "Reloj", image: "/classic-wall-clock.png" },
      { english: "Lamp", spanish: "Lámpara", image: "/modern-desk-lamp.png" },
      { english: "Key", spanish: "Llave", image: "/antique-house-key.png" },
      { english: "Bag", spanish: "Bolsa", image: "/single-shopping-bag.png" },
      { english: "Shoes", spanish: "Zapatos", image: "/pair-of-shoes.jpg" },
      { english: "Glasses", spanish: "Gafas", image: "/diverse-eyeglasses.png" },
      { english: "Watch", spanish: "Reloj de pulsera", image: "/classic-leather-wristwatch.png" },
    ],
  },
  animals: {
    title: "Animals",
    cards: [
      { english: "Dog", spanish: "Perro", image: "/happy-golden-retriever.png" },
      { english: "Cat", spanish: "Gato", image: "/cute-cat.png" },
      { english: "Bird", spanish: "Pájaro", image: "/colorful-bird.png" },
      { english: "Fish", spanish: "Pez", image: "/tropical-fish.jpg" },
      { english: "Horse", spanish: "Caballo", image: "/brown-horse.png" },
      { english: "Cow", spanish: "Vaca", image: "/dairy-cow.png" },
      { english: "Pig", spanish: "Cerdo", image: "/pink-pig.jpg" },
      { english: "Chicken", spanish: "Pollo", image: "/chicken-hen.jpg" },
      { english: "Rabbit", spanish: "Conejo", image: "/white-rabbit.png" },
      { english: "Mouse", spanish: "Ratón", image: "/small-mouse.png" },
      { english: "Elephant", spanish: "Elefante", image: "/majestic-african-elephant.png" },
      { english: "Lion", spanish: "León", image: "/lion.jpg" },
      { english: "Tiger", spanish: "Tigre", image: "/majestic-tiger.png" },
      { english: "Bear", spanish: "Oso", image: "/brown-bear.jpg" },
      { english: "Monkey", spanish: "Mono", image: "/playful-monkey.png" },
    ],
  },
  "food-drinks": {
    title: "Food & Drinks",
    cards: [
      { english: "Apple", spanish: "Manzana", image: "/red-apple.png" },
      { english: "Banana", spanish: "Plátano", image: "/yellow-banana.png" },
      { english: "Orange", spanish: "Naranja", image: "/ripe-orange.png" },
      { english: "Bread", spanish: "Pan", image: "/fresh-bread.png" },
      { english: "Milk", spanish: "Leche", image: "/glass-of-milk.png" },
      { english: "Water", spanish: "Agua", image: "/water-glass.png" },
      { english: "Coffee", spanish: "Café", image: "/coffee-cup.png" },
      { english: "Tea", spanish: "Té", image: "/elegant-tea-cup.png" },
      { english: "Cheese", spanish: "Queso", image: "/cheese-block.png" },
      { english: "Egg", spanish: "Huevo", image: "/assorted-eggs.png" },
      { english: "Rice", spanish: "Arroz", image: "/bowl-of-white-rice.png" },
      { english: "Chicken", spanish: "Pollo", image: "/cooked-chicken.png" },
      { english: "Fish", spanish: "Pescado", image: "/cooked-fish.jpg" },
      { english: "Salad", spanish: "Ensalada", image: "/fresh-salad.png" },
      { english: "Pizza", spanish: "Pizza", image: "/pizza-slice.png" },
    ],
  },
  "colors-shapes": {
    title: "Colors & Shapes",
    cards: [
      { english: "Red", spanish: "Rojo", image: "/red-color.svg" },
      { english: "Blue", spanish: "Azul", image: "/blue-color.svg" },
      { english: "Green", spanish: "Verde", image: "/green-color.svg" },
      { english: "Yellow", spanish: "Amarillo", image: "/yellow-color.svg" },
      { english: "Orange", spanish: "Naranja", image: "/orange-color.svg" },
      { english: "Purple", spanish: "Morado", image: "/purple-color.svg" },
      { english: "Pink", spanish: "Rosa", image: "/pink-color.svg" },
      { english: "Black", spanish: "Negro", image: "/black-color.svg" },
      { english: "White", spanish: "Blanco", image: "/white-color.svg" },
      { english: "Circle", spanish: "Círculo", image: "/circle-shape.svg" },
      { english: "Square", spanish: "Cuadrado", image: "/square-shape.svg" },
      { english: "Triangle", spanish: "Triángulo", image: "/triangle-shape.svg" },
      { english: "Rectangle", spanish: "Rectángulo", image: "/rectangle-shape.svg" },
      { english: "Star", spanish: "Estrella", image: "/star-shape.svg" },
      { english: "Heart", spanish: "Corazón", image: "/heart-shape.svg" },
    ],
  },
}

export default function DeckPage({ params }: { params: { deckId: string } }) {
  const { deckId } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const { primaryLanguage } = useLanguage()
  
  // Translation strings
  const t = {
    thisDecIsEmpty: primaryLanguage === 'es' ? 'Este mazo está vacío' : 'This deck is empty',
    browseOtherDecks: primaryLanguage === 'es' ? 'Ver Otros Mazos' : 'Browse Other Decks',
    addToDeck: primaryLanguage === 'es' ? 'Agregar al Mazo' : 'Add to Deck',
    downloadCards: primaryLanguage === 'es' ? 'Descargar Tarjetas' : 'Download Cards',
    replaceImage: primaryLanguage === 'es' ? 'Reemplazar Imagen' : 'Replace Image',
    deleteCard: primaryLanguage === 'es' ? 'Eliminar Tarjeta' : 'Delete Card',
    of: primaryLanguage === 'es' ? 'de' : 'of',
    previous: primaryLanguage === 'es' ? 'Anterior' : 'Previous',
    next: primaryLanguage === 'es' ? 'Siguiente' : 'Next',
    deleteThisCard: primaryLanguage === 'es' ? '¿Eliminar esta tarjeta?' : 'Delete this card?',
    deleteConfirmation: primaryLanguage === 'es'
      ? 'Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente de este mazo.'
      : 'This action cannot be undone. The card will be permanently removed from this deck.',
    cancel: primaryLanguage === 'es' ? 'Cancelar' : 'Cancel',
    delete: primaryLanguage === 'es' ? 'Eliminar' : 'Delete',
    uploadImage: primaryLanguage === 'es' ? 'Subir Imagen' : 'Upload Image',
    takePhoto: primaryLanguage === 'es' ? 'Tomar Foto' : 'Take Photo',
    analyzingImage: primaryLanguage === 'es' ? 'Analizando imagen...' : 'Analyzing image...',
    analyzeImage: primaryLanguage === 'es' ? 'Analizar Imagen' : 'Analyze Image',
    english: primaryLanguage === 'es' ? 'Inglés' : 'English',
    spanish: primaryLanguage === 'es' ? 'Español' : 'Spanish',
    saveChanges: primaryLanguage === 'es' ? 'Guardar Cambios' : 'Save Changes',
    myCustomDeck: primaryLanguage === 'es' ? 'Mi mazo personalizado' : 'My custom deck',
    favorites: primaryLanguage === 'es' ? 'Favoritos' : 'Favorites',
    card: primaryLanguage === 'es' ? 'Tarjeta' : 'Card',
  }

  // Sample deck title translations
  const deckTitleTranslations: Record<string, string> = {
    'Common Objects': primaryLanguage === 'es' ? 'Objetos Comunes' : 'Common Objects',
    'Animals': primaryLanguage === 'es' ? 'Animales' : 'Animals',
    'Food & Drinks': primaryLanguage === 'es' ? 'Comida y Bebidas' : 'Food & Drinks',
    'Colors & Shapes': primaryLanguage === 'es' ? 'Colores y Formas' : 'Colors & Shapes',
  }
  
  // FREE LIMIT — SUBSCRIPTION HOOK
  const { 
    canUseFavorites,
    canCreateCard,
    incrementCreatedCards,
    canCreateDeck,
    incrementDecks,
    setShowUpgradeModal,
    setUpgradeReason,
  } = useSubscription()
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditingEnglish, setIsEditingEnglish] = useState(false)
  const [isEditingSpanish, setIsEditingSpanish] = useState(false)
  const [editedEnglish, setEditedEnglish] = useState("")
  const [editedSpanish, setEditedSpanish] = useState("")
  const [showReplaceOptions, setShowReplaceOptions] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAddToDeck, setShowAddToDeck] = useState(false)
  const [selectedDecks, setSelectedDecks] = useState<string[]>([])
  const [newDeckName, setNewDeckName] = useState("")
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<{ index: number; card: any; cardId?: string } | null>(null)
  const [showKeepDeckDialog, setShowKeepDeckDialog] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showMultiDownloadDialog, setShowMultiDownloadDialog] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [hasSwipedForward, setHasSwipedForward] = useState(false)
  const [showSignInWarning, setShowSignInWarning] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showFavoritingLoader, setShowFavoritingLoader] = useState(false)
  const [isEditingDeckName, setIsEditingDeckName] = useState(false)
  const [editedDeckName, setEditedDeckName] = useState("")
  const [isSavingDeckName, setIsSavingDeckName] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { decks: contextDecks, mutate: mutateDecks } = useDecks()
  
  // Deck state
  const [deck, setDeck] = useState<DeckWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Use state for cards so React detects changes
  const [cards, setCards] = useState<Array<{ english: string; spanish: string; image: string; id?: string; is_ai_generated?: boolean }>>([])
  
  // Available decks for adding cards (user decks + sample decks)
  const [availableDecks, setAvailableDecks] = useState<Array<{ id: string; title: string }>>([])
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkAuth()
  }, [])
  
  // Load available decks (user + sample)
  useEffect(() => {
    const sampleDecks = Object.keys(deckData).map(key => ({
      id: key,
      title: deckData[key].title
    }))
    
    setAvailableDecks([
      ...contextDecks.map(d => ({ id: d.id, title: d.name })),
      ...sampleDecks
    ])
  }, [contextDecks])

  // Load deck data
  useEffect(() => {
    const loadDeck = async () => {
      // First check if it's a sample deck
      if (deckData[deckId]) {
        setDeck(deckData[deckId] as any)
        
        // Load user customizations for sample deck
        const customizations = await getSampleCardCustomizations(deckId)
        
        // Apply customizations to sample deck cards
        const cardsWithCustomizations = deckData[deckId].cards.map((card, index) => {
          if (customizations[index]) {
            // User has a custom image for this card
            return {
              ...card,
              image: customizations[index]
            }
          }
          return card
        })
        
        setCards(cardsWithCustomizations)
        setLoading(false)
      } else {
        // Try to load from database
        const userDeck = await getDeckWithCards(deckId)
        if (userDeck) {
          setDeck(userDeck)
          setCards(userDeck.cards.map(c => ({
            english: c.english_word,
            spanish: c.spanish_word,
            image: c.image_url || '/placeholder.svg',
            id: c.id,
            is_ai_generated: c.is_ai_generated
          })))
        }
        setLoading(false)
      }
    }
    
    loadDeck()
  }, [deckId])

  // Check for cardIndex query parameter and navigate to that card
  useEffect(() => {
    if (!loading && cards.length > 0) {
      const cardIndexParam = searchParams.get('cardIndex')
      if (cardIndexParam) {
        const targetIndex = parseInt(cardIndexParam, 10)
        if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < cards.length) {
          setCurrentCardIndex(targetIndex)
          setIsFlipped(false)
        }
      }
    }
  }, [loading, cards.length, searchParams])

  // Check if current card is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !cards[currentCardIndex]) {
        setIsFavorited(false)
        return
      }
      
      // If viewing Favorites deck, all cards are already favorited
      if (deck && (deck as any).name === 'Favorites') {
        setIsFavorited(true)
        return
      }
      
      const card = cards[currentCardIndex]
      const favorited = await isCardInFavorites(card.english, card.spanish)
      setIsFavorited(favorited)
    }
    
    checkFavoriteStatus()
  }, [currentCardIndex, cards, user, deck])

  // Handle keeping the empty deck - defined early for use in empty state render
  const handleKeepDeck = () => {
    setShowKeepDeckDialog(false)
    // Deck stays empty, user can add cards later
  }

  // Handle deleting the empty deck - defined early for use in empty state render
  const handleDeleteEmptyDeck = async () => {
    setShowKeepDeckDialog(false)
    // Navigate immediately for faster feedback
    router.push('/my-decks')
    
    // Delete in background
    const success = await deleteDeck(deckId)
    if (success) {
      mutateDecks()
    }
    // If it fails, the deck will still appear when they return to my-decks
  }

  // Handle saving edited deck name
  const handleSaveDeckName = async () => {
    if (!editedDeckName.trim()) {
      setIsEditingDeckName(false)
      return
    }
    
    setIsSavingDeckName(true)
    try {
      const success = await updateDeckName(deckId, editedDeckName.trim())
      if (success) {
        // Update local deck state
        setDeck((prev: any) => prev ? { ...prev, name: editedDeckName.trim() } : prev)
        mutateDecks() // Refresh deck list
      } else {
        alert(primaryLanguage === 'es' ? 'Error al guardar el nombre' : 'Failed to save name')
      }
    } catch (error) {
      console.error('Error saving deck name:', error)
      alert(primaryLanguage === 'es' ? 'Error al guardar el nombre' : 'Failed to save name')
    } finally {
      setIsSavingDeckName(false)
      setIsEditingDeckName(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GemLoader size={64} />
      </div>
    )
  }

  if (!deck || cards.length === 0) {
    const rawDeckName = deck ? ((deck as any).name || (deck as any).title || 'Deck') : 'Deck'
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex items-center gap-4 px-4 py-4 pt-safe">
            <div className="mt-2">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ChevronLeft className="h-5 w-5" />
                {primaryLanguage === 'es' ? 'Atrás' : 'Back'}
              </Button>
            </div>
            <h1 className="text-xl font-bold text-foreground mt-2">{rawDeckName}</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <MemzyLogo size={120} variant="greyed" className="mb-6" />
            <p className="text-muted-foreground text-lg mb-2">
              {primaryLanguage === 'es' ? 'Guarda un Memz' : 'Store a Memz'}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {primaryLanguage === 'es' 
                ? 'Haz clic en + para agregar tarjetas a este mazo' 
                : 'Click + to add cards to this deck'}
            </p>
            <Button onClick={() => router.push('/?action=create')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              {primaryLanguage === 'es' ? 'Crear Tarjeta' : 'Create Card'}
            </Button>
          </div>
        </main>
        <FloatingNav />
        
        {/* Keep or Delete Empty Deck Dialog - must be rendered here too */}
        <AlertDialog open={showKeepDeckDialog} onOpenChange={setShowKeepDeckDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {primaryLanguage === 'es' ? '¿Mantener este mazo?' : 'Keep this deck?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {primaryLanguage === 'es' 
                  ? 'Has eliminado la última tarjeta de este mazo. ¿Quieres mantener el mazo vacío o eliminarlo?'
                  : "You've deleted the last card in this deck. Would you like to keep the empty deck or delete it?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleDeleteEmptyDeck} className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                {primaryLanguage === 'es' ? 'No, eliminar mazo' : 'No, delete deck'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleKeepDeck} className="bg-purple-600 hover:bg-purple-700">
                {primaryLanguage === 'es' ? 'Mantener mazo' : 'Keep Deck'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  const currentCard = cards[currentCardIndex]
  const rawDeckName = (deck as any).name || (deck as any).title || 'Deck'
  // Translate Favorites and sample deck titles
  const deckTitle = rawDeckName === 'Favorites' 
    ? t.favorites 
    : (deckTitleTranslations[rawDeckName] || rawDeckName)

  // Determine front and back content based on language preference
  const frontWord = primaryLanguage === 'es' ? currentCard?.spanish : currentCard?.english
  const backWord = primaryLanguage === 'es' ? currentCard?.english : currentCard?.spanish
  const frontLang = primaryLanguage === 'es' ? 'es' : 'en'
  const backLang = primaryLanguage === 'es' ? 'en' : 'es'
  const frontButtonText = primaryLanguage === 'es' ? 'Tocar para revelar' : 'Tap to Reveal'
  const backButtonText = primaryLanguage === 'es' ? 'Voltear' : 'Flip Back'
  const frontAudioText = primaryLanguage === 'es' ? 'Escuchar' : 'Listen'
  const backAudioText = primaryLanguage === 'es' ? 'Listen' : 'Escuchar'

  const handleSpeak = async (text: string, lang: string) => {
    
    // Use native Capacitor TextToSpeech on mobile
    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
        await TextToSpeech.speak({
          text: text,
          lang: lang === 'es' ? 'es-ES' : 'en-US',
          rate: 0.85,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        })
      } catch (error) {
        console.error('[Audio] Native TTS error:', error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        // Show helpful message for emulator
        alert(primaryLanguage === 'es' 
          ? 'El audio no funciona en el emulador de Android Studio. Prueba en un dispositivo físico.' 
          : 'Audio doesn\'t work on Android Studio emulator. Try on a physical device.')
      }
      return
    }
    
    // Use Web Speech API on web/browser
    
    if (!('speechSynthesis' in window)) {
      console.error('[Audio] Speech synthesis not supported')
      // Silently fail on mobile emulator
      return
    }
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices()
        
        if (lang === 'es') {
          // Find a native Spanish voice
          const spanishVoice = voices.find(voice => 
            voice.lang.startsWith('es-ES') || voice.lang.startsWith('es-MX') || voice.lang.startsWith('es')
          )
          if (spanishVoice) {
            utterance.voice = spanishVoice
          }
          utterance.lang = 'es-ES'
        } else {
          // Find a native English voice
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en-US') || voice.lang.startsWith('en')
          )
          if (englishVoice) {
            utterance.voice = englishVoice
          }
          utterance.lang = 'en-US'
        }
        
        utterance.rate = 0.85
        utterance.pitch = 1
        
        utterance.onerror = (event) => console.error('[Audio] Error speaking:', event.error)
        
        window.speechSynthesis.speak(utterance)
      }
      
      // Ensure voices are loaded
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        speak()
      } else {
        window.speechSynthesis.onvoiceschanged = () => speak()
        setTimeout(() => {
          if (window.speechSynthesis.getVoices().length === 0) {
            speak() // Try anyway
          }
        }, 1000)
      }
    } catch (error) {
      console.error('[Audio] Exception in handleSpeak:', error)
      // Silently fail
    }
  }

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
      setIsEditingEnglish(false)
      setIsEditingSpanish(false)
    }
  }

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
      setIsEditingEnglish(false)
      setIsEditingSpanish(false)
    }
  }

  // Swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && currentCardIndex < cards.length - 1) {
      setHasSwipedForward(true)
      handleNextCard()
    }
    if (isRightSwipe && currentCardIndex > 0) {
      handlePreviousCard()
    }
  }

  const handleSaveCard = () => {
    router.push("/create-account?redirect=deck")
  }

  const handleAddToDeck = () => {
    setShowAddToDeck(true)
  }

  const handleToggleDeck = (deckId: string) => {
    setSelectedDecks(prev => 
      prev.includes(deckId) 
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    )
  }

  const handleCreateNewDeck = () => {
    setIsCreatingDeck(true)
  }

  const handleDeleteClick = (index: number, card: any) => {
    setCardToDelete({ index, card, cardId: card.id })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return

    const isSampleDeck = deckData[deckId] !== undefined
    const deckName = (deck as any)?.name || ''
    const isUncategorized = deckName === 'Uncategorized'
    
    // For sample decks, copy the card to Uncategorized
    if (isSampleDeck) {
      const success = await copySampleCardToUncategorized(
        cardToDelete.card.english,
        cardToDelete.card.spanish,
        cardToDelete.card.image
      )
      
      if (success) {
        // Remove from local state (visually hide the card)
        const newCards = cards.filter((_, i) => i !== cardToDelete.index)
        setCards(newCards)
        
        // Adjust current card index if needed
        if (currentCardIndex >= newCards.length && newCards.length > 0) {
          setCurrentCardIndex(newCards.length - 1)
        } else if (newCards.length === 0) {
          setCurrentCardIndex(0)
        } else if (currentCardIndex > cardToDelete.index) {
          setCurrentCardIndex(currentCardIndex - 1)
        }
        
        setDeleteDialogOpen(false)
        setCardToDelete(null)
        mutateDecks()
      } else {
        alert('Failed to move card. Please sign in and try again.')
      }
      return
    }

    // For Uncategorized deck, permanently delete
    if (isUncategorized && cardToDelete.cardId) {
      const success = await deleteFlashcard(cardToDelete.cardId)
      if (success) {
        // Also remove from deck_cards
        await removeCardFromDeck(deckId, cardToDelete.cardId)
        
        // Remove from local state
        const newCards = cards.filter((_, i) => i !== cardToDelete.index)
        setCards(newCards)
        
        // Adjust current card index if needed
        if (currentCardIndex >= newCards.length && newCards.length > 0) {
          setCurrentCardIndex(newCards.length - 1)
        } else if (newCards.length === 0) {
          setCurrentCardIndex(0)
        } else if (currentCardIndex > cardToDelete.index) {
          setCurrentCardIndex(currentCardIndex - 1)
        }
        
        setDeleteDialogOpen(false)
        setCardToDelete(null)
        mutateDecks()
      } else {
        alert('Failed to delete card. Please try again.')
      }
      return
    }

    // For user decks (Favorites, custom decks), move to Uncategorized
    if (cardToDelete.cardId) {
      // Check if this is the last card in the deck
      const isLastCard = cards.length === 1
      const isSpecialDeck = deckName === 'Favorites' || deckName === 'Uncategorized'
      
      const success = await moveCardToUncategorized(deckId, cardToDelete.cardId)
      if (success) {
        // Remove from local state
        const newCards = cards.filter((_, i) => i !== cardToDelete.index)
        setCards(newCards)
        
        // Adjust current card index if needed
        if (currentCardIndex >= newCards.length && newCards.length > 0) {
          setCurrentCardIndex(newCards.length - 1)
        } else if (newCards.length === 0) {
          setCurrentCardIndex(0)
        } else if (currentCardIndex > cardToDelete.index) {
          setCurrentCardIndex(currentCardIndex - 1)
        }
        
        setDeleteDialogOpen(false)
        setCardToDelete(null)
        
        // If this was the last card and not a special deck, ask user if they want to keep or delete the deck
        if (isLastCard && !isSpecialDeck) {
          setShowKeepDeckDialog(true)
        }
        
        // Refresh decks context
        mutateDecks()
      } else {
        alert('Failed to move card. Please try again.')
      }
    }
  }

  const handleSaveNewDeck = async () => {
    if (newDeckName.trim()) {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please sign in to create decks")
        setTimeout(() => {
          router.push("/login")
        }, 100)
        return
      }
      
      // Create the deck
      try {
        const deck = await createDeck(newDeckName.trim(), t.myCustomDeck)
        if (deck) {
          alert(`Deck "${newDeckName}" created!`)
          setNewDeckName("")
          setIsCreatingDeck(false)
          // Refresh available decks and context
          mutateDecks()
          const sampleDecks = Object.keys(deckData).map(key => ({
            id: key,
            title: deckData[key].title
          }))
          setAvailableDecks([
            ...contextDecks.map(d => ({ id: d.id, title: d.name })),
            ...sampleDecks
          ])
        } else {
          alert("Failed to create deck. Please try again.")
        }
      } catch (error) {
        console.error("Error creating deck:", error)
        if (error instanceof Error && error.message.includes('logged in')) {
          alert("Please sign in to create decks")
          setTimeout(() => {
            router.push("/login")
          }, 100)
        } else {
          alert("Failed to create deck. Please try again.")
        }
      }
    }
  }

  const handleConfirmAddToDeck = async () => {
    if (selectedDecks.length === 0 && !newDeckName.trim()) {
      alert("Please select at least one deck or create a new one")
      return
    }

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please sign in to save cards to your decks")
        return
      }

      const currentCard = cards[currentCardIndex]

      // Create the flashcard in database
      const flashcard = await createFlashcard(
        currentCard.english,
        currentCard.spanish,
        currentCard.image
      )

      if (!flashcard) {
        alert("Failed to create flashcard")
        return
      }

      const deckIds = [...selectedDecks]

      // Create new deck if needed
      if (newDeckName.trim()) {
        const newDeck = await createDeck(newDeckName.trim(), t.myCustomDeck)
        if (newDeck) {
          deckIds.push(newDeck.id)
        }
      }

      // Add card to all selected decks
      if (deckIds.length > 0) {
        await addCardToDecks(flashcard.id, deckIds)
      }

      alert(`Card successfully added to ${deckIds.length} deck${deckIds.length > 1 ? 's' : ''}!`)

      // Reset and close
      setSelectedDecks([])
      setNewDeckName("")
      setIsCreatingDeck(false)
      setShowAddToDeck(false)
      
      // Reload available decks and refresh context
      mutateDecks()
      const sampleDecks = Object.keys(deckData).map(key => ({
        id: key,
        title: deckData[key].title
      }))
      setAvailableDecks([
        ...contextDecks.map(d => ({ id: d.id, title: d.name })),
        ...sampleDecks
      ])
    } catch (error) {
      console.error("Error adding card to deck:", error)
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('logged in')) {
        alert("Please sign in to create decks")
        setTimeout(() => {
          router.push("/login")
        }, 100)
      } else {
        alert("Failed to add card to deck. Please try again.")
      }
    }
  }

  const handleDownloadCard = async () => {
    const currentCard = cards[currentCardIndex]
    
    // Create a canvas to render the card
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (standard card size)
    canvas.width = 600
    canvas.height = 800

    // Draw white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw purple border
    ctx.strokeStyle = '#9333ea'
    ctx.lineWidth = 8
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Draw Spanish word (top, large, purple)
    ctx.fillStyle = '#9333ea'
    ctx.font = 'bold 48px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(currentCard.spanish, canvas.width / 2, 100)

    // Draw image if available
    if (currentCard.image) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const imgSize = 300
        const imgX = (canvas.width - imgSize) / 2
        const imgY = 150
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize)

        // Draw English word (bottom)
        ctx.fillStyle = '#1f2937'
        ctx.font = '32px Arial, sans-serif'
        ctx.fillText(currentCard.english, canvas.width / 2, 520)

        // Download
        downloadCanvas(canvas, currentCard.english)
      }
      img.src = currentCard.image
    } else {
      // Draw English word (bottom) without image
      ctx.fillStyle = '#1f2937'
      ctx.font = '32px Arial, sans-serif'
      ctx.fillText(currentCard.english, canvas.width / 2, canvas.height / 2 + 100)

      // Download
      downloadCanvas(canvas, currentCard.english)
    }
    
    setShowDownloadDialog(false)
  }

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flashcard-${filename.toLowerCase()}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.95)
  }

  const handleEditEnglish = () => {
    setEditedEnglish(currentCard.english)
    setIsEditingEnglish(true)
  }

  const handleEditSpanish = () => {
    setEditedSpanish(currentCard.spanish)
    setIsEditingSpanish(true)
  }

  const handleSaveEdit = async () => {
    const updatedCards = [...cards]
    
    if (isEditingEnglish && editedEnglish.trim()) {
      // Update English word and translate to Spanish
      updatedCards[currentCardIndex].english = editedEnglish.trim()
      
      // Auto-translate the new English word to Spanish
      try {
        const translateResponse = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(editedEnglish.trim())}&langpair=en|es`
        )
        const translateData = await translateResponse.json()
        const spanishTranslation = translateData.responseData.translatedText
        updatedCards[currentCardIndex].spanish = spanishTranslation
      } catch (error) {
        console.error("Translation error:", error)
      }
    }
    
    if (isEditingSpanish && editedSpanish.trim()) {
      updatedCards[currentCardIndex].spanish = editedSpanish.trim()
    }
    
    setCards(updatedCards)
    setIsEditingEnglish(false)
    setIsEditingSpanish(false)
  }

  const openCamera = async () => {
    // Check if user is signed in first
    if (!user) {
      setShowReplaceOptions(false)
      setShowSignInWarning(true)
      return
    }
    
    try {
      // Check if running on a native platform (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Camera plugin on native devices
        const image = await CapacitorCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 90,
          correctOrientation: true,
          direction: CameraDirection.Rear // Prefer back camera to avoid mirror issues
        })
        
        if (image.dataUrl) {
          setImagePreview(image.dataUrl)
          analyzeImage(image.dataUrl)
          
          // Convert data URL to File for consistency
          const response = await fetch(image.dataUrl)
          const blob = await response.blob()
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
          setImageFile(file)
        }
        setShowReplaceOptions(false)
      } else {
        // Use web API for browser
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        setStream(mediaStream)
        setShowCamera(true)
        setShowReplaceOptions(false)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
              setImagePreview(reader.result as string)
              analyzeImage(reader.result as string)
            }
            reader.readAsDataURL(file)
          }
        }, "image/jpeg")
        closeCamera()
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if user is signed in first
      if (!user) {
        setShowReplaceOptions(false)
        setShowSignInWarning(true)
        // Reset the file input
        e.target.value = ''
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        analyzeImage(reader.result as string)
      }
      reader.readAsDataURL(file)
      setShowReplaceOptions(false)
    }
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    try {
      const currentCard = cards[currentCardIndex]
      
      // Check if we're in an existing deck (either sample deck or user deck with card IDs)
      // If so, just replace the image without analyzing to keep the words the same
      const isExistingDeck = deck !== null
      const isSampleDeck = deck !== null && !currentCard.id
      
      if (isExistingDeck) {
        // Update only the image, keep existing words
        const updatedCards = [...cards]
        updatedCards[currentCardIndex] = {
          ...updatedCards[currentCardIndex],
          image: imageData,
        }
        
        // Update state to trigger re-render
        setCards(updatedCards)
        
        // Save to database
        if (isSampleDeck && user) {
          // Sample deck - save to customizations table
          const result = await saveSampleCardCustomization(deckId, currentCardIndex, imageData)
          if (result) {
          } else {
            console.error('Failed to save sample card customization')
            alert('Failed to save image. Please try again.')
          }
        } else if (user && currentCard.id) {
          // User's own deck - save to flashcards table
          const result = await updateFlashcardImage(currentCard.id, imageData)
          if (result) {
          } else {
            console.error('Failed to save image to database')
            alert('Failed to save image. Please try again.')
          }
        } else if (!user) {
        } else {
        }
        
        setIsAnalyzing(false)
        return
      }
      
      // For new cards without a deck context, analyze the image to get words
      // Use relative path since API route is in the same Next.js app
      const response = await fetch('/api/analyze-image', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageData }),
      })

      if (!response.ok) throw new Error("Failed to analyze image")

      const data = await response.json()
      
      // Update the cards array with new data
      const updatedCards = [...cards]
      
      updatedCards[currentCardIndex] = {
        ...updatedCards[currentCardIndex],
        english: data.englishWord,
        spanish: data.spanishTranslation,
        image: imageData, // Use the new image
      }
      
      // Update state to trigger re-render
      setCards(updatedCards)
      
      // Reset flip state to show front with new data
      setIsFlipped(false)
      
      setIsAnalyzing(false)
    } catch (error) {
      console.error("Error analyzing image:", error)
      alert("Failed to analyze image. Please try again.")
      setIsAnalyzing(false)
    }
  }
  
  const handleSignInAndSave = () => {
    setShowSignInWarning(false)
    router.push('/login')
  }

  const handleFavorite = async () => {
    // FREE LIMIT — REQUIRE PRO UPGRADE for Favorites
    if (!canUseFavorites()) {
      setUpgradeReason(primaryLanguage === 'es' 
        ? 'Favoritos es una función Pro. ¡Actualiza para guardar tus tarjetas favoritas!'
        : 'Favorites is a Pro feature. Upgrade to save your favorite cards!')
      setShowUpgradeModal(true)
      return
    }
    
    // Check if user is signed in
    if (!user) {
      // Show sign-in prompt
      if (confirm(primaryLanguage === 'es' 
        ? 'Debes iniciar sesión para agregar favoritos. ¿Ir a iniciar sesión?' 
        : 'You must sign in to add favorites. Go to sign in?')) {
        // Include current deck and card index in redirect URL
        router.push(`/login?redirect=/deck/${deckId}&cardIndex=${currentCardIndex}`)
      }
      return
    }

    const currentCard = cards[currentCardIndex]
    const previousFavoritedState = isFavorited
    
    try {
      // Optimistically update UI
      setIsFavorited(!isFavorited)
      
      let success: boolean
      
      if (previousFavoritedState) {
        // Card is currently favorited, so remove it
        success = await removeCardFromFavorites(
          currentCard.english,
          currentCard.spanish
        )
        
        // If we're viewing the Favorites deck and successfully removed the card,
        // remove it from the local cards array
        if (success && deck && deck.name === 'Favorites') {
          const updatedCards = cards.filter((_, index) => index !== currentCardIndex)
          
          if (updatedCards.length === 0) {
            // No more cards in Favorites, redirect to browse decks
            alert(primaryLanguage === 'es' 
              ? '¡No hay más tarjetas en Favoritos!' 
              : 'No more cards in Favorites!')
            
            // Invalidate decks cache before navigating
            mutateDecks()
            router.push('/my-decks')
            return
          }
          
          // Update the cards array
          setCards(updatedCards)
          
          // Adjust the current card index if needed
          if (currentCardIndex >= updatedCards.length) {
            setCurrentCardIndex(updatedCards.length - 1)
          }
          
          // Reset flip state
          setIsFlipped(false)
          
        }
      } else {
        // Card is not favorited, so add it
        // Show loading dialog immediately
        setShowFavoritingLoader(true)
        
        success = await addCardToFavorites(
          currentCard.english,
          currentCard.spanish,
          currentCard.image,
          currentCard.is_ai_generated || false
        )
      }

      if (success) {
        // Hide loading dialog
        setShowFavoritingLoader(false)
        
        // Invalidate decks cache to force refresh
        mutateDecks()
        
        // Navigate to browse-decks page to show the favorited card
        router.push('/browse-decks')
      } else {
        // Hide loading dialog
        setShowFavoritingLoader(false)
        
        // Revert on failure
        setIsFavorited(previousFavoritedState)
        
        // Show detailed error message
        const errorMsg = primaryLanguage === 'es' 
          ? 'Error al agregar a Favoritos. Revisa la consola para más detalles.' 
          : 'Failed to add to Favorites. Check console for details.'
        
        alert(errorMsg)
        console.error('[handleFavorite] FAILED - Check the [addCardToFavorites] logs above for the exact error')
      }
    } catch (error) {
      // Hide loading dialog
      setShowFavoritingLoader(false)
      
      // Revert on error
      setIsFavorited(previousFavoritedState)
      console.error('Error with favorites:', error)
      alert(primaryLanguage === 'es' 
        ? (previousFavoritedState ? 'Error al eliminar de Favoritos.' : 'Error al agregar a Favoritos.')
        : (previousFavoritedState ? 'Failed to remove from Favorites.' : 'Failed to add to Favorites.'))
    }
  }

  // Check if this is a sample deck (not editable) or special deck (Favorites, Uncategorized)
  const isSampleDeck = deckData[deckId] !== undefined
  const isSpecialDeck = rawDeckName === 'Favorites' || rawDeckName === 'Uncategorized'
  const canEditDeckName = !isSampleDeck && !isSpecialDeck && user

  return (
    <div className="min-h-screen bg-background pb-20 pt-safe">
      <FloatingNav />

      <main className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-center">
            {isEditingDeckName ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Input
                  value={editedDeckName}
                  onChange={(e) => setEditedDeckName(e.target.value)}
                  className="text-2xl font-bold text-center max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDeckName()
                    if (e.key === 'Escape') setIsEditingDeckName(false)
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveDeckName}
                  disabled={isSavingDeckName}
                >
                  {isSavingDeckName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingDeckName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{deckTitle}</h1>
                {canEditDeckName && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditedDeckName(rawDeckName)
                      setIsEditingDeckName(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-muted-foreground">
              {t.card} {currentCardIndex + 1} {t.of} {cards.length}
            </p>
          </div>

          {/* Action buttons - centered above card */}
          <div className="flex gap-2 items-center justify-center mb-4">
            <Button
              onClick={() => setShowMultiDownloadDialog(true)}
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-white shadow-lg"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleAddToDeck}
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setShowReplaceOptions(true)}
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-white shadow-lg"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-white shadow-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => handleDeleteClick(currentCardIndex, currentCard)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-8 flex justify-center items-center gap-4">
            <div 
              className="perspective-1000 group relative select-none touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className={`relative h-[500px] w-[350px] transition-transform duration-700 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Front of card */}
                <div className="absolute inset-0 border-[10px] border-black bg-white p-8 shadow-lg [backface-visibility:hidden]">
                  {/* AI Badge - only show when not flipped */}
                  {currentCard.is_ai_generated && !isFlipped && (
                    <AiBadge size={32} className="absolute left-3 top-3 z-10 pointer-events-none drop-shadow-md" />
                  )}
                  
                  {/* Favorite button - top right */}
                  <button
                    onClick={handleFavorite}
                    className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
                  >
                    <Heart className={`h-5 w-5 transition-all ${isFavorited ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                  </button>
                  
                  {/* Right swipe indicator - only on first card before first swipe */}
                  {currentCardIndex === 0 && !hasSwipedForward && cards.length > 1 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-600 animate-pulse z-10">
                      <ChevronRight className="h-10 w-10" />
                      <span className="text-xs mt-1 font-semibold">{primaryLanguage === 'es' ? 'Desliza' : 'Swipe'}</span>
                    </div>
                  )}
                  
                  {/* Left swipe indicator - only on last card */}
                  {currentCardIndex === cards.length - 1 && cards.length > 1 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-600 animate-pulse z-10">
                      <ChevronLeft className="h-10 w-10" />
                      <span className="text-xs mt-1 font-semibold">{primaryLanguage === 'es' ? 'Desliza' : 'Swipe'}</span>
                    </div>
                  )}
                  
                  <div className="flex h-full flex-col items-center justify-between">
                    <div className="flex w-full items-center justify-center gap-2 text-center">
                      {isEditingEnglish ? (
                        <Input
                          value={editedEnglish}
                          onChange={(e) => setEditedEnglish(e.target.value)}
                          onBlur={handleSaveEdit}
                          className="text-center text-4xl font-bold"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="text-balance text-4xl font-bold text-black">{frontWord}</h3>
                          <button onClick={handleEditEnglish} className="text-gray-400 hover:text-gray-600">
                            <Pencil className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={currentCard.image || "/placeholder.svg"}
                        alt={frontWord}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="w-full space-y-2">
                      <Button onClick={() => setIsFlipped(true)} variant="outline" className="w-full">
                        {frontButtonText}
                      </Button>
                      <Button 
                        onClick={() => handleSpeak(frontWord, frontLang)} 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        {frontAudioText}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className="absolute inset-0 border-[10px] border-black bg-white p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  {/* AI Badge - only show when flipped */}
                  {currentCard.is_ai_generated && isFlipped && (
                    <AiBadge size={32} className="absolute left-3 top-3 z-10 pointer-events-none drop-shadow-md" />
                  )}
                  
                  {/* Favorite button - top right */}
                  <button
                    onClick={handleFavorite}
                    className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
                  >
                    <Heart className={`h-5 w-5 transition-all ${isFavorited ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                  </button>
                  
                  {/* Right swipe indicator - only on first card before first swipe */}
                  {currentCardIndex === 0 && !hasSwipedForward && cards.length > 1 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-600 animate-pulse z-10">
                      <ChevronRight className="h-10 w-10" />
                      <span className="text-xs mt-1 font-semibold">{primaryLanguage === 'es' ? 'Desliza' : 'Swipe'}</span>
                    </div>
                  )}
                  
                  {/* Left swipe indicator - only on last card */}
                  {currentCardIndex === cards.length - 1 && cards.length > 1 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-600 animate-pulse z-10">
                      <ChevronLeft className="h-10 w-10" />
                      <span className="text-xs mt-1 font-semibold">{primaryLanguage === 'es' ? 'Desliza' : 'Swipe'}</span>
                    </div>
                  )}
                  
                  <div className="flex h-full flex-col items-center justify-between">
                    <div className="flex w-full items-center justify-center gap-2 text-center">
                      {isEditingSpanish ? (
                        <Input
                          value={editedSpanish}
                          onChange={(e) => setEditedSpanish(e.target.value)}
                          onBlur={handleSaveEdit}
                          className="text-center text-4xl font-bold"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="text-balance text-4xl font-bold text-[#8B4513]">{backWord}</h3>
                          <button onClick={handleEditSpanish} className="text-gray-400 hover:text-gray-600">
                            <Pencil className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={currentCard.image || "/placeholder.svg"}
                        alt={backWord}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="w-full space-y-2">
                      <Button onClick={() => setIsFlipped(false)} variant="outline" className="w-full">
                        {backButtonText}
                      </Button>
                      <Button 
                        onClick={() => handleSpeak(backWord, backLang)} 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        {backAudioText}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-4 items-center justify-center mb-8">
            <Button
              onClick={handlePreviousCard}
              disabled={currentCardIndex === 0}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="text-sm text-muted-foreground min-w-[60px] text-center">
              {currentCardIndex + 1} / {cards.length}
            </div>
            
            <Button
              onClick={handleNextCard}
              disabled={currentCardIndex === cards.length - 1}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </main>

      {/* Replace Image Options Dialog */}
      <Dialog open={showReplaceOptions} onOpenChange={setShowReplaceOptions}>
        <DialogContent className="max-w-md">
          <DialogTitle>Replace Image</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how you want to replace the flashcard image
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Upload from files */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="deck-image-upload"
                />
                <label
                  htmlFor="deck-image-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:bg-muted"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Upload Image
                  </p>
                </label>
              </div>

              {/* Capture from camera */}
              <button
                type="button"
                onClick={openCamera}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:bg-muted"
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Take Photo
                </p>
              </button>
            </div>

            <Button onClick={() => setShowReplaceOptions(false)} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={closeCamera}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Take a Photo</DialogTitle>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Position the object in the center</p>
            </div>

            {/* Video Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            </div>

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={closeCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={capturePhoto} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Deck Dialog */}
      <Dialog open={showAddToDeck} onOpenChange={setShowAddToDeck}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogTitle>Add to Deck</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select one or more decks to add this flashcard to
            </p>

            {/* Create New Deck Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Create New Deck</h3>
                {!isCreatingDeck && (
                  <Button onClick={handleCreateNewDeck} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                )}
              </div>
              
              {isCreatingDeck && (
                <div className="space-y-2">
                  <Input
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Enter deck name..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNewDeck} size="sm" className="flex-1">
                      <Check className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsCreatingDeck(false)
                        setNewDeckName("")
                      }} 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Decks */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Select Existing Decks</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent cursor-pointer"
                    onClick={() => handleToggleDeck(deck.id)}
                  >
                    <Checkbox
                      checked={selectedDecks.includes(deck.id)}
                      onCheckedChange={() => handleToggleDeck(deck.id)}
                    />
                    <Label className="flex-1 cursor-pointer">{deck.title}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowAddToDeck(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAddToDeck} 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={selectedDecks.length === 0 && !newDeckName.trim()}
              >
                Add to {selectedDecks.length > 0 ? `${selectedDecks.length} Deck${selectedDecks.length > 1 ? 's' : ''}` : 'Deck'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Card Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>Download Card</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download this flashcard as an image
            </p>
            
            <div className="rounded-lg border border-border p-6">
              {/* Card Preview */}
              <div className="mb-4 rounded-lg border-2 border-purple-600 p-4 text-center bg-white">
                <div className="text-3xl font-bold text-purple-600 mb-3">{currentCard?.spanish}</div>
                {currentCard?.image && (
                  <div className="relative w-40 h-40 mx-auto mb-3">
                    <Image 
                      src={currentCard.image} 
                      alt={currentCard.english} 
                      fill 
                      className="object-contain rounded"
                    />
                  </div>
                )}
                <div className="text-lg font-medium text-gray-700">{currentCard?.english}</div>
              </div>
            </div>
            
            {/* Download Button */}
            <Button 
              onClick={handleDownloadCard}
              variant="outline"
              className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download JPG
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Card Download Dialog */}
      <DownloadCardsDialog
        open={showMultiDownloadDialog}
        onOpenChange={setShowMultiDownloadDialog}
        initialDeckId={deckId}
        initialDeckName={rawDeckName}
        initialSelectedCard={
          currentCard
            ? {
                id: currentCard.id || `${deckId}-${currentCardIndex}`,
                card: {
                  id: currentCard.id || `${deckId}-${currentCardIndex}`,
                  english_word: currentCard.english,
                  spanish_word: currentCard.spanish,
                  image_url: currentCard.image,
                  is_ai_generated: currentCard.is_ai_generated,
                  user_id: '',
                  created_at: '',
                  updated_at: ''
                }
              }
            : undefined
        }
      />

      {/* Delete Card Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {((deck as any)?.name === 'Uncategorized') 
                ? (primaryLanguage === 'es' ? 'Eliminar Tarjeta Permanentemente' : 'Delete Card Permanently')
                : (primaryLanguage === 'es' ? 'Mover a Sin Categorizar' : 'Move to Uncategorized')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deckData[deckId] ? (
                // Sample deck
                primaryLanguage === 'es' ? (
                  <>
                    "{cardToDelete?.card?.english}" se moverá al mazo Sin Categorizar donde puedes eliminarlo permanentemente.
                  </>
                ) : (
                  <>
                    "{cardToDelete?.card?.english}" will be moved to the Uncategorized deck where you can permanently delete it.
                  </>
                )
              ) : (deck as any)?.name === 'Uncategorized' ? (
                // Uncategorized deck - permanent delete
                primaryLanguage === 'es' ? (
                  <>
                    ¿Estás seguro de que deseas eliminar permanentemente "{cardToDelete?.card?.english}"?
                    <span className="block mt-2 font-semibold text-foreground">Esta acción no se puede deshacer.</span>
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete "{cardToDelete?.card?.english}"? 
                    <span className="block mt-2 font-semibold text-foreground">This action cannot be undone.</span>
                  </>
                )
              ) : (
                // Favorites or custom deck
                primaryLanguage === 'es' ? (
                  <>
                    "{cardToDelete?.card?.english}" se moverá al mazo Sin Categorizar donde puedes eliminarlo permanentemente.
                  </>
                ) : (
                  <>
                    "{cardToDelete?.card?.english}" will be moved to the Uncategorized deck where you can permanently delete it.
                  </>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{primaryLanguage === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={(deck as any)?.name === 'Uncategorized' ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
            >
              {(deck as any)?.name === 'Uncategorized' 
                ? (primaryLanguage === 'es' ? 'Eliminar Permanentemente' : 'Delete Permanently')
                : (primaryLanguage === 'es' ? 'Mover a Sin Categorizar' : 'Move to Uncategorized')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sign In Warning Dialog */}
      <AlertDialog open={showSignInWarning} onOpenChange={setShowSignInWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in required</AlertDialogTitle>
            <AlertDialogDescription>
              You must be signed in to replace images. Please sign in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignInAndSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Favoriting Loader Dialog */}
      <Dialog open={showFavoritingLoader} onOpenChange={setShowFavoritingLoader}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Adding to Favorites</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <GemLoader size={80} />
            <p className="text-lg font-medium text-center text-foreground">
              {primaryLanguage === 'es' 
                ? 'Agregando Memz a Favoritos...' 
                : 'Adding Memz to Favorites...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keep or Delete Empty Deck Dialog */}
      <AlertDialog open={showKeepDeckDialog} onOpenChange={setShowKeepDeckDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {primaryLanguage === 'es' ? '¿Mantener este mazo?' : 'Keep this deck?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {primaryLanguage === 'es' 
                ? 'Has eliminado la última tarjeta de este mazo. ¿Quieres mantener el mazo vacío o eliminarlo?'
                : "You've deleted the last card in this deck. Would you like to keep the empty deck or delete it?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleDeleteEmptyDeck} className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
              {primaryLanguage === 'es' ? 'No, eliminar mazo' : 'No, delete deck'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleKeepDeck} className="bg-purple-600 hover:bg-purple-700">
              {primaryLanguage === 'es' ? 'Mantener mazo' : 'Keep Deck'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
