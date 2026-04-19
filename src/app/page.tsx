'use client'

import { useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import StatusTree from '@/components/dashboard/StatusTree'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import PlantingCalendar from '@/components/dashboard/PlantingCalendar'
import PestAlertForm from '@/components/dashboard/PestAlertForm'
import PestAlertsPanel from '@/components/dashboard/PestAlertsPanel'
import VillageElderChat from '@/components/ai/VillageElderChat'
import AIVisionModule from '@/components/ai/AIVisionModule'
import AuthModal from '@/components/auth/AuthModal'
import { useFirebase } from '@/context/FirebaseContext'
import { Wifi, WifiOff, Sparkles, LogOut, User as UserIcon, Lock } from 'lucide-react'

import MarketDashboard from '@/components/dashboard/MarketDashboard'

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab }: { activeTab: string }) {
  const { isConnected, farmStatus, user, logout } = useFirebase()

  const titles: Record<string, string> = {
    home:     '🌿 EcoFarm',
    market:   '📈 Market',
    calendar: '📅 Planting',
    chat:     '👵 Village Elder',
    alerts:   '🚨 Pest Alerts',
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-x-0 border-t-0 border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <h1 className="font-display font-black text-xl text-wheat tracking-tight">
          {titles[activeTab] || '🌿 EcoFarm'}
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`p-1.5 rounded-full ${isConnected ? 'bg-safe/20' : 'bg-alert/20'} transition-colors`}>
            {isConnected ? <Wifi className="text-safe" size={14} /> : <WifiOff className="text-alert" size={14} />}
          </div>
          
          {/* User Profile / Logout */}
          {user && (
            <button 
              onClick={() => logout()}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-all active:scale-90"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Home tab ─────────────────────────────────────────────────────────────────
function HomeTab() {
  const { weather, user } = useFirebase()

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-leaf bg-nature-gradient p-5 shadow-nature">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-wheat/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/3 rounded-full" />

        <div className="relative z-10">
          <p className="text-wheat/80 text-xs uppercase tracking-widest font-medium">Good day</p>
          <h2 className="font-display font-bold text-white text-2xl mt-1 high-contrast-text">
            {user ? (user.displayName || 'Farmer') : 'EcoFarmer'} 👋
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {weather ? `${weather.location} · ${weather.temperature}°C` : 'Connecting to farm...'}
          </p>
        </div>
      </div>

      {/* Status tree — AI Powered */}
      <StatusTree compact={false} />

      {/* AI Vision Quick Link */}
      <AIVisionModule />

      {/* Quick weather summary */}
      <WeatherWidget />

      {/* Community stats */}
      <div className="nature-card p-4">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Community This Week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <CommunityStat value="247" label="Farmers" emoji="👨‍🌾" />
          <CommunityStat value="93" label="Reports" emoji="📋" />
          <CommunityStat value="12" label="Districts" emoji="📍" />
        </div>
      </div>
    </div>
  )
}

function CommunityStat({ value, label, emoji }: { value: string; label: string; emoji: string }) {
  return (
    <div>
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className="font-display font-bold text-wheat text-xl">{value}</div>
      <div className="text-[10px] text-white/40 uppercase tracking-wide">{label}</div>
    </div>
  )
}

// ─── Market tab ──────────────────────────────────────────────────────────────
function MarketTab() {
  return (
    <div className="space-y-4 animate-fade-in">
      <MarketDashboard />
    </div>
  )
}

// ─── Tab content router ───────────────────────────────────────────────────────
function TabContent({ tab }: { tab: string }) {
  const { user } = useFirebase()
  
  // Home and Market remain open for guest viewing
  if (tab === 'home') return <HomeTab />
  if (tab === 'market') return <MarketTab />
  
  // Calendar, Chat, and Alerts require Auth
  if (!user) return <AuthGate tabName={tab} />

  switch (tab) {
    case 'calendar': return <PlantingCalendar />
    case 'chat': return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="text-wheat" size={16} />
          <h2 className="font-display font-bold text-white text-lg">Village Elder</h2>
        </div>
        <VillageElderChat />
      </div>
    )
    case 'alerts': return (
      <div className="space-y-8 animate-fade-in">
        <PestAlertsPanel />
        <div className="border-t border-white/10 pt-6">
          <PestAlertForm />
        </div>
      </div>
    )
    default: return <HomeTab />
  }
}

function AuthGate({ tabName }: { tabName: string }) {
  const { setShowAuthModal } = useFirebase()
  return (
    <div className="nature-card p-8 text-center animate-fade-in mt-10">
      <div className="w-16 h-16 bg-forest/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-forest/30">
        <Lock className="text-wheat" size={32} />
      </div>
      <h3 className="font-display font-bold text-white text-xl mb-2">Protected Feature</h3>
      <p className="text-xs text-white/40 mb-6 leading-relaxed max-w-[200px] mx-auto">
        Please sign in to access your personalized {tabName} data and AI advice.
      </p>
      <button 
        onClick={() => setShowAuthModal(true)}
        className="text-[10px] py-2 px-4 bg-forest text-wheat uppercase font-black tracking-widest rounded-leaf-sm shadow-nature active:scale-95 transition-all outline-none"
      >
        Login Required
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')
  const { authLoading, user, showAuthModal, setShowAuthModal } = useFirebase()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-dark">
        <div className="w-12 h-12 border-4 border-wheat/20 border-t-wheat rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-forest-dark">
      <AppBar activeTab={activeTab} />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-28 pt-16">
        <div className="max-w-md mx-auto px-4 py-5">
          <TabContent tab={activeTab} />
          
          {/* Global login trigger for guests */}
          {!user && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-wheat/60 hover:text-wheat font-bold uppercase tracking-widest border-b border-wheat/20 pb-1"
              >
                Sign In to access all features
              </button>
            </div>
          )}
        </div>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
