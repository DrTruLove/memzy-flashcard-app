"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FloatingNav } from "@/components/floating-nav"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { ChevronRight, Upload, Camera, X, Loader2, Plus, Check, Save, Trash2, Download, Volume2, Settings, BookOpen, Sparkles, ImageIcon, Pencil, Heart, Crown, FlipHorizontal2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createFlashcard, createDeck, addCardToDecks, deleteFlashcard, addCardToFavorites, removeCardFromFavorites, isCardInFavorites } from "@/lib/database"
import { useDecks } from "@/lib/decks-context"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { DownloadCardsDialog } from "@/components/print-cards-dialog"
import { useLanguage } from "@/lib/language-context"
import { useSubscription } from "@/lib/subscription-context"
import { FreeUsageIndicator, UpgradeRequiredBadge } from "@/components/upgrade-modal"
import AiBadge from "@/components/ai-badge"
import MemzyLogo from "@/components/memzy-logo"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { GemLoader } from "@/components/gem-loader"

// Dynamically import Capacitor modules to avoid SSR issues
let CapacitorCamera: any, CameraResultType: any, CameraSource: any, CameraDirection: any, Capacitor: any, TextToSpeech: any

if (typeof window !== 'undefined') {
  import('@capacitor/camera').then(module => {
    CapacitorCamera = module.Camera
    CameraResultType = module.CameraResultType
    CameraSource = module.CameraSource
    CameraDirection = module.CameraDirection
  })
  import('@capacitor/core').then(module => {
    Capacitor = module.Capacitor
  })
  import('@capacitor-community/text-to-speech').then(module => {
    TextToSpeech = module.TextToSpeech
  })
}

