import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { englishWord } = await request.json()

    if (!englishWord || typeof englishWord !== "string") {
      return Response.json({ error: "English word is required" }, { status: 400 })
    }


    // Try Gemini first if API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        const prompt = `You are a professional Spanish translator specializing in educational flashcards. 
          
Translate the following English word or phrase to Spanish. Provide ONLY the Spanish translation, nothing else.

Rules:
- If it's a single word, provide the single Spanish word
- If it's a phrase, provide the Spanish phrase
- Use proper Spanish grammar and capitalization
- Do not include explanations, articles (unless part of the phrase), or additional text
- For compound phrases like "Soft Hands", translate as a natural Spanish phrase

English: ${englishWord}
Spanish:`

        const result = await model.generateContent(prompt)
        const spanishTranslation = result.response.text().trim()

        return Response.json({ spanishTranslation })
      } catch (geminiError) {
      }
    }

    // Fallback to free MyMemory API
    const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishWord)}&langpair=en|es`
    
    const translateResponse = await fetch(translateUrl, {
      signal: AbortSignal.timeout(10000)
    })
    
    if (!translateResponse.ok) {
      throw new Error("Translation API request failed")
    }
    
    const translateData = await translateResponse.json()
    const spanishTranslation = translateData.responseData.translatedText

    
    // If translation is same as input, try LibreTranslate
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
          return Response.json({ spanishTranslation: libreData.translatedText })
        }
      } catch (libreError) {
      }
    }

    return Response.json({ spanishTranslation })
  } catch (error) {
    return Response.json({ error: "Failed to translate. Please try again." }, { status: 500 })
  }
}
