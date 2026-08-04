'use client'

import { useRouter } from 'next/navigation'
import {
  Leaf, ArrowRight, Mic, Activity,
  TrendingUp, Truck, ShoppingBasket, Star, ChevronDown, CheckCircle,
  Menu, X, LogOut, User
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import AuthModal from '@/components/auth/AuthModal'
import { useState, useEffect } from 'react'

// Dashboard tab IDs that match what the dashboard page expects
const FEATURE_ROUTES: Record<string, string> = {
  'AI Crop Diagnosis':  '/dashboard?tab=ai',
  'Direct Market':      '/dashboard?tab=market',
  'Pest Hub':           '/dashboard?tab=community',
  'Logistics':          '/dashboard?tab=logistics',
}

const NAV_ITEMS = [
  { label: 'Home',         href: '#home' },
  { label: 'Features',     href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Partners',     href: '#partners' },
]

export default function LandingPage() {
  const router = useRouter()
  const {
    user, showAuthModal, setShowAuthModal,
    language, setLanguage, logout,
    systemStats,
  } = useApp()

  const [openFaq, setOpenFaq]     = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]   = useState(false)

  // Sticky nav shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ─── Helpers ─────────────────────────────── */

  const goToDashboard = () => router.push('/dashboard')

  /** Auth gate: if logged in go straight to dashboard, else show modal */
  const handleGetStarted = () => {
    if (user) goToDashboard()
    else setShowAuthModal(true)
  }

  /** Auth gate for a specific dashboard tab */
  const handleFeatureClick = (label: string) => {
    if (user) router.push(FEATURE_ROUTES[label] ?? '/dashboard')
    else setShowAuthModal(true)
  }

  /** Smooth-scroll anchor helper */
  const scrollTo = (href: string) => {
    setMobileOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push(href)
    }
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  /* ─── Feature card data ───────────────────── */
  const FEATURES = [
    { icon: Mic,          label: 'AI Crop Diagnosis', sub: 'Voice & photo leaf scan',  topBg: '#1a3c20', iconCol: '#7ec87a' },
    { icon: ShoppingBasket, label: 'Direct Market',   sub: 'Buyer-to-farmer trade',    topBg: '#7a4214', iconCol: '#f5c49a' },
    { icon: Activity,     label: 'Pest Hub',          sub: 'GPS outbreak alerts',       topBg: '#1a3c20', iconCol: '#7ec87a' },
    { icon: Truck,        label: 'Logistics',         sub: 'Book & track trucks',       topBg: '#7a4214', iconCol: '#f5c49a' },
  ]

  const STEPS = [
    { step: '01', title: 'Careful Field Preparation',  desc: 'Farmers get hyper-local planting schedules, soil tips, and climate alerts in their own voice.',  topBg: '#1a3c20', accent: '#7ec87a' },
    { step: '02', title: 'Fresh Crop Monitoring',      desc: 'Community pest alerts and AI-guided advice catch problems before they spread.',                   topBg: '#2d5e34', accent: '#a8cc8c' },
    { step: '03', title: 'Reliable Market Delivery',   desc: 'Match harvest to buyers and book verified trucks — transparently, in one tap.',                   topBg: '#7a4214', accent: '#f5c49a' },
  ]

  const TESTIMONIALS = [
    { name: 'Sarah K.', role: 'Smallholder Farmer, Iganga',   quote: 'The pest alert saved my maize crop. I heard about the armyworm before it reached my farm.',         initials: 'SK', color: '#1a3c20' },
    { name: 'Moses T.', role: 'Produce Buyer, Kampala',        quote: 'I source directly from verified farmers now. No middlemen, better prices, fresher produce every week.', initials: 'MT', color: '#c9773a' },
    { name: 'Grace N.', role: 'Transport Driver, Jinja',       quote: 'Finding delivery jobs used to take days. With EcoFarm I find a job every single morning.',           initials: 'GN', color: '#1a3c20' },
  ]

  const FAQS = [
    { q: 'Do farmers accept organic farming techniques?',     a: 'Yes. EcoFarm actively promotes organic practices through our AI Crop Advisor. Farmers get voice-guided advice on natural pest control tailored to their region and dialect.' },
    { q: 'How do platform features and supply services work?', a: 'Farmers list their harvest, buyers browse verified produce, and drivers find pickup jobs — all without middlemen. The platform handles payments securely.' },
    { q: 'How does recommended quality work?',                a: 'Farmers photograph their produce and our AI grades it for quality. Buyers see verified quality ratings before any purchase offer, ensuring fair pricing.' },
    { q: 'Do you offer delivery services?',                   a: 'Yes. Verified truck drivers register, browse available jobs, optimise routes, and receive guaranteed payments after delivery confirmation.' },
  ]

  const LANGUAGES: { name: string; code: string }[] = [
    { name: 'English',    code: 'EN' },
    { name: 'Luganda',    code: 'LG' },
    { name: 'Runyankole', code: 'NY' },
    { name: 'Lusoga',     code: 'SG' },
    { name: 'Acholi',     code: 'AC' },
    { name: 'Swahili',    code: 'SW' },
  ]

  // Map language code → SupportedLanguage value expected by AppContext
  const LANG_MAP: Record<string, string> = {
    EN: 'English', LG: 'Luganda', NY: 'Runyankole', SG: 'Lusoga', AC: 'Acholi', SW: 'Swahili',
  }

  const currentLangCode = Object.entries(LANG_MAP).find(([, v]) => v === language)?.[0] ?? 'EN'

  /* ─── Render ──────────────────────────────── */
  return (
    <div
      className="min-h-screen bg-white text-[#111] overflow-x-hidden"
      style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif' }}
    >

      {/* ── NAV ───────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-sm' : 'border-b border-[#eee]'}`}
      >
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => scrollTo('#home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-[#1a3c20] flex items-center justify-center">
              <Leaf size={13} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-[#111]">EcoFarm</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="text-[13.5px] text-[#555] hover:text-[#1a3c20] font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={goToDashboard}
                  className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1a3c20] hover:underline"
                >
                  <User size={14} /> Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-[13px] text-[#888] hover:text-red-500 transition-colors"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-[13.5px] font-semibold text-[#111] hover:text-[#1a3c20] transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-5 py-2 rounded-full bg-[#1a3c20] text-white text-[13px] font-bold hover:bg-[#122a17] transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-[#eee] px-6 py-4 space-y-3 shadow-lg">
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="block w-full text-left text-[14px] font-medium text-[#555] hover:text-[#1a3c20] py-1.5 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t border-[#eee] flex flex-col gap-2">
              {user ? (
                <>
                  <button onClick={() => { setMobileOpen(false); goToDashboard() }}
                    className="w-full py-2.5 rounded-full bg-[#1a3c20] text-white text-[13px] font-bold">
                    Go to Dashboard
                  </button>
                  <button onClick={() => { setMobileOpen(false); handleSignOut() }}
                    className="w-full py-2.5 rounded-full border border-red-200 text-red-500 text-[13px] font-semibold">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMobileOpen(false); setShowAuthModal(true) }}
                    className="w-full py-2.5 rounded-full border border-[#1a3c20] text-[#1a3c20] text-[13px] font-semibold">
                    Sign in
                  </button>
                  <button onClick={() => { setMobileOpen(false); handleGetStarted() }}
                    className="w-full py-2.5 rounded-full bg-[#1a3c20] text-white text-[13px] font-bold">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="pt-[60px]">

        {/* ── HERO ──────────────────────────────── */}
        <section id="home" className="bg-[#1a3c20]">
          <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[520px]">

            <div>
              <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/90 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9773a]"></span>
                Uganda&apos;s #1 AgriTech Platform
              </div>

              <h1
                className="text-[2.5rem] md:text-[3.2rem] font-bold text-white leading-[1.08] mb-5 tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                Organic Fresh<br />Produce Grown<br />With Care
              </h1>

              <p className="text-[14px] text-white/65 leading-relaxed max-w-sm mb-8">
                EcoFarm helps farmers, buyers and logistics partners grow smarter — with voice-guided AI, real-time market prices, and community pest alerts. No reading required.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#c9773a] text-white text-[13.5px] font-bold hover:bg-[#a85e28] transition-colors shadow-[0_4px_16px_rgba(201,119,58,0.35)]"
                >
                  {user ? 'Go to Dashboard' : 'Start for Free'} <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => scrollTo('#how-it-works')}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white text-[13.5px] font-semibold hover:bg-white/10 transition-colors"
                >
                  How it works
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {['MAAIF Aligned', 'WFP Supported', 'UN Program'].map(b => (
                  <div key={b} className="flex items-center gap-1.5 text-[12px] font-medium text-white/55">
                    <CheckCircle size={13} className="text-[#7ec87a]" /> {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating card panel */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-[320px] lg:w-[340px]">
                <div className="bg-[#f5f5f2] rounded-2xl p-5 shadow-xl relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest">Live Network</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1a3c20]">
                      <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { val: `${systemStats.farmersCount > 0 ? systemStats.farmersCount.toLocaleString() : '11k+'}`, lab: 'Farmers' },
                      { val: `${systemStats.reportsCount > 0 ? systemStats.reportsCount : '3'}`, lab: 'Alerts' },
                      { val: '6', lab: 'Dialects' },
                    ].map(s => (
                      <div key={s.lab} className="bg-white rounded-xl p-3 text-center shadow-sm">
                        <div className="text-lg font-bold text-[#1a3c20]" style={{ fontFamily: 'var(--font-newsreader)' }}>{s.val}</div>
                        <div className="text-[11px] text-[#888] mt-0.5">{s.lab}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleGetStarted}
                    className="w-full bg-white rounded-xl p-4 border border-[#f0ebe4] text-left hover:border-[#c9773a]/30 hover:bg-[#fffbf8] transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#fdf0e6] flex items-center justify-center">
                        <Activity size={14} className="text-[#c9773a]" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-[#c9773a] uppercase tracking-wider">Pest Alert</span>
                        <span className="block text-[13px] font-bold text-[#111]">Fall armyworm — 2 farms away</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#888]">14 neighbors notified · <span className="text-[#c9773a] font-semibold group-hover:underline">View on map →</span></p>
                  </button>
                </div>

                <div className="absolute -left-12 top-8 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 w-[140px]">
                  <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Farmers Active</div>
                  <div className="text-2xl font-bold text-[#1a3c20]" style={{ fontFamily: 'var(--font-newsreader)' }}>200K+</div>
                  <div className="text-[11px] text-[#aaa]">Across Uganda</div>
                </div>

                <div className="absolute -right-6 bottom-16 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 w-[140px]">
                  <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Revenue Up</div>
                  <div className="text-2xl font-bold text-[#c9773a]" style={{ fontFamily: 'var(--font-newsreader)' }}>300K+</div>
                  <div className="text-[11px] text-[#aaa]">This season</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TAGLINE ───────────────────────────── */}
        <section className="py-14 px-6 border-b border-[#eee]">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-[1.8rem] md:text-[2.2rem] font-bold leading-[1.2] text-[#111] max-w-3xl"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Fresh harvests. Sustainable farming.{' '}
              EcoFarm delivers{' '}
              <span className="text-[#c9773a]">naturally grown produce</span>{' '}
              with quality, care, and everyday freshness.
            </h2>
          </div>
        </section>

        {/* ── SPLIT PANEL ───────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '380px' }}>
          <div className="bg-[#1a3c20] relative overflow-hidden" style={{ minHeight: '280px' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a5630] to-[#1a3c20]"></div>
            <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-white/5 border border-white/10"></div>
            <div className="absolute bottom-10 left-12 w-20 h-20 rounded-full bg-white/5"></div>
            <div className="absolute bottom-8 left-8 text-white z-10">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-[#7ec87a] mb-1">Voice-guided AI</span>
              <span className="block text-2xl font-bold" style={{ fontFamily: 'var(--font-newsreader)' }}>Farming for Everyone</span>
            </div>
          </div>
          <div className="bg-[#f5f5f2] p-10 lg:p-14 flex items-center">
            <div>
              <h3
                className="text-[1.4rem] font-bold leading-snug text-[#111] mb-4"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                We cultivate modern agricultural innovation with local wisdom and accessible tools.
              </h3>
              <p className="text-[14px] text-[#666] leading-relaxed mb-6">
                From the smallholder in Iganga to the wholesale buyer in Kampala, EcoFarm creates a transparent, voice-first agricultural ecosystem that works even without internet or literacy.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a3c20] text-white text-[13px] font-bold hover:bg-[#122a17] transition-colors"
              >
                Join EcoFarm <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────── */}
        <section className="py-12 border-b border-[#eee]">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '25', unit: '.', sub: 'Regions Covered' },
              { num: '50',  unit: 'K+', sub: 'Active Farmers' },
              { num: '1',   unit: 'M+', sub: 'Transactions Completed' },
              { num: '−40', unit: '%',  sub: 'Crop Loss Reduced' },
            ].map(s => (
              <div key={s.sub}>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-[2.4rem] font-bold text-[#111]" style={{ fontFamily: 'var(--font-newsreader)' }}>{s.num}</span>
                  <span className="text-[1.2rem] font-bold text-[#c9773a]" style={{ fontFamily: 'var(--font-newsreader)' }}>{s.unit}</span>
                </div>
                <p className="text-[12px] text-[#888] mt-1 font-medium">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────── */}
        <section id="features" className="py-16 bg-[#f5f5f2]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-[1.4rem] font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>
                Our Platform Features
              </h2>
              <p className="text-[13px] text-[#888]">
                Everything a <span className="text-[#1a3c20] font-semibold">farmer</span>,{' '}
                <span className="text-[#c9773a] font-semibold">buyer</span>, or{' '}
                <span className="text-[#1a3c20] font-semibold">driver</span> needs — in one icon-driven app.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {FEATURES.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleFeatureClick(item.label)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer text-left group"
                >
                  <div className="h-[130px] flex items-center justify-center relative" style={{ backgroundColor: item.topBg }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <item.icon size={22} style={{ color: item.iconCol }} />
                    </div>
                    <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: item.iconCol }}></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[13.5px] font-bold text-[#111] mb-1" style={{ fontFamily: 'var(--font-newsreader)' }}>{item.label}</h3>
                    <p className="text-[12px] text-[#888]">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────── */}
        <section id="how-it-works" className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-[1.4rem] font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>
                How We Deliver Freshness
              </h2>
              <p className="text-[13px] text-[#888]">Three simple steps from field to market.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={handleGetStarted}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-[#eee] text-left group"
                >
                  <div className="h-[160px] relative overflow-hidden" style={{ backgroundColor: step.topBg }}>
                    <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <span className="text-[11px] font-black" style={{ color: step.topBg }}>{step.step}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: step.accent, transform: 'translate(30%, 30%)' }}></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <span className="text-[11px] font-bold opacity-60">Step {step.step}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[14px] font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>{step.title}</h3>
                    <p className="text-[12.5px] text-[#888] leading-relaxed">{step.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────── */}
        <section id="partners" className="py-16 bg-[#f5f5f2]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-[1.4rem] font-bold text-[#111]" style={{ fontFamily: 'var(--font-newsreader)' }}>
                What Our Partners Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: t.color }}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#111]">{t.name}</div>
                      <div className="text-[11px] text-[#888]">{t.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={12} fill="#c9773a" className="text-[#c9773a]" />
                    ))}
                  </div>
                  <p className="text-[13px] text-[#555] leading-relaxed" style={{ fontFamily: 'var(--font-newsreader)' }}>
                    &quot;{t.quote}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LANGUAGE SWITCHER ─────────────────── */}
        <section className="py-14 border-t border-b border-[#eee]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-[1.4rem] font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>
                Zero-reading interface
              </h2>
              <p className="text-[13px] text-[#888] max-w-md mx-auto">
                Switch dialect and the entire app re-speaks — from onboarding to pest alerts.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {LANGUAGES.map(lang => {
                const active = lang.code === currentLangCode
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(LANG_MAP[lang.code] as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[13px] font-semibold transition-all ${
                      active
                        ? 'bg-[#1a3c20] border-[#1a3c20] text-white shadow-md'
                        : 'bg-white border-[#ddd] text-[#555] hover:border-[#1a3c20] hover:text-[#1a3c20]'
                    }`}
                  >
                    {lang.name}
                    <span className={`font-mono text-[10px] ${active ? 'text-white/60' : 'text-[#bbb]'}`}>{lang.code}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-14 items-start">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-[1.4rem] font-bold text-[#111] mb-3" style={{ fontFamily: 'var(--font-newsreader)' }}>
                Questions About EcoFarm
              </h2>
              <p className="text-[13px] text-[#888] leading-relaxed mb-6">
                EcoFarm is Uganda&apos;s leading agricultural intelligence platform, built by the Student Software Engineering Collective at Cavendish University Uganda.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a3c20] text-white text-[13px] font-bold hover:bg-[#122a17] transition-colors"
              >
                Get Started <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-[#e8e8e8] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
                  >
                    <span className="text-[13.5px] font-semibold text-[#111]">{faq.q}</span>
                    <ChevronDown size={15} className={`text-[#aaa] shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 pt-3 text-[13px] text-[#666] leading-relaxed border-t border-[#eee]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ────────────────────────── */}
        <section className="bg-[#1a3c20] py-14 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-white">
            <div>
              <h2 className="text-[1.6rem] font-bold mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>
                Built by farmers&apos; neighbors,<br />for farmers&apos; fields.
              </h2>
              <p className="text-[13px] text-white/55">Join 50,000+ farmers, buyers, and drivers on EcoFarm.</p>
            </div>
            <button
              onClick={handleGetStarted}
              className="px-7 py-3 rounded-full bg-[#c9773a] text-white text-[13.5px] font-bold hover:bg-[#a85e28] whitespace-nowrap shadow-lg flex items-center gap-2 transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────── */}
      <footer className="bg-[#0d1a0e] text-white pt-14 pb-4 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <button onClick={() => scrollTo('#home')} className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-[#1a3c20] flex items-center justify-center">
                  <Leaf size={11} className="text-white" />
                </div>
                <span className="text-[14px] font-bold">EcoFarm</span>
              </button>
              <p className="text-[12px] text-white/35 leading-relaxed">Fresh, natural produce. Uganda&apos;s #1 agricultural intelligence platform.</p>
            </div>

            {[
              {
                title: 'Services',
                items: [
                  { label: 'AI Diagnosis',  action: () => handleFeatureClick('AI Crop Diagnosis') },
                  { label: 'Market Prices', action: () => handleFeatureClick('Direct Market') },
                  { label: 'Pest Alerts',   action: () => handleFeatureClick('Pest Hub') },
                  { label: 'Logistics',     action: () => handleFeatureClick('Logistics') },
                ],
              },
              {
                title: 'Resources',
                items: [
                  { label: 'For Farmers',  action: handleGetStarted },
                  { label: 'For Buyers',   action: handleGetStarted },
                  { label: 'For Drivers',  action: handleGetStarted },
                  { label: 'Languages',    action: () => scrollTo('#home') },
                ],
              },
              {
                title: 'Office',
                items: [
                  { label: 'Cavendish Univ.',  action: () => {} },
                  { label: 'Kampala, Uganda',  action: () => {} },
                  { label: 'Privacy Policy',   action: () => {} },
                  { label: 'Terms of Service', action: () => {} },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item.label}>
                      <button
                        onClick={item.action}
                        className="text-[13px] text-white/55 hover:text-white transition-colors text-left"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-4">
            <div className="text-center leading-none select-none overflow-hidden">
              <span
                className="font-bold text-[6rem] md:text-[10rem] text-white/5 tracking-tight"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                ECOFARM
              </span>
            </div>
            <div className="text-center text-[11px] text-white/25 mt-2 pb-2">
              © 2026 EcoFarm Uganda. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
