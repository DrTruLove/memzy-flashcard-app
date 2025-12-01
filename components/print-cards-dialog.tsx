"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, Loader2, ChevronDown, Crown } from "lucide-react"
import { getDeckWithCards } from "@/lib/database"
import { useDecks } from "@/lib/decks-context"
import type { DeckWithCards, Flashcard } from "@/lib/database"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"
import { useSubscription } from "@/lib/subscription-context"
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GemLoader } from "@/components/gem-loader"

interface DownloadCardsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelectedCard?: { id: string; card: Flashcard }
  initialDeckId?: string
  initialDeckName?: string
}

interface Deck {
  id: string
  name: string
  isUserDeck: boolean
}

// Sample deck IDs and names
const sampleDecks = [
  { id: "common-objects", name: "Common Objects", nameEs: "Objetos Comunes", isUserDeck: false },
  { id: "animals", name: "Animals", nameEs: "Animales", isUserDeck: false },
  { id: "food-drinks", name: "Food & Drinks", nameEs: "Comida y Bebidas", isUserDeck: false },
  { id: "body-parts", name: "Body Parts", nameEs: "Partes del Cuerpo", isUserDeck: false },
  { id: "colors-shapes", name: "Colors & Shapes", nameEs: "Colores y Formas", isUserDeck: false },
]

interface DeckWithAllCards extends Deck {
  cards: Flashcard[]
  loading: boolean
}

