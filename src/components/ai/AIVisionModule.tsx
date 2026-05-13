'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { Camera, Upload, X, AlertCircle, Play, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
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
    <div className="modern-card overflow-hidden">
      {/* Header */}
      <div className={`p-6 transition-colors duration-500 ${
        analysisResult?.visual_status === 'Red' ? 'bg-alert/10' : 
        analysisResult?.visual_status === 'Yellow' ? 'bg-warning/10' : 
        'bg-eco-sidebar'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
            <Camera className="text-eco-gold" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-eco-dark uppercase tracking-tight">Visual Pathologist</h3>
            <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em]">
              {analysisResult ? analysisResult.identification : 'Identify Pests & Disease'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!analysisResult ? (
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-black/5 group shadow-inner">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-eco-dark shadow-lg active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video w-full rounded-[32px] border-2 border-dashed border-black/5 bg-eco-bg flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white transition-all shadow-inner"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-eco-gold shadow-sm">
                  <Upload size={28} />
                </div>
                <p className="text-[11px] text-black/30 font-black uppercase tracking-[0.15em]">Tap to upload plant photo</p>
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
              <div className="flex items-center gap-2 p-4 bg-alert/10 border border-alert/20 rounded-2xl text-alert text-[11px] font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isGeneratingAI}
              className="w-full py-5 bg-eco-dark text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg hover:brightness-110"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Camera size={18} />
                  Analyze Plant Health
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Status & Audio */}
            <div className={`p-8 rounded-[40px] text-center space-y-5 shadow-sm transition-colors duration-500 ${
              analysisResult.visual_status === 'Red' ? 'bg-alert/10' : 
              analysisResult.visual_status === 'Yellow' ? 'bg-warning/10' : 
              'bg-eco-sidebar'
            }`}>
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                <span className="text-5xl">{analysisResult.visual_status === 'Red' ? '⚠️' : analysisResult.visual_status === 'Yellow' ? '🔍' : '✅'}</span>
              </div>
              <h4 className="text-2xl font-display font-black text-eco-dark uppercase tracking-tight leading-none">
                {analysisResult.identification}
              </h4>
              <button 
                onClick={() => speakText(analysisResult.audio_explanation)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-black/5 rounded-full text-eco-dark text-[11px] font-black uppercase tracking-widest hover:bg-eco-sidebar transition-all shadow-sm active:scale-95"
              >
                <Play size={18} fill="currentColor" className="text-eco-gold" />
                Listen to Recovery Plan
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest ml-1">Expert Recovery Steps</p>
              <div className="grid grid-cols-3 gap-3">
                {analysisResult.visual_steps.map((step: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => speakText(step.step_description)}
                    className="flex flex-col items-center gap-3 p-5 modern-tile hover:scale-[1.02] transition-transform"
                  >
                    <span className="text-5xl">{step.step_icon}</span>
                    <span className="text-[9px] font-black text-eco-dark/60 uppercase text-center leading-tight tracking-tight">
                      {step.step_description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setAnalysisResult(null); setSelectedImage(null); setPreviewUrl(null); }}
              className="w-full py-4 bg-black/5 border border-black/5 rounded-[20px] text-black/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black/10 transition-colors"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
