"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Globe, Palette } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/language-context"

export default function SettingsPage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { primaryLanguage, setPrimaryLanguage } = useLanguage()

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(isDark)
    // Don't apply theme here - it's already applied by layout.tsx
  }, [])

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleLanguage = (checked: boolean) => {
    const newLanguage = checked ? 'es' : 'en'
    setPrimaryLanguage(newLanguage)
  }

  const t = {
    backToHome: primaryLanguage === 'es' ? 'Volver a Inicio' : 'Back to Home',
    settings: primaryLanguage === 'es' ? 'Ajustes' : 'Settings',
    managePreferences: primaryLanguage === 'es' ? 'Administra tus preferencias de Memzy' : 'Manage your Memzy preferences',
    primaryLanguage: primaryLanguage === 'es' ? 'Idioma Principal' : 'Primary Language',
    english: 'English',
    spanish: 'Español',
    appearance: primaryLanguage === 'es' ? 'Apariencia' : 'Appearance',
    lightMode: primaryLanguage === 'es' ? 'Modo Claro' : 'Light Mode',
    darkMode: primaryLanguage === 'es' ? 'Modo Oscuro' : 'Dark Mode',
    light: primaryLanguage === 'es' ? 'Claro' : 'Light',
    dark: primaryLanguage === 'es' ? 'Oscuro' : 'Dark'
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t.backToHome}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{t.settings}</h1>
            <p className="text-muted-foreground">{t.managePreferences}</p>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{t.primaryLanguage}</h3>
                  <p className="text-sm text-muted-foreground">
                    {primaryLanguage === 'en' ? t.english : t.spanish}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${primaryLanguage === 'en' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {t.english}
                  </span>
                  <Switch
                    checked={primaryLanguage === 'es'}
                    onCheckedChange={toggleLanguage}
                    className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                  <span className={`text-sm font-semibold ${primaryLanguage === 'es' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {t.spanish}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{t.appearance}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? t.dark : t.light}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${!isDarkMode ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {t.lightMode}
                  </span>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {t.darkMode}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
