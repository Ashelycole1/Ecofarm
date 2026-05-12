'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { X, ArrowLeft, Leaf } from 'lucide-react'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [showSignUp, setShowSignUp] = useState(false)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0D2422] w-full max-w-md max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-[40px] sm:rounded-[40px] relative border border-white/5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-12">
          <div className="text-center mb-8 space-y-2">
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto border border-forest/20">
              <Leaf className="text-forest" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">EcoFarm Auth</h2>
            <p className="text-white/40 text-xs uppercase tracking-widest font-black">Clerk Protocol Active</p>
          </div>

          <div className="flex flex-col items-center">
            {showSignUp ? (
              <div className="w-full space-y-4">
                <SignUp 
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none border-none",
                      headerTitle: "text-white hidden",
                      headerSubtitle: "text-white/40 hidden",
                      formButtonPrimary: "bg-forest hover:bg-forest-light text-white font-black uppercase tracking-widest rounded-2xl py-4",
                      formFieldInput: "bg-white/5 border-white/10 text-white rounded-2xl",
                      formFieldLabel: "text-white/40 font-black uppercase text-[10px] tracking-widest",
                      footerActionText: "text-white/40",
                      footerActionLink: "text-forest hover:text-forest-light",
                      identityPreviewText: "text-white",
                      identityPreviewEditButtonIcon: "text-white/40"
                    }
                  }}
                />
                <button 
                  onClick={() => setShowSignUp(false)}
                  className="w-full py-4 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Already have an account? Sign In
                </button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <SignIn 
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none border-none",
                      headerTitle: "text-white hidden",
                      headerSubtitle: "text-white/40 hidden",
                      formButtonPrimary: "bg-forest hover:bg-forest-light text-white font-black uppercase tracking-widest rounded-2xl py-4",
                      formFieldInput: "bg-white/5 border-white/10 text-white rounded-2xl",
                      formFieldLabel: "text-white/40 font-black uppercase text-[10px] tracking-widest",
                      footerActionText: "text-white/40",
                      footerActionLink: "text-forest hover:text-forest-light",
                      identityPreviewText: "text-white",
                      identityPreviewEditButtonIcon: "text-white/40"
                    }
                  }}
                />
                <button 
                  onClick={() => setShowSignUp(true)}
                  className="w-full py-4 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  New to EcoFarm? Create an Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
