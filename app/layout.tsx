import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LanguageProvider } from "@/lib/language-context"
import { DecksProvider } from "@/lib/decks-context"
import { SubscriptionProvider } from "@/lib/subscription-context"
import dynamic from "next/dynamic"
import "./globals.css"

const SplashScreen = dynamic(() => import("@/components/splash-screen").then(mod => ({ default: mod.SplashScreen })), { ssr: false })
const UpgradeModal = dynamic(() => import("@/components/upgrade-modal").then(mod => ({ default: mod.UpgradeModal })), { ssr: false })

export const metadata: Metadata = {
  title: "Memzy - AI Flashcard Creator",
  description: "Create beautiful English-Spanish flashcards with AI-powered translation",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Immediate splash background - prevents flash of content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html.splash-active body > *:not(.splash-screen) {
              visibility: hidden !important;
            }
            html.splash-active {
              background-color: #8B2FFB !important;
            }
          `
        }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Show splash background immediately
                if (!sessionStorage.getItem('memzy_splash_done')) {
                  document.documentElement.classList.add('splash-active');
                }
                
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SplashScreen />
        <LanguageProvider>
          <SubscriptionProvider>
            <DecksProvider>
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              <UpgradeModal />
              <Analytics />
            </DecksProvider>
          </SubscriptionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
