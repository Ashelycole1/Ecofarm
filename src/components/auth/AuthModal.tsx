'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
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
      const result = await signIn.create({
        identifier: email,
        password,
      })
      if (result.status === 'complete' || result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId })
        onClose()
        window.location.reload()
      } else if (result.status === 'needs_second_factor') {
        const factor = result.supportedSecondFactors?.[0]
        const strategy = (factor?.strategy as string) || 'phone_code'
        setSignInFactorType('second')
        setSignInStrategy(strategy)
        try {
          await signIn.prepareSecondFactor({ strategy: strategy as any })
        } catch (_) { }
        setCode('')
        setError('')
        setMode('verify_signin')
      } else if (result.status === 'needs_first_factor') {
        const factor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') || result.supportedFirstFactors?.[0]
        const strategy = (factor?.strategy as string) || 'email_code'
        setSignInFactorType('first')
        setSignInStrategy(strategy)
        try {
          await signIn.prepareFirstFactor({ strategy: strategy as any, emailAddressId: (factor as any)?.emailAddressId })
        } catch (_) { }
        setCode('')
        setError('')
        setMode('verify_signin')
      } else {
        setError(`We couldn't complete your sign-in (Status: ${result.status}). Please try again or contact the EcoFarm platform for help.`)
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
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })
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
               email: email,
               phone: phone,
               role: role,
               is_onboarded: true,
               created_at: new Date().toISOString()
             }])
             if (dbError) console.warn("Supabase profile creation failed:", dbError)
          }
        } catch (dbErr) {
          console.warn("Supabase connection error during signup:", dbErr)
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ink/60 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-modal overflow-hidden flex flex-col border border-border-soft animate-slide-up relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center text-ink-muted hover:bg-bone-dim/20 transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 scrollbar-hide">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest-medium/10 flex items-center justify-center text-forest mx-auto mb-6 border border-forest-medium/20 shadow-inner">
              <Leaf size={32} />
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink tracking-tight mb-3">
              {mode === 'signin' ? 'Welcome Back' : 
               mode === 'signup' ? 'Join EcoFarm' : 
               'Verify Account'}
            </h2>
            <p className="font-body text-ink-muted text-sm max-w-xs mx-auto">
              {mode === 'signin' ? 'Sign in to access your professional dashboard and AI advice.' : 
               mode === 'signup' ? 'Start your journey towards sustainable and profitable farming.' : 
               'Enter the code sent to your email to continue.'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-alert/5 border border-alert/20 rounded-2xl flex items-start gap-4 animate-shake">
              <div className="w-8 h-8 rounded-full bg-alert/10 flex items-center justify-center text-alert shrink-0">
                <X size={16} />
              </div>
              <p className="font-body text-alert text-sm font-bold pt-1">{error}</p>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-5 rounded-2xl text-base font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In Now'}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-soft"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 font-bold text-ink-faint tracking-widest">Or continue with</span></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-4 border border-border-soft rounded-2xl flex items-center justify-center gap-3 font-bold text-ink hover:bg-bone-low transition-all active:scale-[0.98]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.044l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                Google
              </button>

              <p className="text-center font-body text-sm text-ink-muted">
                New to the platform?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('signup')}
                  className="text-forest font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+256 7..."
                      className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-bone-low border border-border-soft rounded-2xl font-body text-sm text-ink outline-none focus:border-forest shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-xs font-bold text-ink-muted uppercase tracking-widest ml-1">Your Primary Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['farmer', 'buyer', 'delivery'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                        role === r ? 'bg-forest text-white border-forest shadow-md' : 'bg-bone-low border-border-soft text-ink-muted'
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
                className="btn-primary w-full py-5 rounded-2xl text-base font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
              </button>

              <p className="text-center font-body text-sm text-ink-muted">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('signin')}
                  className="text-forest font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={mode === 'verify' ? handleVerification : handleSignInVerification} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-center font-body text-xs font-bold text-ink-muted uppercase tracking-[0.2em]">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="000000"
                  className="w-full py-6 text-center text-4xl font-display font-bold tracking-[0.5em] bg-bone-low border border-border-soft rounded-3xl outline-none focus:border-forest shadow-inner transition-all text-ink placeholder:text-ink-faint/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="btn-primary w-full py-5 rounded-2xl text-base font-bold shadow-lg active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Complete Verification'}
              </button>

              <div className="flex flex-col items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => setMode('signin')}
                  className="flex items-center gap-2 text-ink-muted hover:text-ink font-body text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="p-8 bg-bone-low/50 border-t border-border-soft text-center">
          <p className="font-body text-[10px] text-ink-faint uppercase tracking-[0.2em] font-extrabold flex items-center justify-center gap-2">
            <CheckCircle2 size={12} className="text-forest" />
            Secured by EcoFarm Enterprise Logic
          </p>
        </div>
      </div>
    </div>
  )
}
