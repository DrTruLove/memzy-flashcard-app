"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, Loader2, ChevronDown } from "lucide-react"
import { getDeckWithCards } from "@/lib/database"
import { useDecks } from "@/lib/decks-context"
import type { DeckWithCards, Flashcard } from "@/lib/database"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GemLoader } from "@/components/gem-loader"

interface DownloadCardsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelectedCard?: { id: string; card: Flashcard }
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

export function DownloadCardsDialog({ open, onOpenChange, initialSelectedCard }: DownloadCardsDialogProps) {
  const { primaryLanguage } = useLanguage()
  const { decks: contextDecks } = useDecks()
  
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
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  // Pre-select the initial card if provided
  const [hasInitialized, setHasInitialized] = useState(false)
  
  useEffect(() => {
    if (open && !hasInitialized) {
      if (initialSelectedCard) {
        setSelectedCards(new Map([[initialSelectedCard.id, initialSelectedCard.card]]))
      }
      setHasInitialized(true)
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false)
    }
  }, [initialSelectedCard, open, hasInitialized])

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

  const handleToggleCard = (card: Flashcard) => {
    setSelectedCards(prev => {
      const newMap = new Map(prev)
      if (newMap.has(card.id)) {
        newMap.delete(card.id)
      } else {
        if (newMap.size < 8) {
          newMap.set(card.id, card)
        } else {
          alert("Maximum 8 cards can be selected")
        }
      }
      return newMap
    })
  }

  const handleDownload = async () => {
    if (selectedCards.size === 0) {
      alert("Please select at least one card to download")
      return
    }

    setIsDownloading(true)

    try {
      const selectedCardData = Array.from(selectedCards.values())
      
      await downloadAsJPG(selectedCardData)
      
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

    const cols = 4
    const rows = 2
    // Add proper printing margins (0.5 inch on all sides = 75px at 150 DPI)
    const printMargin = 75
    const usableWidth = canvas.width - (printMargin * 2)
    const usableHeight = canvas.height - (printMargin * 2)
    const gap = 20
    const cardWidth = (usableWidth - (gap * (cols - 1))) / cols
    const cardHeight = (usableHeight - (gap * (rows - 1))) / rows

    // Load and draw each card (up to 8 cards)
    for (let i = 0; i < Math.min(cards.length, 8); i++) {
      const card = cards[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = printMargin + col * (cardWidth + gap)
      const y = printMargin + row * (cardHeight + gap)

      // Draw card border (purple to match app colors)
      ctx.strokeStyle = '#8B2FFB'
      ctx.lineWidth = 10
      ctx.strokeRect(x, y, cardWidth, cardHeight)

      // Draw AI badge if card is AI-generated
      if (card.is_ai_generated) {
        const badgeSize = 28
        const badgeX = x + 12
        const badgeY = y + 12
        
        ctx.save()
        ctx.translate(badgeX + badgeSize/2, badgeY + badgeSize/2)
        ctx.rotate(-45 * Math.PI / 180)
        
        // Draw purple diamond
        ctx.fillStyle = '#9333ea'
        ctx.beginPath()
        ctx.moveTo(0, -badgeSize/2)
        ctx.lineTo(badgeSize/2, 0)
        ctx.lineTo(0, badgeSize/2)
        ctx.lineTo(-badgeSize/2, 0)
        ctx.closePath()
        ctx.fill()
        
        // Draw white sparkle
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✦', 0, 0)
        
        ctx.restore()
      }

      // Calculate layout with proper spacing between elements
      const contentPadding = 30
      const topTextArea = 50 // Space for Spanish word
      const bottomTextArea = 50 // Space for English word
      const verticalGap = 15 // Gap above and below image
      const availableImageHeight = cardHeight - contentPadding - topTextArea - (verticalGap * 2) - bottomTextArea - contentPadding
      
      // Draw Spanish word at top
      ctx.fillStyle = '#9333ea'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const spanishY = y + contentPadding
      ctx.fillText(card.spanish_word, x + cardWidth / 2, spanishY)

      // Calculate image area - positioned after Spanish word with gap
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
      
      // Always draw English word at bottom (regardless of image success)
      ctx.fillStyle = '#1f2937'
      ctx.font = '500 26px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const englishY = y + cardHeight - contentPadding
      ctx.fillText(card.english_word, x + cardWidth / 2, englishY)
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
                              onClick={() => handleToggleCard(card)}
                            >
                              <Checkbox
                                checked={selectedCards.has(card.id)}
                                onCheckedChange={() => handleToggleCard(card)}
                              />
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
