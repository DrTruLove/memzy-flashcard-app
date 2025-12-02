"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Globe, Palette, Crown, Sparkles } from "lucide-react"
import { FloatingNav } from "@/components/floating-nav"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/language-context"
import { useSubscription, SUBSCRIPTION_PLANS, FREE_LIMITS } from "@/lib/subscription-context"
import { ProBadge } from "@/components/upgrade-modal"

export default function SettingsPage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { primaryLanguage, setPrimaryLanguage } = useLanguage()
  
  // FREE LIMIT — SUBSCRIPTION HOOK
  const { 
    plan, 
    isFreeUser, 
    isProUser,
    usage, 
    freeCardLimit,
    freeExportLimit,
    freeDeckLimit,
    setShowUpgradeModal,
    setUpgradeReason,
    restorePurchases,
  } = useSubscription()

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
    dark: primaryLanguage === 'es' ? 'Oscuro' : 'Dark',
    // Subscription translations
    subscription: primaryLanguage === 'es' ? 'Suscripción' : 'Subscription',
    freePlan: primaryLanguage === 'es' ? 'Plan Gratis' : 'Free Plan',
    proPlan: primaryLanguage === 'es' ? 'Plan Pro' : 'Pro Plan',
    upgradeNow: primaryLanguage === 'es' ? 'Actualizar Ahora' : 'Upgrade Now',
    restorePurchases: primaryLanguage === 'es' ? 'Restaurar Compras' : 'Restore Purchases',
    usage: primaryLanguage === 'es' ? 'Uso' : 'Usage',
    cardsCreated: primaryLanguage === 'es' ? 'Tarjetas creadas' : 'Cards created',
    downloads: primaryLanguage === 'es' ? 'Descargas' : 'Downloads',
    decks: primaryLanguage === 'es' ? 'Mazos' : 'Decks',
    unlimited: primaryLanguage === 'es' ? 'Ilimitado' : 'Unlimited',
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 pt-safe">
          <div className="mt-2">
            <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-5 w-5" />
              {t.backToHome}
            </Button>
          </div>
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

            {/* Subscription Card */}
            <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${isProUser ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Crown className={`w-6 h-6 ${isProUser ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.subscription}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isProUser ? t.proPlan : t.freePlan}
                    </p>
                  </div>
                </div>
                {isProUser ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-semibold rounded-full">
                    PRO
                  </span>
                ) : (
                  <Button
                    onClick={() => {
                      setUpgradeReason('Unlock unlimited cards, decks, downloads, and favorites!')
                      setShowUpgradeModal(true)
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  >
                    {t.upgradeNow}
                  </Button>
                )}
              </div>
              
              {/* Usage Stats for Free Users */}
              {isFreeUser && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.usage}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t.cardsCreated}</span>
                      <span className={`text-sm font-medium ${usage.cardsCreated >= freeCardLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {usage.cardsCreated} / {freeCardLimit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t.decks}</span>
                      <span className={`text-sm font-medium ${usage.decksCreated >= freeDeckLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {usage.decksCreated} / {freeDeckLimit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t.downloads}</span>
                      <span className={`text-sm font-medium ${usage.exportsUsed >= freeExportLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {usage.exportsUsed} / {freeExportLimit}
                      </span>
                    </div>
                  </div>
                  
                  {/* Restore Purchases Button */}
                  <Button
                    variant="ghost"
                    onClick={restorePurchases}
                    className="w-full mt-4 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    {t.restorePurchases}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
