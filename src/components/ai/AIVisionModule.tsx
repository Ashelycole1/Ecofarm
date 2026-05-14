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
  
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setAnalysisResult(null)
      setError(null)
      setIsCameraMode(false)
    }
  }

  const startCamera = async () => {
    setError(null)
    setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraMode(true)
      }
    } catch (err) {
      setError('Camera access denied or not available.')
      console.error(err)
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraMode(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
            setSelectedImage(file)
            setPreviewUrl(URL.createObjectURL(file))
            stopCamera()
          }
        }, 'image/jpeg', 0.95)
      }
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
            {isCameraMode ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border-soft">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
                   <div className="w-48 h-48 border-2 border-white/20 rounded-full opacity-20" />
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 px-6">
                   <button 
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full bg-white border-4 border-ochre flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-ochre/10 flex items-center justify-center">
                      <Camera className="text-ochre" size={20} />
                    </div>
                  </button>
                  <div className="w-10 h-10" /> {/* Spacer */}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : previewUrl ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="aspect-square sm:aspect-video w-full rounded-2xl border-2 border-dashed border-border-strong bg-bone-low flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white transition-all shadow-inner group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-ochre border border-border-soft shadow-sm group-hover:scale-110 transition-transform">
                    {cameraLoading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                  </div>
                  <p className="font-body text-[11px] text-ink-muted font-bold uppercase tracking-[0.15em]">Take Plant Photo</p>
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square sm:aspect-video w-full rounded-2xl border-2 border-dashed border-border-strong bg-bone-low flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white transition-all shadow-inner group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-ochre border border-border-soft shadow-sm group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <p className="font-body text-[11px] text-ink-muted font-bold uppercase tracking-[0.15em]">Upload from Gallery</p>
                </button>
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

            {!isCameraMode && (
              <button
                onClick={handleAnalyze}
                disabled={!selectedImage || isGeneratingAI}
                className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-widest justify-center shadow-md disabled:opacity-40 transition-all active:scale-[0.98]"
              >
                {isGeneratingAI ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Analyze Plant Health</span>
                  </>
                )}
              </button>
            )}
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
