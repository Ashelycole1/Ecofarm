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
  setShowAuthModal: (show: boolean) => void
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // ── Firestore Listeners ────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Pest Alerts
    const alertsQuery = query(collection(db, 'pestAlerts'), orderBy('reportCount', 'desc'))
    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PestAlert))
        setPestAlerts(alerts)
      } else {
          setPestAlerts([])
        }
      }, (error) => {
        console.warn("Firestore Alerts Error (likely rules):", error)
        setPestAlerts([])
      })
  
      // 2. Open-Meteo Weather Fetching & Dynamic Crops
      setFarmStatus({
        overall: 'green',
        message: 'Initializing farm status...',
        treeHealth: 100,
        waterLevel: 50,
        soilHealth: 80,
        alerts: 0,
        aiAdvice: "Loading AI insights...",
      } as FarmStatus)

    const fetchDynamicCrops = async (weatherStatus: string) => {
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
        const prompt = `Return a JSON array of exactly 4 optimal farming crops for a Ugandan farmer during ${weatherStatus} weather. 
        Each object must exactly match this TypeScript interface:
        { id: string, name: string, emoji: string, status: "optimal" | "warning", plantingDate: string, tips: string }
        Return ONLY valid raw JSON array, without any markdown formatting or backticks.`
        
        const result = await model.generateContent(prompt)
        const rawText = result.response.text()
        const text = rawText.replace(/```json/g, '').replace(/```/g, '').replace(/\\n/g, '').trim()
        const dynamicCrops = JSON.parse(text)
        
        setCrops(dynamicCrops)
      } catch (err: any) {
        console.warn("Failed to generate dynamic crops via Gemini", err)
        setCrops([])
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

    return () => {
      unsubAlerts()
    }
  }, [user])

  const logout = async () => {
    await signOut(auth)
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
    } catch (error) {
      console.error("Error submitting report:", error)
    }
  }

  // ── Gemini AI (Google AI Studio SDK) ───────────────────────────────────────────
  const getClimateAdvice = async (weatherData: WeatherData, cropType: string) => {
    setIsGeneratingAI(true)
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const prompt = `Advisory for a Ugandan farmer. 
                     Weather: ${weatherData.status}, Temp: ${weatherData.temperature}°C. 
                     Crop: ${cropType}. Use a professional, scientific Agronomist tone. Short and actionable advice only on planting and growth.`

      const result = await model.generateContent(prompt)
      const advice = result.response.text()
      
      setFarmStatus(prev => prev ? { ...prev, aiAdvice: advice } : prev)
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
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      })

      const systemPrompt = `Role: You are the "Village Elder," an expert Agronomist and Community Mentor for EcoFarm. Your purpose is to provide highly practical, empathetic, and spoken-word agricultural advice to rural farmers.
      
      Language: Respond ONLY in ${language}. If ${language} is a local Ugandan dialect, use authentic phrasing and cultural idioms.
      
      Contextual Constraints:
      - Audience: Small-scale farmers with limited literacy.
      - Delivery: The output will be converted to speech. Use short sentences and a rhythmic, conversational tone.
      - Environment: Weather is ${weather?.status || 'unknown'}, Temp: ${weather?.temperature || '??'}°C, Location: ${weather?.location || 'Uganda'}.

      Task:
      Analyze the farmer's message. Provide a response in ${language} that prioritizes traditional knowledge integrated with modern science.
      
      Response Structure (Strict JSON Format):
      Return ONLY a JSON object with these keys:
      {
        "primary_dialect": "${language}",
        "emotional_tone": "mood of the farmer (e.g., anxious, curious, hopeful)",
        "voice_script": "Response in ${language} under 60 words. Short sentences. Use 'The Traffic Light' logic (Green=Go, Yellow=Caution, Red=Stop)",
        "action_icon": "Single emoji representing the main task",
        "daily_brief": "One-sentence summary for the Daily Farm Brief"
      }
      Return ONLY the raw JSON object, no markdown.`

      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
      })
      
      const result = await chat.sendMessage(systemPrompt + "\n\nFarmer Message: " + text)
      const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
      
      let aiData;
      try {
        aiData = JSON.parse(responseText)
      } catch (e) {
        aiData = { voice_script: responseText, action_icon: '👴' }
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
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

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

          const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: imageFile.type } }
          ])

          const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
          return JSON.parse(text)
        } catch (error) {
          console.error("Analysis Error:", error)
          throw error
        } finally {
          setIsGeneratingAI(false)
        }
      },
      submitCommunityTip: async (audioTranscript: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

          const prompt = `Role: You are the EcoFarm Community Warden and Storyteller. Your job is to manage the "Digital Village Square," where farmers share voice tips, and to award "Trust Badges" for high-quality, verified reporting.

          Task:
          Audit Audio Tips: Analyze this transcript: "${audioTranscript}"
          Ensure it is safe, helpful, and not spreading misinformation.

          Response Structure (Strict JSON Format):
          Return ONLY a JSON object with these keys:
          {
            "safety_check": "Approved" | "Flagged",
            "summary_icon": "emoji (e.g., 🧪, 🌦️, 💰)",
            "trust_reward": "Sprouting Seed" | "Iron Hoe" | "Golden Harvest",
            "celebration_script": "A 15-word congratulatory voice script",
            "audio_board_caption": "A 3-word visual title"
          }
          Gamification: Award "Golden Harvest" only for data-driven pro-tips. Award "Sprouting Seed" for first-timers. Flag dangerous chemicals or harmful myths.`

          const result = await model.generateContent(prompt)
          const rawText = result.response.text()
          const text = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
          
          try {
            return JSON.parse(text)
          } catch (e) {
            console.warn("JSON Parse failed for Warden, using fallback", text)
            return {
              safety_check: "Approved",
              summary_icon: "🌾",
              trust_reward: "Sprouting Seed",
              celebration_script: "Your wisdom has been shared with the village!",
              audio_board_caption: "Village Wisdom"
            }
          }
        } catch (error) {
          console.error("Community Warden Error:", error)
          throw error
        } finally {
          setIsGeneratingAI(false)
        }
      }
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
