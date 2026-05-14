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
import { SupportedLanguage } from '@/lib/translations'

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const navTabs = [
  { id: 'home',      label: 'Home',      Icon: Home },
  { id: 'market',    label: 'Market',    Icon: TrendingUp },
  { id: 'calendar',  label: 'Planting',  Icon: Leaf },
  { id: 'community', label: 'Community', Icon: Users },
  { id: 'chat',      label: 'Chat',      Icon: MessageCircle },
  { id: 'alerts',    label: 'Alerts',    Icon: Bell },
  { id: 'track',     label: 'Track',     Icon: Navigation },
]

const tabTitles: Record<string, string> = {
  home:      'EcoFarm',
  market:    'Market',
  calendar:  'Planting',
  community: 'Farmer Community',
  chat:      'Village Elder',
  alerts:    'Pest Alerts',
  track:     'Eco-Track',
}

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab, onToggleSidebar }: { activeTab: string; onToggleSidebar: () => void }) {
  const { isConnected, user, logout, language, setLanguage, t } = useApp()

  const languages: SupportedLanguage[] = ['English', 'Luganda', 'Runyankole', 'Lusoga', 'Acholi', 'Swahili']

  const tabTitleKeys: Record<string, string> = {
    home:      'header.title',
    market:    'header.intel',
    calendar:  'header.planting',
    community: 'header.community',
    chat:      'header.elder',
    alerts:    'header.alerts',
    track:     'header.track',
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 md:left-56 lg:left-64 bg-bone/90 backdrop-blur-md border-b border-border-soft"
    >
      <div className="flex items-center justify-between w-full px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-1 text-ink-muted hover:text-ink transition-colors rounded-lg"
          >
            <Menu size={20} />
          </button>
          <span className="md:hidden font-display font-semibold text-lg text-ink tracking-tight">
            {t('header.title')}
          </span>
        </div>

        <span className="md:hidden font-body text-[10px] font-bold text-ink-muted uppercase tracking-widest truncate max-w-[120px]">
          {t(tabTitleKeys[activeTab]) || t('header.title')}
        </span>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-bone-dim/20 border border-border-soft rounded-lg px-2 py-1 font-body text-[10px] font-bold text-ink outline-none focus:border-forest-tint transition-all"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-bone-card border border-border-soft`}>
            {isConnected
              ? <Wifi className="text-safe" size={14} />
              : <WifiOff className="text-alert" size={14} />}
          </div>
          {user && (
            <button
              onClick={() => logout()}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-bone-card border border-border-soft text-ink-muted hover:text-sienna hover:border-sienna/30 transition-all"
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
  const { user, setShowAuthModal, t } = useApp()

  const navItemKeys: Record<string, string> = {
    home:      'nav.home',
    market:    'nav.market',
    calendar:  'nav.planting',
    community: 'nav.community',
    chat:      'nav.chat',
    alerts:    'nav.alerts',
    track:     'nav.track',
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-ink/30 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`
          mh-sidebar fixed left-0 top-0 bottom-0 z-[70] py-8 px-4 transition-transform duration-500 ease-in-out
          w-72 md:w-56 lg:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sienna flex items-center justify-center shadow-btn">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-forest-light tracking-tight">EcoFarm</span>
          </div>
          <button onClick={onClose} className="md:hidden text-forest-light/50 hover:text-forest-light transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Bogolan divider */}
        <div className="bogolan-divider mb-6 mx-2" />

        <nav className="flex flex-col gap-1">
          {navTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => { onTabChange(id); onClose() }}
                id={`sidebar-tab-${id}`}
                className={`mh-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[12px] font-semibold tracking-wide">{t(navItemKeys[id]) || label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto pt-8">
          <div className="bogolan-divider mb-6 mx-2" />
          {!user ? (
            <button
              onClick={() => { setShowAuthModal(true); onClose() }}
              className="w-full py-3 rounded-lg bg-sienna text-white text-xs font-semibold tracking-wide shadow-btn hover:bg-sienna-dark transition-all"
            >
              Sign In to EcoFarm
            </button>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-forest-medium flex items-center justify-center">
                <span className="text-forest-light text-xs font-bold">{(user.displayName || 'F')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-forest-light text-xs font-semibold truncate">{user.displayName || 'Farmer'}</p>
                <p className="text-forest-light/40 text-[10px] uppercase tracking-wider">Registered</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Home tab ─────────────────────────────────────────────────────────────────
function HomeTab() {
  const { weather, user, systemStats, t } = useApp()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero greeting card */}
      <div
        className="mh-card bogolan-border relative overflow-hidden p-10 md:p-14 min-h-[220px] flex flex-col justify-center"
        style={{ background: 'linear-gradient(135deg, #f4f4ee 0%, #eeeee9 100%)' }}
      >
        {/* Bogolanfini watermark */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232d4b37' stroke-width='1'%3E%3Crect x='6' y='6' width='36' height='36'/%3E%3Crect x='12' y='12' width='24' height='24'/%3E%3Cline x1='6' y1='6' x2='42' y2='42'/%3E%3Cline x1='42' y1='6' x2='6' y2='42'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '48px 48px'
          }}
        />
        <div className="relative z-10">
          <p className="font-body text-[11px] text-ink-muted uppercase tracking-[0.25em] font-semibold mb-3">
            {t('home.welcome').split(',')[0]}
          </p>
          <h1 className="font-display font-semibold text-ink text-4xl md:text-5xl leading-tight">
            {user ? (user.displayName || 'Farmer') : t('auth.signin')}
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <MapPin size={14} className="text-sienna" />
            <p className="font-body text-sm text-ink-muted font-medium">
              {weather ? `${weather.location} · ${weather.temperature}°C` : 'Connecting to farm...'}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <StatusTree compact={false} />
        <WeatherWidget />
      </div>

      {/* Community Stats */}
      <div className="mh-card p-8 bogolan-border">
        <p className="font-body text-[10px] text-ink-muted uppercase tracking-[0.2em] font-bold mb-8">{t('home.activity')}</p>
        <div className="grid grid-cols-3 gap-6 text-center">
          <CommunityStat value={String(systemStats?.farmersCount || 0)} label={t('home.farmers')} Icon={Users} color="text-forest-medium" />
          <CommunityStat value={String(systemStats?.reportsCount || 0)} label={t('home.reports')} Icon={ClipboardList} color="text-sienna" />
          <CommunityStat value={String(systemStats?.districtsCount || 0)} label={t('home.districts')} Icon={MapPin} color="text-ochre-light" />
        </div>
      </div>

      <div>
        <AIVisionModule />
      </div>
    </div>
  )
}

function CommunityStat({ value, label, Icon, color }: { value: string; label: string; Icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className={`w-11 h-11 rounded-xl bg-bone-low border border-border-soft flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-card-sm ${color}`}>
        <Icon size={20} />
      </div>
      <div className="font-display font-semibold text-ink text-2xl leading-tight">{value}</div>
      <div className="font-body text-[10px] text-ink-muted uppercase tracking-widest font-semibold mt-1">{label}</div>
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
      <div className="flex p-1.5 bg-bone-low rounded-2xl border border-border-soft max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setView('request')}
          className={`flex-1 py-3 rounded-xl font-body text-[10px] font-bold uppercase tracking-widest transition-all ${
            view === 'request' ? 'bg-white text-ink shadow-sm' : 'text-ink-faint hover:text-ink'
          }`}
        >
          Book Truck
        </button>
        <button
          onClick={() => setView('buyer')}
          className={`flex-1 py-3 rounded-xl font-body text-[10px] font-bold uppercase tracking-widest transition-all ${
            view === 'buyer' ? 'bg-white text-ink shadow-sm' : 'text-ink-faint hover:text-ink'
          }`}
        >
          Track Load
        </button>
        <button
          onClick={() => setView('driver')}
          className={`flex-1 py-3 rounded-xl font-body text-[10px] font-bold uppercase tracking-widest transition-all ${
            view === 'driver' ? 'bg-white text-ink shadow-sm' : 'text-ink-faint hover:text-ink'
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
            <div className="p-10 md:p-12 text-center space-y-6 mh-card bg-white">
              <div className="w-20 h-20 bg-bone-low rounded-3xl flex items-center justify-center mx-auto mb-2 border border-border-soft shadow-inner">
                <Navigation className="text-ochre-light animate-pulse" size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-ink text-2xl tracking-tight leading-tight">Enter Delivery ID</h3>
                <p className="font-body text-ink-muted text-xs font-medium">Track your agricultural logistics in real-time.</p>
              </div>
              <input
                type="text"
                placeholder="TRK-XXXX-XXXX"
                className="w-full bg-bone-low border border-border-soft rounded-xl px-6 py-4 text-ink text-center focus:border-forest outline-none font-body text-sm font-semibold tracking-widest shadow-inner transition-colors"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button
                onClick={() => setActiveId(trackId)}
                className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-widest justify-center shadow-md transition-all active:scale-95 disabled:opacity-40"
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
                className="w-full py-2 font-body text-ink-faint text-[10px] font-bold uppercase tracking-widest hover:text-ink transition-colors"
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
  const { setShowAuthModal, t } = useApp()
  return (
    <div className="p-10 md:p-12 text-center animate-fade-in mt-10 mh-card bg-white">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-bone-low border border-border-soft shadow-inner">
        <Lock className="text-ochre-light" size={32} />
      </div>
      <h3 className="font-display font-bold text-ink text-3xl mb-2 tracking-tight leading-tight">{t('common.protected')}</h3>
      <p className="font-body text-xs text-ink-muted mb-8 leading-relaxed max-w-[260px] mx-auto font-medium">
        {t('common.protected_desc')}
      </p>
      <button
        onClick={() => setShowAuthModal(true)}
        className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest justify-center shadow-md hover:scale-[1.02] transition-all active:scale-95"
      >
        {t('common.signin_to_continue')}
      </button>
    </div>
  )
}

// ─── Bottom Navigation (Mobile Only) ──────────────────────────────────────────
function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { t } = useApp()

  const navItemKeys: Record<string, string> = {
    home:      'nav.home',
    market:    'nav.market',
    community: 'nav.community',
    chat:      'nav.chat',
    alerts:    'nav.alerts',
  }

  const mobileNavItems = [
    { id: 'home',      label: 'Home',      Icon: Home },
    { id: 'market',    label: 'Market',    Icon: TrendingUp },
    { id: 'community', label: 'Community', Icon: Users },
    { id: 'chat',      label: 'Chat',      Icon: MessageCircle },
    { id: 'alerts',    label: 'Alerts',    Icon: Bell },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-t border-border-soft flex items-center justify-around px-2 py-3 pb-safe shadow-modal">
      {mobileNavItems.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? 'text-sienna' : 'text-ink-muted'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-sienna-pale' : ''}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{t(navItemKeys[id]) || label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { authLoading, showAuthModal, setShowAuthModal } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bone">
        <div className="w-12 h-12 rounded-full border-2 border-forest-light/30 border-t-sienna animate-spin" />
        <p className="font-body text-ink-muted text-[11px] font-semibold uppercase tracking-[0.3em]">Loading EcoFarm</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-bone">
      <AppBar activeTab={activeTab} onToggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pb-28 md:pb-10 pt-14 md:ml-56 lg:ml-64">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <TabContent tab={activeTab} />
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
