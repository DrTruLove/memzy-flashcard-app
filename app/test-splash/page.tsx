"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function TestSplashPage() {
  const router = useRouter()
  const [splashShown, setSplashShown] = useState<string>('Loading...')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Only access sessionStorage after component mounts on client
    const value = sessionStorage.getItem('memzy_splash_shown')
    setSplashShown(value || 'Not set')
  }, [])

  const clearAndReload = () => {
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Navigate to home to see splash
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold">Splash Screen Test</h1>
        
        <div className="space-y-4 text-left bg-gray-100 p-6 rounded-lg">
          <h2 className="font-semibold">Current State:</h2>
          <p className="text-sm">
            Splash shown: <code className="bg-white px-2 py-1 rounded">
              {splashShown}
            </code>
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={clearAndReload}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Clear & Test Splash Screen
          </Button>
          
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Go to Home (No Clear)
          </Button>
        </div>

        <div className="text-xs text-gray-600 space-y-2">
          <p>Expected behavior:</p>
          <ul className="list-disc list-inside text-left space-y-1">
            <li>First button: Clears storage & shows splash</li>
            <li>Second button: Goes to home without splash</li>
            <li>Splash only shows once per session</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
