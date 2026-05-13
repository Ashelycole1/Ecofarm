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
import { Wifi, WifiOff, Sparkles, LogOut, Lock, Home, TrendingUp, Leaf, MessageCircle, Bell, Navigation, Menu, X, Users, ClipboardList, MapPin } from 'lucide-react'
import MarketDashboard from '@/components/dashboard/MarketDashboard'
import EcoTrack from '@/components/dashboard/EcoTrack'
import LogisticsViewer from '@/components/dashboard/LogisticsViewer'
import LogisticTrackingView from '@/components/dashboard/LogisticTrackingView'
import CommunityFeed from '@/components/dashboard/CommunityFeed'

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
  home:     'EcoFarm',
  market:   'Market',
  calendar: 'Planting',
  chat:     'Village Elder',
  alerts:   'Pest Alerts',
  track:    'Eco-Track',
}

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab, onToggleSidebar }: { activeTab: string; onToggleSidebar: () => void }) {
  const { isConnected, user, logout } = useApp()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 md:left-56 lg:left-64"
    >
      <div className="flex items-center justify-between w-full px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 text-eco-dark/50 hover:text-eco-dark transition-colors"
          >
            <Menu size={20} />
          </button>
          {/* Brand logo — mobile only */}
          <span className="md:hidden font-display font-black text-xl tracking-tight text-eco-dark">
            🌿 EcoFarm
          </span>
        </div>

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
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/40 transition-all active:scale-90"
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
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-[70] border-r border-black/5 py-8 px-4 transition-transform duration-500 ease-in-out
          w-72 md:w-56 lg:w-64 bg-eco-sidebar
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between mb-10 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-display font-black text-lg text-eco-dark uppercase tracking-tight">EcoFarm</span>
          </div>
          <button onClick={onClose} className="md:hidden text-black/40 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => {
                  onTabChange(id)
                  onClose()
                }}
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
            onClick={() => {
              setShowAuthModal(true)
              onClose()
            }}
            className="mt-4 w-full py-3 rounded-xl border border-eco-gold/20 bg-eco-gold/10 text-eco-gold text-[10px] font-black uppercase tracking-widest hover:bg-eco-gold/20 transition-colors"
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
  const { weather, user, systemStats } = useApp()

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

      {/* Community Stats Section - Merged from remote but with modern styling */}
      <div className="p-10 rounded-[40px] modern-card bg-eco-sidebar/30 border-black/5 shadow-sm">
        <p className="text-[10px] text-black/20 uppercase tracking-[0.2em] mb-10 font-black">Community This Week</p>
        <div className="grid grid-cols-3 gap-8 text-center">
          <CommunityStat value={String(systemStats?.farmersCount || 247)} label="Farmers" Icon={Users} color="text-eco-dark" />
          <CommunityStat value={String(systemStats?.reportsCount || 93)}  label="Reports" Icon={ClipboardList} color="text-eco-gold" />
          <CommunityStat value={String(systemStats?.districtsCount || 12)}  label="Districts" Icon={MapPin} color="text-forest" />
        </div>
      </div>

      <div className="pt-4">
        <AIVisionModule />
      </div>
    </div>
  )
}

function CommunityStat({ value, label, Icon, color }: { value: string; label: string; Icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={24} />
      </div>
      <div className="font-display font-black text-eco-dark text-3xl tracking-tight">{value}</div>
      <div className="text-[10px] text-black/30 uppercase tracking-widest font-black mt-1">{label}</div>
    </div>
  )
}

// ─── Tab content router ───────────────────────────────────────────────────────
function TabContent({ tab }: { tab: string }) {
  const { user } = useApp()

  if (tab === 'home') return <HomeTab />
  if (tab === 'market') return <MarketDashboard />
  if (tab === 'track') return <TrackTab />
  // Community is publicly viewable; posting requires auth (handled inside component)
  if (tab === 'community') return <CommunityFeed />

  if (!user) return <AuthGate tabName={tab} />

  switch (tab) {
    case 'calendar': return <PlantingCalendar />
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
      <div className="flex p-1 bg-black/5 rounded-2xl border border-black/5 max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setView('request')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'request' ? 'bg-eco-sidebar text-eco-dark shadow-sm' : 'text-black/30'
          }`}
        >
          Book Truck
        </button>
        <button
          onClick={() => setView('buyer')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'buyer' ? 'bg-eco-sidebar text-eco-dark shadow-sm' : 'text-black/30'
          }`}
        >
          Track Load
        </button>
        <button
          onClick={() => setView('driver')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            view === 'driver' ? 'bg-eco-sidebar text-eco-dark shadow-sm' : 'text-black/30'
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
            <div className="p-12 rounded-[40px] text-center space-y-6 modern-card">
              <div className="w-20 h-20 bg-eco-sidebar rounded-3xl flex items-center justify-center mx-auto mb-2 border border-black/5">
                <Navigation className="text-eco-gold" size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-eco-dark font-black text-xl uppercase tracking-tight">Enter Delivery ID</h3>
                <p className="text-black/30 text-xs font-medium">Track your agricultural logistics in real-time.</p>
              </div>
              <input
                type="text"
                placeholder="TRK-XXXX-XXXX"
                className="w-full bg-eco-bg border border-black/5 rounded-2xl px-6 py-4 text-eco-dark text-center focus:border-eco-gold/30 outline-none text-sm font-mono tracking-widest shadow-inner"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button
                onClick={() => setActiveId(trackId)}
                className="w-full py-4 rounded-2xl bg-eco-dark text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-20"
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
                className="w-full py-2 text-black/30 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors"
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
    <div className="p-12 text-center animate-fade-in mt-10 rounded-[40px] modern-card">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-eco-sidebar border border-black/5">
        <Lock className="text-eco-gold" size={32} />
      </div>
      <h3 className="font-display font-black text-eco-dark text-2xl mb-2 uppercase tracking-tight">Protected Feature</h3>
      <p className="text-xs text-black/30 mb-8 leading-relaxed max-w-[240px] mx-auto font-medium">
        Please sign in to access your personalized {tabName} data and AI advice.
      </p>
      <button
        onClick={() => setShowAuthModal(true)}
        className="w-full py-4 rounded-2xl bg-eco-dark text-white font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all active:scale-95"
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#FDF8F4' }}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-eco-sidebar rounded-full border-t-eco-gold animate-spin" />
          <Sparkles className="absolute inset-0 m-auto text-eco-gold/40" size={24} />
        </div>
        <p className="text-black/20 text-[10px] font-black uppercase tracking-[0.3em]">Loading EcoFarm</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col" style={{ background: '#FDF8F4' }}>
      <AppBar activeTab={activeTab} onToggleSidebar={() => setSidebarOpen(true)} />

      {/* Primary Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content — left-padded on md+ to clear the sidebar */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-8 pt-16 md:ml-56 lg:ml-64">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <TabContent tab={activeTab} />
        </div>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
