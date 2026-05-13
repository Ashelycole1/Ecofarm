'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Loader2, Leaf } from 'lucide-react'

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#060E0D] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 bg-forest/20 rounded-full flex items-center justify-center border border-forest/30 shadow-[0_0_30px_rgba(25,116,59,0.3)]">
        <Leaf className="text-forest-light" size={32} />
      </div>
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm font-medium tracking-wider uppercase">Signing you in...</span>
      </div>
      {/* Clerk handles the redirect and session activation automatically */}
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
