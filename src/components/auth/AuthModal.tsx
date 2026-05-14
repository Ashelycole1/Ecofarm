'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { X, ArrowLeft, Leaf, Loader2, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

interface AuthModalProps {
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'verify' | 'verify_signin'
type UserRole = 'farmer' | 'buyer' | 'delivery'

export default function AuthModal({ onClose }: AuthModalProps) {
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
      
      const generatedUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + Math.floor(Math.random() * 10000);

      await signUp.create({
        emailAddress: email,
        username: generatedUsername,
        password,
        firstName: firstName || fullName,
        lastName: lastName || undefined,
        unsafeMetadata: { role, phone }
      })
      
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setMode('verify')
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded) return
    setLoading(true)
    setError('')
    try {
      let completeSignUp = signUp

      if (signUp.status !== 'complete') {
        completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        })
      }

      if (completeSignUp.status === 'complete') {
        try {
          const supabase = getSupabase()
          if (supabase && completeSignUp.createdUserId) {
             const { error: dbError } = await supabase.from('profiles').insert([{
               id: completeSignUp.createdUserId,
               email,
               full_name: fullName,
               phone_number: phone,
               role: role
             }])
             if (dbError) {
               console.warn("Failed to create profile in Supabase:", dbError)
             }
          }
        } catch (dbErr) {
          console.warn("Supabase client error:", dbErr)
        }

        if (completeSignUp.createdSessionId) {
          await setSignUpActive({ session: completeSignUp.createdSessionId })
          onClose()
          window.location.reload()
        } else {
          setMode('signin')
          setError('Account created! Please sign in.')
        }
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.'
      
      if (errorMessage.toLowerCase().includes('already been verified') || err.errors?.[0]?.code === 'form_verification_already_verified') {
        if (signUp.status === 'complete' && signUp.createdSessionId) {
          await setSignUpActive({ session: signUp.createdSessionId })
          onClose()
          window.location.reload()
        } else {
          setMode('signin')
          setError('Email verified successfully! Please sign in.')
        }
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded) return
    setLoading(true)
    setError('')
    try {
      let result;
      if (signInFactorType === 'second') {
        result = await signIn.attemptSecondFactor({ strategy: signInStrategy as any, code })
      } else {
        result = await signIn.attemptFirstFactor({ strategy: signInStrategy as any, code })
      }

      if (result.status === 'complete' || result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId })
        onClose()
        window.location.reload()
      } else {
        setError(`Verification incomplete (Status: ${result.status}).`)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-md max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-3xl sm:rounded-3xl relative shadow-modal border border-border-soft">

        {/* Ambient top glowing leaf arc overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-forest-pale/40 rounded-b-full blur-2xl pointer-events-none" />

        {/* Premium multi-tone top border strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest via-forest-tint to-sienna rounded-t-3xl sm:rounded-t-3xl" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-[110] w-9 h-9 rounded-full bg-bone-low border border-border-soft flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white hover:border-border-strong transition-all shadow-sm active:scale-95"
          title="Close Modal"
        >
          <X size={16} />
        </button>

        {mode === 'verify' && (
          <button
            onClick={() => setMode('signup')}
            className="absolute top-5 left-5 z-[110] w-9 h-9 rounded-full bg-bone-low border border-border-soft flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-all shadow-sm active:scale-95"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className="p-8 pt-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="w-16 h-16 bg-bone-low rounded-2xl flex items-center justify-center mx-auto border border-border-soft shadow-inner mb-4">
              <Leaf className="text-forest" size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold text-ink tracking-tight leading-tight">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join EcoFarm' : mode === 'verify_signin' ? 'Verify Identity' : 'Verify Email'}
            </h2>
            <p className="font-body text-ink-muted text-xs font-semibold tracking-wide">
              {mode === 'signin' ? 'Secure editorial platform access' : mode === 'signup' ? 'Create your authorized farmer account' : mode === 'verify_signin' ? 'Enter the authentication code' : 'Enter the code sent to your inbox'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-alert/10 border border-alert/20 rounded-xl font-body text-alert text-xs font-semibold text-center animate-fade-in leading-relaxed shadow-sm">
              {error}
            </div>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-3.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest justify-center shadow-md mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-soft/60" />
                <span className="font-body text-ink-faint text-[9px] font-bold uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border-soft/60" />
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2.5 bg-bone-low hover:bg-bone border border-border-soft text-ink font-body font-bold text-xs rounded-xl py-3 transition-all shadow-sm active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-body text-ink-muted hover:text-forest font-bold text-[11px] transition-colors underline decoration-border-soft hover:decoration-forest underline-offset-4"
                >
                  New to EcoFarm? Create an Account
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-3.5">
                {/* Role Toggle Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-bone-low rounded-xl border border-border-soft shadow-inner">
                  {(['farmer', 'buyer', 'delivery'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-lg font-body text-[10px] font-bold uppercase tracking-wider transition-all ${
                        role === r 
                          ? 'bg-forest text-white shadow-sm' 
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number (e.g. +256...)"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-ink-faint" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password"
                    className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 pl-11 pr-4 font-body text-xs outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest justify-center shadow-md mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-soft/60" />
                <span className="font-body text-ink-faint text-[9px] font-bold uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border-soft/60" />
              </div>

              {/* Google Sign-Up Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2.5 bg-bone-low hover:bg-bone border border-border-soft text-ink font-body font-bold text-xs rounded-xl py-3 transition-all shadow-sm active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-body text-ink-muted hover:text-forest font-bold text-[11px] transition-colors underline decoration-border-soft hover:decoration-forest underline-offset-4"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-6 space-y-2">
                <p className="font-body text-ink text-xs font-semibold leading-relaxed">
                  We sent a confirmation code to <span className="text-forest font-bold">{email}</span>. Please enter it below.
                </p>
                <p className="font-body text-ink-muted text-[11px] bg-bone-low border border-border-soft py-2 px-3 rounded-xl inline-block mt-1 shadow-inner">
                  ⏱️ Emails usually arrive instantly, but can take 1-2 minutes depending on mail routing.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <CheckCircle2 className="w-4 h-4 text-ink-faint" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint text-center tracking-[0.4em] font-mono font-bold text-sm shadow-inner"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest justify-center shadow-md mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Account'}
              </button>
            </form>
          )}

          {mode === 'verify_signin' && (
            <form onSubmit={handleVerifySignIn} className="space-y-4">
              <div className="text-center mb-6 space-y-2">
                <p className="font-body text-ink text-xs font-bold">
                  Two-Factor / Extra Security Verification
                </p>
                <p className="font-body text-ink-muted text-[11px]">
                  Please enter the authorization code sent to your registered contact.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Code"
                  className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3.5 px-4 outline-none focus:border-forest focus:bg-white transition-all placeholder:text-ink-faint text-center tracking-[0.4em] font-mono font-bold text-sm shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code}
                className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest justify-center shadow-md mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Sign In'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
