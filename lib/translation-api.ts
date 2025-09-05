// Translation API utilities for Transflux


interface TranslationRequest {
  text: string
  targetLanguage: string
  engine: TranslationEngine
  sourceLanguage?: string
}

interface TranslationResponse {
  translatedText: string
  detectedLanguage?: string
  success: boolean
  error?: string
}

interface DetectLanguageResponse {
  detectedLanguage: string
  confidence: number
  success: boolean
  error?: string
}

interface Language {
  code: string
  name: string
}

const API_BASE_URL = "https://translation-server-phi.vercel.app/api"

export async function fetchSupportedLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/languages`)
    if (!response.ok) {
      throw new Error(`Error fetching languages: ${response.status}`)
    }
    const languages = await response.json()
    return languages
  } catch (error) {
    console.error("Failed to fetch languages from API, using fallback:", error)
    // Fallback to common languages if API fails
    return [
      { code: "auto", name: "Auto-detect" },
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
      { code: "ru", name: "Russian" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "th", name: "Thai" },
      { code: "vi", name: "Vietnamese" },
    ]
  }
}

export async function detectLanguage(text: string): Promise<DetectLanguageResponse> {
  try {
    const response = await translateText({
      text,
      targetLanguage: "en", // Dummy target for detection
      engine: "google",
      sourceLanguage: "auto",
    })

    if (response.success && response.detectedLanguage) {
      return {
        detectedLanguage: response.detectedLanguage,
        confidence: 0.9, // API doesn't provide confidence, using default
        success: true,
      }
    } else {
      throw new Error("Detection failed")
    }
  } catch (error) {
    return {
      detectedLanguage: "unknown",
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function translateText({
  text,
  targetLanguage,
  engine,
  sourceLanguage,
}: TranslationRequest): Promise<TranslationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage || "auto",
        target: targetLanguage,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      translatedText: data.translatedText || text,
      detectedLanguage: data.detectedLanguage,
      success: true,
    }
  } catch (error) {
    return {
      translatedText: text,
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/languages`, {
      method: "GET",
    })
    return response.ok
  } catch (error) {
    return false
  }
}
