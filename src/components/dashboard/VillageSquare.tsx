'use client'

import { useState } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Mic, Trophy, Play, CheckCircle2, AlertCircle, Share2, Sparkles, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function VillageSquare() {
  const { submitCommunityTip, isGeneratingAI, user } = useFirebase()
  const [tipText, setTipText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [badges, setBadges] = useState<string[]>([])

  const handleSubmit = async () => {
    if (!tipText.trim()) return
    try {
      const audit = await submitCommunityTip(tipText)
      setResult(audit)
      if (audit.safety_check === 'Approved') {
        setBadges(prev => [...prev, audit.trust_reward])
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#F5E6BE', '#FF9800']
        })
        speakText(audit.celebration_script)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-6">
      {/* Reputation Header (Medal Cabinet) */}
      <div className="nature-card p-6 bg-gradient-to-br from-forest-deep to-forest border-wheat/20 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-wheat opacity-10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-wheat/40 font-black uppercase tracking-widest">Farmer Reputation</p>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Trust Cabinet</h3>
          </div>
          <div className="flex -space-x-2">
            {badges.length > 0 ? badges.map((b, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-white/10 border-2 border-forest flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer" title={b}>
                {b === 'Golden Harvest' ? '🏆' : b === 'Iron Hoe' ? '⚒️' : '🌱'}
              </div>
            )) : (
              <div className="w-12 h-12 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-white/20 italic text-[10px]">Empty</div>
            )}
          </div>
        </div>
      </div>

      {!result ? (
        <div className="nature-card p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-forest/20 rounded-full flex items-center justify-center mx-auto border-2 border-forest-light/30 shadow-nature">
              <Mic className="text-wheat animate-pulse" size={32} />
            </div>
            <h4 className="text-white font-bold">Share Your Wisdom</h4>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Village Warden Audit Required</p>
          </div>

          <div className="space-y-4">
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              placeholder="e.g., 'The rain is coming early, start planting maize tomorrow!'"
              className="w-full bg-black/20 border border-white/10 rounded-3xl px-6 py-4 text-white text-sm focus:border-forest-light outline-none transition-all h-32"
            />
            <button
              onClick={handleSubmit}
              disabled={!tipText.trim() || isGeneratingAI}
              className="w-full py-4 bg-forest text-wheat rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-nature hover:bg-forest-light transition-all"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Share2 size={18} />
                  Voice to Village Square
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="nature-card p-0 overflow-hidden animate-slide-up">
          <div className={`p-8 text-center space-y-6 ${result.safety_check === 'Approved' ? 'bg-safe/20' : 'bg-alert/20'}`}>
            <div className="relative inline-block">
              <div className="text-8xl mb-4 float-anim">{result.summary_icon}</div>
              {result.safety_check === 'Approved' && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-safe rounded-full flex items-center justify-center border-4 border-forest">
                  <CheckCircle2 className="text-white" size={20} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                {result.audio_board_caption}
              </h3>
              <p className="text-xs text-white/60 font-medium italic">"{result.celebration_script}"</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => speakText(result.celebration_script)}
                className="w-full py-4 bg-white/10 rounded-2xl flex items-center justify-center gap-3 text-wheat font-bold hover:bg-white/20 transition-all"
              >
                <Play fill="currentColor" size={20} />
                Listen to Warden
              </button>
              
              <button 
                onClick={() => setResult(null)}
                className="text-[10px] text-white/30 font-black uppercase tracking-widest hover:text-white"
              >
                Back to Square
              </button>
            </div>
          </div>

          {result.safety_check === 'Approved' && (
            <div className="p-6 bg-forest/40 flex items-center gap-4 border-t border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-wheat/20 flex items-center justify-center text-3xl shadow-xl">
                {result.trust_reward === 'Golden Harvest' ? '🏆' : result.trust_reward === 'Iron Hoe' ? '⚒️' : '🌱'}
              </div>
              <div>
                <p className="text-[10px] text-wheat font-black uppercase tracking-widest">New Badge Earned!</p>
                <h5 className="text-lg font-black text-white tracking-tight">{result.trust_reward}</h5>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Digital Square Feed */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="text-wheat" size={14} />
          <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Recent Wisdom</h5>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TipCard icon="🐛" label="Pest Alert" author="Farmer John" color="bg-alert/10" />
          <TipCard icon="🌧️" label="Rain Tip" author="Farmer Mary" color="bg-safe/10" />
        </div>
      </div>
    </div>
  )
}

function TipCard({ icon, label, author, color }: { icon: string; label: string; author: string; color: string }) {
  return (
    <div className={`p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-2 ${color} hover:scale-105 transition-transform cursor-pointer shadow-lg`}>
      <span className="text-4xl mb-1">{icon}</span>
      <span className="text-[10px] font-black text-white uppercase tracking-tight">{label}</span>
      <span className="text-[8px] text-white/30 font-medium uppercase tracking-widest">{author}</span>
    </div>
  )
}
