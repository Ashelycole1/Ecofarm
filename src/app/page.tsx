'use client'

import { useState } from 'react'
import StatusTree from '@/components/dashboard/StatusTree'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import PlantingCalendar from '@/components/dashboard/PlantingCalendar'
import PestAlertForm from '@/components/dashboard/PestAlertForm'
import PestAlertsPanel from '@/components/dashboard/PestAlertsPanel'
import VillageElderChat from '@/components/ai/VillageElderChat'
import AIVisionModule from '@/components/ai/AIVisionModule'
import AuthModal from '@/components/auth/AuthModal'
import { useApp } from '@/context/AppContext'
import { Wifi, WifiOff, Sparkles, LogOut, Lock, Home, TrendingUp, Leaf, MessageCircle, Bell, Navigation, FlaskConical, Globe, Menu, X, Users, ClipboardList, MapPin } from 'lucide-react'
import VillageSquare from '@/components/dashboard/VillageSquare'
import MarketDashboard from '@/components/dashboard/MarketDashboard'
import EcoTrack from '@/components/dashboard/EcoTrack'
import LogisticsViewer from '@/components/dashboard/LogisticsViewer'
import LogisticTrackingView from '@/components/dashboard/LogisticTrackingView'

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
  { id: 'community', label: 'Village',  Icon: Globe },
  { id: 'soil',     label: 'Soil',     Icon: FlaskConical },
  { id: 'track',    label: 'Track',    Icon: Navigation },
]

const tabTitles: Record<string, string> = {
  home:     'EcoFarm',

  market:   'Market',
  calendar: 'Planting',
  chat:     'Village Elder',
  alerts:   'Pest Alerts',
  community: 'Digital Village Square',
  soil:     'Soil Logger',
  track:    'Eco-Track',
}

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab, onToggleSidebar }: { activeTab: string; onToggleSidebar: () => void }) {
  const { isConnected, user, logout } = useApp()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]"
      style={{
        background: 'rgba(6,20,18,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between w-full px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="text-leaf" size={18} />
            <span className="font-display font-black text-xl tracking-tight text-white uppercase">
              EcoFarm
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isConnected ? 'bg-safe/10' : 'bg-alert/10'
          }`}>
            {isConnected
              ? <Wifi className="text-safe" size={14} />
              : <WifiOff className="text-alert" size={14} />}
          </div>

          {user && (
            <button
              onClick={() => logout()}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 transition-all active:scale-90 border border-white/10"
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

// ─── Desktop & Mobile Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const { user, setShowAuthModal } = useApp()

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-[70] border-r border-white/[0.08] py-8 px-4 transition-transform duration-500 ease-in-out
          w-72 md:w-56 lg:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          background: '#051412',
        }}
      >
        <div className="flex items-center justify-between mb-8 px-2 md:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="text-leaf" size={18} />
            <span className="font-display font-black text-white uppercase tracking-tight">EcoFarm</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-hide">
          {navTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => {
                  onTabChange(id)
                  onClose()
                }}
                className={`
                  flex items-center gap-3.5 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 text-left
                  ${isActive
                    ? 'bg-forest/20 text-wheat border border-forest-light/20 shadow-2xl'
                    : 'text-white/30 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
                {id === 'alerts' && (
                  <span className="ml-auto w-2 h-2 bg-alert rounded-full shadow-[0_0_8px_rgba(231,76,60,0.6)] animate-pulse" />
                )}
              </button>
            )
          })}
        </nav>

        {!user && (
          <button
            onClick={() => {
              setShowAuthModal(true)
              onClose()
            }}
            className="mt-6 w-full py-4 rounded-2xl border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Sign In
          </button>
        )}
      </aside>
    </>
  )
}

