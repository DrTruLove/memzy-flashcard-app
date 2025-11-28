import Replicate from "replicate"

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json({ error: "Image is required" }, { status: 400 })
    }


    // Check if API token exists
    if (!process.env.REPLICATE_API_TOKEN) {
      return Response.json({ error: "API configuration error" }, { status: 500 })
    }

    // Use Replicate with LLaVA vision model
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    
    // Use LLaVA model for image analysis with improved prompt to prioritize people
    const output = await replicate.run(
      "yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
      {
        input: {
          image: imageBase64,
          prompt: "What is the main subject in this image? If there is a person, say 'Person' or 'Man' or 'Woman'. Otherwise, name the main object in 1-2 words:",
          max_tokens: 10 // Limit response length for faster processing
        }
      }
    ) as string[]

    let englishWord = output.join("").trim()
    
    // Clean up response more aggressively
    englishWord = englishWord
      .replace(/[^a-zA-Z\s]/g, '') // Remove punctuation
      .trim()
      .split(/\s+/)
      .slice(0, 2) // Take first 2 words max
      .join(" ")
    
    // Capitalize first letter
    englishWord = englishWord.charAt(0).toUpperCase() + englishWord.slice(1).toLowerCase()


    
    // Use free translation API (MyMemory)
    const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishWord)}&langpair=en|es`
    
    const translateResponse = await fetch(
      translateUrl,
      { signal: AbortSignal.timeout(10000) } // 10 second timeout
    )
    
    if (!translateResponse.ok) {
      throw new Error("Translation failed")
    }
    
    const translateData = await translateResponse.json()
    let spanishTranslation = translateData.responseData.translatedText

    
    // If translation is the same as input, try alternate API (LibreTranslate)
    if (englishWord.toLowerCase() === spanishTranslation.toLowerCase()) {
      try {
        const libreResponse = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: englishWord,
            source: 'en',
            target: 'es',
            format: 'text'
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (libreResponse.ok) {
          const libreData = await libreResponse.json()
          spanishTranslation = libreData.translatedText
        }
      } catch (libreError) {
        // Keep original translation
      }
    }

    return Response.json({
      englishWord,
      spanishTranslation,
    })
  } catch (error: any) {
    return Response.json(
      { 
        error: "Failed to analyze image. Please try again.",
        details: error?.message || "Unknown error"
      },
      { status: 500 },
    )
  }
}
