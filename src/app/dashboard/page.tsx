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
import { Wifi, WifiOff, Sparkles, LogOut, Lock, Home, TrendingUp, Leaf, MessageCircle, Bell, Menu, X, Users, ClipboardList, MapPin } from 'lucide-react'
import MarketDashboard from '@/components/dashboard/MarketDashboard'
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
]

const tabTitles: Record<string, string> = {
  home:      'EcoFarm',
  market:    'Market',
  calendar:  'Planting',
  community: 'Farmer Community',
  chat:      'Village Elder',
  alerts:    'Pest Alerts',
}

// ─── Top app bar ──────────────────────────────────────────────────────────────
function AppBar({ activeTab, onToggleSidebar, desktopSidebarOpen }: { activeTab: string; onToggleSidebar: () => void; desktopSidebarOpen: boolean }) {
  const { isConnected, language, setLanguage, t } = useApp()

  const languages: SupportedLanguage[] = ['English', 'Luganda', 'Runyankole', 'Lusoga', 'Acholi', 'Swahili']

  const tabTitleKeys: Record<string, string> = {
    home:      'header.title',
    market:    'header.intel',
    calendar:  'header.planting',
    community: 'header.community',
    chat:      'header.elder',
    alerts:    'header.alerts',
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#eeeeee] transition-all duration-500 ease-in-out ${desktopSidebarOpen ? 'md:left-56 lg:left-64' : 'md:left-0'}`}
    >
      <div className="flex items-center justify-between w-full px-4 py-3 md:px-8" style={{ minHeight: 60 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-[#555] hover:text-[#111] transition-colors rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="md:hidden font-bold text-[15px] text-[#111]" style={{ fontFamily: 'var(--font-newsreader)' }}>
            {t('header.title')}
          </span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-[#f5f5f2] border border-[#eeeeee] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#555] outline-none focus:border-[#1a3c20] transition-all"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f5f5f2] border border-[#eeeeee]">
            {isConnected
              ? <Wifi className="text-[#4CAF50]" size={14} />
              : <WifiOff className="text-[#ba1a1a]" size={14} />}
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Desktop & Mobile Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ 
  activeTab, 
  onTabChange, 
  mobileSidebarOpen,
  desktopSidebarOpen, 
  onCloseMobile 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  mobileSidebarOpen: boolean; 
  desktopSidebarOpen: boolean;
  onCloseMobile: () => void 
}) {
  const { user, setShowAuthModal, t, logout } = useApp()

  const navItemKeys: Record<string, string> = {
    home:      'nav.home',
    market:    'nav.market',
    calendar:  'nav.planting',
    community: 'nav.community',
    chat:      'nav.chat',
    alerts:    'nav.alerts',
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-ink/30 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`
          mh-sidebar fixed left-0 top-0 bottom-0 z-[70] py-8 px-4 transition-transform duration-500 ease-in-out
          w-72 md:w-56 lg:w-64
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${desktopSidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="EcoFarm Logo" className="w-7 h-7" />
            <span className="font-bold text-[15px] text-white" style={{ fontFamily: 'var(--font-newsreader)' }}>EcoFarm</span>
          </div>
          <button onClick={onCloseMobile} className="md:hidden text-white/40 hover:text-white/80 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Bogolan divider */}
        <div className="h-px bg-white/10 mb-5 mx-1" />

        <nav className="flex flex-col gap-1">
          {navTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => { onTabChange(id); onCloseMobile() }}
                id={`sidebar-tab-${id}`}
                className={`mh-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[12px] font-semibold tracking-wide">{t(navItemKeys[id]) || label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="h-px bg-white/10 mb-5 mx-1" />
          {!user ? (
            <button
              onClick={() => { setShowAuthModal(true); onCloseMobile() }}
              className="w-full py-2.5 rounded-full bg-[#c9773a] text-white text-[12px] font-bold tracking-wide hover:bg-[#a85e28] transition-colors shadow-md"
            >
              Sign In to EcoFarm
            </button>
          ) : (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{(user.displayName || 'F')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-semibold truncate">{user.displayName || 'Farmer'}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Registered</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
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
        className="relative overflow-hidden p-10 md:p-14 min-h-[220px] flex flex-col justify-center rounded-2xl shadow-sm"
        style={{ backgroundColor: '#1a3c20' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#c9773a]/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-[11px] text-[#7ec87a] uppercase tracking-[0.25em] font-bold mb-3 font-body">
            {t('home.welcome').split(',')[0]}
          </p>
          <h1 className="text-white text-4xl md:text-5xl leading-tight font-bold tracking-tight" style={{ fontFamily: 'var(--font-newsreader)' }}>
            {user ? (user.displayName || 'Farmer') : t('auth.signin')}
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <MapPin size={14} className="text-[#c9773a]" />
            <p className="text-[13px] text-white/80 font-medium font-body">
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#eeeeee] flex items-center justify-around px-2 py-2 pb-safe shadow-sm">
      {mobileNavItems.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 transition-all px-2 py-1 rounded-xl ${
              isActive ? 'text-[#c9773a]' : 'text-[#888]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#fdf0e6]' : ''}`}>
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">{t(navItemKeys[id]) || label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const { authLoading, showAuthModal, setShowAuthModal, t } = useApp()

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setDesktopSidebarOpen(prev => !prev)
    } else {
      setMobileSidebarOpen(prev => !prev)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bone">
        <div className="w-12 h-12 rounded-full border-2 border-forest-light/30 border-t-sienna animate-spin" />
        <p className="font-body text-ink-muted text-[11px] font-semibold uppercase tracking-[0.3em]">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-bone overflow-x-hidden">
      <AppBar activeTab={activeTab} onToggleSidebar={toggleSidebar} desktopSidebarOpen={desktopSidebarOpen} />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileSidebarOpen={mobileSidebarOpen}
        desktopSidebarOpen={desktopSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className={`flex-1 overflow-y-auto pb-28 md:pb-10 pt-14 transition-all duration-500 ease-in-out ${desktopSidebarOpen ? 'md:ml-56 lg:ml-64' : 'md:ml-0'}`}>
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <TabContent tab={activeTab} />
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
