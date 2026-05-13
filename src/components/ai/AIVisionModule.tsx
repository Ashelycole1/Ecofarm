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
      setError('Could not complete image analysis. Please try again.')
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
    <div className="mh-card bg-white overflow-hidden border border-border-soft">
      {/* Header */}
      <div className={`p-6 transition-colors duration-500 border-b border-border-soft ${
        analysisResult?.visual_status === 'Red' ? 'bg-alert/10' : 
        analysisResult?.visual_status === 'Yellow' ? 'bg-warning/10' : 
        'bg-bone-low'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-inner border border-border-soft flex items-center justify-center">
            <Camera className="text-ochre" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-ink tracking-tight leading-tight">Visual Pathologist</h3>
            <p className="font-body text-[10px] text-ink-muted font-bold uppercase tracking-[0.2em] mt-0.5">
              {analysisResult ? analysisResult.identification : 'Identify Pests & Disease'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!analysisResult ? (
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border-soft group shadow-inner bg-bone-low">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-border-soft flex items-center justify-center text-ink shadow-sm hover:bg-white transition-all active:scale-95"
                  title="Remove Image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video w-full rounded-2xl border-2 border-dashed border-border-strong bg-bone-low flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white transition-all shadow-inner"
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-ochre border border-border-soft shadow-sm">
                  <Upload size={24} />
                </div>
                <p className="font-body text-[11px] text-ink-muted font-bold uppercase tracking-[0.15em]">Tap to upload plant photo</p>
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
              <div className="flex items-center gap-2 p-3.5 bg-alert/10 border border-alert/20 rounded-xl font-body text-alert text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isGeneratingAI}
              className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-widest justify-center shadow-md disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Camera size={16} />
                  <span>Analyze Plant Health</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Status & Audio */}
            <div className={`p-8 rounded-2xl text-center space-y-4 border border-border-soft shadow-inner transition-colors duration-500 ${
              analysisResult.visual_status === 'Red' ? 'bg-alert/10' : 
              analysisResult.visual_status === 'Yellow' ? 'bg-warning/10' : 
              'bg-bone-low'
            }`}>
              <div className="w-20 h-20 rounded-2xl bg-white border border-border-soft flex items-center justify-center mx-auto shadow-sm">
                <span className="text-4xl">{analysisResult.visual_status === 'Red' ? '⚠️' : analysisResult.visual_status === 'Yellow' ? '🔍' : '✅'}</span>
              </div>
              <h4 className="text-2xl font-display font-bold text-ink tracking-tight leading-tight">
                {analysisResult.identification}
              </h4>
              <button 
                onClick={() => speakText(analysisResult.audio_explanation || "Follow the recovery steps below.")}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-white border border-border-soft rounded-xl font-body text-ink font-bold text-xs shadow-sm hover:bg-bone-low transition-all active:scale-95"
              >
                <Play size={14} fill="currentColor" className="text-ochre" />
                <span>Listen to Recovery Plan</span>
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-3">
              <p className="font-body text-[10px] font-bold text-ink-muted uppercase tracking-widest ml-1">Expert Recovery Steps</p>
              <div className="grid grid-cols-3 gap-3">
                {Array.isArray(analysisResult.visual_steps) && analysisResult.visual_steps.map((step: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => speakText(step.step_description || '')}
                    className="flex flex-col items-center gap-2.5 p-4 bg-bone-low border border-border-soft rounded-xl hover:bg-white hover:border-border-strong transition-all shadow-sm group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{step.step_icon || '🌱'}</span>
                    <span className="font-body text-[10px] font-semibold text-ink text-center leading-tight tracking-tight">
                      {step.step_description || 'Care step'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setAnalysisResult(null); setSelectedImage(null); setPreviewUrl(null); }}
              className="w-full py-3.5 bg-bone-low border border-border-soft rounded-xl font-body text-ink-muted text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-ink transition-colors shadow-sm"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
