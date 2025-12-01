'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSubscription, SUBSCRIPTION_PLANS, PLAN_PRICING } from "@/lib/subscription-context"
import { Crown, Check, X, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

// ===========================
// UPGRADE MODAL COMPONENT
// ===========================

export function UpgradeModal() {
  const { 
    showUpgradeModal, 
    setShowUpgradeModal, 
    upgradeReason,
    upgradeToPro,
    restorePurchases,
    usage,
    freeCardLimit,
    freeExportLimit,
    freeDeckLimit,
  } = useSubscription()
  
  const { primaryLanguage } = useLanguage()
  
  // Translation strings
  const t = {
    unlockPro: primaryLanguage === 'es' ? 'Desbloquear Pro' : 'Unlock Pro',
    getUnlimited: primaryLanguage === 'es' 
      ? 'Obtén tarjetas ilimitadas, mazos ilimitados, descargas ilimitadas y Favoritos.'
      : 'Get unlimited cards, unlimited decks, unlimited downloads, and Favorites.',
    currentUsage: primaryLanguage === 'es' ? 'Uso actual' : 'Current usage',
    cards: primaryLanguage === 'es' ? 'tarjetas' : 'cards',
    exports: primaryLanguage === 'es' ? 'descargas' : 'downloads',
    decks: primaryLanguage === 'es' ? 'mazos' : 'decks',
    proFeatures: primaryLanguage === 'es' ? 'Características Pro' : 'Pro Features',
    unlimitedCards: primaryLanguage === 'es' ? 'Tarjetas AI ilimitadas' : 'Unlimited AI cards',
    unlimitedDecks: primaryLanguage === 'es' ? 'Mazos ilimitados' : 'Unlimited decks',
    unlimitedDownloads: primaryLanguage === 'es' ? 'Descargas ilimitadas' : 'Unlimited downloads',
    favorites: primaryLanguage === 'es' ? 'Función de Favoritos' : 'Favorites feature',
    choosePlan: primaryLanguage === 'es' ? 'Elige tu plan' : 'Choose your plan',
    perMonth: primaryLanguage === 'es' ? '/mes' : '/mo',
    bestValue: primaryLanguage === 'es' ? 'Mejor valor' : 'Best value',
    mostPopular: primaryLanguage === 'es' ? 'Más popular' : 'Most popular',
    cancel: primaryLanguage === 'es' ? 'Cancelar' : 'Cancel',
    restorePurchases: primaryLanguage === 'es' ? 'Restaurar compras' : 'Restore purchases',
    monthly: primaryLanguage === 'es' ? 'Mensual' : 'Monthly',
    sixMonth: primaryLanguage === 'es' ? '6 Meses' : '6 Months',
    yearly: primaryLanguage === 'es' ? 'Anual' : 'Yearly',
  }

  const handleUpgrade = async (planId: string) => {
    const success = await upgradeToPro(planId as any)
    if (success) {
      setShowUpgradeModal(false)
    }
  }

  return (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{t.unlockPro}</DialogTitle>
        <DialogDescription className="sr-only">{t.getUnlimited}</DialogDescription>
        
        {/* Header */}
        <div className="text-center pb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t.unlockPro}</h2>
          {upgradeReason && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">
              {upgradeReason}
            </p>
          )}
          <p className="text-muted-foreground mt-2">{t.getUnlimited}</p>
        </div>

        {/* Current Usage (for free users) */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.currentUsage}:</p>
          <div className="flex justify-between text-sm">
            <span>{usage.cardsCreated}/{freeCardLimit} {t.cards}</span>
            <span>{usage.exportsUsed}/{freeExportLimit} {t.exports}</span>
            <span>{usage.decksCreated}/{freeDeckLimit} {t.decks}</span>
          </div>
        </div>

        {/* Pro Features */}
        <div className="space-y-2 mb-6">
          <p className="text-sm font-semibold text-foreground">{t.proFeatures}:</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: Sparkles, text: t.unlimitedCards },
              { icon: Check, text: t.unlimitedDecks },
              { icon: Check, text: t.unlimitedDownloads },
              { icon: Check, text: t.favorites },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <feature.icon className="w-4 h-4 text-purple-600" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="space-y-3 mb-4">
          <p className="text-sm font-semibold text-foreground">{t.choosePlan}:</p>
          
          {/* Monthly */}
          <button
            onClick={() => handleUpgrade(SUBSCRIPTION_PLANS.PRO_MONTHLY)}
            className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-colors text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{t.monthly}</p>
                <p className="text-2xl font-bold text-purple-600">$5.99<span className="text-sm font-normal text-muted-foreground">{t.perMonth}</span></p>
              </div>
            </div>
          </button>

          {/* 6 Month - Most Popular */}
          <button
            onClick={() => handleUpgrade(SUBSCRIPTION_PLANS.PRO_6MONTH)}
            className="w-full p-4 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors text-left relative"
          >
            <div className="absolute -top-3 left-4 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {t.mostPopular}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{t.sixMonth}</p>
                <p className="text-2xl font-bold text-purple-600">$27.99</p>
                <p className="text-sm text-muted-foreground">$4.66{t.perMonth}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                {PLAN_PRICING[SUBSCRIPTION_PLANS.PRO_6MONTH].savings}
              </div>
            </div>
          </button>

          {/* Yearly - Best Value */}
          <button
            onClick={() => handleUpgrade(SUBSCRIPTION_PLANS.PRO_YEARLY)}
            className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-colors text-left relative"
          >
            <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {t.bestValue}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{t.yearly}</p>
                <p className="text-2xl font-bold text-purple-600">$47.99<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                <p className="text-sm text-muted-foreground">$4.00{t.perMonth}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                {PLAN_PRICING[SUBSCRIPTION_PLANS.PRO_YEARLY].savings}
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => restorePurchases()}
            className="text-sm text-muted-foreground"
          >
            {t.restorePurchases}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowUpgradeModal(false)}
            className="text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            {t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===========================
// PRO BADGE COMPONENT
// ===========================

export function ProBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      <Crown className="w-3 h-3" />
      PRO
    </span>
  )
}

// ===========================
// LIMIT REACHED BADGE
// ===========================

export function LimitReachedBadge({ className = '' }: { className?: string }) {
  const { primaryLanguage } = useLanguage()
  const text = primaryLanguage === 'es' ? 'Límite alcanzado' : 'Limit reached'
  
  return (
    <span className={`inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {text}
    </span>
  )
}

// ===========================
// UPGRADE REQUIRED BADGE
// ===========================

export function UpgradeRequiredBadge({ className = '' }: { className?: string }) {
  const { primaryLanguage } = useLanguage()
  const text = primaryLanguage === 'es' ? 'Requiere Pro' : 'Upgrade required'
  
  return (
    <span className={`inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      <Crown className="w-3 h-3" />
      {text}
    </span>
  )
}

// ===========================
// FREE USAGE INDICATOR
// ===========================

export function FreeUsageIndicator() {
  const { 
    isFreeUser, 
    usage, 
    freeCardLimit,
    getRemainingFreeCards,
  } = useSubscription()
  const { primaryLanguage } = useLanguage()
  
  if (!isFreeUser) return null
  
  const remaining = getRemainingFreeCards()
  const t = {
    freeCards: primaryLanguage === 'es' ? 'Tarjetas gratis' : 'Free cards',
    remaining: primaryLanguage === 'es' ? 'restantes' : 'remaining',
  }
  
  return (
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      <span>{t.freeCards}: {remaining}/{freeCardLimit} {t.remaining}</span>
    </div>
  )
}
