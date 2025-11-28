"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import MemzyLogo from "@/components/memzy-logo"

const quotes = [
  // Original quotes
  "Memory is the mother of all wisdom.",
  "We learn best from what we love.",
  "The art of remembering is the art of noticing.",
  "Every image teaches a word.",
  "Make language personal.",
  "Visual learning sticks forever.",
  "See it, know it, remember it.",
  // Visual learning focused
  "A picture is worth a thousand words.",
  "Your eyes are the gateway to memory.",
  "What you see, you remember.",
  "Images speak louder than definitions.",
  "Paint words in your mind.",
  "Visualize to memorize.",
  "Your brain thinks in pictures.",
  "One glance, lasting knowledge.",
  "See the word, own the word.",
  "Pictures unlock vocabulary.",
  "Visual connections last a lifetime.",
  "Let images do the teaching.",
  "Snapshot learning, permanent results.",
  "Your mind's eye never forgets.",
  "Colors and shapes build language.",
  "Turn words into mental movies.",
  "The brain remembers what it sees.",
  "Every photo tells a Spanish story.",
  "Link images to unlock fluency.",
  "See it once, know it always.",
  "Vision is the language of memory.",
  "Pictures plant words in your mind.",
  "Learn with your eyes, speak with confidence.",
]

// Get a random quote that's different from the last one shown
function getRandomQuote(): string {
  const lastQuoteIndex = parseInt(localStorage.getItem('memzy_last_quote_index') || '-1', 10)
  let newIndex: number
  
  // Keep picking until we get a different quote (unless there's only one quote)
  do {
    newIndex = Math.floor(Math.random() * quotes.length)
  } while (newIndex === lastQuoteIndex && quotes.length > 1)
  
  // Save the new index for next time
  try {
    localStorage.setItem('memzy_last_quote_index', newIndex.toString())
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return quotes[newIndex]
}

export function SplashScreen() {
  // Check sessionStorage to see if we already showed splash this session
  const [shouldShow, setShouldShow] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [quote, setQuote] = useState("")

  // Check on mount if we should show
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('memzy_splash_done')
    if (!alreadyShown) {
      setShouldShow(true)
      setShowContent(true)
      // Get a random quote different from last time
      setQuote(getRandomQuote())
    } else {
      // Remove splash-active class if it's there
      document.documentElement.classList.remove('splash-active')
    }
  }, [])

  useEffect(() => {
    // If we shouldn't show, do nothing
    if (!shouldShow) {
      return
    }
    
    // Lock body scroll
    document.body.style.overflow = 'hidden'

    // Start exit animation after 4.5 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 4500)

    // Hide completely after 5 seconds
    const hideTimer = setTimeout(() => {
      setShowContent(false)
      document.body.style.overflow = 'auto'
      // Mark as shown in sessionStorage
      sessionStorage.setItem('memzy_splash_done', 'true')
      // Remove the splash-active class to reveal content
      document.documentElement.classList.remove('splash-active')
    }, 5000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
      document.body.style.overflow = 'auto'
    }
  }, [shouldShow])

  // Don't render if not showing
  if (!showContent) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1, filter: isExiting ? 'blur(10px)' : 'blur(0px)' }}
      transition={{ duration: 0.5 }}
      className="splash-screen fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#8B2FFB] text-white"
      style={{ pointerEvents: 'all', visibility: 'visible' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo Icon */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: "spring" }}
        >
          <MemzyLogo size={96} variant="white" />
        </motion.div>

        {/* Memzy Text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-6xl font-bold tracking-tight"
        >
          Memzy
        </motion.h1>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="max-w-md px-8 text-center text-lg font-light italic min-h-[60px]"
        >
          "{quote}"
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
