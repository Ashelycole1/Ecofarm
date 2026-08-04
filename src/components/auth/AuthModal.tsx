'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { X, ArrowLeft, Leaf, Loader2, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import { useApp } from '@/context/AppContext'

interface AuthModalProps {
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'verify' | 'verify_signin'
type UserRole = 'farmer' | 'buyer' | 'delivery'

export default function AuthModal({ onClose }: AuthModalProps) {
  const { t } = useApp()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()

  const [mode, setMode] = useState<AuthMode>('signin')

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('farmer')
  const [code, setCode] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signInFactorType, setSignInFactorType] = useState<'first' | 'second' | null>(null)
  const [signInStrategy, setSignInStrategy] = useState<string>('email_code')

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleGoogleAuth = async () => {
    if (!isSignInLoaded) return
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: window.location.origin,
      })
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.')
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete' || result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId })
        onClose()
        window.location.reload()
      } else if (result.status === 'needs_second_factor') {
        const factor = result.supportedSecondFactors?.[0]
        const strategy = (factor?.strategy as string) || 'phone_code'
        setSignInFactorType('second')
        setSignInStrategy(strategy)
        try { await signIn.prepareSecondFactor({ strategy: strategy as any }) } catch (_) {}
        setCode(''); setError(''); setMode('verify_signin')
      } else if (result.status === 'needs_first_factor') {
        const factor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') || result.supportedFirstFactors?.[0]
        const strategy = (factor?.strategy as string) || 'email_code'
        setSignInFactorType('first')
        setSignInStrategy(strategy)
        try { await signIn.prepareFirstFactor({ strategy: strategy as any, emailAddressId: (factor as any)?.emailAddressId }) } catch (_) {}
        setCode(''); setError(''); setMode('verify_signin')
      } else {
        setError(`Sign-in could not be completed (status: ${result.status}). Please try again.`)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded) return
    setLoading(true)
    setError('')
    try {
      const [firstName, ...lastNames] = fullName.split(' ')
      const lastName = lastNames.join(' ')
      await signUp.create({ emailAddress: email, password, firstName, lastName })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setMode('verify')
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded) return
    setLoading(true)
    setError('')
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code })
      if (completeSignUp.status === 'complete') {
        try {
          const supabase = getSupabase()
          if (supabase && completeSignUp.createdUserId) {
            const { error: dbError } = await supabase.from('profiles').insert([{
              id: completeSignUp.createdUserId,
              full_name: fullName,
              email,
              phone,
              role,
              is_onboarded: true,
              created_at: new Date().toISOString(),
            }])
            if (dbError) console.warn('Supabase profile creation failed:', dbError)
          }
        } catch (dbErr) {
          console.warn('Supabase connection error during signup:', dbErr)
        }
        await setSignUpActive({ session: completeSignUp.createdSessionId })
        onClose()
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignInVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded) return
    setLoading(true)
    setError('')
    try {
      const attempt = signInFactorType === 'first'
        ? await signIn.attemptFirstFactor({ strategy: signInStrategy as any, code })
        : await signIn.attemptSecondFactor({ strategy: signInStrategy as any, code })
      if (attempt.status === 'complete') {
        await setSignInActive({ session: attempt.createdSessionId })
        onClose()
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'signin' ? 'Welcome Back' :
    mode === 'signup' ? 'Join EcoFarm' :
    'Verify Account'

  const subtitle =
    mode === 'signin' ? 'Sign in to access your professional dashboard and AI advice.' :
    mode === 'signup' ? 'Start your journey towards sustainable and profitable farming.' :
    'Enter the code sent to your email to continue.'

  return (
    /* ── Backdrop ── clicking it closes the modal */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* ── Card ── stop propagation so clicks inside don't close */}
      <div
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-100"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Sticky header with close button ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a3c20]/10 flex items-center justify-center">
              <Leaf size={16} className="text-[#1a3c20]" />
            </div>
            <span className="text-[13px] font-bold text-[#1a3c20]">EcoFarm</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-6">

          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="font-bold text-2xl text-[#111] tracking-tight mb-1.5">
              {title}
            </h2>
            <p className="text-[13px] text-gray-500 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <X size={13} />
              </div>
              <p className="text-red-600 text-[13px] font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* ── Sign In ── */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#c9773a] text-white text-[14px] font-bold hover:bg-[#a85e28] active:scale-[0.98] transition-all shadow-md mt-2"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign In Now'}
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-[14px] font-semibold text-[#111] hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.044l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <p className="text-center text-[13px] text-gray-500 pt-1">
                New to the platform?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError('') }}
                  className="text-[#1a3c20] font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* ── Sign Up ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+256 7..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111] outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Your Primary Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['farmer', 'buyer', 'delivery'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all capitalize ${
                        role === r
                          ? 'bg-[#1a3c20] text-white border-[#1a3c20] shadow-md'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#1a3c20]/40'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1a3c20] text-white text-[14px] font-bold hover:bg-[#122a17] active:scale-[0.98] transition-all shadow-md mt-2"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Account'}
              </button>

              <p className="text-center text-[13px] text-gray-500 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError('') }}
                  className="text-[#1a3c20] font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── Verification ── */}
          {(mode === 'verify' || mode === 'verify_signin') && (
            <form onSubmit={mode === 'verify' ? handleVerification : handleSignInVerification} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full py-5 text-center text-3xl font-bold tracking-[0.4em] bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#1a3c20] focus:ring-2 focus:ring-[#1a3c20]/10 transition-all text-[#111] placeholder:text-gray-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3.5 rounded-xl bg-[#c9773a] text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all shadow-md"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Complete Verification'}
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError('') }}
                  className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#111] font-semibold transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 rounded-b-2xl">
          <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 size={11} className="text-[#1a3c20]" />
            Secured by EcoFarm Enterprise Logic
          </p>
        </div>
      </div>
    </div>
  )
}
