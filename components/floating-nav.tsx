"use client"

import { useState, useEffect } from "react"
import { Home, BookOpen, Plus, Camera, Upload } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

export function FloatingNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { primaryLanguage } = useLanguage()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Prefetch browse-decks on mount for faster navigation
  useEffect(() => {
    router.prefetch('/browse-decks')
  }, [router])

  const navItems = [
    { 
      href: "/", 
      icon: Home, 
      label: primaryLanguage === 'es' ? "Inicio" : "Home" 
    },
    { 
      href: "/browse-decks", 
      icon: BookOpen, 
      label: primaryLanguage === 'es' ? "Explorar Mazos" : "Browse Decks" 
    },
  ]

  const handleTakePhoto = async () => {
    setShowCreateDialog(false)
    // Small delay to let dialog close
    setTimeout(() => {
      router.push('/?action=camera')
    }, 100)
  }

  const handleUploadImage = () => {
    setShowCreateDialog(false)
    // Small delay to let dialog close
    setTimeout(() => {
      router.push('/?action=upload')
    }, 100)
  }

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex gap-2 rounded-full border-2 border-purple-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon
            // Only highlight Home when on home page, Browse Decks never highlighted
            const isActive = item.href === "/" && pathname === "/"
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  isActive ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Create Card Button */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 transition-all text-gray-700 hover:bg-purple-50"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">
              {primaryLanguage === 'es' ? "Crear Tarjeta" : "Create Card"}
            </span>
          </button>
        </div>
      </nav>

      {/* Create Card Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogTitle>
            {primaryLanguage === 'es' ? "Crear Nueva Tarjeta" : "Create New Card"}
          </DialogTitle>
          <div className="space-y-3">
            <Button 
              onClick={handleTakePhoto}
              className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
              size="lg"
            >
              <Camera className="h-5 w-5" />
              {primaryLanguage === 'es' ? "Tomar Foto" : "Take Photo"}
            </Button>
            <Button 
              onClick={handleUploadImage}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <Upload className="h-5 w-5" />
              {primaryLanguage === 'es' ? "Subir Imagen" : "Upload Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
