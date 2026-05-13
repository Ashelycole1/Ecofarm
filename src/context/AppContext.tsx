'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { getSupabase } from '@/lib/supabaseClient'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { diagnosticTestGemini } from '@/lib/ai-test'
import {
  mockCrops,
  mockPestAlerts,
  pestTypes,
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

export interface AppContextValue {
  // Auth (Clerk)
  user: any // Clerk User
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

  generatePlantingSchedule: (crop: string, region: string) => Promise<any>
  setShowAuthModal: (show: boolean) => void
  loginAsGuest: () => void
  translateWithSunbird: (text: string, source: string, target: string) => Promise<string>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const [user, setUser] = useState<any>(null)
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

  // ── Auth Sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        setUser({
          uid: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber,
          displayName: clerkUser.fullName || clerkUser.username || 'Farmer',
          photoURL: clerkUser.imageUrl,
        })

        // Ensure user profile exists in Supabase
        const syncProfile = async () => {
          const supabase = getSupabase()
          if (!supabase) return
          const role = (clerkUser.unsafeMetadata?.role as string) || 'farmer'
          const validRole = ['farmer', 'buyer', 'delivery'].includes(role) ? role : 'farmer'
          
          const { error } = await supabase.from('profiles').upsert({
            id: clerkUser.id,
            full_name: clerkUser.fullName || clerkUser.username || 'Farmer',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            phone_number: clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.unsafeMetadata?.phone || '',
            role: validRole,
            avatar_url: clerkUser.imageUrl || ''
          }, { onConflict: 'id' })
          if (error) {
            console.warn('[Supabase] Auto profile sync warning:', error)
          }
        }
        syncProfile()
      } else if (!user?.isGuest) {
        setUser(null)
      }
      setAuthLoading(false)
    }
  }, [isLoaded, isSignedIn, clerkUser, user?.isGuest])

  // ── AI Diagnostic ──────────────────────────────────────────────────────────
  useEffect(() => {
    diagnosticTestGemini().catch(() => {})
  }, [])

  // ── Load Chat History ──────────────────────────────────────────────────────
  useEffect(() => {
    if (user && !user.isGuest) {
      const supabase = getSupabase()
      if (!supabase) return
      
      const loadHistory = async () => {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: true })
        
        if (data) {
          const formatted = data.map(m => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: m.metadata
          }))
          setMessages(formatted)
        }
      }
      loadHistory()
    }
  }, [user])

  // ── Supabase Listeners & Data Fetching ──────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    // 1. Pest Alerts (Supabase Realtime)
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('pest_alerts')
        .select('*')
        .order('report_count', { ascending: false })
      
      if (data && data.length > 0) {
        const mappedAlerts: PestAlert[] = data.map((row: any) => {
          const pt = pestTypes.find(p => p.id === row.pest_type_id)
          return {
            id: row.id,
            pestName: pt ? pt.label : row.pest_type_id,
            emoji: '',
            affectedCrops: [row.crop_id],
            severity: row.severity || 'medium',
            description: `Active sighting reported in ${row.location}. ${pt?.description || ''}`,
            action: 'Apply recommended organic/chemical treatment and notify local agricultural officers.',
            reportCount: row.report_count || 1,
            lastReported: new Date(row.last_reported).toLocaleDateString()
          }
        })
        setPestAlerts(mappedAlerts)
      } else {
        setPestAlerts(mockPestAlerts)
      }
    }

    fetchAlerts()

    // Fetch existing pest reports to populate community counter
    const fetchReports = async () => {
      const { data } = await supabase.from('pest_reports').select('*').order('timestamp', { ascending: false })
      if (data && data.length > 0) {
        const formattedReports = data.map((r: any) => ({
          id: r.id,
          pestTypeId: r.pest_type_id,
          cropId: r.crop_id,
          location: r.location,
          severity: r.severity,
          notes: r.notes,
          timestamp: r.timestamp
        }))
        setPestReports(formattedReports)
      }
    }
    fetchReports()

    const alertsChannel = supabase
      .channel('pest_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pest_alerts' }, fetchAlerts)
      .subscribe()

    // 2. Weather & Crops (Same logic as before)
    setFarmStatus({
      overall: 'green',
      message: 'Initializing farm status...',
      treeHealth: 100,
      waterLevel: 50,
      soilHealth: 80,
      alerts: 0,
      aiAdvice: "Connecting to farm intelligence...",
    } as FarmStatus)

    const fetchDynamicCrops = async (weatherStatus: string) => {
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const modelNames = ["gemini-1.5-flash"]
        let dynamicCrops = []
        
        for (const name of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: name })
            const prompt = `Return a JSON array of exactly 4 optimal farming crops for a Ugandan farmer during ${weatherStatus} weather. 
            Each object must exactly match this TypeScript interface:
            { id: string, name: string, localName: string, status: "optimal" | "warning", plantingDate: string, tips: string }
            Return ONLY valid raw JSON array, without any markdown formatting or backticks. No emojis.`
            
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
        setCrops(mockCrops.slice(0, 4))
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
        
        await fetchDynamicCrops(currentStatus)
        setIsLoading(false)
      } catch (err) {
        setIsLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchLiveWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchLiveWeather(0.3476, 32.5825)
      )
    } else {
      fetchLiveWeather(0.3476, 32.5825)
    }

    return () => {
      alertsChannel.unsubscribe()
    }
  }, [])

  const logout = async () => {
    setUser(null)
    await signOut()
    window.location.reload()
  }

  const loginAsGuest = () => {
    setUser({
      uid: 'guest-123',
      email: 'guest@ecofarm.demo',
      displayName: 'Guest Farmer',
      isGuest: true,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
    })
    setShowAuthModal(false)
  }

  const refreshWeather = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setIsLoading(false)
  }

  const submitPestReport = async (report: Omit<PestReport, 'id' | 'timestamp'>) => {
    if (!user) return
    const supabase = getSupabase()
    if (!supabase) return
    
    try {
      // 1. Insert into pest_reports using correct snake_case column names
      const { error: reportError } = await supabase.from('pest_reports').insert([{
        user_id: user.uid,
        pest_type_id: report.pestTypeId,
        crop_id: report.cropId,
        location: report.location || 'Not specified',
        severity: report.severity,
        notes: report.notes || '',
        timestamp: new Date().toISOString()
      }])
      
      if (reportError) {
        console.error("[Supabase] Error inserting pest_report:", reportError)
        return
      }

      // Dynamically update local state to reflect new report in the UI instantly
      const newReport: PestReport = {
        id: Date.now().toString(),
        pestTypeId: report.pestTypeId,
        cropId: report.cropId,
        location: report.location || 'Not specified',
        severity: report.severity,
        notes: report.notes || '',
        timestamp: new Date().toISOString()
      }
      setPestReports(prev => [newReport, ...prev])

      // 2. Insert or update the aggregated pest_alerts table
      const { data: existingAlerts } = await supabase
        .from('pest_alerts')
        .select('*')
        .eq('pest_type_id', report.pestTypeId)
        .eq('crop_id', report.cropId)
        .limit(1)

      if (existingAlerts && existingAlerts.length > 0) {
        const existing = existingAlerts[0]
        await supabase
          .from('pest_alerts')
          .update({
            report_count: (existing.report_count || 1) + 1,
            last_reported: new Date().toISOString(),
            severity: report.severity
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('pest_alerts')
          .insert([{
            pest_type_id: report.pestTypeId,
            crop_id: report.cropId,
            location: report.location || 'Not specified',
            severity: report.severity,
            report_count: 1,
            last_reported: new Date().toISOString()
          }])
      }
      
      setFarmStatus(prev => prev ? { ...prev, alerts: prev.alerts + 1 } : prev)
    } catch (error) {
      console.error("Error submitting report:", error)
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

    if (!res.ok) throw new Error('Sunbird Request Failed')
    return res.json()
  }

  const translateWithSunbird = async (text: string, source: string, target: string): Promise<string> => {
    try {
      const langMap: Record<string, string> = {
        'English': 'eng', 'Luganda': 'lug', 'Acholi': 'ach', 'Lusoga': 'xog', 'Runyankole': 'nyn', 'Lugbara': 'lgg', 'Swahili': 'swa'
      }
      const res = await sunbirdRequest('tasks/nllb_translate', {
        text, src_lang: langMap[source] || 'eng', tgt_lang: langMap[target] || 'lug'
      })
      return res.output || text
    } catch (e) {
      return text
    }
  }

  const getClimateAdvice = async (weatherData: WeatherData, cropType: string) => {
    setIsGeneratingAI(true)
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const prompt = `Advisory for a Ugandan farmer. Weather: ${weatherData.status}, Temp: ${weatherData.temperature}°C. Crop: ${cropType}. Short and actionable advice.`
      const result = await model.generateContent(prompt)
      const advice = result.response.text()
      setFarmStatus(prev => prev ? { ...prev, aiAdvice: advice } : prev)
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
      let inputForAI = text
      if (language !== 'English') {
        inputForAI = await translateWithSunbird(text, language, 'English')
      }

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const systemPrompt = `Role: Village Elder. Audience: Ugandan farmer. Respond in English about farming. JSON format only: { "voice_script": "...", "action_icon_meta": "...", "daily_brief": "..." }`
      const result = await model.generateContent(systemPrompt + "\n\nFarmer Message: " + inputForAI)
      let responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
      const aiData = JSON.parse(responseText)

      if (language !== 'English') {
        aiData.voice_script = await translateWithSunbird(aiData.voice_script, 'English', language)
      }

      const elderMsg: ChatMessage = {
        id: `m_${Date.now() + 1}`,
        text: aiData.voice_script,
        sender: 'elder',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: { icon: aiData.action_icon_meta, brief: aiData.daily_brief }
      }
      setMessages(prev => [...prev, elderMsg])

      // Persist to Supabase
      if (user && !user.isGuest) {
        const supabase = getSupabase()
        if (supabase) {
          await supabase.from('chat_messages').insert([
            { user_id: user.uid, text, sender: 'user', language },
            { user_id: user.uid, text: aiData.voice_script, sender: 'elder', language, metadata: elderMsg.metadata }
          ])
        }
      }
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <AppContext.Provider value={{
      user, authLoading, weather, crops, pestAlerts, farmStatus, pestReports, messages,
      isLoading, isGeneratingAI, isConnected: !!user, showAuthModal,
      logout, submitPestReport, refreshWeather,
      getFavoriteCrops: () => crops.filter(c => favoriteCropIds.includes(c.id)),
      setFavoriteCrops: (cropIds: string[]) => setFavoriteCropIds(cropIds),
      getClimateAdvice, sendMessage, setShowAuthModal, loginAsGuest, translateWithSunbird,
      analyzeCropImage: async (imageFile: File, cropType: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
          
          const readFileAsBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
          }

          const base64Data = await readFileAsBase64(imageFile)
          const prompt = `Analyze this ${cropType} crop image for pests, diseases, or nutrient deficiencies. Return JSON: { "diagnosis": "...", "confidence": 0.95, "treatment": "...", "severity": "low|medium|high" }. No markdown.`
          
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: imageFile.type } }
          ])
          
          const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
          const diagnosis = JSON.parse(text)

          // Persist report
          if (user && !user.isGuest) {
            const supabase = getSupabase()
            if (supabase) {
              await supabase.from('pest_reports').insert([{
                user_id: user.uid,
                pest_type_id: diagnosis.diagnosis,
                crop_id: cropType,
                location: 'Farm Image Upload',
                severity: diagnosis.severity,
                ai_diagnosis: diagnosis,
                timestamp: new Date().toISOString()
              }])
            }
          }

          return diagnosis
        } finally {
          setIsGeneratingAI(false)
        }
      },
      submitCommunityTip: async (audioTranscript: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
          const prompt = `Audit this farming tip from a Ugandan farmer: "${audioTranscript}". 
          Check if it's safe and helpful. Return JSON: { "safety_check": "Approved|Rejected", "celebration_script": "...", "trust_reward": "Golden Harvest|Iron Hoe|Sprout", "audio_board_caption": "..." }. No markdown.`
          
          const result = await model.generateContent(prompt)
          const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
          return JSON.parse(text)
        } finally {
          setIsGeneratingAI(false)
        }
      },
      generatePlantingSchedule: async (crop: string, region: string) => {
        setIsGeneratingAI(true)
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
          const prompt = `Generate a 4-crop planting schedule for ${crop} in ${region}, Uganda. 
          Return JSON array of 4 objects matching { id, name, localName, status, plantingDate, tips }. No markdown.`
          
          const result = await model.generateContent(prompt)
          const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '')
          const schedule = JSON.parse(text)

          // Persist schedule
          if (user && !user.isGuest) {
            const supabase = getSupabase()
            if (supabase) {
              await supabase.from('planting_schedules').insert([{
                user_id: user.uid,
                crop_name: crop,
                region: region,
                schedule_data: schedule
              }])
            }
          }

          return schedule
        } finally {
          setIsGeneratingAI(false)
        }
      },
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
