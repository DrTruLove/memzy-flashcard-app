'use client'

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ===========================
// SUBSCRIPTION TIERS & LIMITS
// ===========================

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO_MONTHLY: 'pro_monthly',
  PRO_6MONTH: 'pro_6month',
  PRO_YEARLY: 'pro_yearly',
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

export const PLAN_PRICING = {
  [SUBSCRIPTION_PLANS.PRO_MONTHLY]: {
    price: 5.99,
    period: 'month',
    displayPrice: '$5.99/mo',
    savings: null,
    googlePlayId: 'memzy_pro_monthly',
    appStoreId: 'memzy_pro_monthly',
  },
  [SUBSCRIPTION_PLANS.PRO_6MONTH]: {
    price: 27.99,
    period: '6 months',
    displayPrice: '$27.99',
    monthlyEquivalent: '$4.66/mo',
    savings: 'Save 22%',
    googlePlayId: 'memzy_pro_6month',
    appStoreId: 'memzy_pro_6month',
  },
  [SUBSCRIPTION_PLANS.PRO_YEARLY]: {
    price: 47.99,
    period: 'year',
    displayPrice: '$47.99/yr',
    monthlyEquivalent: '$4.00/mo',
    savings: 'Save 33%',
    googlePlayId: 'memzy_pro_yearly',
    appStoreId: 'memzy_pro_yearly',
  },
} as const

// FREE PLAN LIMITS
export const FREE_LIMITS = {
  MAX_CARDS: 8,
  MAX_EXPORTS: 1,
  MAX_DECKS: 1,
} as const

// ===========================
// SUBSCRIPTION CONTEXT TYPE
// ===========================

interface SubscriptionUsage {
  cardsCreated: number
  exportsUsed: number
  decksCreated: number
}

interface SubscriptionContextType {
  // Plan status
  plan: SubscriptionPlan
  isFreeUser: boolean
  isProUser: boolean
  
  // Limits
  freeCardLimit: number
  freeExportLimit: number
  freeDeckLimit: number
  
  // Usage tracking
  usage: SubscriptionUsage
  getRemainingFreeCards: () => number
  getRemainingFreeExports: () => number
  getRemainingFreeDecks: () => number
  
  // Usage increment methods
  incrementCreatedCards: () => Promise<boolean>
  incrementExports: () => Promise<boolean>
  incrementDecks: () => Promise<boolean>
  
  // Limit checks
  canCreateCard: () => boolean
  canExport: () => boolean
  canCreateDeck: () => boolean
  canUseFavorites: () => boolean
  
  // Upgrade flow
  showUpgradeModal: boolean
  setShowUpgradeModal: (show: boolean) => void
  upgradeReason: string
  setUpgradeReason: (reason: string) => void
  
  // Subscription management
  upgradeToPro: (planId: SubscriptionPlan) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
  
