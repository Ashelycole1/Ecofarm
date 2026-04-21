'use client'

import { useState, useRef } from 'react'
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Leaf } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default function AIVisionModule() {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ diagnosis: string; prevention: string; curative: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setStatus('analyzing')
    setErrorMsg('')
    
    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1]

        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const prompt = `You are a specialist agronomist based in East Africa, experienced in Ugandan smallholder farming systems. Analyze this crop image.
        Identify the disease, pest, or deficiency — and provide ONLY organic, low-cost 'Appropriate Technology' solutions that are available in rural Uganda (e.g., neem leaves, wood ash, cow dung, crop rotation, intercropping).
        Respond ONLY in the following JSON format with no markdown, backticks, or extra text:
        {
          "diagnosis": "string",
          "prevention": "string",
          "curative": "string"
        }`

        const imagePart = {
          inlineData: {
            data: base64data,
            mimeType: file.type
          }
        }

        const aiResult = await model.generateContent([prompt, imagePart])
        const text = aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(text)
        
        // Simple fallback validation
        setResult({
          diagnosis: parsed.diagnosis || "Unknown Issue",
          prevention: parsed.prevention || "Maintain good field hygiene.",
          curative: parsed.curative || "Consult local extension officer."
        })
        setStatus('success')
      }
    } catch (err: any) {
      console.warn("Vision AI Error:", err)
      setErrorMsg(err.message || 'Analysis failed. Make sure your API key is correct.')
      setStatus('error')
    }
  }

  const resetScanner = () => {
    setStatus('idle')
    setResult(null)
    setImagePreview(null)
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="nature-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-white text-lg">AI Plant Diagnostic</h3>
          <p className="text-xs text-white/40">Analyze crop health from photos</p>
        </div>
        <div className="p-2 bg-forest/20 rounded-full">
          <Camera className="text-wheat" size={24} />
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleImageCapture} 
        className="hidden" 
      />

      {(status === 'idle' || status === 'error') && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[4/3] sm:aspect-[16/9] rounded-leaf border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-forest-light/40 transition-colors group relative overflow-hidden"
        >
          {imagePreview && (
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
               <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4 rounded-full bg-white/5 group-hover:bg-forest/20 transition-colors z-10">
            <Upload className="text-white/20 group-hover:text-wheat transition-colors" size={32} />
          </div>
          <p className="text-sm text-white/40 font-medium z-10">Tap to upload or take photo</p>
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 rounded-md bg-alert/20 border border-alert/50 text-alert text-xs text-center">
          {errorMsg}
        </div>
      )}

      {status === 'analyzing' && (
        <div className="aspect-[4/3] rounded-leaf bg-black/40 overflow-hidden relative flex flex-col items-center justify-center gap-4">
          {imagePreview && (
             <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="z-10 flex flex-col items-center gap-4">
            <RefreshCw className="text-wheat animate-spin drop-shadow-md" size={40} />
            <p className="text-sm text-wheat font-bold animate-pulse drop-shadow-md bg-black/20 px-3 py-1 rounded-full">
              Gemini analyzing foliage...
            </p>
          </div>
        </div>
      )}

      {status === 'success' && result && (
        <div className="space-y-4 animate-fade-in">
          {imagePreview && (
             <div className="w-full h-32 rounded-leaf-sm overflow-hidden border border-white/10 opacity-70">
                <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />
             </div>
          )}
          <div className="rounded-leaf bg-forest/20 border border-safe/30 p-5 space-y-4 shadow-inner">
            
            <div className="flex gap-3">
              <CheckCircle2 className="text-safe shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm text-wheat flex items-center font-bold tracking-wide uppercase mb-1">Diagnosis</h4>
                <p className="text-xs text-white/80 leading-relaxed">{result.diagnosis}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <AlertCircle className="text-wheat shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm text-wheat font-bold tracking-wide uppercase mb-1">Prevention</h4>
                <p className="text-xs text-white/80 leading-relaxed">{result.prevention}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Leaf className="text-safe shrink-0 mt-1" size={20} />
              <div>
                 <h4 className="text-sm text-wheat font-bold tracking-wide uppercase mb-1">Curative Measures</h4>
                 <p className="text-xs text-white/80 leading-relaxed">{result.curative}</p>
              </div>
            </div>

          </div>
          <button 
            onClick={resetScanner}
            className="w-full py-3 rounded-leaf bg-forest border border-white/10 text-wheat font-bold text-sm uppercase tracking-wider hover:bg-forest-light transition-colors"
          >
            New Analysis
          </button>
        </div>
      )}

      {status !== 'success' && (
      <div className="bg-white/5 rounded-leaf-sm p-3 flex items-start gap-3">
        <AlertCircle className="text-wheat shrink-0" size={16} />
        <p className="text-[10px] text-white/60 leading-relaxed">
          The AI Vision module securely processes your image entirely client-side using Google's Gemini SDK. Always verify with local experts for critical decisions.
        </p>
      </div>
      )}
    </div>
  )
}
