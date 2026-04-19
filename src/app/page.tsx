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
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] px-4 py-3"
      style={{
        background: 'rgba(6,20,18,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        <h1 className="font-display font-black text-xl tracking-tight" style={{ color: '#FFFFFF' }}>
          {titles[activeTab] || '🌿 EcoFarm'}
        </h1>
        
        <div className="flex items-center gap-2.5">
          {/* Connection status */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isConnected ? 'bg-safe/15' : 'bg-alert/15'
          }`}>
            {isConnected ? <Wifi className="text-safe" size={13} /> : <WifiOff className="text-alert" size={13} />}
          </div>
          
          {/* Logout */}
          {user && (
            <button 
              onClick={() => logout()}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 transition-all active:scale-90"
              title="Logout"
            >
              <LogOut size={14} />
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
      {/* Greeting hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(45,102,95,0.55) 0%, rgba(13,36,34,0.80) 100%)',
          border: '1px solid rgba(61,138,129,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 0 40px rgba(45,102,95,0.12)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3D8A81, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2D665F, transparent)' }} />

        <div className="relative z-10">
          <p className="text-[11px] text-forest-light/80 uppercase tracking-widest font-semibold">Good day</p>
          <h2 className="font-display font-bold text-white text-2xl mt-1 high-contrast-text">
            {user ? (user.displayName || 'Farmer') : 'EcoFarmer'} 👋
          </h2>
          <p className="text-white/50 text-sm mt-1.5">
            {weather ? `📍 ${weather.location} · ${weather.temperature}°C` : 'Connecting to farm...'}
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
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(45,102,95,0.18) 0%, rgba(13,36,34,0.55) 100%)',
          border: '1px solid rgba(61,138,129,0.15)',
        }}
      >
        <p className="text-[11px] text-white/35 uppercase tracking-widest mb-3 font-semibold">Community This Week</p>
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
          <Sparkles className="text-forest-light" size={16} />
          <h2 className="font-display font-bold text-white text-lg">Agricultural Expert</h2>
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
    <div
      className="p-8 text-center animate-fade-in mt-10 rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(45,102,95,0.18) 0%, rgba(13,36,34,0.60) 100%)',
        border: '1px solid rgba(61,138,129,0.20)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(45,102,95,0.25)', border: '1px solid rgba(61,138,129,0.30)' }}
      >
        <Lock className="text-forest-light" size={28} />
      </div>
      <h3 className="font-display font-bold text-white text-xl mb-2">Protected Feature</h3>
      <p className="text-xs text-white/40 mb-6 leading-relaxed max-w-[200px] mx-auto">
        Please sign in to access your personalized {tabName} data and AI advice.
      </p>
      <button 
        onClick={() => setShowAuthModal(true)}
        className="btn-primary text-xs py-2.5 px-6"
      >
        Sign In to Continue
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#061412' }}>
        <div className="w-12 h-12 border-2 border-forest rounded-full border-t-forest-light animate-spin" />
        <p className="text-white/30 text-sm font-medium tracking-wide">Loading EcoFarm...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col" style={{ background: '#061412' }}>
      <AppBar activeTab={activeTab} />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-28 pt-16">
        <div className="max-w-md mx-auto px-4 py-5">
          <TabContent tab={activeTab} />
          
          {/* Global sign-in prompt for guests */}
          {!user && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-forest-light/70 hover:text-forest-light font-bold uppercase tracking-widest border-b border-forest-light/20 pb-1 transition-colors"
              >
                Sign In to unlock all features
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
