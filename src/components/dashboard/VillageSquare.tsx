'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Mic, Trophy, Play, CheckCircle2, AlertCircle, Share2, Sparkles, Loader2, Hammer, Sprout, Bug, CloudRain } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function VillageSquare() {
  const { submitCommunityTip, isGeneratingAI, user } = useApp()
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
      utterance.pitch = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-6">
      {/* Reputation Header (Medal Cabinet) */}
      <div className="nature-card p-8 bg-white/[0.02] border-white/5 overflow-hidden relative shadow-2xl rounded-[32px]">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-wheat opacity-5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Farmer Reputation</p>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Trust Cabinet</h3>
          </div>
          <div className="flex -space-x-3">
            {badges.length > 0 ? badges.map((b, i) => (
              <div key={i} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer backdrop-blur-md" title={b}>
                {b === 'Golden Harvest' ? <Trophy className="text-wheat" size={24} /> : b === 'Iron Hoe' ? <Hammer className="text-white/60" size={24} /> : <Sprout className="text-leaf" size={24} />}
              </div>
            )) : (
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/10 italic text-[10px] font-black uppercase tracking-widest">Empty</div>
            )}
          </div>
        </div>
      </div>

      {!result ? (
        <div className="nature-card p-10 space-y-8 rounded-[32px] bg-white/[0.02] border-white/5 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-forest/20 rounded-[32px] flex items-center justify-center mx-auto border border-forest-light/20 shadow-2xl group">
              <Mic className="text-wheat group-hover:scale-110 transition-transform" size={40} />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-black text-xl uppercase tracking-tight">Share Your Wisdom</h4>
              <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Village Elder Audit Required</p>
            </div>
          </div>

          <div className="space-y-6">
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              placeholder="e.g., 'The rain is coming early, start planting maize tomorrow!'"
              className="w-full bg-black/40 border border-white/10 rounded-[24px] px-8 py-6 text-white text-sm focus:border-forest-light outline-none transition-all h-40 placeholder:text-white/10 font-medium"
            />
            <button
              onClick={handleSubmit}
              disabled={!tipText.trim() || isGeneratingAI}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Share2 size={18} />
                  Voice to Village Elder
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="nature-card p-0 overflow-hidden animate-slide-up rounded-[32px] border-white/5 bg-white/[0.02] shadow-2xl">
          <div className={`p-10 text-center space-y-8 ${result.safety_check === 'Approved' ? 'bg-safe/10' : 'bg-alert/10'}`}>
            <div className="relative inline-block">
              <div className="p-8 rounded-[32px] bg-white/5 border border-white/10">
                 <Sparkles className="text-wheat float-anim" size={64} />
              </div>
              {result.safety_check === 'Approved' && (
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-safe rounded-2xl flex items-center justify-center border-4 border-[#051412] shadow-2xl">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight max-w-xs mx-auto">
                {result.audio_board_caption}
              </h3>
              <div className="bg-black/40 p-6 rounded-[24px] border border-white/5">
                <p className="text-[14px] text-white/70 font-medium leading-relaxed italic">&quot;{result.celebration_script}&quot;</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => speakText(result.celebration_script)}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                <Play fill="currentColor" size={18} />
                Listen to Elder
              </button>
              
              <button 
                onClick={() => setResult(null)}
                className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                Back to Square
              </button>
            </div>
          </div>

          {result.safety_check === 'Approved' && (
            <div className="p-8 bg-forest/20 flex items-center gap-6 border-t border-white/5">
              <div className="w-16 h-16 rounded-[20px] bg-white/5 flex items-center justify-center shadow-2xl border border-white/10">
                 {result.trust_reward === 'Golden Harvest' ? <Trophy className="text-wheat" size={32} /> : result.trust_reward === 'Iron Hoe' ? <Hammer className="text-white/40" size={32} /> : <Sprout className="text-leaf" size={32} />}
              </div>
              <div>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">New Badge Earned</p>
                <h5 className="text-xl font-black text-white uppercase tracking-tight">{result.trust_reward}</h5>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Digital Square Feed */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="text-wheat/40" size={16} />
          <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Recent Wisdom</h5>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TipCard icon={<Bug className="text-alert" size={24} />} label="Pest Alert" author="Farmer John" color="bg-alert/10" />
          <TipCard icon={<CloudRain className="text-safe" size={24} />} label="Rain Tip" author="Farmer Mary" color="bg-safe/10" />
        </div>
      </div>
    </div>
  )
}

function TipCard({ icon, label, author, color }: { icon: React.ReactNode; label: string; author: string; color: string }) {
  return (
    <div className={`p-6 rounded-[32px] border border-white/5 flex flex-col items-center gap-4 ${color} hover:scale-[1.05] transition-all cursor-pointer shadow-xl group`}>
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="text-center">
        <span className="block text-[10px] font-black text-white uppercase tracking-tight">{label}</span>
        <span className="block text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{author}</span>
      </div>
    </div>
  )
}
