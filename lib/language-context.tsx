"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'es'

interface LanguageContextType {
  primaryLanguage: Language
  setPrimaryLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [primaryLanguage, setPrimaryLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language preference on mount
    const savedLanguage = localStorage.getItem('primaryLanguage') as Language | null
    if (savedLanguage) {
      setPrimaryLanguageState(savedLanguage)
    }
  }, [])

  const setPrimaryLanguage = (lang: Language) => {
    setPrimaryLanguageState(lang)
    localStorage.setItem('primaryLanguage', lang)
  }

  return (
    <LanguageContext.Provider value={{ primaryLanguage, setPrimaryLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