export function DownloadCardsDialog({ open, onOpenChange, initialSelectedCard, initialDeckId, initialDeckName }: DownloadCardsDialogProps) {
  const { primaryLanguage } = useLanguage()
  const { decks: contextDecks } = useDecks()
  
  // FREE LIMIT — SUBSCRIPTION HOOK for export gating
  const { 
    canExport, 
    incrementExports, 
    setShowUpgradeModal, 
    setUpgradeReason,
    isFreeUser,
    usage,
    freeExportLimit,
  } = useSubscription()
  
  // Translation strings
  const t = {
    downloadCards: primaryLanguage === 'es' ? 'Descargar Tarjetas' : 'Download Cards',
    selectCards: primaryLanguage === 'es' ? 'Seleccionar tarjetas para descargar' : 'Select cards to download',
    yourDecks: primaryLanguage === 'es' ? 'Mis Mazos' : 'My Decks',
    sampleDecks: primaryLanguage === 'es' ? 'Mazos de Muestra' : 'Sample Decks',
    selectAll: primaryLanguage === 'es' ? 'Seleccionar Todas' : 'Select All',
    deselectAll: primaryLanguage === 'es' ? 'Deseleccionar Todas' : 'Deselect All',
    cardsSelected: (count: number) => primaryLanguage === 'es' 
      ? `${count} tarjeta${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`
      : `${count} card${count !== 1 ? 's' : ''} selected`,
    downloadFormat: primaryLanguage === 'es' ? 'Formato de Descarga' : 'Download Format',
    cancel: primaryLanguage === 'es' ? 'Cancelar' : 'Cancel',
    download: primaryLanguage === 'es' ? 'Descargar' : 'Download',
    downloading: primaryLanguage === 'es' ? 'Descargando...' : 'Downloading...',
    noCardsSelected: primaryLanguage === 'es' ? 'No hay tarjetas seleccionadas' : 'No cards selected',
    cards: primaryLanguage === 'es' ? 'tarjetas' : 'cards',
  }
  
  const [allDecksWithCards, setAllDecksWithCards] = useState<DeckWithAllCards[]>([])
  const [selectedCards, setSelectedCards] = useState<Map<string, Flashcard>>(new Map())
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null) // Track which deck cards come from
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  // Pre-select the initial card if provided
  const [hasInitialized, setHasInitialized] = useState(false)
  
  useEffect(() => {
    if (open && !hasInitialized) {
      if (initialSelectedCard) {
        setSelectedCards(new Map([[initialSelectedCard.id, initialSelectedCard.card]]))
      }
      if (initialDeckId) {
        setSelectedDeckId(initialDeckId)
      }
      setHasInitialized(true)
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false)
      setSelectedDeckId(null) // Reset selected deck when closing
    }
  }, [initialSelectedCard, initialDeckId, open, hasInitialized])

  // Load all decks with their cards
  useEffect(() => {
    const loadAllDecksWithCards = async () => {
      setLoading(true)
      
      // Load user decks from context
      const userDecksWithCards: DeckWithAllCards[] = await Promise.all(
        contextDecks.map(async (d) => {
          const deck = await getDeckWithCards(d.id)
          return {
            id: d.id,
            name: d.name,
            isUserDeck: true,
            cards: deck?.cards || [],
            loading: false
          }
        })
      )
      
      // Load sample decks
      const sampleDecksWithCards: DeckWithAllCards[] = sampleDecks.map((d) => {
        const sampleDeckData = getSampleDeckData(d.id)
        const cards = sampleDeckData?.cards.map((card: any, index: number) => ({
          id: `${d.id}-${index}`,
          english_word: card.english,
          spanish_word: card.spanish,
          image_url: card.image,
          user_id: '',
          created_at: '',
          updated_at: ''
        })) || []
        
        return {
          ...d,
          cards,
          loading: false
        }
      })
      
      setAllDecksWithCards([...userDecksWithCards, ...sampleDecksWithCards])
      setLoading(false)
    }
    
    if (open) {
      loadAllDecksWithCards()
    }
  }, [open, contextDecks])
  
  // Helper function to get sample deck data
  const getSampleDeckData = (deckId: string) => {
    const sampleDeckData: Record<string, { title: string; cards: Array<{ english: string; spanish: string; image: string }> }> = {
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
      "body-parts": {
        title: "Body Parts",
        cards: [
          { english: "Head", spanish: "Cabeza", image: "/body-head.jpg" },
          { english: "Eye", spanish: "Ojo", image: "/body-eye.jpg" },
          { english: "Nose", spanish: "Nariz", image: "/body-nose.jpg" },
          { english: "Mouth", spanish: "Boca", image: "/body-mouth.jpg" },
          { english: "Ear", spanish: "Oreja", image: "/body-ear.jpg" },
          { english: "Hand", spanish: "Mano", image: "/body-hand.jpg" },
          { english: "Foot", spanish: "Pie", image: "/body-foot.jpg" },
          { english: "Leg", spanish: "Pierna", image: "/body-leg.jpg" },
          { english: "Hair", spanish: "Cabello", image: "/body-hair.jpg" },
          { english: "Teeth", spanish: "Dientes", image: "/body-teeth.jpg" },
          { english: "Tongue", spanish: "Lengua", image: "/body-tongue.jpg" },
          { english: "Neck", spanish: "Cuello", image: "/body-neck.jpg" },
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
    return sampleDeckData[deckId]
  }

  const handleToggleCard = (card: Flashcard, deckId: string) => {
    setSelectedCards(prev => {
      const newMap = new Map(prev)
      if (newMap.has(card.id)) {
        newMap.delete(card.id)
        // If no cards left, clear the selected deck
        if (newMap.size === 0) {
          setSelectedDeckId(null)
        }
      } else {
        if (newMap.size < 8) {
          newMap.set(card.id, card)
          // Track which deck the cards are from
          setSelectedDeckId(deckId)
        } else {
          alert("Maximum 8 cards can be selected")
        }
      }
      return newMap
    })
  }

  // Get the selected deck info for the header
  const getSelectedDeckInfo = () => {
    if (!selectedDeckId) return null
    const deck = allDecksWithCards.find(d => d.id === selectedDeckId)
    
    // Use deck name from loaded decks, or fall back to initialDeckName
    const deckName = deck?.name || initialDeckName || 'Deck'
    const isUserDeck = deck?.isUserDeck ?? true // Assume user deck if not found
    
    // Find sample deck for Spanish name
    const sampleDeck = sampleDecks.find(s => s.id === selectedDeckId)
    
    // For sample decks, use the predefined Spanish name
    // For user decks, we'll need to translate dynamically
    return {
      name: deckName,
      nameEs: sampleDeck?.nameEs || null, // null for user decks - will trigger translation
      isUserDeck: isUserDeck
    }
  }

  const handleDownload = async () => {
    if (selectedCards.size === 0) {
      alert("Please select at least one card to download")
      return
    }

    // FREE LIMIT — REQUIRE PRO UPGRADE for multiple downloads
    if (!canExport()) {
      setUpgradeReason(primaryLanguage === 'es' 
        ? 'Ya usaste tu descarga gratis. ¡Actualiza a Pro para descargas ilimitadas!'
        : 'You\'ve used your free download. Upgrade to Pro for unlimited downloads!')
      setShowUpgradeModal(true)
      onOpenChange(false) // Close the dialog
      return
    }

    setIsDownloading(true)

    try {
      const selectedCardData = Array.from(selectedCards.values())
      
      await downloadAsJPG(selectedCardData)
      
      // FREE LIMIT — INCREMENT EXPORT COUNT on successful download
      await incrementExports()
      
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download cards: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsDownloading(false)
    }
  }

    // Helper function to load images with timeout and retry
  const loadImage = (src: string, retryCount = 0): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      
      // Add longer timeout for mobile networks
      const timeout = setTimeout(() => {
        console.error('Image load timeout:', src, 'retry:', retryCount)
        if (retryCount < 2) {
          // Retry up to 2 times
          resolve(loadImage(src, retryCount + 1))
        } else {
          reject(new Error('Image load timeout after retries'))
        }
      }, 15000) // 15 second timeout
      
      img.onload = () => {
        clearTimeout(timeout)
        resolve(img)
      }
      img.onerror = (error: any) => {
        clearTimeout(timeout)
        console.error('Image load error:', src, error, 'retry:', retryCount)
        if (retryCount < 2) {
          // Retry on error
          setTimeout(() => {
            resolve(loadImage(src, retryCount + 1))
          }, 1000) // Wait 1 second before retry
        } else {
          reject(error)
        }
      }
      img.src = src
    })
  }

  const downloadAsJPG = async (cards: Flashcard[]) => {
    // Create a canvas to render the cards
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for landscape (11 x 8.5 inches at 150 DPI) - 4 columns, 2 rows
    const dpi = 150
    canvas.width = 11 * dpi  // 1650px (landscape)
    canvas.height = 8.5 * dpi  // 1275px

    // Fill white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Get deck info for header
    const deckInfo = getSelectedDeckInfo()

    const cols = 4
    const rows = 2
    // Add proper printing margins (0.5 inch on all sides = 75px at 150 DPI)
    const printMargin = 75
    const headerHeight = deckInfo ? 50 : 0 // Space for deck title
    const footerHeight = 35 // Space for single Memzy footer at bottom
    const usableWidth = canvas.width - (printMargin * 2)
    const usableHeight = canvas.height - (printMargin * 2) - headerHeight - footerHeight
    const gap = 20
    const cardWidth = (usableWidth - (gap * (cols - 1))) / cols
    const cardHeight = (usableHeight - (gap * (rows - 1))) / rows

    // Load Memzy logo once for all cards
    let logoImg: HTMLImageElement | null = null
    try {
      logoImg = await loadImage('/memzy-logo.png')
    } catch (err) {
      console.error('Failed to load Memzy logo:', err)
    }

    // Draw deck title header if we have deck info
    if (deckInfo) {
      ctx.fillStyle = '#8B2FFB' // purple
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      // Get Spanish translation for the deck name
      let spanishName = deckInfo.nameEs
      
      // For user decks (no preset Spanish name), translate the deck name
      if (!spanishName && deckInfo.isUserDeck) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: deckInfo.name, targetLang: 'es' })
          })
          if (response.ok) {
            const data = await response.json()
            spanishName = data.translation
          }
        } catch (err) {
          console.error('Failed to translate deck name:', err)
        }
      }
      
      // Format: "Animals / Animales" - always show both languages
      let titleText = ''
      if (spanishName && spanishName !== deckInfo.name) {
        // Show English / Spanish format
        titleText = `${deckInfo.name} / ${spanishName}`
      } else {
        // Fallback to just the name if translation failed or same
        titleText = deckInfo.name
      }
      
      ctx.fillText(titleText, canvas.width / 2, printMargin)
    }

    // Determine words based on primary language
    // If primary is English: English (small) at top, Spanish (large, purple) at bottom
    // If primary is Spanish: Spanish (small) at top, English (large, purple) at bottom
    const getTopWord = (card: Flashcard) => primaryLanguage === 'en' ? card.english_word : card.spanish_word
    const getBottomWord = (card: Flashcard) => primaryLanguage === 'en' ? card.spanish_word : card.english_word

    // Load and draw each card (up to 8 cards)
    for (let i = 0; i < Math.min(cards.length, 8); i++) {
      const card = cards[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = printMargin + col * (cardWidth + gap)
      const y = printMargin + headerHeight + row * (cardHeight + gap)

      // Draw card border (purple to match app colors)
      ctx.strokeStyle = '#8B2FFB'
      ctx.lineWidth = 10
      ctx.strokeRect(x, y, cardWidth, cardHeight)

      // Draw AI badge if card is AI-generated (check for truthy value)
      // User-created cards from AI analysis will have is_ai_generated === true
      const isAiGenerated = card.is_ai_generated === true
      if (isAiGenerated && logoImg) {
        const badgeSize = 32
        const badgeX = x + 12
        const badgeY = y + 12
        ctx.drawImage(logoImg, badgeX, badgeY, badgeSize, badgeSize)
      }

      // Calculate layout with proper spacing between elements
      const contentPadding = 30
      const topTextArea = 35 // Space for smaller primary word
      const bottomTextArea = 55 // Space for larger translated word
      const verticalGap = 12 // Gap above and below image
      const availableImageHeight = cardHeight - contentPadding - topTextArea - (verticalGap * 2) - bottomTextArea - contentPadding
      
      // Draw primary language word at top (smaller, black, not bold)
      ctx.fillStyle = '#374151' // gray-700
      ctx.font = '22px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const topWordY = y + contentPadding
      ctx.fillText(getTopWord(card), x + cardWidth / 2, topWordY)

      // Calculate image area - positioned after top word with gap
      const imageAreaTop = y + contentPadding + topTextArea + verticalGap
      const imageAreaWidth = cardWidth - 80 // More horizontal padding
      
      // Try to load and draw image
      let imageDrawn = false
      if (card.image_url) {
        try {
          const img = await loadImage(card.image_url)
          
          // Calculate image size to fit available space while maintaining aspect ratio
          const imgAspect = img.width / img.height
          let imgWidth = imageAreaWidth
          let imgHeight = imgWidth / imgAspect
          
          // If height is too big, scale by height instead
          if (imgHeight > availableImageHeight) {
            imgHeight = availableImageHeight
            imgWidth = imgHeight * imgAspect
          }
          
          // Center the image horizontally within the card
          const imgX = x + (cardWidth - imgWidth) / 2
          // Center the image vertically within available image space
          const imgY = imageAreaTop + (availableImageHeight - imgHeight) / 2
          
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
          imageDrawn = true
        } catch (err) {
          console.error(`Failed to load image for card ${i}:`, card.image_url, err)
          
          // Draw error indicator in center of image area
          ctx.fillStyle = '#ef4444'
          ctx.font = '16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('(Image failed to load)', x + cardWidth / 2, imageAreaTop + availableImageHeight / 2)
        }
      }
      
      // Draw translated word at bottom (larger, purple, bold)
      ctx.fillStyle = '#9333ea' // purple-600
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const bottomWordY = y + cardHeight - contentPadding
      ctx.fillText(getBottomWord(card), x + cardWidth / 2, bottomWordY)
    }

    // Draw single Memzy footer at bottom of page (centered)
    if (logoImg) {
      ctx.globalAlpha = 0.5
      const footerY = canvas.height - printMargin + 25 // Push footer further down, closer to page edge
      const footerLogoSize = 24
      
      // Calculate footer width
      ctx.font = 'bold 18px Arial'
      const footerText = 'Created with Memzy'
      const footerTextWidth = ctx.measureText(footerText).width
      const totalFooterWidth = footerLogoSize + 8 + footerTextWidth
      const footerStartX = (canvas.width - totalFooterWidth) / 2
      
      // Apply grayscale effect to logo
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = footerLogoSize
      tempCanvas.height = footerLogoSize
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.filter = 'grayscale(100%)'
        tempCtx.drawImage(logoImg, 0, 0, footerLogoSize, footerLogoSize)
        ctx.drawImage(tempCanvas, footerStartX, footerY - footerLogoSize + 4, footerLogoSize, footerLogoSize)
      }
      
      // Draw "Created with Memzy" text
      ctx.fillStyle = '#6b7280' // gray-500
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(footerText, footerStartX + footerLogoSize + 8, footerY)
      
      ctx.globalAlpha = 1.0
    }

    // Download as JPG - use native sharing on mobile
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      // Check if we're on a native platform (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        try {
          // Convert blob to base64
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64Data = reader.result as string
            const base64String = base64Data.split(',')[1]
            
            // Save to temporary file
            const fileName = `flashcards-${Date.now()}.jpg`
            const result = await Filesystem.writeFile({
              path: fileName,
              data: base64String,
              directory: Directory.Cache
            })
            
            // Share the file
            await Share.share({
              title: 'Flashcards',
              text: 'Check out these flashcards!',
              url: result.uri,
              dialogTitle: 'Save or Share Flashcards'
            })
          }
          reader.readAsDataURL(blob)
        } catch (error) {
          console.error('Error sharing file:', error)
          alert('Failed to save file. Please try again.')
        }
      } else {
        // Web browser - use traditional download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flashcards-${Date.now()}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogTitle>{t.downloadCards}</DialogTitle>
        
        {/* Sticky Header with Buttons */}
        <div className="sticky top-0 z-10 bg-background pb-4 border-b space-y-4">
          <p className="text-sm text-muted-foreground">
            {primaryLanguage === 'es' 
              ? 'Selecciona hasta 8 tarjetas para descargar como JPG'
              : 'Select up to 8 cards to download as JPG'}
          </p>

          {/* FREE LIMIT — Show remaining exports for free users */}
          {isFreeUser && (
            <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2">
              <span className="text-xs text-purple-700 dark:text-purple-400">
                {primaryLanguage === 'es' 
                  ? `Descargas gratis: ${freeExportLimit - usage.exportsUsed}/${freeExportLimit} restantes`
                  : `Free downloads: ${freeExportLimit - usage.exportsUsed}/${freeExportLimit} remaining`}
              </span>
              {usage.exportsUsed >= freeExportLimit && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                  <Crown className="w-3 h-3" />
                  {primaryLanguage === 'es' ? 'Actualiza a Pro' : 'Upgrade to Pro'}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons - Moved to Top */}
          <div className="flex gap-3">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              {t.cancel}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={selectedCards.size === 0 || selectedCards.size > 8 || isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.downloading}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t.download} {selectedCards.size} {t.cardsSelected(selectedCards.size).split(' ').slice(1).join(' ')} {primaryLanguage === 'es' ? 'como JPG' : 'as JPG'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4">

          {/* Cards Selection from All Decks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>
                {primaryLanguage === 'es' ? 'Seleccionar Tarjetas' : 'Select Cards'} ({selectedCards.size}/8)
              </Label>
              {selectedCards.size > 0 && (
                <Button
                  onClick={() => setSelectedCards(new Map())}
                  variant="ghost"
                  size="sm"
                >
                  {primaryLanguage === 'es' ? 'Limpiar Todas' : 'Clear All'}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <GemLoader size={48} />
              </div>
            ) : (
              <Accordion type="multiple" className="max-h-96 overflow-y-auto border border-border rounded-lg">
                {allDecksWithCards.map(deck => (
                  <AccordionItem key={deck.id} value={deck.id}>
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-semibold text-sm text-purple-600">{deck.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({deck.isUserDeck ? 'My Deck' : 'Sample'}) • {deck.cards.length} cards
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {deck.cards.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No cards in this deck</p>
                      ) : (
                        <div className="space-y-2">
                          {deck.cards.map(card => (
                            <div
                              key={card.id}
                              className="flex items-center space-x-3 rounded-lg border border-border p-2 hover:bg-accent cursor-pointer"
                              onClick={() => handleToggleCard(card, deck.id)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedCards.has(card.id)}
                                  onCheckedChange={() => handleToggleCard(card, deck.id)}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm">{card.english_word}</div>
                                <div className="text-xs text-muted-foreground truncate">{card.spanish_word}</div>
                              </div>
                              {card.image_url && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <Image
                                    src={card.image_url}
                                    alt={card.english_word}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
