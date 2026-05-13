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
import { Wifi, WifiOff, Sparkles, LogOut, Lock, Home, TrendingUp, Leaf, MessageCircle, Bell, Navigation, Truck, Map as MapIcon, FlaskConical, FileText, Globe } from 'lucide-react'
import VillageSquare from '@/components/dashboard/VillageSquare'
import MarketDashboard from '@/components/dashboard/MarketDashboard'
import EcoTrack from '@/components/dashboard/EcoTrack'
import LogisticsViewer from '@/components/dashboard/LogisticsViewer'
import RequestRider from '@/components/dashboard/RequestRider'
import FarmIntelMap from '@/components/dashboard/FarmIntelMap'
import SoilLogger from '@/components/dashboard/SoilLogger'
import MarketPriceBoard from '@/components/dashboard/MarketPriceBoard'
import CropInsightEngine from '@/components/ai/CropInsightEngine'

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const navTabs = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'market',   label: 'Market',   Icon: TrendingUp },
  { id: 'calendar', label: 'Planting', Icon: Leaf },
  { id: 'chat',     label: 'Chat',     Icon: MessageCircle },
  { id: 'alerts',   label: 'Alerts',   Icon: Bell },
  { id: 'track',    label: 'Track',    Icon: Navigation },
]

const tabTitles: Record<string, string> = {
  home:     '🌿 EcoFarm',
  map:      '🗺️ Farm Intelligence Map',
  market:   '📈 Market',
  calendar: '📅 Planting',
  chat:     '👵 Village Elder',
  alerts:   '🚨 Pest Alerts',
  community: '🤝 Digital Village Square',
  soil:     '🌱 Soil Logger',
  track:    '🚚 Eco-Track',
}

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab }: { activeTab: string }) {
  const { isConnected, user, logout } = useFirebase()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 md:left-56 lg:left-64"
    >
      <div className="flex items-center justify-between w-full px-4 py-4 md:px-8">
        {/* Brand logo — mobile only */}
        <span className="md:hidden font-display font-black text-xl tracking-tight text-eco-dark">
          🌿 EcoFarm
        </span>

        {/* Active tab title — mobile only */}
        <span className="md:hidden font-display font-semibold text-sm text-black/40 tracking-wide">
          {tabTitles[activeTab] || '🌿 EcoFarm'}
        </span>

        <div className="hidden md:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-eco-pill`}>
            {isConnected
              ? <Wifi className="text-eco-dark" size={16} />
              : <WifiOff className="text-alert" size={16} />}
          </div>


          {user && (
            <button
              onClick={() => logout()}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/40 transition-all active:scale-90"
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

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { user, setShowAuthModal } = useFirebase()

  return (
    <aside
      className="hidden md:flex flex-col w-56 lg:w-64 fixed left-0 top-0 bottom-0 z-40 border-r border-black/5 py-8 px-4 bg-eco-sidebar"
    >
      <div className="mb-10 px-4 flex items-center gap-2">
        <span className="text-xl">🌿</span>
        <span className="font-display font-black text-lg text-eco-dark uppercase tracking-tight">EcoFarm</span>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navTabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              id={`sidebar-tab-${id}`}
              className={`modern-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="uppercase tracking-widest text-[11px] font-extrabold">{label}</span>
            </button>
          )
        })}
      </nav>

      {!user && (
        <button
          onClick={() => setShowAuthModal(true)}
          className="mt-4 w-full py-3 rounded-xl border border-eco-gold/20 bg-eco-gold/10 text-eco-gold text-[10px] font-black uppercase tracking-widest hover:bg-eco-gold/20 transition-colors"
        >
          Sign In
        </button>
      )}
    </aside>
  )
}


// ─── Home tab ─────────────────────────────────────────────────────────────────
function HomeTab() {
  const { weather, user } = useFirebase()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting hero banner */}
      <div
        className="relative overflow-hidden rounded-[32px] p-10 md:p-14 modern-card min-h-[220px] flex flex-col justify-center"
        style={{
          background: 'linear-gradient(135deg, #F9F1E2 0%, #F3E8D3 100%)',
        }}
      >
        {/* Soil/Track pattern overlay placeholder */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#C6A552 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative z-10">
          <p className="text-[12px] text-black/30 uppercase tracking-[0.2em] font-extrabold mb-2">Good day</p>
          <h2 className="font-display font-black text-eco-dark text-4xl md:text-5xl tracking-tight">
            {user ? (user.displayName || 'Farmer') : 'Evans Rwothomio'}
          </h2>
          <div className="flex items-center gap-2 mt-4 text-black/40 font-bold">
            <span className="text-eco-gold">📍</span>
            <p className="text-sm">
              {weather ? `${weather.location} · ${weather.temperature}°C` : 'Your Farm - 23°C'}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <StatusTree compact={false} />
        <WeatherWidget />
      </div>

      <div className="pt-4">
        <AIVisionModule />
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

// ─── Market tab ───────────────────────────────────────────────────────────────
function MarketTab() {
  return (
    <div className="space-y-4 animate-fade-in">
      <MarketDashboard />
    </div>
  )
}

// ─── Track tab ──────────────────────────────────────────────────────────────
function TrackTab() {
  const [view, setView] = useState<'request' | 'driver' | 'buyer'>('request')
  const [trackId, setTrackId] = useState('')
  const [activeId, setActiveId] = useState('')

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto">
        <button
          onClick={() => setView('request')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            view === 'request' ? 'bg-[#FF9800] text-black shadow-lg' : 'text-white/40'
          }`}
        >
          Book Truck
        </button>
        <button
          onClick={() => setView('buyer')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            view === 'buyer' ? 'bg-forest/40 text-wheat shadow-lg' : 'text-white/40'
          }`}
        >
          Track Load
        </button>
        <button
          onClick={() => setView('driver')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            view === 'driver' ? 'bg-forest/40 text-wheat shadow-lg' : 'text-white/40'
          }`}
        >
          Driver Mode
        </button>
      </div>

      {view === 'request' ? (
        <RequestRider onRiderFound={(tripId) => {
          setTrackId(tripId)
          setActiveId(tripId)
          setView('buyer')
        }} />
      ) : view === 'driver' ? (
        <EcoTrack />
      ) : (
        <div className="space-y-4">
          {!activeId ? (
            <div className="p-8 rounded-2xl text-center space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div className="w-16 h-16 bg-forest/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Truck className="text-wheat" size={32} />
              </div>
              <h3 className="text-white font-bold text-lg">Enter Delivery ID</h3>
              <p className="text-white/50 text-xs">Enter the tracking ID provided by the farmer or driver.</p>
              <input
                type="text"
                placeholder="e.g. 550e8400-e29b-41d4-a716..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:border-forest/50 outline-none"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button
                onClick={() => setActiveId(trackId)}
                className="w-full py-3 rounded-xl bg-btn-primary text-white font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                disabled={!trackId}
              >
                Track Live Movement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <LogisticsViewer tripId={activeId} />
              <button
                onClick={() => setActiveId('')}
                className="w-full py-2 text-white/40 text-xs hover:text-white/60 transition-colors"
              >
                ← Change Trip ID
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab content router ───────────────────────────────────────────────────────
function TabContent({ tab }: { tab: string }) {
  const { user } = useFirebase()

  if (tab === 'home') return <HomeTab />
  if (tab === 'map') return <div className="animate-fade-in"><FarmIntelMap /></div>
  if (tab === 'market') return <MarketTab />
  if (tab === 'track') return <TrackTab />

  if (!user) return <AuthGate tabName={tab} />

  switch (tab) {
    case 'calendar': return <PlantingCalendar />
    case 'soil': return (
      <div className="space-y-5 animate-fade-in">
        <SoilLogger />
        <CropInsightEngine />
        <MarketPriceBoard />
      </div>
    )
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
        {/* Two-column on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <PestAlertsPanel />
          <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
            <PestAlertForm />
          </div>
        </div>
      </div>
    )
    case 'community': return <VillageSquare />
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
    <div className="min-h-screen min-h-dvh flex flex-col" style={{ background: '#FDF8F4' }}>
      <AppBar activeTab={activeTab} />

      {/* Desktop sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content — left-padded on md+ to clear the sidebar */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-8 pt-16 md:ml-56 lg:ml-64">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <TabContent tab={activeTab} />

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

      {/* Bottom nav — mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
