'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { 
  Leaf, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  ChevronRight, 
  Sparkles, 
  AlertTriangle, 
  Truck, 
  ShoppingBag, 
  Sprout, 
  Bike, 
  Car,
  X,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react'
import { useFirebase } from '@/context/FirebaseContext'

interface AuthModalProps {
  onClose: () => void
}

type Step = 'auth' | 'role' | 'vehicle' | 'details' | 'verification'
type Role = 'farmer' | 'buyer' | 'delivery'
type Vehicle = 'car' | 'bike' | 'truck'

export default function AuthModal({ onClose }: AuthModalProps) {
  const [step, setStep] = useState<Step>('auth')
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { loginAsGuest } = useFirebase()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!auth) {
      setError('Authentication service is unavailable. Please check your Firebase configuration.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        onClose()
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        setStep('role')
      }
    } catch (err: any) {
      // Provide friendly error messages
      const code = err?.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.')
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.')
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please use Google sign-in or contact support.')
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    if (!auth) {
      setError('Authentication service is unavailable. Please check your Firebase configuration.')
      setLoading(false)
      return
    }

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      if (result.user) {
        setStep('role')
      }
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.')
      } else if (code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please add it to Firebase Console > Authentication > Authorized Domains.')
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        setError('') // User closed popup, not an error
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelection = (selectedRole: Role) => {
    setRole(selectedRole)
    if (selectedRole === 'delivery') {
      setStep('vehicle')
    } else {
      setStep('details')
    }
  }

  const handleVehicleSelection = (selectedVehicle: Vehicle) => {
    setVehicle(selectedVehicle)
    setStep('details')
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('verification')
  }

  const renderAuth = () => (
    <div className="animate-fade-in space-y-6">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto border border-forest/20">
          <Leaf className="text-forest" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-white/40 text-sm">Join the EcoFarm logistics network</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-forest/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-forest/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-forest-light transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-forest/20"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            {isLogin ? "New to EcoFarm? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )

  const renderRoleSelection = () => (
    <div className="animate-fade-in space-y-8">
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight">I am a...</h2>
        <p className="text-white/40 text-sm">Choose your role in the ecosystem</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'farmer', title: 'Farmer', desc: 'I produce fresh organic crops', icon: Sprout, color: 'bg-green-500/10 text-green-500' },
          { id: 'buyer', title: 'Buyer', desc: 'I purchase fresh produce', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-500' },
          { id: 'delivery', title: 'Delivery Partner', desc: 'I transport goods securely', icon: Truck, color: 'bg-wheat/10 text-wheat' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleRoleSelection(item.id as Role)}
            className="flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-[28px] text-left hover:bg-white/[0.08] hover:border-white/20 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shrink-0 shadow-lg`}>
              <item.icon size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{item.title}</h3>
              <p className="text-white/30 text-xs">{item.desc}</p>
            </div>
            <ChevronRight className="text-white/10 group-hover:text-white transition-colors" size={20} />
          </button>
        ))}
      </div>
    </div>
  )

  const renderVehicleSelection = () => (
    <div className="animate-fade-in space-y-8">
      <div className="space-y-2 flex justify-between items-start text-left">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Delivery Mode</h2>
          <p className="text-white/40 text-sm">What do you use for transport?</p>
        </div>
        <button onClick={() => setStep('role')} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'bike', title: 'Motorbike / Bike', desc: 'Perfect for small, fast orders', icon: Bike },
          { id: 'car', title: 'Car / Small Van', desc: 'Great for medium loads', icon: Car },
          { id: 'truck', title: 'Truck / Lorry', desc: 'Bulk transport specialist', icon: Truck },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleVehicleSelection(item.id as Vehicle)}
            className="flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-[28px] text-left hover:bg-white/[0.08] hover:border-white/20 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-wheat/10 text-wheat flex items-center justify-center shrink-0">
              <item.icon size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{item.title}</h3>
              <p className="text-white/30 text-xs">{item.desc}</p>
            </div>
            <ChevronRight className="text-white/10 group-hover:text-white transition-colors" size={20} />
          </button>
        ))}
      </div>
    </div>
  )

  const renderDetails = () => (
    <div className="animate-fade-in space-y-8">
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight">Complete Profile</h2>
        <p className="text-white/40 text-sm">We will send you an email to verify your address</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-forest/50 transition-all text-left">
            <label className="text-[10px] uppercase font-black text-white/20 block mb-1 tracking-widest">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-forest/50 transition-all text-left">
            <label className="text-[10px] uppercase font-black text-white/20 block mb-1 tracking-widest">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 opacity-50 cursor-not-allowed text-left">
            <label className="text-[10px] uppercase font-black text-white/20 block mb-1 tracking-widest">Email address</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-forest-light transition-all active:scale-95"
        >
          Next Step <ChevronRight size={18} />
        </button>
      </form>
    </div>
  )

  const renderVerification = () => (
    <div className="animate-fade-in space-y-10 text-center">
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight">Verify Email</h2>
        <p className="text-white/40 text-sm">We sent a 4-digit code to <span className="text-white font-bold">{email}</span></p>
      </div>

      <div className="flex justify-between gap-3 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center text-3xl font-black text-white transition-all ${i === 1 ? 'border-forest bg-forest/5' : 'border-white/10 bg-white/5'}`}>
            {i === 1 ? '|' : ''}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <p className="text-white/20 text-sm font-bold">
          Didn&apos;t receive the code? <button className="text-white/40 hover:text-white" type="button">(00:29)</button>
        </p>
        
        <button
          onClick={() => onClose()}
          className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl"
        >
          Verify & Finish <CheckCircle2 size={18} />
        </button>
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0D2422] w-full max-w-md max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-[40px] sm:rounded-[40px] relative border border-white/5">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8 pb-12">
          {error && (
            <div className="mb-6 bg-alert/10 border border-alert/20 rounded-2xl p-4 flex items-start gap-3 text-left">
              <AlertTriangle className="text-alert shrink-0" size={16} />
              <p className="text-xs text-alert font-bold">{error}</p>
            </div>
          )}

          {step === 'auth' && renderAuth()}
          {step === 'role' && renderRoleSelection()}
          {step === 'vehicle' && renderVehicleSelection()}
          {step === 'details' && renderDetails()}
          {step === 'verification' && renderVerification()}
        </div>
      </div>
    </div>
  )
}