// ─── Home tab ─────────────────────────────────────────────────────────────────
function HomeTab() {
  const { weather, user } = useApp()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting hero banner */}
      <div
        className="relative overflow-hidden rounded-[32px] p-8 border border-white/5 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(6,20,18,0.4) 0%, rgba(6,20,18,0.8) 100%)',
        }}
      >
        <div className="relative z-10">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Good day</p>
          <h2 className="font-display font-black text-white text-3xl md:text-4xl mt-2 tracking-tight">
            {user ? (user.displayName || 'Farmer') : 'EcoFarmer'}
          </h2>
          <p className="text-white/40 text-sm mt-3 font-medium flex items-center gap-2">
            {weather ? (
              <>
                <MapPin size={14} className="text-leaf" />
                {weather.location} · {weather.temperature}°C
              </>
            ) : 'Connecting to farm...'}
          </p>
        </div>
      </div>

      {/* Two-column grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <StatusTree compact={false} />
          <AIVisionModule />
        </div>
        <div className="space-y-6">
          <WeatherWidget />
          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-xl">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-6 font-black">Community This Week</p>
            <div className="grid grid-cols-3 gap-6 text-center">
              <CommunityStat value="247" label="Farmers" Icon={Users} color="text-safe" />
              <CommunityStat value="93"  label="Reports" Icon={ClipboardList} color="text-wheat" />
              <CommunityStat value="12"  label="Districts" Icon={MapPin} color="text-alert" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommunityStat({ value, label, Icon, color }: { value: string; label: string; Icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="font-display font-black text-white text-2xl tracking-tight">{value}</div>
      <div className="text-[9px] text-white/20 uppercase tracking-widest font-black mt-1">{label}</div>
    </div>
  )
}

// ─── Tab content router ───────────────────────────────────────────────────────
function TabContent({ tab }: { tab: string }) {
  const { user } = useApp()

  if (tab === 'home') return <HomeTab />

  if (tab === 'market') return <MarketDashboard />
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
    case 'chat': return <VillageElderChat />
    case 'alerts': return (
      <div className="space-y-8 animate-fade-in">
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

// ─── Sub-tabs for tracking ───────────────────────────────────────────────────
function TrackTab() {
  const [view, setView] = useState<'request' | 'driver' | 'buyer'>('request')
  const [trackId, setTrackId] = useState('')
  const [activeId, setActiveId] = useState('')

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setView('request')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'request' ? 'bg-forest/40 text-wheat shadow-lg' : 'text-white/30'
          }`}
        >
          Book Truck
        </button>
        <button
          onClick={() => setView('buyer')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'buyer' ? 'bg-forest/40 text-wheat shadow-lg' : 'text-white/30'
          }`}
        >
          Track Load
        </button>
        <button
          onClick={() => setView('driver')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'driver' ? 'bg-forest/40 text-wheat shadow-lg' : 'text-white/30'
          }`}
        >
          Driver Mode
        </button>
      </div>

      {view === 'request' ? (
        <LogisticTrackingView />
      ) : view === 'driver' ? (
        <EcoTrack />
      ) : (
        <div className="space-y-4">
          {!activeId ? (
            <div className="p-12 rounded-[32px] text-center space-y-6 bg-white/[0.02] border border-white/5 shadow-2xl">
              <div className="w-20 h-20 bg-forest/20 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-forest/30">
                <Navigation className="text-wheat" size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-black text-xl uppercase tracking-tight">Enter Delivery ID</h3>
                <p className="text-white/30 text-xs font-medium">Track your agricultural logistics in real-time.</p>
              </div>
              <input
                type="text"
                placeholder="TRK-XXXX-XXXX"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-center focus:border-forest/50 outline-none text-sm font-mono tracking-widest"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button
                onClick={() => setActiveId(trackId)}
                className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20"
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
                className="w-full py-2 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
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

function AuthGate({ tabName }: { tabName: string }) {
  const { setShowAuthModal } = useApp()
  return (
    <div className="p-12 text-center animate-fade-in mt-10 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-2xl">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-white/5 border border-white/10">
        <Lock className="text-leaf" size={32} />
      </div>
      <h3 className="font-display font-black text-white text-2xl mb-2 uppercase tracking-tight">Protected Feature</h3>
      <p className="text-xs text-white/30 mb-8 leading-relaxed max-w-[240px] mx-auto font-medium">
        Please sign in to access your personalized {tabName} data and AI advice.
      </p>
      <button
        onClick={() => setShowAuthModal(true)}
        className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
      >
        Sign In to Continue
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { authLoading, showAuthModal, setShowAuthModal } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#051412' }}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-forest/20 rounded-full border-t-leaf animate-spin" />
          <Sparkles className="absolute inset-0 m-auto text-leaf/40" size={24} />
        </div>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Loading EcoFarm</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#051412' }}>
      <AppBar activeTab={activeTab} onToggleSidebar={() => setSidebarOpen(true)} />

      {/* Primary Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content — left-padded on md+ to clear the sidebar */}
      <main className="flex-1 overflow-y-auto pb-12 pt-20 md:ml-56 lg:ml-64">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6">
          <TabContent tab={activeTab} />
        </div>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
