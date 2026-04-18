'use client'

import { useState } from 'react'
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AIVisionModule() {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  const simulateAnalysis = () => {
    setStatus('analyzing')
    setTimeout(() => {
      setStatus('success')
      setResult('Leaf Spot Disease detected. Apply neem oil and improve airflow.')
    }, 2000)
  }

  return (
    <div className="nature-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-white text-lg">AI Vision</h3>
          <p className="text-xs text-white/40">Analyze crop health from photos</p>
        </div>
        <div className="p-2 bg-forest/20 rounded-full">
          <Camera className="text-wheat" size={24} />
        </div>
      </div>

      {status === 'idle' && (
        <div 
          onClick={simulateAnalysis}
          className="aspect-square rounded-leaf border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-forest-light/40 transition-colors group"
        >
          <div className="p-4 rounded-full bg-white/5 group-hover:bg-forest/20 transition-colors">
            <Camera className="text-white/20 group-hover:text-wheat transition-colors" size={32} />
          </div>
          <p className="text-sm text-white/40 font-medium">Click to upload photo</p>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="aspect-square rounded-leaf bg-black/20 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="text-wheat animate-spin" size={40} />
          <p className="text-sm text-wheat font-bold animate-pulse">Gemini 3 Flash analyzing...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 animate-fade-in">
          <div className="aspect-square rounded-leaf bg-forest/20 border border-safe/30 flex items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <CheckCircle2 className="text-safe mx-auto" size={48} />
              <p className="text-sm text-white font-medium">{result}</p>
            </div>
          </div>
          <button 
            onClick={() => setStatus('idle')}
            className="w-full py-3 rounded-leaf bg-forest text-wheat font-bold text-sm uppercase tracking-wider"
          >
            New Analysis
          </button>
        </div>
      )}

      <div className="bg-white/5 rounded-leaf-sm p-3 flex items-start gap-3">
        <AlertCircle className="text-wheat shrink-0" size={16} />
        <p className="text-[10px] text-white/60 leading-relaxed">
          The AI Vision module uses Gemini 3 Flash to detect pests and disease early. Always consult a local agricultural officer for critical decisions.
        </p>
      </div>
    </div>
  )
}
