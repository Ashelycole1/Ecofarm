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
  sendMessage: (text: string) => Promise<void>
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
        status: "Good",
        alerts: 0,
        aiAdvice: "Loading AI insights...",
      } as FarmStatus)

    const fetchDynamicCrops = async (weatherStatus: string) => {
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const prompt = `Return a JSON array of exactly 4 optimal farming crops for a Ugandan farmer during ${weatherStatus} weather. 
        Each object must exactly match this TypeScript interface:
        { id: string, name: string, emoji: string, status: "optimal" | "warning", plantingDate: string, tips: string }
        Return ONLY valid raw JSON array, without any markdown formatting or backticks.`
        
        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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

  const sendMessage = async (text: string) => {
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
        model: "gemini-2.5-flash",
        systemInstruction: "You are a professional agricultural expert and agronomist in Uganda. Provide highly accurate, scientific, and practical advice on planting, soil analysis, and crop growth. Keep responses concise, professional, and directly actionable for farmers.",
      })
      const chat = model.startChat()
      const result = await chat.sendMessage(text)
      const responseText = result.response.text()

      const elderMsg: ChatMessage = {
        id: `m_${Date.now() + 1}`,
        text: responseText,
        sender: 'elder',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
