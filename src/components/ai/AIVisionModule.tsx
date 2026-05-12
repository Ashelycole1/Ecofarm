'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { Camera, Upload, X, AlertCircle, Play, CheckCircle2, ChevronRight, Loader2, Info, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function AIVisionModule() {
  const { analyzeCropImage, isGeneratingAI } = useApp()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setAnalysisResult(null)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return
    setError(null)
    try {
      const result = await analyzeCropImage(selectedImage, 'General')
      setAnalysisResult(result)
    } catch (err) {
      setError('Could not analyze image. Please try again.')
      console.error(err)
    }
  }

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="nature-card overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] shadow-2xl">
      {/* Header */}
      <div className={`p-6 transition-colors duration-500 border-b border-white/5 ${
        analysisResult?.visual_status === 'Red' ? 'bg-alert/10' : 
        analysisResult?.visual_status === 'Yellow' ? 'bg-warning/10' : 
        'bg-white/[0.03]'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
            <Camera className="text-wheat" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Visual Pathologist</h3>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">
              {analysisResult ? analysisResult.identification : 'Identify Pests & Disease'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {!analysisResult ? (
          <div className="space-y-6">
            {previewUrl ? (
              <div className="relative aspect-video w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl group">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video w-full rounded-[24px] border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all bg-white/[0.01]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
                  <Upload size={28} />
                </div>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Tap to upload photo</p>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />

            {error && (
              <div className="flex items-center gap-3 p-4 bg-alert/5 border border-alert/20 rounded-2xl text-alert text-[10px] font-black uppercase tracking-widest">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isGeneratingAI}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Sparkles size={18} />
                  Analyze Plant Health
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Status & Audio */}
            <div className={`p-8 rounded-[32px] text-center space-y-6 shadow-2xl transition-colors duration-500 border border-white/10 ${
              analysisResult.visual_status === 'Red' ? 'bg-alert/10' : 
              analysisResult.visual_status === 'Yellow' ? 'bg-warning/10' : 
              'bg-safe/10'
            }`}>
              <div className="w-20 h-20 rounded-[24px] bg-white/5 flex items-center justify-center mx-auto mb-2 border border-white/10 shadow-2xl">
                 {analysisResult.visual_status === 'Red' ? <AlertCircle size={40} className="text-alert" /> : analysisResult.visual_status === 'Yellow' ? <Info size={40} className="text-warning" /> : <CheckCircle2 size={40} className="text-safe" />}
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                  {analysisResult.identification}
                </h4>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Condition Identified</p>
              </div>
              <button 
                onClick={() => speakText(analysisResult.audio_explanation)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                <Play size={16} fill="currentColor" />
                Listen to Recovery Plan
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Recovery Protocol</p>
              <div className="grid grid-cols-3 gap-3">
                {analysisResult.visual_steps.map((step: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => speakText(step.step_description)}
                    className="flex flex-col items-center gap-4 p-5 bg-white/[0.02] rounded-[24px] border border-white/5 hover:bg-white/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                       <Sparkles size={20} className="text-wheat/40" />
                    </div>
                    <span className="text-[9px] font-black text-white/40 uppercase text-center leading-tight tracking-widest">
                      {step.step_description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setAnalysisResult(null); setSelectedImage(null); setPreviewUrl(null); }}
              className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
