'use client'

import { useState, useRef } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Camera, Upload, X, AlertCircle, Play, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function AIVisionModule() {
  const { analyzeCropImage, isGeneratingAI } = useFirebase()
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
    <div className="nature-card overflow-hidden">
      {/* Header */}
      <div className={`p-4 transition-colors duration-500 ${
        analysisResult?.visual_status === 'Red' ? 'bg-alert/20' : 
        analysisResult?.visual_status === 'Yellow' ? 'bg-warning/20' : 
        'bg-forest/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wheat/20 flex items-center justify-center">
            <Camera className="text-wheat" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Visual Pathologist</h3>
            <p className="text-[10px] text-wheat/60 font-medium uppercase tracking-wider">
              {analysisResult ? analysisResult.identification : 'Identify Pests & Disease'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!analysisResult ? (
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-white/10 group">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center text-forest">
                  <Upload size={24} />
                </div>
                <p className="text-xs text-white/40 font-medium">Tap to upload leaf or pest photo</p>
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
              <div className="flex items-center gap-2 p-3 bg-alert/10 border border-alert/20 rounded-xl text-alert text-[10px]">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isGeneratingAI}
              className="w-full py-4 bg-forest text-wheat rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-nature"
            >
              {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : 'Analyze Plant Health'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Status & Audio */}
            <div className={`p-6 rounded-3xl text-center space-y-4 shadow-xl transition-colors duration-500 ${
              analysisResult.visual_status === 'Red' ? 'bg-alert' : 
              analysisResult.visual_status === 'Yellow' ? 'bg-warning' : 
              'bg-safe'
            }`}>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 border-4 border-white/20">
                <span className="text-4xl">{analysisResult.visual_status === 'Red' ? '⚠️' : analysisResult.visual_status === 'Yellow' ? '🔍' : '✅'}</span>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">
                {analysisResult.identification}
              </h4>
              <button 
                onClick={() => speakText(analysisResult.audio_explanation)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black/20 rounded-full text-wheat text-xs font-bold hover:bg-black/30 transition-all"
              >
                <Play size={16} fill="currentColor" />
                Listen to Recovery Plan
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Recovery Steps</p>
              <div className="grid grid-cols-3 gap-3">
                {analysisResult.visual_steps.map((step: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => speakText(step.step_description)}
                    className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <span className="text-4xl group-active:scale-90 transition-transform">{step.step_icon}</span>
                    <span className="text-[8px] font-bold text-wheat/60 uppercase text-center leading-tight">
                      {step.step_description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setAnalysisResult(null); setSelectedImage(null); setPreviewUrl(null); }}
              className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
