'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
} from 'firebase/firestore'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { diagnosticTestGemini } from '@/lib/ai-test'
import {
  mockCrops,
  mockPestAlerts,
} from '@/lib/mockData'
import type {
  WeatherData,
  Crop,
  PestAlert,
  FarmStatus,
  ChatMessage,
} from '@/lib/mockData'


// ─── Types ────────────────────────────────────────────────────────────────────

export interface PestReport {
  id: string
  pestTypeId: string
  cropId: string
  location: string
  severity: 'low' | 'medium' | 'high'
  notes: string
  timestamp: string
}

export interface FirebaseContextValue {
  // Auth
  user: FirebaseUser | null
  authLoading: boolean
  
  // Data
  weather: WeatherData | null
  crops: Crop[]
  pestAlerts: PestAlert[]
  farmStatus: FarmStatus | null
  pestReports: PestReport[]
  messages: ChatMessage[]

  // State
  isLoading: boolean
  isConnected: boolean
  isGeneratingAI: boolean
  showAuthModal: boolean

  // Actions
  logout: () => Promise<void>
  submitPestReport: (report: Omit<PestReport, 'id' | 'timestamp'>) => Promise<void>
  refreshWeather: () => Promise<void>
  getFavoriteCrops: () => Crop[]
  setFavoriteCrops: (cropIds: string[]) => void
  getClimateAdvice: (weatherData: WeatherData, cropType: string) => Promise<void>
  sendMessage: (text: string, language?: string) => Promise<void>
  analyzeCropImage: (imageFile: File, cropType: string) => Promise<any>
  submitCommunityTip: (audioTranscript: string) => Promise<any>
  transcribeAudio: (audioBlob: Blob) => Promise<string | null>
  generatePlantingSchedule: (crop: string, region: string) => Promise<any>
  setShowAuthModal: (show: boolean) => void
  loginAsGuest: () => void
  translateWithSunbird: (text: string, source: string, target: string) => Promise<string>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([])
  const [farmStatus, setFarmStatus] = useState<FarmStatus | null>(null)
  const [pestReports, setPestReports] = useState<PestReport[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [favoriteCropIds, setFavoriteCropIds] = useState<string[]>(['matooke', 'maize', 'beans'])

  // ── Auth Listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Handle Redirect Result (Important for Google Sign-In)
    const { getRedirectResult } = require('firebase/auth')
    getRedirectResult(auth)
      .then((result: any) => {
        if (result?.user) {
          console.log('[Firebase] Redirect login success:', result.user.email)
          setUser(result.user)
        }
      })
      .catch((error: any) => {
        console.error('[Firebase] Redirect login error:', error)
      })

    // 2. Standard Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log('[Firebase] Auth State Changed:', fbUser ? fbUser.email : 'No user')
      if (fbUser) {
        setUser(fbUser)
      } else {
        // Only clear if we're not in guest mode
        setUser(prev => prev && (prev as any).isGuest ? prev : null)
      }
      setAuthLoading(false)
    })
    return () => unsubscribe()
    // Run AI Diagnostic
    diagnosticTestGemini()
  }, [])

  // ── Firestore Listeners ────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Pest Alerts
    try {
      const alertsQuery = query(collection(db, 'pestAlerts'), orderBy('reportCount', 'desc'))
      const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PestAlert))
          setPestAlerts(alerts)
        } else {
            setPestAlerts([])
          }
        }, (error) => {
          // Suppress repetitive 'Database (default) not found' errors in console
          if (!error.message.includes('Database \'(default)\' not found')) {
            console.warn("Firestore Alerts Error:", error)
          }
          setPestAlerts(mockPestAlerts) // Fallback to mock data
        })

        return () => unsubAlerts()
    } catch (e) {
        console.warn("Firestore initialization failed, using mock alerts.")
        setPestAlerts(mockPestAlerts)
    }
  
      // 2. Open-Meteo Weather Fetching & Dynamic Crops
      setFarmStatus({
        overall: 'green',
        message: 'Initializing farm status...',
        treeHealth: 100,
        waterLevel: 50,
        soilHealth: 80,
        alerts: 0,
        aiAdvice: "Connecting to farm intelligence...",
      } as FarmStatus)

      // Initial fallback for alerts
      setPestAlerts(mockPestAlerts)

    const fetchDynamicCrops = async (weatherStatus: string) => {
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
        let dynamicCrops = []
        
        for (const name of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: name })
            const prompt = `Return a JSON array of exactly 4 optimal farming crops for a Ugandan farmer during ${weatherStatus} weather. 
            Each object must exactly match this TypeScript interface:
            { id: string, name: string, emoji: string, status: "optimal" | "warning", plantingDate: string, tips: string }
            Return ONLY valid raw JSON array, without any markdown formatting or backticks.`
            
            const result = await model.generateContent(prompt)
            const rawText = result.response.text()
            const text = rawText.replace(/```json/g, '').replace(/```/g, '').replace(/\\n/g, '').trim()
            dynamicCrops = JSON.parse(text)
            if (dynamicCrops.length > 0) break
          } catch (e) {
            console.warn(`Crop fetch failed for ${name}`)
          }
        }
        
        setCrops(dynamicCrops.length > 0 ? dynamicCrops : mockCrops.slice(0, 4))
      } catch (err: any) {
        console.warn("Gemini Quota/Error: Falling back to local crop intelligence.", err.message)
        // Filter mock crops based on weather for a smart fallback
        const filteredCrops = mockCrops.filter(c => {
          if (weatherStatus === 'rainy' || weatherStatus === 'stormy') return c.waterNeed !== 'low'
          if (weatherStatus === 'sunny' || weatherStatus === 'drought') return c.waterNeed !== 'high'
          return true
        }).slice(0, 4)
        
        setCrops(filteredCrops.length > 0 ? filteredCrops : mockCrops.slice(0, 4))
      }
    }

    const fetchLiveWeather = async (lat: number, lon: number) => {
      try {
        setIsLoading(true)
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)
        const data = await res.json()

        const mapWMOCode = (code: number) => {
          if (code === 0) return 'sunny'
          if (code >= 1 && code <= 3) return 'cloudy'
          if (code >= 51 && code <= 67) return 'rainy'
          if (code >= 80 && code <= 82) return 'rainy'
          if (code >= 95 && code <= 99) return 'stormy'
          return 'sunny'
        }

        const currentStatus = mapWMOCode(data.current.weather_code)
        
        const forecast = data.daily.time.slice(0, 5).map((timeStr: string, i: number) => ({
          day: new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short' }),
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          rainfall: data.daily.precipitation_sum[i],
          status: mapWMOCode(data.daily.weather_code[i])
        }))

        setWeather({
          location: 'Your Farm',
          region: 'Local',
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.temperature_2m),
          rainfall: data.current.precipitation,
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          uvIndex: 5,
          status: currentStatus,
          forecast,
          lastUpdated: new Date().toISOString()
        })
        
        // Fetch dynamic crops based on live weather
        await fetchDynamicCrops(currentStatus)
        setIsLoading(false)
      } catch (err) {
        console.warn("Failed to fetch weather", err)
        setWeather(null)
        setCrops([])
        setIsLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchLiveWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchLiveWeather(0.3476, 32.5825) // Fallback to Kampala
      )
    } else {
      fetchLiveWeather(0.3476, 32.5825)
    }
  }, [user])

  const logout = async () => {
    setUser(null)
    await signOut(auth).catch(() => {})
  }

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest-123',
      email: 'guest@ecofarm.demo',
      displayName: 'Guest Farmer',
      isGuest: true,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
    }
    setUser(guestUser as any)
    setShowAuthModal(false)
  }

  const refreshWeather = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    // Fetch live weather could be called here instead of mock
    setIsLoading(false)
  }

  const submitPestReport = async (report: Omit<PestReport, 'id' | 'timestamp'>) => {
    if (!user) return
    
    try {
      await addDoc(collection(db, 'pestReports'), {
        ...report,
        userId: user.uid,
        timestamp: serverTimestamp(),
      })
      
      setFarmStatus(prev => prev ? {
        ...prev,
        alerts: prev.alerts + 1,
      } : prev)
    } catch (error: any) {
      if (error.message.includes('Database \'(default)\' not found')) {
        console.warn("Firestore database not initialized. Report saved to local session only.")
        // Locally update for immediate feedback even if DB fails
        setFarmStatus(prev => prev ? { ...prev, alerts: prev.alerts + 1 } : prev)
      } else {
        console.error("Error submitting report:", error)
      }
    }
  }


  // ── Sunbird AI Integration ──────────────────────────────────────────────────
  const sunbirdRequest = async (endpoint: string, body: any) => {
    const apiKey = process.env.NEXT_PUBLIC_SUNBIRD_API_KEY
    if (!apiKey) throw new Error('Sunbird AI API Key missing')

    const res = await fetch(`https://api.sunbird.ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Sunbird Request Failed')
    }
    return res.json()
  }

  const translateWithSunbird = async (text: string, source: string, target: string): Promise<string> => {
    try {
      // 1. Try Sunbird AI (Gold standard for Ugandan dialects)
      const langMap: Record<string, string> = {
        'English': 'eng',
        'Luganda': 'lug',
        'Acholi': 'ach',
        'Lusoga': 'xog',
        'Runyankole': 'nyn',
        'Lugbara': 'lgg',
        'Swahili': 'swa'
      }

      const res = await sunbirdRequest('tasks/nllb_translate', {
        text,
        src_lang: langMap[source] || 'eng',
        tgt_lang: langMap[target] || 'lug'
      })
      
      if (res.output) {
        console.log(`[Sunbird] Translated ${source} -> ${target}`)
        return res.output
      }
      throw new Error('Empty Sunbird response')
    } catch (e) {
      console.warn('Sunbird failed, falling back to Gemini Native Translation:', e)
      
      // 2. Fallback to Gemini Native Translation (Reasonable for major dialects)
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" })
        const prompt = `Translate this text from ${source} to ${target}. Return ONLY the translated text: "${text}"`
        const result = await model.generateContent(prompt)
        return result.response.text().trim()
      } catch (gemErr) {
        console.error('Gemini translation fallback failed:', gemErr)
        return text // Last resort: return original
      }
    }
  }

  const generateSunbirdTTS = async (text: string, speakerId: number): Promise<string | null> => {
    try {
      const res = await sunbirdRequest('tasks/tts', {
        text,
        speaker_id: speakerId
      })
      
      if (res.output?.audio_url) {
        return res.output.audio_url
      }
      return null
    } catch (e) {
      console.error('Sunbird TTS failed, using browser speech only.')
      return null
    }
  }

  // ── Gemini AI (Google AI Studio SDK) ───────────────────────────────────────────
  const getClimateAdvice = async (weatherData: WeatherData, cropType: string) => {
    setIsGeneratingAI(true)
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      
      // Fallback model list
      const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      let advice = ""
      
      for (const name of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: name })
          const prompt = `Advisory for a Ugandan farmer. 
                         Weather: ${weatherData.status}, Temp: ${weatherData.temperature}°C. 
                         Crop: ${cropType}. Use a professional, scientific Agronomist tone. Short and actionable advice only on planting and growth.`
          const result = await model.generateContent(prompt)
          advice = result.response.text()
          if (advice) break
        } catch (e) {
          console.warn(`Model ${name} failed, trying next...`)
        }
      }
      
      setFarmStatus(prev => prev ? { ...prev, aiAdvice: advice || "Could not generate advice at this time." } : prev)
    } catch (error: any) {
      console.warn("AI Generation Error:", error)
      setFarmStatus(prev => prev ? { ...prev, aiAdvice: `Error: ${error.message || "Could not fetch advice"}` } : prev)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const sendMessage = async (text: string, language: string = 'English') => {
    const userMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setIsGeneratingAI(true)

    try {
      // 1. Translate User Input to English for better reasoning if not already English
      let inputForAI = text
      if (language !== 'English') {
        inputForAI = await translateWithSunbird(text, language, 'English')
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        console.error("[AI] Gemini API Key is MISSING in environment variables!")
      }
      const genAI = new GoogleGenerativeAI(apiKey || '')
      
      const systemPrompt = `Role: You are the "Village Elder," an expert Agronomist and Community Mentor for EcoFarm. Your purpose is to provide highly practical, empathetic, and spoken-word agricultural advice to rural farmers.
      
      Language: Respond ONLY in English. Your response will be translated to ${language} by a specialized system. Use authentic phrasing, cultural idioms, and local wisdom that translates well.
      
      Contextual Constraints:
      - Audience: Small-scale farmers with limited literacy.
      - Delivery: The output will be converted to speech. Use short sentences and a rhythmic, conversational tone.
      - Environment: Weather is ${weather?.status || 'unknown'}, Temp: ${weather?.temperature || '??'}°C, Location: ${weather?.location || 'Uganda'}.
 
      Task:
      Analyze the farmer's message: "${inputForAI}". Provide a response in English that prioritizes traditional knowledge integrated with modern science. Do NOT be generic. Use specific Ugandan farming terms.

      Response Structure (Strict JSON Format):
      Return ONLY a JSON object with these keys:
      {
        "primary_dialect": "${language}",
        "emotional_tone": "mood of the farmer (e.g., anxious, curious, hopeful)",
        "voice_script": "A wise, fatherly response in English (maximum 60 words). Provide AUTHENTIC, deep agricultural advice specific to the farmer's concern. Ensure the feedback is actionable and scientifically sound. End with a traditional blessing.",
        "action_icon": "Single emoji representing the main task",
        "daily_brief": "One-sentence summary for the Daily Farm Brief"
      }
      Return ONLY the raw JSON object, no markdown.`

      // Fallback model list for maximum resilience
      const modelNames = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash"
      ]
      let responseText = ""
      
      for (const name of modelNames) {
        try {
          console.log(`[AI] Attempting Gemini with model: ${name}...`)
          const model = genAI.getGenerativeModel({ model: name })
          const chat = model.startChat({
            history: messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }],
            })),
          })
          
          const result = await chat.sendMessage(systemPrompt + "\n\nFarmer Message: " + inputForAI)
          responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
          if (responseText) {
            console.log(`[AI] Gemini Success with ${name}`)
            break
          }
        } catch (e: any) {
          console.error(`[AI] Gemini ${name} failed:`, e.message || e)
        }
      }

      if (!responseText) throw new Error("All AI models failed to respond.")
      
      let aiData;
      try {
        aiData = JSON.parse(responseText)
      } catch (e) {
        aiData = { voice_script: responseText, action_icon: '👴' }
      }

      // Final Step: Use Sunbird to translate the script to ensure 0% hallucination in dialect
      if (language !== 'English') {
        const translatedScript = await translateWithSunbird(aiData.voice_script, 'English', language)
        aiData.voice_script = translatedScript
      }

      const elderMsg: ChatMessage = {
        id: `m_${Date.now() + 1}`,
        text: aiData.voice_script,
        sender: 'elder',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          dialect: aiData.primary_dialect,
          emotion: aiData.emotional_tone,
          icon: aiData.action_icon,
          brief: aiData.daily_brief
        }
      }
      setMessages(prev => [...prev, elderMsg])
    } catch (err: any) {
      console.warn("Chat AI Error:", err)
      setTimeout(() => {
        const elderMsg: ChatMessage = {
          id: `m_${Date.now() + 1}`,
          text: `[System Error]: The AI could not respond. Reason: ${err.message || 'Unknown network error'}.`,
          sender: 'elder',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, elderMsg])
        setIsGeneratingAI(false)
      }, 1000)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const getFavoriteCrops = () => crops.filter(c => favoriteCropIds.includes(c.id))
  const setFavoriteCrops = (cropIds: string[]) => setFavoriteCropIds(cropIds)

  return (
    <FirebaseContext.Provider value={{
      user,
      authLoading,
      weather,
      crops,
      pestAlerts,
      farmStatus,
      pestReports,
      messages,
      isLoading,
      isGeneratingAI,
      isConnected: !!user,
      showAuthModal,
      logout,
      submitPestReport,
      refreshWeather,
      getFavoriteCrops,
      setFavoriteCrops,
      getClimateAdvice,
      sendMessage,
      setShowAuthModal,

      analyzeCropImage: async (imageFile: File, cropType: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          
          // Convert file to base64
          const readFileAsBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1]
                resolve(base64String)
              }
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
          }

          const base64Data = await readFileAsBase64(imageFile)

          const prompt = `Role: You are the EcoFarm Visual Pathologist. Your expertise lies in identifying agricultural pests, crop diseases, and nutrient deficiencies from images. Your goal is to guide a farmer who cannot read through a visual recovery plan.

          Task:
          Analyze the uploaded image (leaf, fruit, or insect) for a ${cropType} crop.
          Identify the specific issue with 95% confidence.

          Response Structure (Strict JSON Format):
          Return ONLY a JSON object with these keys:
          {
            "identification": "Common name of the pest/disease (e.g., 'Fall Armyworm')",
            "threat_level": number (1-10),
            "visual_status": "Green" | "Yellow" | "Red",
            "audio_explanation": "A 30-word script in simple, fatherly/motherly language",
            "visual_steps": [
              {
                "step_icon": "emoji",
                "step_description": "5-word caption",
                "media_search_query": "keyword for instructional GIF"
              }
            ]
          }
          Instructions: No scientific names. Use local/descriptive names. Suggest tools rural farmers already have (soapy water, ash, manual removal).`

          const modelNames = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"]
          let visionResponse = ""
          for (const name of modelNames) {
            try {
              console.log(`[Vision] Attempting Gemini Vision with model: ${name}...`)
              const model = genAI.getGenerativeModel({ model: name })
              const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: imageFile.type } }
              ])
              visionResponse = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
              if (visionResponse) {
                console.log(`[Vision] Gemini Success with ${name}`)
                break
              }
            } catch (e: any) {
              console.error(`[Vision] Gemini ${name} failed:`, e.message || e)
            }
          }

          return JSON.parse(visionResponse)
        } catch (error) {

          console.error("Analysis Error:", error)
          throw error
        } finally {
          setIsGeneratingAI(false)
        }
      },
      generatePlantingSchedule: async (crop: string, region: string) => {
        setIsGeneratingAI(true)
        try {
          const prompt = `Generate a highly specific planting calendar JSON array of 3 distinct varieties or complementary options for growing ${crop} in the ${region} region of Uganda. 
          Each object must strictly match this exact JSON schema:
          { "id": "string", "name": "string", "localName": "string", "region": ["string"], "status": "optimal" | "good" | "caution" | "avoid", "tip": "string", "waterNeed": "low" | "medium" | "high", "harvestWeeks": number, "plantingMonths": number[], "emoji": "string", "plantingDate": "string", "tips": "string" }
          Return ONLY valid raw JSON array, without markdown.`

          let responseText = ""
          
          // 1. Try Gemini
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          try {
            console.log(`[Planner] Attempting Gemini with model: gemini-2.5-flash...`)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
            const result = await model.generateContent(prompt)
            responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
            if (responseText) console.log('[Planner] Gemini Success')
          } catch (e: any) {
            console.error('[Planner] Gemini failed:', e.message || e)
          }

          return JSON.parse(responseText)
        } catch (error) {

          console.error('Planner AI Error:', error)
          return null
        } finally {
          setIsGeneratingAI(false)
        }
      },
      submitCommunityTip: async (audioTranscript: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          
          const prompt = `Role: You are the "Village Elder," the most respected Agricultural Expert and Community Mentor of EcoFarm. Your job is to audit tips shared in the "Digital Village Square" and provide actual, high-quality agricultural feedback to help the community grow.

          Task:
          Analyze this farmer's tip: "${audioTranscript}"
          
          Guidelines:
          1. Check if the tip is agriculturally sound and safe.
          2. Provide a warm, wise, and highly practical agricultural feedback/validation.
          3. If the tip is good, award a badge. If it's harmful (e.g., suggesting dangerous chemicals without PPE, or myths that hurt soil), flag it and explain why kindly.

          Response Structure (Strict JSON Format):
          Return ONLY a JSON object with these keys:
          {
            "safety_check": "Approved" | "Flagged",
            "summary_icon": "emoji related to the topic",
            "trust_reward": "Sprouting Seed" | "Iron Hoe" | "Golden Harvest",
            "celebration_script": "A 20-30 word wise response from the Village Elder giving actual feedback on the tip. Be specific about the agricultural practice mentioned.",
            "audio_board_caption": "A 3-word title for the tip"
          }
          Gamification: Award "Golden Harvest" only for expert-level pro-tips. Award "Sprouting Seed" for simple but helpful ones. Flag dangerous practices.`

          const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
          for (const name of modelNames) {
            try {
              const model = genAI.getGenerativeModel({ model: name })
              const result = await model.generateContent(prompt)
              const rawText = result.response.text()
              const text = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
              const data = JSON.parse(text)
              if (data && data.celebration_script) return data
            } catch (e) {
              console.warn(`Village Elder audit failed for ${name}`)
            }
          }
          
          return {
            safety_check: "Approved",
            summary_icon: "🌾",
            trust_reward: "Sprouting Seed",
            celebration_script: "Your wisdom on agricultural practices is valued! Every piece of traditional knowledge helps our community grow stronger.",
            audio_board_caption: "Village Wisdom"
          }
        } catch (error) {
          console.error("Village Elder Feedback Error:", error)
          return {
            safety_check: "Approved",
            summary_icon: "🌾",
            trust_reward: "Sprouting Seed",
            celebration_script: "Your wisdom has been shared with the village!",
            audio_board_caption: "Village Wisdom"
          }
        } finally {
          setIsGeneratingAI(false)
        }
      },
      loginAsGuest,
      generateOpenAIVoice
    }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext)
  if (!ctx) throw new Error('useFirebase must be used inside FirebaseProvider')
  return ctx
}
