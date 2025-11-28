"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Download, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Moon,
  Sun,
  Trash2,
  Plus
} from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"

export default function TutorialPage() {
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)

  const tutorialSteps = [
  {
    title: primaryLanguage === 'es' ? "¡Bienvenido a Memzy! 🎉" : "Welcome to Memzy! 🎉",
    description: primaryLanguage === 'es' 
      ? "Aprende español con tarjetas educativas con IA. ¡Hagamos un recorrido rápido!"
      : "Learn Spanish with AI-powered flashcards. Let's take a quick tour!",
    image: null,
    icon: <Sparkles className="h-16 w-16 text-purple-600" />,
    color: "from-purple-500 to-purple-700"
  },
  {
    title: primaryLanguage === 'es' ? "Crea Tarjetas con IA" : "Create Flashcards with AI",
    description: primaryLanguage === 'es'
      ? "Toma una foto o sube una imagen. ¡Nuestra IA detecta el objeto instantáneamente y lo traduce al español!"
      : "Take a photo or upload an image. Our AI instantly detects the object and translates it to Spanish!",
    image: "/example-flashcard.png",
    icon: <Camera className="h-12 w-12 text-purple-600" />,
    features: [
      { icon: <Camera className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Captura con cámara" : "Camera capture" },
      { icon: <Upload className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Subir imágenes" : "Upload images" },
      { icon: <Sparkles className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Traducción con IA" : "AI translation" }
    ],
    color: "from-blue-500 to-cyan-600"
  },
  {
    title: primaryLanguage === 'es' ? "Explora y Estudia Mazos" : "Browse & Study Decks",
    description: primaryLanguage === 'es'
      ? "Explora 5 mazos de muestra o crea tus propios mazos personalizados. ¡Cada mazo tiene 15 tarjetas para ayudarte a aprender!"
      : "Explore 5 sample decks or create your own custom decks. Each deck has 15 cards to help you learn!",
    icon: <BookOpen className="h-12 w-12 text-purple-600" />,
    features: [
      { icon: <BookOpen className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Objetos Comunes" : "Common Objects" },
      { icon: <BookOpen className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Animales" : "Animals" },
      { icon: <BookOpen className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Partes del Cuerpo" : "Body Parts" },
      { icon: <BookOpen className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Colores y Formas" : "Colors & Shapes" }
    ],
    color: "from-green-500 to-emerald-600"
  },
  {
    title: primaryLanguage === 'es' ? "Voltea y Navega las Tarjetas" : "Flip & Navigate Cards",
    description: primaryLanguage === 'es'
      ? "Toca para revelar la traducción al español. Usa los botones Anterior ◀ y Siguiente ▶ para navegar por tu mazo."
      : "Tap to reveal Spanish translation. Use Previous ◀ and Next ▶ buttons to navigate through your deck.",
    icon: <ChevronRight className="h-12 w-12 text-purple-600" />,
    features: [
      { icon: <ChevronLeft className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Tarjeta anterior" : "Previous card" },
      { icon: <ChevronRight className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Siguiente tarjeta" : "Next card" },
      { text: primaryLanguage === 'es' ? "Voltear para revelar" : "Flip to reveal" }
    ],
    color: "from-orange-500 to-red-600"
  },
  {
    title: primaryLanguage === 'es' ? "Acciones de Tarjeta y Descarga" : "Card Actions & Download",
    description: primaryLanguage === 'es'
      ? "Cada tarjeta tiene 4 iconos de acción en la esquina superior derecha (botones blancos con sombra): Descargar 📥, Agregar al Mazo ➕, Reemplazar Imagen 🖼️ y Eliminar 🗑️ (rojo). ¡Haz clic en el icono de descarga para seleccionar hasta 8 tarjetas y descargar como PDF o JPG!"
      : "Each card has 4 action icons in the top-right corner (white buttons with shadow): Download 📥, Add to Deck ➕, Replace Image 🖼️, and Delete 🗑️ (red). Click the download icon to select up to 8 cards and download as PDF or JPG!",
    icon: <Download className="h-12 w-12 text-purple-600" />,
    features: [
      { icon: <Download className="h-5 w-5 text-purple-600" />, text: primaryLanguage === 'es' ? "Icono de Descargar (📥) - botón blanco" : "Download icon (📥) - white button" },
      { icon: <Plus className="h-5 w-5 text-purple-600" />, text: primaryLanguage === 'es' ? "Icono Agregar al Mazo (➕) - botón blanco" : "Add to Deck icon (➕) - white button" },
      { text: primaryLanguage === 'es' ? "Icono Reemplazar Imagen (🖼️) - botón blanco" : "Replace Image icon (🖼️) - white button" },
      { icon: <Trash2 className="h-5 w-5 text-red-600" />, text: primaryLanguage === 'es' ? "Icono Eliminar (🗑️) - texto rojo" : "Delete icon (🗑️) - red text" }
    ],
    color: "from-pink-500 to-rose-600"
  },
  {
    title: primaryLanguage === 'es' ? "Personaliza y Administra" : "Customize & Manage",
    description: primaryLanguage === 'es'
      ? "¡Cambia entre modo oscuro y claro, elimina tarjetas no deseadas y organiza tus mazos como quieras!"
      : "Switch between dark and light mode, delete unwanted cards, and organize your decks however you like!",
    icon: <Settings className="h-12 w-12 text-purple-600" />,
    features: [
      { icon: <Moon className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Modo oscuro" : "Dark mode" },
      { icon: <Sun className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Modo claro" : "Light mode" },
      { icon: <Trash2 className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Eliminar tarjetas/mazos" : "Delete cards/decks" },
      { icon: <Plus className="h-5 w-5" />, text: primaryLanguage === 'es' ? "Crear mazos personalizados" : "Create custom decks" }
    ],
    color: "from-indigo-500 to-purple-600"
  },
  {
    title: primaryLanguage === 'es' ? "¡Listo para Comenzar! 🚀" : "Ready to Start! 🚀",
    description: primaryLanguage === 'es' 
      ? "¡Crea tu primera tarjeta y comienza tu viaje de aprendizaje de español!"
      : "Create your first flashcard and begin your Spanish learning journey!",
    icon: <Sparkles className="h-16 w-16 text-purple-600" />,
    color: "from-purple-500 to-purple-700"
  }
]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    router.push("/")
  }

  const step = tutorialSteps[currentStep]

  const t = {
    previous: primaryLanguage === 'es' ? 'Anterior' : 'Previous',
    skipTutorial: primaryLanguage === 'es' ? 'Saltar Tutorial' : 'Skip Tutorial',
    next: primaryLanguage === 'es' ? 'Siguiente' : 'Next',
    getStarted: primaryLanguage === 'es' ? 'Comenzar' : 'Get Started',
    stepOf: primaryLanguage === 'es' ? 'Paso' : 'Step',
    of: primaryLanguage === 'es' ? 'de' : 'of'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="overflow-hidden">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${step.color} p-8 text-white text-center`}>
            <div className="flex justify-center mb-4">
              {step.icon}
            </div>
            <h1 className="text-3xl font-bold mb-2">{step.title}</h1>
            <p className="text-lg opacity-90">{step.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step.image && (
              <div className="mb-6 rounded-lg overflow-hidden border-2 border-border">
                <div className="relative h-64 bg-muted">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {step.features && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {step.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    {feature.icon && (
                      <div className="text-purple-600">{feature.icon}</div>
                    )}
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-purple-600"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 0}
                className="flex-1 max-w-[120px]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t.previous}
              </Button>

              <Button
                onClick={handleSkip}
                variant="ghost"
                className="text-muted-foreground"
              >
                {t.skipTutorial}
              </Button>

              <Button
                onClick={handleNext}
                className="flex-1 max-w-[120px] bg-purple-600 hover:bg-purple-700"
              >
                {currentStep === tutorialSteps.length - 1 ? t.getStarted : t.next}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {t.stepOf} {currentStep + 1} {t.of} {tutorialSteps.length}
        </div>
      </div>
    </div>
  )
}