  // Loading state
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// ===========================
// LOCAL STORAGE KEYS
// ===========================

const STORAGE_KEYS = {
  PLAN: 'memzy_subscription_plan',
  USAGE: 'memzy_subscription_usage',
  PRO_EXPIRY: 'memzy_pro_expiry',
} as const

// ===========================
// SUBSCRIPTION PROVIDER
// ===========================

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.FREE)
  const [usage, setUsage] = useState<SubscriptionUsage>({
    cardsCreated: 0,
    exportsUsed: 0,
    decksCreated: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  
  // Derived state
  const isFreeUser = plan === SUBSCRIPTION_PLANS.FREE
  const isProUser = !isFreeUser
  
  // ===========================
  // LOAD SUBSCRIPTION STATE
  // ===========================
  
  useEffect(() => {
    const loadSubscriptionState = async () => {
      try {
        // Try to load from local storage first (for offline support)
        const storedPlan = localStorage.getItem(STORAGE_KEYS.PLAN)
        const storedUsage = localStorage.getItem(STORAGE_KEYS.USAGE)
        const storedExpiry = localStorage.getItem(STORAGE_KEYS.PRO_EXPIRY)
        
        if (storedPlan) {
          // Check if Pro subscription has expired
          if (storedPlan !== SUBSCRIPTION_PLANS.FREE && storedExpiry) {
            const expiryDate = new Date(storedExpiry)
            if (expiryDate < new Date()) {
              // Subscription expired, revert to free
              setPlan(SUBSCRIPTION_PLANS.FREE)
              localStorage.setItem(STORAGE_KEYS.PLAN, SUBSCRIPTION_PLANS.FREE)
              localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRY)
            } else {
              setPlan(storedPlan as SubscriptionPlan)
            }
          } else {
            setPlan(storedPlan as SubscriptionPlan)
          }
        }
        
        if (storedUsage) {
          setUsage(JSON.parse(storedUsage))
        }
        
        // Try to sync with server if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await syncWithServer(user.id)
        }
      } catch (error) {
        console.error('Error loading subscription state:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSubscriptionState()
  }, [])
  
  // ===========================
  // SYNC WITH SERVER
  // ===========================
  
  const syncWithServer = async (userId: string) => {
    try {
      // Check for subscription in database
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (subscription) {
        // Check if subscription is still active
        if (subscription.status === 'active' && new Date(subscription.expires_at) > new Date()) {
          setPlan(subscription.plan as SubscriptionPlan)
          localStorage.setItem(STORAGE_KEYS.PLAN, subscription.plan)
          localStorage.setItem(STORAGE_KEYS.PRO_EXPIRY, subscription.expires_at)
        } else {
          // Subscription expired
          setPlan(SUBSCRIPTION_PLANS.FREE)
          localStorage.setItem(STORAGE_KEYS.PLAN, SUBSCRIPTION_PLANS.FREE)
        }
      }
      
      // Sync usage from server
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (usageData) {
        const serverUsage = {
          cardsCreated: usageData.cards_created || 0,
          exportsUsed: usageData.exports_used || 0,
          decksCreated: usageData.decks_created || 0,
        }
        setUsage(serverUsage)
        localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(serverUsage))
      }
    } catch (error) {
      // Table might not exist yet, that's okay
      console.log('Subscription sync skipped:', error)
    }
  }
  
  // ===========================
  // SAVE USAGE TO STORAGE
  // ===========================
  
  const saveUsage = useCallback(async (newUsage: SubscriptionUsage) => {
    setUsage(newUsage)
    localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(newUsage))
    
    // Try to sync with server
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_usage')
          .upsert({
            user_id: user.id,
            cards_created: newUsage.cardsCreated,
            exports_used: newUsage.exportsUsed,
            decks_created: newUsage.decksCreated,
            updated_at: new Date().toISOString(),
          })
      }
    } catch (error) {
      console.log('Usage sync skipped:', error)
    }
  }, [])
  
  // ===========================
  // REMAINING COUNTS
  // ===========================
  
  const getRemainingFreeCards = useCallback(() => {
    if (isProUser) return Infinity
    return Math.max(0, FREE_LIMITS.MAX_CARDS - usage.cardsCreated)
  }, [isProUser, usage.cardsCreated])
  
  const getRemainingFreeExports = useCallback(() => {
    if (isProUser) return Infinity
    return Math.max(0, FREE_LIMITS.MAX_EXPORTS - usage.exportsUsed)
  }, [isProUser, usage.exportsUsed])
  
  const getRemainingFreeDecks = useCallback(() => {
    if (isProUser) return Infinity
    return Math.max(0, FREE_LIMITS.MAX_DECKS - usage.decksCreated)
  }, [isProUser, usage.decksCreated])
  
  // ===========================
  // CAN DO CHECKS
  // ===========================
  
  const canCreateCard = useCallback(() => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (isProUser) return true
    return usage.cardsCreated < FREE_LIMITS.MAX_CARDS
  }, [isProUser, usage.cardsCreated])
  
  const canExport = useCallback(() => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (isProUser) return true
    return usage.exportsUsed < FREE_LIMITS.MAX_EXPORTS
  }, [isProUser, usage.exportsUsed])
  
  const canCreateDeck = useCallback(() => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (isProUser) return true
    return usage.decksCreated < FREE_LIMITS.MAX_DECKS
  }, [isProUser, usage.decksCreated])
  
  const canUseFavorites = useCallback(() => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    return isProUser
  }, [isProUser])
  
  // ===========================
  // INCREMENT METHODS
  // ===========================
  
  const incrementCreatedCards = useCallback(async (): Promise<boolean> => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (!canCreateCard()) {
      setUpgradeReason('You\'ve reached the free limit of 8 AI cards. Upgrade to Pro for unlimited cards!')
      setShowUpgradeModal(true)
      return false
    }
    
    if (isFreeUser) {
      const newUsage = { ...usage, cardsCreated: usage.cardsCreated + 1 }
      await saveUsage(newUsage)
    }
    
    return true
  }, [canCreateCard, isFreeUser, usage, saveUsage])
  
  const incrementExports = useCallback(async (): Promise<boolean> => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (!canExport()) {
      setUpgradeReason('You\'ve used your free download. Upgrade to Pro for unlimited downloads!')
      setShowUpgradeModal(true)
      return false
    }
    
    if (isFreeUser) {
      const newUsage = { ...usage, exportsUsed: usage.exportsUsed + 1 }
      await saveUsage(newUsage)
    }
    
    return true
  }, [canExport, isFreeUser, usage, saveUsage])
  
  const incrementDecks = useCallback(async (): Promise<boolean> => {
    // FREE LIMIT — REQUIRE PRO UPGRADE
    if (!canCreateDeck()) {
      setUpgradeReason('Free users can only have 1 deck. Upgrade to Pro for unlimited decks!')
      setShowUpgradeModal(true)
      return false
    }
    
    if (isFreeUser) {
      const newUsage = { ...usage, decksCreated: usage.decksCreated + 1 }
      await saveUsage(newUsage)
    }
    
    return true
  }, [canCreateDeck, isFreeUser, usage, saveUsage])
  
  // ===========================
  // UPGRADE FLOW (PLACEHOLDER)
  // ===========================
  
  const upgradeToPro = useCallback(async (planId: SubscriptionPlan): Promise<boolean> => {
    try {
      // PLACEHOLDER: This will be replaced with actual IAP logic
      // For Google Play: use @capgo/capacitor-purchases or similar
      // For App Store: use the same or StoreKit
      
      console.log('[SubscriptionManager] Initiating upgrade to:', planId)
      
      // Simulate purchase flow
      // In production, this would:
      // 1. Call native IAP module
      // 2. Verify receipt on server
      // 3. Update database
      // 4. Return success/failure
      
      const planInfo = PLAN_PRICING[planId as keyof typeof PLAN_PRICING]
      if (!planInfo) {
        console.error('Invalid plan:', planId)
        return false
      }
      
      // PLACEHOLDER: Native IAP call would go here
      // const purchaseResult = await NativeIAP.purchase(planInfo.googlePlayId)
      
      alert(`This would initiate purchase of ${planInfo.displayPrice} plan.\n\nIn-App Purchase integration coming soon!`)
      
      return false // Return false until IAP is implemented
    } catch (error) {
      console.error('Upgrade error:', error)
      return false
    }
  }, [])
  
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      // PLACEHOLDER: Restore purchases from app store
      console.log('[SubscriptionManager] Restoring purchases...')
      
      // In production, this would:
      // 1. Call native IAP restore
      // 2. Verify receipts
      // 3. Update local state
      
      alert('Restore purchases functionality coming soon!')
      
      return false
    } catch (error) {
      console.error('Restore error:', error)
      return false
    }
  }, [])
  
  // ===========================
  // CONTEXT VALUE
  // ===========================
  
  const value: SubscriptionContextType = {
    plan,
    isFreeUser,
    isProUser,
    
    freeCardLimit: FREE_LIMITS.MAX_CARDS,
    freeExportLimit: FREE_LIMITS.MAX_EXPORTS,
    freeDeckLimit: FREE_LIMITS.MAX_DECKS,
    
    usage,
    getRemainingFreeCards,
    getRemainingFreeExports,
    getRemainingFreeDecks,
    
    incrementCreatedCards,
    incrementExports,
    incrementDecks,
    
    canCreateCard,
    canExport,
    canCreateDeck,
    canUseFavorites,
    
    showUpgradeModal,
    setShowUpgradeModal,
    upgradeReason,
    setUpgradeReason,
    
    upgradeToPro,
    restorePurchases,
    
    isLoading,
  }
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// ===========================
// HOOK
// ===========================

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// ===========================
// DEV HELPER: Set Pro for testing
// ===========================

export function setDevProStatus(isPro: boolean) {
  if (typeof window !== 'undefined') {
    if (isPro) {
      localStorage.setItem(STORAGE_KEYS.PLAN, SUBSCRIPTION_PLANS.PRO_MONTHLY)
      // Set expiry 1 year from now
      const expiry = new Date()
      expiry.setFullYear(expiry.getFullYear() + 1)
      localStorage.setItem(STORAGE_KEYS.PRO_EXPIRY, expiry.toISOString())
    } else {
      localStorage.setItem(STORAGE_KEYS.PLAN, SUBSCRIPTION_PLANS.FREE)
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRY)
    }
    window.location.reload()
  }
}
