'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { X, ArrowLeft, Leaf, Loader2, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

interface AuthModalProps {
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'verify'
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
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
        onClose()
      } else {
        setError('Additional verification steps required. Please contact support.')
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
      
      // Auto-generate a username to satisfy Clerk's requirement if it's enabled in their dashboard
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

      // Only attempt verification if not already complete
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
               console.warn("Failed to create profile in Supabase. User can still log in:", dbError)
             }
          }
        } catch (dbErr) {
          console.warn("Supabase client error:", dbErr)
        }

        if (completeSignUp.createdSessionId) {
          await setSignUpActive({ session: completeSignUp.createdSessionId })
          onClose()
        } else {
          setMode('signin')
          setError('Account created! Please sign in.')
        }
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.'
      
      // Handle case where code was clicked twice or already verified
      if (errorMessage.toLowerCase().includes('already been verified') || err.errors?.[0]?.code === 'form_verification_already_verified') {
        if (signUp.status === 'complete' && signUp.createdSessionId) {
          await setSignUpActive({ session: signUp.createdSessionId })
          onClose()
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0A1A18] w-full max-w-md max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-[40px] sm:rounded-[32px] relative border border-forest/20 shadow-[0_0_50px_rgba(25,116,59,0.1)]">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-forest/20 to-transparent pointer-events-none rounded-t-[40px] sm:rounded-t-[32px]" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {mode === 'verify' && (
          <button
            onClick={() => setMode('signup')}
            className="absolute top-6 left-6 z-[110] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="p-8 pt-12 relative z-10">
          <div className="text-center mb-8 space-y-3">
            <div className="w-16 h-16 bg-forest/20 rounded-full flex items-center justify-center mx-auto border border-forest/30 shadow-[0_0_30px_rgba(25,116,59,0.3)]">
              <Leaf className="text-forest-light" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join EcoFarm' : 'Verify Email'}
            </h2>
            <p className="text-forest-light/60 text-xs uppercase tracking-widest font-black">
              {mode === 'signin' ? 'Access your dashboard' : mode === 'signup' ? 'Create your account' : 'Enter the code sent to your email'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest hover:bg-forest-light disabled:opacity-50 disabled:hover:bg-forest text-white font-black uppercase tracking-widest rounded-2xl py-4 transition-all shadow-[0_0_20px_rgba(25,116,59,0.3)] mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>

              <button 
                type="button"
                onClick={() => setMode('signup')}
                className="w-full py-4 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors mt-2"
              >
                New to EcoFarm? Create an Account
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                  {(['farmer', 'buyer', 'delivery'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        role === r 
                          ? 'bg-forest text-white shadow-lg' 
                          : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number (e.g. +256...)"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-white/20" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest hover:bg-forest-light disabled:opacity-50 disabled:hover:bg-forest text-white font-black uppercase tracking-widest rounded-2xl py-4 transition-all shadow-[0_0_20px_rgba(25,116,59,0.3)] mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>

              <button 
                type="button"
                onClick={() => setMode('signin')}
                className="w-full py-4 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors mt-2"
              >
                Already have an account? Sign In
              </button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm">
                  We sent a code to <span className="text-white font-bold">{email}</span>. Please enter it below.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <CheckCircle2 className="w-5 h-5 text-white/20" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20 text-center tracking-[0.5em] font-mono text-lg"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-forest hover:bg-forest-light disabled:opacity-50 disabled:hover:bg-forest text-white font-black uppercase tracking-widest rounded-2xl py-4 transition-all shadow-[0_0_20px_rgba(25,116,59,0.3)] mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