export default function MemzyPage() {
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const { decks: contextDecks, mutate: mutateDecks } = useDecks()
  
  // FREE LIMIT — SUBSCRIPTION HOOK
  const { 
    isFreeUser, 
    canCreateCard, 
    incrementCreatedCards,
    canUseFavorites,
    canCreateDeck,
    incrementDecks,
    setShowUpgradeModal,
    setUpgradeReason,
    getRemainingFreeCards,
  } = useSubscription()
  
  // Translation strings
  const t = {
    tutorial: primaryLanguage === 'es' ? 'Tutorial' : 'Tutorial',
    tagline: primaryLanguage === 'es' 
      ? '¡Crea tarjetas significativas de español e inglés que tu memoria amará!' 
      : 'Create meaningful Spanish & English flashcards your memory will love!',
    memzOfTheDay: primaryLanguage === 'es' ? 'Memz del Día' : 'Memz of the Day',
    uploadImage: primaryLanguage === 'es' ? 'Subir Imagen' : 'Upload Image',
    takePhoto: primaryLanguage === 'es' ? 'Tomar Foto' : 'Take Photo',
    analyzingImage: primaryLanguage === 'es' ? 'Analizando imagen...' : 'Analyzing image...',
    analyzing: primaryLanguage === 'es' ? 'Analizando...' : 'Analyzing...',
    addToDeck: primaryLanguage === 'es' ? 'Agregar al Mazo' : 'Add to Deck',
    downloadCards: primaryLanguage === 'es' ? 'Descargar Tarjetas' : 'Download Cards',
    replaceImage: primaryLanguage === 'es' ? 'Reemplazar Imagen' : 'Replace Image',
    deleteCard: primaryLanguage === 'es' ? 'Eliminar' : 'Delete',
    sampleDecks: primaryLanguage === 'es' ? 'Mazos de Muestra' : 'Sample Decks',
    browseAllDecks: primaryLanguage === 'es' ? 'Ver Todos los Mazos' : 'Browse All Decks',
    createNewDeck: primaryLanguage === 'es' ? 'Crear Nuevo Mazo' : 'Create New Deck',
    deckName: primaryLanguage === 'es' ? 'Nombre del Mazo' : 'Deck Name',
    create: primaryLanguage === 'es' ? 'Crear' : 'Create',
    creating: primaryLanguage === 'es' ? 'Creando...' : 'Creating...',
    cancel: primaryLanguage === 'es' ? 'Cancelar' : 'Cancel',
    selectDecks: primaryLanguage === 'es' ? 'Seleccionar Mazos' : 'Select Decks',
    save: primaryLanguage === 'es' ? 'Guardar' : 'Save',
    saving: primaryLanguage === 'es' ? 'Guardando...' : 'Saving...',
    orCreateNew: primaryLanguage === 'es' ? 'O crear nuevo mazo' : 'Or create new deck',
    cards: primaryLanguage === 'es' ? 'tarjetas' : 'cards',
    welcomeTitle: primaryLanguage === 'es' ? '¡Bienvenido a Memzy! 🎉' : 'Welcome to Memzy! 🎉',
    welcomeDesc: primaryLanguage === 'es'
      ? 'Crea hermosas tarjetas educativas inglés-español con reconocimiento de imagen con IA en solo unos simples pasos.'
      : 'Create beautiful English-Spanish flashcards with AI-powered image recognition in just a few simple steps.',
    step1Title: primaryLanguage === 'es' ? 'Paso 1: Sube una Imagen' : 'Step 1: Upload an Image',
    step1Desc: primaryLanguage === 'es'
      ? 'Haz clic en el área de carga o arrastra y suelta una imagen que represente la palabra que quieres aprender.'
      : 'Click the upload area or drag and drop an image that represents the word you want to learn.',
    uploadFromFiles: primaryLanguage === 'es' ? 'Subir desde archivos' : 'Upload from files',
    takeAPhoto: primaryLanguage === 'es' ? 'Tomar una foto' : 'Take a photo',
    dragAndDrop: primaryLanguage === 'es' ? 'Arrastra y suelta' : 'Drag and drop',
    step2Title: primaryLanguage === 'es' ? 'Paso 2: IA Analiza tu Imagen' : 'Step 2: AI Analyzes Your Image',
    step2Desc: primaryLanguage === 'es'
      ? 'Nuestra IA detectará automáticamente qué hay en tu imagen e identificará la palabra o frase en inglés.'
      : 'Our AI will automatically detect what\'s in your image and identify the English word or phrase.',
    step3Title: primaryLanguage === 'es' ? 'Paso 3: Traducción Instantánea' : 'Step 3: Instant Translation',
    step3Desc: primaryLanguage === 'es'
      ? 'La traducción al español se genera automáticamente, ¡pero puedes editarla si lo deseas!'
      : 'The Spanish translation is automatically generated, but you can edit it if you want!',
    step4Title: primaryLanguage === 'es' ? 'Paso 4: ¡Estudia y Aprende!' : 'Step 4: Study & Learn!',
    step4Desc: primaryLanguage === 'es'
      ? 'Revisa tus tarjetas, organízalas en mazos y domina tu vocabulario. ¡El aprendizaje nunca había sido tan fácil!'
      : 'Review your cards, organize them into decks, and master your vocabulary. Learning has never been easier!',
    getStarted: primaryLanguage === 'es' ? '¡Empezar!' : 'Get Started',
    next: primaryLanguage === 'es' ? 'Siguiente' : 'Next',
    skip: primaryLanguage === 'es' ? 'Saltar' : 'Skip',
    aiImageRecognition: primaryLanguage === 'es' ? 'Reconocimiento de imagen con IA' : 'AI image recognition',
    instantDetection: primaryLanguage === 'es' ? 'Detección instantánea' : 'Instant detection',
    accurateIdentification: primaryLanguage === 'es' ? 'Identificación precisa' : 'Accurate identification',
    englishDetected: primaryLanguage === 'es' ? 'Inglés detectado' : 'English detected',
    spanishTranslation: primaryLanguage === 'es' ? 'Traducción al español' : 'Spanish translation',
    readyToSave: primaryLanguage === 'es' ? 'Listo para guardar' : 'Ready to save',
    beautifulDesign: primaryLanguage === 'es' ? 'Diseño hermoso' : 'Beautiful design',
    flipToReveal: primaryLanguage === 'es' ? 'Voltear para revelar' : 'Flip to reveal',
    saveToDecks: primaryLanguage === 'es' ? 'Guardar en mazos' : 'Save to decks',
    step4ViewTitle: primaryLanguage === 'es' ? 'Paso 4: Ve tu Tarjeta' : 'Step 4: View Your Flashcard',
    step4ViewDesc: primaryLanguage === 'es'
      ? '¡Ve tu hermosa tarjeta con la imagen, palabra en inglés y traducción al español lista para usar!'
      : 'See your beautiful flashcard with the image, English word, and Spanish translation ready to use!',
    createAnother: primaryLanguage === 'es' ? 'Crear Otra' : 'Create Another',
    download: primaryLanguage === 'es' ? 'Descargar' : 'Download',
    retakePhoto: primaryLanguage === 'es' ? 'Retomar Foto' : 'Retake Photo',
    english: primaryLanguage === 'es' ? 'Inglés' : 'English',
    spanish: primaryLanguage === 'es' ? 'Español' : 'Spanish',
    enterEnglishWord: primaryLanguage === 'es' ? 'Ingresa palabra en inglés' : 'Enter English word',
    regenerating: primaryLanguage === 'es' ? 'Regenerando...' : 'Regenerating...',
    saveAndTranslate: primaryLanguage === 'es' ? 'Guardar y Traducir' : 'Save & Translate',
    takeAPhotoTitle: primaryLanguage === 'es' ? 'Tomar una Foto' : 'Take a Photo',
    positionObject: primaryLanguage === 'es' ? 'Posiciona el objeto en el centro' : 'Position the object in the center',
    capturePhoto: primaryLanguage === 'es' ? 'Capturar Foto' : 'Capture Photo',
    downloadOrSaveCard: primaryLanguage === 'es' ? 'Descargar o Guardar Tarjeta' : 'Download or Save Card',
    downloadCard: primaryLanguage === 'es' ? 'Descargar Tarjeta' : 'Download Card',
    saveToDeck: primaryLanguage === 'es' ? 'Guardar en Mazo' : 'Save to Deck',
    selectOneOrMore: primaryLanguage === 'es' 
      ? 'Selecciona uno o más mazos para agregar esta tarjeta'
      : 'Select one or more decks to add this flashcard to',
    new: primaryLanguage === 'es' ? 'Nuevo' : 'New',
    enterDeckName: primaryLanguage === 'es' ? 'Ingresa nombre del mazo...' : 'Enter deck name...',
    selectExistingDecks: primaryLanguage === 'es' ? 'Seleccionar Mazos Existentes' : 'Select Existing Decks',
    check: primaryLanguage === 'es' ? 'Verificar' : 'Check',
    deck: primaryLanguage === 'es' ? 'Mazo' : 'Deck',
    decks: primaryLanguage === 'es' ? 'Mazos' : 'Decks',
    addToDeckCount: (count: number) => primaryLanguage === 'es' 
      ? `Agregar a ${count > 0 ? `${count} Mazo${count > 1 ? 's' : ''}` : 'Mazo'}`
      : `Add to ${count > 0 ? `${count} Deck${count > 1 ? 's' : ''}` : 'Deck'}`,
    downloadAsImage: primaryLanguage === 'es' ? 'Descargar esta tarjeta como una imagen' : 'Download this flashcard as an image',
    readyToCreateTitle: primaryLanguage === 'es' ? '¿Listo para Crear?' : 'Ready to Create?',
    readyToCreateDesc: primaryLanguage === 'es' 
      ? '¡Sube una imagen y deja que la IA genere tu tarjeta automáticamente!'
      : 'Upload an image and let AI generate your flashcard automatically!',
  }
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [englishWord, setEnglishWord] = useState("")
  const [spanishWord, setSpanishWord] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [analysisStage, setAnalysisStage] = useState(0) // 0: preparing, 1: analyzing, 2: translating
  const [error, setError] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isResultCardFlipped, setIsResultCardFlipped] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [walkthroughStep, setWalkthroughStep] = useState(0)
  const [showGems, setShowGems] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardPreviewRef = useRef<HTMLDivElement>(null)
  const [isEditingEnglish, setIsEditingEnglish] = useState(false)
  const [editedEnglish, setEditedEnglish] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showAddToDeck, setShowAddToDeck] = useState(false)
  const [selectedDecks, setSelectedDecks] = useState<string[]>([])
  const [newDeckName, setNewDeckName] = useState("")
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [userDecks, setUserDecks] = useState<Array<{ id: string; title: string }>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDownloadCardsDialog, setShowDownloadCardsDialog] = useState(false)
  const [isDailyCardFavorited, setIsDailyCardFavorited] = useState(false)
  const [showDailyFavoritingLoader, setShowDailyFavoritingLoader] = useState(false)
  const [isResultCardFavorited, setIsResultCardFavorited] = useState(false)
  const [showResultFavoritingLoader, setShowResultFavoritingLoader] = useState(false)
  const [resultFavoritingAction, setResultFavoritingAction] = useState<'add' | 'remove'>('add')
  const [pendingAction, setPendingAction] = useState<'camera' | 'upload' | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [showReplaceOptions, setShowReplaceOptions] = useState(false)

  // Daily rotating flashcards pool
  const dailyCards = [
    { english: "Dog", spanish: "Perro", image: "/happy-golden-retriever.png" },
    { english: "Cat", spanish: "Gato", image: "/cute-cat.png" },
    { english: "Apple", spanish: "Manzana", image: "/red-apple.png" },
    { english: "Book", spanish: "Libro", image: "/open-book.png" },
    { english: "Elephant", spanish: "Elefante", image: "/majestic-african-elephant.png" },
    { english: "Tiger", spanish: "Tigre", image: "/majestic-tiger.png" },
    { english: "Banana", spanish: "Plátano", image: "/yellow-banana.png" },
    { english: "Water", spanish: "Agua", image: "/water-glass.png" },
    { english: "Rabbit", spanish: "Conejo", image: "/white-rabbit.png" },
    { english: "Heart", spanish: "Corazón", image: "/heart-shape.svg" },
  ]

  // Get card of the day based on current date
  const getCardOfTheDay = () => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    const cardIndex = dayOfYear % dailyCards.length
    return dailyCards[cardIndex]
  }

  // Format today's date
  const getTodayDate = () => {
    const today = new Date()
    const locale = primaryLanguage === 'es' ? 'es-ES' : 'en-US'
    return today.toLocaleDateString(locale, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const cardOfTheDay = getCardOfTheDay()
  const todayDate = getTodayDate()

  // Dynamic content for Memz of the Day based on language preference
  const dayCardFront = primaryLanguage === 'es' ? cardOfTheDay.spanish : cardOfTheDay.english
  const dayCardBack = primaryLanguage === 'es' ? cardOfTheDay.english : cardOfTheDay.spanish
  const dayCardFrontLang = primaryLanguage === 'es' ? 'es' : 'en'
  const dayCardBackLang = primaryLanguage === 'es' ? 'en' : 'es'
  const dayCardClickText = primaryLanguage === 'es' ? 'Toca para voltear' : 'Tap to flip'
  const dayCardFrontAudio = primaryLanguage === 'es' ? 'Escuchar' : 'Listen'
  const dayCardBackAudio = primaryLanguage === 'es' ? 'Listen' : 'Escuchar'

  // Pre-existing sample decks (always available)
  const sampleDecks = [
    { id: "common-objects", title: "Common Objects", isSample: true },
    { id: "animals", title: "Animals", isSample: true },
    { id: "food-drinks", title: "Food & Drinks", isSample: true },
    { id: "colors-shapes", title: "Colors & Shapes", isSample: true },
  ]

  // Combine user decks with sample decks
  const availableDecks = [...userDecks, ...sampleDecks]

  useEffect(() => {
    // Load user's decks from context
    setUserDecks(contextDecks.map(d => ({ id: d.id, title: d.name, isSample: false })))
  }, [contextDecks])

  // Check if daily card is favorited
  useEffect(() => {
    const checkDailyCardFavoriteStatus = async () => {
      if (!user) {
        setIsDailyCardFavorited(false)
        return
      }
      
      const favorited = await isCardInFavorites(cardOfTheDay.english, cardOfTheDay.spanish)
      setIsDailyCardFavorited(favorited)
    }
    
    checkDailyCardFavoriteStatus()
  }, [user, cardOfTheDay])

  useEffect(() => {
    // Restore saved image from sessionStorage if exists
    const savedImage = sessionStorage.getItem('pendingImagePreview')
    const savedEnglish = sessionStorage.getItem('pendingEnglishWord')
    const savedSpanish = sessionStorage.getItem('pendingSpanishWord')
    const wasTryingToSave = sessionStorage.getItem('pendingAddToDeck')
    
    if (savedImage) {
      setImagePreview(savedImage)
      if (savedEnglish) setEnglishWord(savedEnglish)
      if (savedSpanish) setSpanishWord(savedSpanish)
      if (savedEnglish && savedSpanish) {
        setShowResult(true)
        // If user was trying to add to deck, reopen that dialog
        if (wasTryingToSave === 'true') {
          setTimeout(() => setShowAddToDeck(true), 500)
        }
      }
      
      // Clear from storage after restoring
      sessionStorage.removeItem('pendingImagePreview')
      sessionStorage.removeItem('pendingEnglishWord')
      sessionStorage.removeItem('pendingSpanishWord')
      sessionStorage.removeItem('pendingAddToDeck')
    }

    // Check for action query parameter from floating nav (client-side only)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get('action')
      
      if (action === 'camera') {
        // Remove query param and store pending action
        window.history.replaceState({}, '', '/')
        setPendingAction('camera')
      } else if (action === 'upload') {
        // Remove query param and store pending action
        window.history.replaceState({}, '', '/')
        setPendingAction('upload')
      } else if (action === 'create') {
        // Remove query param and show image options dialog
        window.history.replaceState({}, '', '/')
        setShowReplaceOptions(true)
      }
    }

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setUserLoaded(true)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Execute pending action once user is loaded
  useEffect(() => {
    if (userLoaded && pendingAction) {
      if (pendingAction === 'camera') {
        setTimeout(() => openCamera(), 100)
      } else if (pendingAction === 'upload') {
        setTimeout(() => {
          document.getElementById('image-upload')?.click()
        }, 100)
      }
      setPendingAction(null)
    }
  }, [userLoaded, pendingAction])

  const walkthroughScreens = [
    {
      title: t.welcomeTitle,
      description: t.welcomeDesc,
      image: "/welcome-screen-with-purple-gem-logo-and-flashcards.jpg",
      icon: <MemzyLogo size={64} />,
      color: "from-purple-500 to-purple-700"
    },
    {
      title: t.step1Title,
      description: t.step1Desc,
      image: "/upload-image-interface-with-drag-and-drop-area.jpg",
      icon: <Upload className="h-12 w-12 text-white" />,
      features: [
        { icon: <Upload className="h-5 w-5" />, text: t.uploadFromFiles },
        { icon: <Camera className="h-5 w-5" />, text: t.takeAPhoto },
        { text: t.dragAndDrop }
      ],
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: t.step2Title,
      description: t.step2Desc,
      image: "/text-input-field-with-english-word-example.jpg",
      icon: <MemzyLogo size={48} />,
      features: [
        { icon: <Sparkles className="h-5 w-5" />, text: t.aiImageRecognition },
        { text: t.instantDetection },
        { text: t.accurateIdentification }
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      title: t.step3Title,
      description: t.step3Desc,
      image: "/translate-button-being-clicked-with-ai-processing.jpg",
      icon: <Loader2 className="h-12 w-12 text-white" />,
      features: [
        { text: t.englishDetected },
        { text: t.spanishTranslation },
        { text: t.readyToSave }
      ],
      color: "from-orange-500 to-red-600"
    },
    {
      title: t.step4ViewTitle,
      description: t.step4ViewDesc,
      image: "/finished-flashcard-with-image-and-translations.jpg",
      icon: <MemzyLogo size={48} />,
      features: [
        { text: t.beautifulDesign },
        { text: t.flipToReveal },
        { text: t.saveToDecks }
      ],
      color: "from-pink-500 to-rose-600"
    },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check authentication first
    if (!user) {
      setError(primaryLanguage === 'es' ? "Por favor inicia sesión para subir imágenes" : "Please sign in to upload images")
      return
    }
    
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setTimeout(() => {
          cardPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check authentication first
    if (!user) {
      setError(primaryLanguage === 'es' ? "Por favor inicia sesión para tomar fotos" : "Please sign in to take photos")
      return
    }
    
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setTimeout(() => {
          cardPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const openCamera = async () => {
    // Check authentication first
    if (!user) {
      setError(primaryLanguage === 'es' ? "Por favor inicia sesión para usar la cámara" : "Please sign in to use the camera")
      return
    }
    
    try {
      // Check if we're on a native platform (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Camera plugin for native platforms
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          correctOrientation: true,
          direction: CameraDirection?.Rear // Prefer back camera to avoid mirror issues
        })
        
        if (image.dataUrl) {
          setImagePreview(image.dataUrl)
          setImageFile(null)
          // Scroll to the card preview after image is set
          setTimeout(() => {
            cardPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      } else {
        // Fallback to web camera for browser
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        setStream(mediaStream)
        setShowCamera(true)
        
        // Wait for video element to be ready
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        }, 100)
      }
    } catch (err) {
      // Only show error for actual permission denials, not for user cancellations
      // Capacitor Camera handles its own permission prompts
      if (err instanceof Error && err.message.includes('permission')) {
        setError("Camera permission denied. Please enable camera access in your device settings.")
      }
      console.error("Camera error:", err)
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
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
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setImagePreview(imageData)
        setImageFile(null) // Clear file since we have base64
        closeCamera()
        // Scroll to the card preview after image is set
        setTimeout(() => {
          cardPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }

  // Flip/mirror image horizontally (for selfie camera fix)
  const flipImageHorizontally = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Flip horizontally
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/jpeg', 0.9))
        } else {
          resolve(imageDataUrl)
        }
      }
      img.src = imageDataUrl
    })
  }

  const handleFlipImage = async () => {
    if (imagePreview) {
      const flippedImage = await flipImageHorizontally(imagePreview)
      setImagePreview(flippedImage)
    }
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleSpeak = async (text: string, lang: string, event?: React.MouseEvent) => {
    // Stop event propagation to prevent card flip
    if (event) {
      event.stopPropagation()
    }
    
    // Use native TTS on mobile platforms (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        // Stop any ongoing speech first
        await TextToSpeech.stop()
        
        // Speak using native TTS
        await TextToSpeech.speak({
          text: text,
          lang: lang === 'es' ? 'es-ES' : 'en-US',
          rate: 0.85,
          pitch: 1.0,
          volume: 1.0,
          category: 'playback'
        })
      } catch (error) {
        console.error('Native TTS error:', error)
        // Fallback to web speech if native fails
        speakWithWebAPI(text, lang)
      }
    } else {
      // Use Web Speech API on browser
      speakWithWebAPI(text, lang)
    }
  }
  
  const speakWithWebAPI = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices()
        
        if (lang === 'es') {
          // Find a native Spanish voice (prioritize es-ES, es-MX, or any Spanish voice)
          const spanishVoice = voices.find(voice => 
            voice.lang.startsWith('es-ES') || voice.lang.startsWith('es-MX') || voice.lang.startsWith('es')
          )
          if (spanishVoice) {
            utterance.voice = spanishVoice
          }
          utterance.lang = 'es-ES'
        } else {
          // Find a native English voice (prioritize en-US)
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en-US') || voice.lang.startsWith('en')
          )
          if (englishVoice) {
            utterance.voice = englishVoice
          }
          utterance.lang = 'en-US'
        }
        
        utterance.rate = 0.85 // Slightly slower for better clarity
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
      }
      
      // Ensure voices are loaded
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        speak()
      } else {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          speak()
        }
      }
    }
  }

  const handleDailyCardFavorite = async (event?: React.MouseEvent) => {
    // Stop event propagation to prevent card flip
    if (event) {
      event.stopPropagation()
    }

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
      alert(primaryLanguage === 'es' 
        ? 'Inicia sesión para agregar a Favoritos.'
        : 'Please sign in to add to Favorites.')
      router.push('/login')
      return
    }

    const previousFavoritedState = isDailyCardFavorited

    try {
      // Show loading dialog
      setShowDailyFavoritingLoader(true)
      
      // Optimistically update UI
      setIsDailyCardFavorited(!previousFavoritedState)

      let success = false

      if (previousFavoritedState) {
        // Remove from favorites
        success = await removeCardFromFavorites(cardOfTheDay.english, cardOfTheDay.spanish)
      } else {
        // Add to favorites (database handles creating Favorites deck if needed)
        success = await addCardToFavorites(cardOfTheDay.english, cardOfTheDay.spanish, cardOfTheDay.image, false)
      }

      if (success) {
        // Invalidate decks cache to refresh the Favorites deck
        mutateDecks()
        
        // Hide loading dialog
        setShowDailyFavoritingLoader(false)
      } else {
        // Revert on failure
        setIsDailyCardFavorited(previousFavoritedState)
        setShowDailyFavoritingLoader(false)
        alert(primaryLanguage === 'es' 
          ? 'Error al actualizar Favoritos.'
          : 'Failed to update Favorites.')
      }
    } catch (error) {
      // Hide loading dialog
      setShowDailyFavoritingLoader(false)
      
      // Revert on error
      setIsDailyCardFavorited(previousFavoritedState)
      console.error('Error with favorites:', error)
      alert(primaryLanguage === 'es' 
        ? 'Error al actualizar Favoritos.'
        : 'Failed to update Favorites.')
    }
  }

  const handleResultCardFavorite = async (event?: React.MouseEvent) => {
    // Stop event propagation to prevent card flip
    if (event) {
      event.stopPropagation()
    }

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
      alert(primaryLanguage === 'es' 
        ? 'Inicia sesión para agregar a Favoritos.'
        : 'Please sign in to add to Favorites.')
      router.push('/login')
      return
    }

    const previousFavoritedState = isResultCardFavorited

    try {
      // Track the action we're about to perform
      setResultFavoritingAction(previousFavoritedState ? 'remove' : 'add')
      // Show loading dialog
      setShowResultFavoritingLoader(true)
      
      // Optimistically update UI
      setIsResultCardFavorited(!previousFavoritedState)

      let success = false

      if (previousFavoritedState) {
        // Remove from favorites
        success = await removeCardFromFavorites(englishWord, spanishWord)
      } else {
        // Add to favorites (database handles creating Favorites deck if needed)
        success = await addCardToFavorites(englishWord, spanishWord, imagePreview, true)
      }

      if (success) {
        // Invalidate decks cache to refresh the Favorites deck
        mutateDecks()
        
        // Hide loading dialog
        setShowResultFavoritingLoader(false)
      } else {
        // Revert on failure
        setIsResultCardFavorited(previousFavoritedState)
        setShowResultFavoritingLoader(false)
        alert(primaryLanguage === 'es' 
          ? 'Error al actualizar Favoritos.'
          : 'Failed to update Favorites.')
      }
    } catch (error) {
      // Hide loading dialog
      setShowResultFavoritingLoader(false)
      
      // Revert on error
      setIsResultCardFavorited(previousFavoritedState)
      console.error('Error with favorites:', error)
      alert(primaryLanguage === 'es' 
        ? 'Error al actualizar Favoritos.'
        : 'Failed to update Favorites.')
    }
  }

  const handleSaveToDeck = () => {
    // No login required for download, just open the dialog
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
    // FREE LIMIT — REQUIRE PRO UPGRADE for multiple decks
    if (!canCreateDeck()) {
      setUpgradeReason(primaryLanguage === 'es' 
        ? 'Los usuarios gratis solo pueden tener 1 mazo. ¡Actualiza a Pro para mazos ilimitados!'
        : 'Free users can only have 1 deck. Upgrade to Pro for unlimited decks!')
      setShowUpgradeModal(true)
      return
    }
    setIsCreatingDeck(true)
  }

  const handleSaveNewDeck = async () => {
    if (newDeckName.trim()) {
      // FREE LIMIT — REQUIRE PRO UPGRADE for multiple decks
      if (!canCreateDeck()) {
        setUpgradeReason(primaryLanguage === 'es' 
          ? 'Los usuarios gratis solo pueden tener 1 mazo. ¡Actualiza a Pro para mazos ilimitados!'
          : 'Free users can only have 1 deck. Upgrade to Pro for unlimited decks!')
        setShowUpgradeModal(true)
        return
      }
      
      try {
        const deck = await createDeck(newDeckName)
        if (deck) {
          // FREE LIMIT — INCREMENT DECK COUNT
          await incrementDecks()
          
          // Add to user decks and select it
          setUserDecks(prev => [...prev, { id: deck.id, title: deck.name, isSample: false }])
          setSelectedDecks(prev => [...prev, deck.id])
        }
        setNewDeckName("")
        setIsCreatingDeck(false)
      } catch (error) {
        console.error('Error creating deck:', error)
        // Check if it's an auth error
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
    // Check if user is logged in for saving to deck
    if (!user) {
      // Save current image and words to sessionStorage before redirecting
      if (imagePreview) {
        sessionStorage.setItem('pendingImagePreview', imagePreview)
        if (englishWord) sessionStorage.setItem('pendingEnglishWord', englishWord)
        if (spanishWord) sessionStorage.setItem('pendingSpanishWord', spanishWord)
        sessionStorage.setItem('pendingAddToDeck', 'true')
      }
      
      alert("Please sign in to save cards to your decks")
      setTimeout(() => {
        router.push("/login")
      }, 100)
      return
    }

    if (selectedDecks.length === 0 && !newDeckName.trim()) {
      alert("Please select at least one deck or create a new one")
      return
    }
    
    setIsSaving(true)
    
    try {
      // Create new deck if name is provided
      let finalDeckIds = [...selectedDecks]
      if (newDeckName.trim()) {
        const newDeck = await createDeck(newDeckName)
        if (newDeck) {
          finalDeckIds.push(newDeck.id)
        }
      }
      
      // Create the flashcard (mark as AI-generated if from AI result dialog)
      const card = await createFlashcard(englishWord, spanishWord, imagePreview, showResult)
      
      
      if (card && finalDeckIds.length > 0) {
        // Add card to selected decks
        const success = await addCardToDecks(card.id, finalDeckIds)
        
        const deckNames = finalDeckIds
          .map(id => availableDecks.find(d => d.id === id)?.title)
          .filter(Boolean)
        
        alert(`Flashcard saved to: ${deckNames.join(", ")}`)
        
        // Refresh the decks list to show new deck
        mutateDecks()
        
        // Close the result dialog and reset state
        setShowResult(false)
        setIsResultCardFlipped(false)
        setImagePreview("")
        setImageFile(null)
        setEnglishWord("")
        setSpanishWord("")
      }
      
      // Reset and close
      setSelectedDecks([])
      setNewDeckName("")
      setIsCreatingDeck(false)
      setShowAddToDeck(false)
      setIsSaving(false)
    } catch (error) {
      console.error("Error saving flashcard:", error)
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('logged in')) {
        alert("Please sign in to create decks")
        setTimeout(() => {
          router.push("/login")
        }, 100)
      } else {
        alert("Failed to save flashcard. Please try again.")
      }
      setIsSaving(false)
    }
  }

  const handleDownloadCard = async () => {
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
    ctx.fillText(spanishWord, canvas.width / 2, 100)

    // Draw image if available
    if (imagePreview) {
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
        ctx.fillText(englishWord, canvas.width / 2, 520)

        // Download
        downloadCanvas(canvas)
      }
      img.src = imagePreview
    } else {
      // Draw English word (bottom) without image
      ctx.fillStyle = '#1f2937'
      ctx.font = '32px Arial, sans-serif'
      ctx.fillText(englishWord, canvas.width / 2, canvas.height / 2 + 100)

      // Download
      downloadCanvas(canvas)
    }
  }

  const downloadCanvas = (canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flashcard-${englishWord.toLowerCase()}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.95)
  }

  const handleRegenerateTranslation = async () => {
    if (!editedEnglish.trim()) {
      setError("Please enter an English word")
      return
    }

    setIsRegenerating(true)
    setError("")

    try {
      // Use relative path since API route is in the same Next.js app
      const response = await fetch('/api/translate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ englishWord: editedEnglish.trim() }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const data = await response.json()
      
      
      // Update both words
      setEnglishWord(editedEnglish.trim())
      setSpanishWord(data.spanishTranslation)
      setIsEditingEnglish(false)
      
      // If card is flipped to back, flip to front then back to force re-render with new translation
      if (isResultCardFlipped) {
        setIsResultCardFlipped(false)
        setTimeout(() => setIsResultCardFlipped(true), 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to translate. Please try again.")
      console.error("[v0] Translation error:", err)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      setError("Please upload an image first")
      return
    }

    // FREE LIMIT — REQUIRE PRO UPGRADE
    // Check if user can create more cards before analyzing
    if (!canCreateCard()) {
      setUpgradeReason(primaryLanguage === 'es' 
        ? 'Has alcanzado el límite de 12 tarjetas AI gratis. ¡Actualiza a Pro para tarjetas ilimitadas!'
        : 'You\'ve reached the free limit of 12 AI cards. Upgrade to Pro for unlimited cards!')
      setShowUpgradeModal(true)
      return
    }

    // Trigger gem animation
    setShowGems(true)

    setIsTranslating(true)
    setAnalysisStage(0) // Start with preparing stage
    setError("")

    try {
      // Compress image before sending to API (reduces upload time and API processing)
      let imageToSend = imagePreview
      
      // If image is larger than 500KB, compress it
      if (imagePreview.length > 500000) {
        const img = document.createElement('img') as HTMLImageElement
        img.src = imagePreview
        await new Promise((resolve) => { img.onload = resolve })
        
        const canvas = document.createElement('canvas')
        const maxSize = 800 // Max width/height
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        imageToSend = canvas.toDataURL('image/jpeg', 0.7)
      }

      // Move to analyzing stage
      setAnalysisStage(1)

      // Use relative path since API route is in the same Next.js app
      const response = await fetch('/api/analyze-image', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: imageToSend }),
      })

      // Move to translating stage (the API already handles translation)
      setAnalysisStage(2)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Image analysis failed")
      }

      const data = await response.json()

      // Debug logging

      // Validate that we have both words
      if (!data.englishWord || !data.spanishTranslation) {
        throw new Error("Translation incomplete - missing English or Spanish word")
      }

      // Set the results and show them
      setEnglishWord(data.englishWord)
      setSpanishWord(data.spanishTranslation)
      setShowGems(false)
      setShowResult(true)
      
      // FREE LIMIT — INCREMENT CARD COUNT on successful analysis
      await incrementCreatedCards()
      
      // Extra verification log
      setTimeout(() => {
      }, 100)
      
      // Check if this card is already favorited
      if (user) {
        const favorited = await isCardInFavorites(data.englishWord, data.spanishTranslation)
        setIsResultCardFavorited(favorited)
      } else {
        setIsResultCardFavorited(false)
      }
      
      // Verify state was set
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image. Please try again.")
      setShowGems(false)
      console.error("[v0] Image analysis error:", err)
    } finally {
      setIsTranslating(false)
    }
  }

  const nextStep = () => {
    if (walkthroughStep < walkthroughScreens.length - 1) {
      setWalkthroughStep(walkthroughStep + 1)
    }
  }

  const prevStep = () => {
    if (walkthroughStep > 0) {
      setWalkthroughStep(walkthroughStep - 1)
    }
  }

  const closeWalkthrough = () => {
    setShowWalkthrough(false)
    setWalkthroughStep(0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center -mt-3">
                <MemzyLogo size={40} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Memzy</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="touch-manipulation">
                <a href="/settings">
                  <Settings className="h-5 w-5" />
                </a>
              </Button>
              <ProfileDropdown />
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">{t.tagline}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-12">
          <section className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{t.memzOfTheDay}</h2>
              <p className="text-sm text-muted-foreground mt-1">{todayDate}</p>
            </div>
            <div className="flex justify-center">
              <div className="perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div
                  className={`relative h-[400px] w-[300px] transition-transform duration-700 [transform-style:preserve-3d] ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 border-[10px] border-purple-600 bg-white p-8 shadow-lg [backface-visibility:hidden]">
                    {/* Favorite button - top right */}
                    <button
                      onClick={(e) => handleDailyCardFavorite(e)}
                      className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
                    >
                      <Heart className={`h-5 w-5 transition-all ${isDailyCardFavorited ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                    </button>
                    
                    <div className="flex h-full flex-col items-center justify-between">
                      <div className="text-center">
                        <h3 className="text-balance text-4xl font-bold text-black">{dayCardFront}</h3>
                      </div>
                      <div className="relative h-52 w-52 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={cardOfTheDay.image} alt={dayCardFront} fill className="object-cover" />
                      </div>
                      <div className="w-full space-y-2">
                        <p className="text-sm text-gray-500 text-center">{dayCardClickText}</p>
                        <Button 
                          onClick={(e) => handleSpeak(dayCardFront, dayCardFrontLang, e)} 
                          variant="ghost" 
                          size="sm"
                          className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {dayCardFrontAudio}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 border-[10px] border-purple-600 bg-white p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {/* Favorite button - top right */}
                    <button
                      onClick={(e) => handleDailyCardFavorite(e)}
                      className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
                    >
                      <Heart className={`h-5 w-5 transition-all ${isDailyCardFavorited ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                    </button>
                    
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <div className="text-center">
                        <h3 className="text-balance text-5xl font-bold text-[#8B4513]">{dayCardBack}</h3>
                      </div>
                      <Button 
                        onClick={(e) => handleSpeak(dayCardBack, dayCardBackLang, e)} 
                        variant="ghost" 
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        {dayCardBackAudio}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  {primaryLanguage === 'es' ? 'Crea Tu Tarjeta' : 'Create Your Flashcard'}
                </h2>

                {/* Image Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {primaryLanguage === 'es' ? 'Subir o Capturar Imagen' : 'Upload or Capture Image'}
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Upload from files */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:bg-muted"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-center text-xs text-muted-foreground">
                            {t.uploadImage}
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
                          {t.takePhoto}
                        </p>
                      </button>
                    </div>

                    {imageFile && (
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        {imageFile.name}
                      </p>
                    )}
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="space-y-2">
                      <div ref={cardPreviewRef} className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                        <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                      </div>
                      <Button
                        onClick={handleFlipImage}
                        variant="outline"
                        size="sm"
                        className="w-full text-muted-foreground"
                      >
                        <FlipHorizontal2 className="mr-2 h-4 w-4" />
                        {primaryLanguage === 'es' ? 'Voltear Imagen (para selfies)' : 'Flip Image (for selfies)'}
                      </Button>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                  <div className="relative">
                    <Button
                      onClick={handleAnalyzeImage}
                      disabled={isTranslating || !imagePreview}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {analysisStage === 0 
                            ? (primaryLanguage === 'es' ? 'Preparando imagen...' : 'Preparing image...')
                            : analysisStage === 1 
                            ? (primaryLanguage === 'es' ? 'Analizando con IA...' : 'AI analyzing...')
                            : (primaryLanguage === 'es' ? 'Traduciendo...' : 'Translating...')
                          }
                        </>
                      ) : (
                        primaryLanguage === 'es' ? "Analizar Imagen y Generar Tarjeta" : "Analyze Image & Generate Flashcard"
                      )}
                    </Button>

                    {/* Gem particles animation */}
                    {showGems && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        {[...Array(12)].map((_, i) => {
                          const angle = (i * 360) / 12
                          const tx = Math.cos((angle * Math.PI) / 180) * 200
                          const ty = Math.sin((angle * Math.PI) / 180) * 200
                          return (
                            <div
                              key={i}
                              className="gem-particle absolute"
                              style={
                                {
                                  "--tx": `${tx}px`,
                                  "--ty": `${ty}px`,
                                  animationDelay: `${i * 0.05}s`,
                                } as React.CSSProperties
                              }
                            >
                              <MemzyLogo size={24} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/browse-decks")}
                  variant="outline"
                  size="lg"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t.browseAllDecks}
                </Button>
                
                <Button
                  onClick={() => setShowDownloadCardsDialog(true)}
                  variant="outline"
                  size="lg"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {t.downloadCards}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <MemzyLogo size={128} className="opacity-50" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-foreground">{t.readyToCreateTitle}</h3>
                <p className="text-muted-foreground">
                  {t.readyToCreateDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Daily Card Favoriting Loader Dialog */}
      <Dialog open={showDailyFavoritingLoader} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {isDailyCardFavorited 
              ? (primaryLanguage === 'es' ? 'Eliminando de Favoritos' : 'Removing from Favorites')
              : (primaryLanguage === 'es' ? 'Agregando a Favoritos' : 'Adding to Favorites')
            }
          </DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <GemLoader size={64} />
            <p className="text-center text-muted-foreground">
              {isDailyCardFavorited 
                ? (primaryLanguage === 'es' ? 'Eliminando de Favoritos...' : 'Removing from Favorites...')
                : (primaryLanguage === 'es' ? 'Agregando a Favoritos...' : 'Adding to Favorites...')
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Card Favoriting Loader Dialog */}
      <Dialog open={showResultFavoritingLoader} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {resultFavoritingAction === 'remove'
              ? (primaryLanguage === 'es' ? 'Eliminando de Favoritos' : 'Removing from Favorites')
              : (primaryLanguage === 'es' ? 'Agregando a Favoritos' : 'Adding to Favorites')
            }
          </DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <GemLoader size={64} />
            <p className="text-center text-muted-foreground">
              {resultFavoritingAction === 'remove'
                ? (primaryLanguage === 'es' ? 'Eliminando de Favoritos...' : 'Removing from Favorites...')
                : (primaryLanguage === 'es' ? 'Agregando a Favoritos...' : 'Adding to Favorites...')
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flashcard Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-2xl flex justify-center">
          <DialogTitle className="sr-only">
            {primaryLanguage === 'es' ? 'Tu Tarjeta' : 'Your Flashcard'}
          </DialogTitle>
          <div className="space-y-6 p-4 w-full flex flex-col items-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                {primaryLanguage === 'es' ? '¡Tu Tarjeta Está Lista! 🎉' : 'Your Flashcard is Ready! 🎉'}
              </h2>
              <p className="text-muted-foreground">
                {primaryLanguage === 'es' ? 'Esto es lo que detectó la IA:' : "Here's what the AI detected:"}
              </p>
            </div>

            {/* Flashcard Preview with Action Icons */}
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center">
                {/* Action buttons positioned above card - centered */}
                <div className="mb-4 flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-white shadow-lg hover:bg-gray-50"
                    onClick={handleSaveToDeck}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-white shadow-lg hover:bg-gray-50"
                    onClick={() => setShowAddToDeck(true)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-white shadow-lg hover:bg-gray-50"
                    onClick={() => setShowReplaceOptions(true)}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-white shadow-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => {
                      setShowResult(false)
                      setIsResultCardFlipped(false)
                      setImagePreview("")
                      setImageFile(null)
                      setEnglishWord("")
                      setSpanishWord("")
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Card */}
                <div className="perspective-1000 flex justify-center">
                  <div
                    className={`relative h-[500px] w-[350px] transition-transform duration-700 [transform-style:preserve-3d] ${
                      isResultCardFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                  >
                    {/* Front of card */}
                    <div className="absolute inset-0 border-[10px] border-black bg-white p-8 shadow-lg [backface-visibility:hidden]">
                      {/* AI Badge - positioned absolutely, doesn't affect layout - only show when not flipped */}
                      {!isResultCardFlipped && (
                        <div className="absolute left-3 top-3 z-10 pointer-events-none drop-shadow-md [backface-visibility:hidden]">
                          <AiBadge size={32} className="" />
                        </div>
                      )}
                      
                      {/* Favorite button - top right */}
                      {!isResultCardFlipped && (
                        <button
                          onClick={handleResultCardFavorite}
                          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-all"
                          aria-label={isResultCardFavorited ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-6 w-6 transition-all ${
                              isResultCardFavorited 
                                ? 'fill-purple-600 text-purple-600' 
                                : 'text-gray-400 hover:text-purple-600'
                            }`}
                          />
                        </button>
                      )}
                      
                      <div className="flex h-full flex-col items-center justify-between">
                        {/* Word at top */}
                        <div className="flex w-full items-center justify-center gap-2 text-center">
                        {isEditingEnglish && primaryLanguage === 'en' ? (
                          <div className="space-y-2 w-full">
                            <Input
                              value={editedEnglish}
                              onChange={(e) => setEditedEnglish(e.target.value)}
                              placeholder={t.enterEnglishWord}
                              className="text-center text-2xl font-bold"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={handleRegenerateTranslation}
                                disabled={isRegenerating || !editedEnglish.trim()}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                {isRegenerating ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    {t.regenerating}
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-3 w-3" />
                                    {t.saveAndTranslate}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsEditingEnglish(false)
                                  setEditedEnglish(englishWord)
                                }}
                              >
                                {t.cancel}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-balance text-4xl font-bold text-black">
                              {primaryLanguage === 'es' ? spanishWord : englishWord}
                            </h3>
                            {primaryLanguage === 'en' && (
                              <button
                                onClick={() => {
                                  setEditedEnglish(englishWord)
                                  setIsEditingEnglish(true)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Image in middle */}
                      {imagePreview && (
                        <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-gray-100">
                          <Image src={imagePreview} alt={englishWord} fill className="object-cover" />
                        </div>
                      )}

                      {/* Button at bottom */}
                      <div className="w-full space-y-2">
                        <Button 
                          onClick={() => setIsResultCardFlipped(true)} 
                          variant="outline" 
                          className="w-full"
                        >
                          {primaryLanguage === 'es' ? 'Tocar para revelar' : 'Tap to Reveal'}
                        </Button>
                        <Button 
                          onClick={(e) => handleSpeak(
                            primaryLanguage === 'es' ? spanishWord : englishWord,
                            primaryLanguage === 'es' ? 'es' : 'en',
                            e
                          )} 
                          variant="ghost" 
                          size="sm"
                          className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {primaryLanguage === 'es' ? 'Escuchar' : 'Listen'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 border-[10px] border-black bg-white p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {/* AI Badge - only show when flipped */}
                    {isResultCardFlipped && (
                      <div className="absolute left-3 top-3 z-10 pointer-events-none drop-shadow-md [backface-visibility:hidden]">
                        <AiBadge size={32} className="" />
                      </div>
                    )}
                    
                    {/* Favorite button - top right */}
                    {isResultCardFlipped && (
                      <button
                        onClick={handleResultCardFavorite}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-all"
                        aria-label={isResultCardFavorited ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart 
                          className={`h-6 w-6 transition-all ${
                            isResultCardFavorited 
                              ? 'fill-purple-600 text-purple-600' 
                              : 'text-gray-400 hover:text-purple-600'
                          }`}
                        />
                      </button>
                    )}
                    
                    <div className="flex h-full flex-col items-center justify-between">
                      {/* Translated word at top */}
                      <div className="text-center">
                        <h3 className="text-balance text-4xl font-bold text-[#8B4513]">
                          {(() => {
                            const displayWord = primaryLanguage === 'es' ? englishWord : spanishWord
                            return displayWord
                          })()}
                        </h3>
                      </div>

                      {/* Same image in middle */}
                      {imagePreview && (
                        <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-gray-100">
                          <Image src={imagePreview} alt={spanishWord} fill className="object-cover" />
                        </div>
                      )}

                      {/* Flip back button at bottom */}
                      <div className="w-full space-y-2">
                        <Button 
                          onClick={() => setIsResultCardFlipped(false)} 
                          variant="outline" 
                          className="w-full"
                        >
                          {primaryLanguage === 'es' ? 'Voltear' : 'Flip Back'}
                        </Button>
                        <Button 
                          onClick={(e) => handleSpeak(
                            primaryLanguage === 'es' ? englishWord : spanishWord,
                            primaryLanguage === 'es' ? 'en' : 'es',
                            e
                          )} 
                          variant="ghost" 
                          size="sm"
                          className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {primaryLanguage === 'es' ? 'Listen' : 'Escuchar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Options Dialog */}
      <Dialog open={showReplaceOptions} onOpenChange={setShowReplaceOptions}>
        <DialogContent className="max-w-md">
          <DialogTitle>{primaryLanguage === 'es' ? 'Añadir Imagen' : 'Add Image'}</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {primaryLanguage === 'es' ? 'Elige cómo quieres añadir la imagen' : 'Choose how you want to add the image'}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Upload from files */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e)
                      setShowResult(false)
                      setIsResultCardFlipped(false)
                      setEnglishWord("")
                      setSpanishWord("")
                      setShowReplaceOptions(false)
                      e.target.value = ""
                    }
                  }}
                  className="hidden"
                  id="replace-image-upload"
                />
                <label
                  htmlFor="replace-image-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:bg-muted"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {t.uploadImage}
                  </p>
                </label>
              </div>

              {/* Capture from camera */}
              <button
                type="button"
                onClick={() => {
                  setShowReplaceOptions(false)
                  openCamera()
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:bg-muted"
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {t.takePhoto}
                </p>
              </button>
            </div>

            <Button onClick={() => setShowReplaceOptions(false)} variant="outline" className="w-full">
              {t.cancel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={closeCamera}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">Camera</DialogTitle>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{t.takeAPhotoTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.positionObject}</p>
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
                {t.cancel}
              </Button>
              <Button onClick={capturePhoto} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Camera className="mr-2 h-4 w-4" />
                {t.capturePhoto}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Deck Dialog */}
      <Dialog open={showAddToDeck} onOpenChange={setShowAddToDeck}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogTitle>{t.downloadOrSaveCard}</DialogTitle>
          
          <Tabs defaultValue="download" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="download">{t.downloadCard}</TabsTrigger>
              <TabsTrigger value="save">{t.saveToDeck}</TabsTrigger>
            </TabsList>
            
            {/* Save to Deck Tab */}
            <TabsContent value="save" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.selectOneOrMore}
              </p>

            {/* Create New Deck Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{t.createNewDeck}</h3>
                {!isCreatingDeck && (
                  <Button onClick={handleCreateNewDeck} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    {t.new}
                  </Button>
                )}
              </div>
              
              {isCreatingDeck && (
                <div className="space-y-2">
                  <Input
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder={t.enterDeckName}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNewDeck} size="sm" className="flex-1">
                      <Check className="h-4 w-4 mr-1" />
                      {t.create}
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
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Decks */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">{t.selectExistingDecks}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleDeck(deck.id);
                    }}
                  >
                    <Checkbox
                      checked={selectedDecks.includes(deck.id)}
                      className="pointer-events-none"
                    />
                    <Label className="flex-1 cursor-pointer pointer-events-none">{deck.title}</Label>
                  </div>
                ))}
              </div>
            </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowAddToDeck(false)} variant="outline" className="flex-1">
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleConfirmAddToDeck} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isSaving || (selectedDecks.length === 0 && !newDeckName.trim())}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    t.addToDeckCount(selectedDecks.length)
                  )}
                </Button>
              </div>
            </TabsContent>
            
            {/* Download Card Tab */}
            <TabsContent value="download" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.downloadAsImage}
              </p>
              
              <div className="rounded-lg border border-border p-6">
                {/* Card Preview */}
                <div className="mb-4 rounded-lg border-2 border-purple-600 p-4 text-center bg-white">
                  <div className="text-3xl font-bold text-purple-600 mb-3">{spanishWord}</div>
                  {imagePreview && (
                    <div className="relative w-40 h-40 mx-auto mb-3">
                      <Image 
                        src={imagePreview} 
                        alt={englishWord} 
                        fill 
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  <div className="text-lg font-medium text-gray-700">{englishWord}</div>
                </div>
              </div>
              
              {/* Download Format Options */}
              <Button 
                onClick={handleDownloadCard}
                variant="outline"
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download JPG
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Download Cards Dialog */}
      <DownloadCardsDialog
        open={showDownloadCardsDialog}
        onOpenChange={setShowDownloadCardsDialog}
      />
    </div>
  )
}
