'use client'

import { useState } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { pestTypes } from '@/lib/mockData'
import { Send, CheckCircle, MapPin, AlertTriangle, Bug, Ghost, Microscope, CloudRain, Wind, Sprout, Info, AlertCircle } from 'lucide-react'

const severityConfig = {
  low:    { label: 'Low',    color: 'border-safe/50 bg-safe/10 text-safe',   Icon: Info },
  medium: { label: 'Medium', color: 'border-wheat/50 bg-wheat/10 text-wheat', Icon: AlertTriangle },
  high:   { label: 'High',   color: 'border-alert/50 bg-alert/10 text-alert', Icon: AlertCircle },
}

const pestIcons: Record<string, any> = {
  worm: Bug,
  beetle: Bug,
  fly: Wind,
  fungus: Ghost,
  locust: Sprout,
  mite: Microscope,
  rodent: Ghost,
  disease: AlertCircle
}

type Severity = 'low' | 'medium' | 'high'

export default function PestAlertForm() {
  const { crops, submitPestReport, pestReports } = useFirebase()
  const [selectedPest, setSelectedPest] = useState<string | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<string>('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [location, setLocation] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPest || !selectedCrop) return

    setSubmitting(true)
    await submitPestReport({
      pestTypeId: selectedPest,
      cropId: selectedCrop,
      location: location || 'Not specified',
      severity,
      notes,
    })
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelectedPest(null)
      setSelectedCrop('')
      setSeverity('medium')
      setLocation('')
      setNotes('')
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between px-2">
        <div>
          <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">Report a Pest</h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Help your community by sharing sightings</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Community reports</p>
          <p className="text-xl font-black text-wheat uppercase tracking-tighter">{pestReports.length + 93}</p>
        </div>
      </div>

      {submitted ? (
        <div className="nature-card p-12 flex flex-col items-center text-center gap-4 animate-fade-in rounded-[32px] bg-safe/5 border-safe/20">
          <div className="w-20 h-20 bg-safe/20 rounded-full flex items-center justify-center border border-safe/30 shadow-2xl">
            <CheckCircle size={40} className="text-safe" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-black text-white text-xl uppercase tracking-tight">Report Logged</h3>
            <p className="text-xs text-white/40 font-medium max-w-[200px]">Thank you. Your intelligence helps protect nearby farmers.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select pest type */}
          <FormSection number="1" title="What pest did you see?">
            <div className="grid grid-cols-4 gap-3">
              {pestTypes.map(pest => {
                const Icon = pestIcons[pest.id] || Bug
                return (
                  <button
                    key={pest.id}
                    type="button"
                    onClick={() => setSelectedPest(pest.id)}
                    className={`
                      flex flex-col items-center gap-3 p-4 rounded-[24px] border transition-all duration-300
                      ${selectedPest === pest.id
                        ? 'border-wheat bg-wheat/10 scale-105 shadow-2xl'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform ${selectedPest === pest.id ? 'bg-wheat/20' : 'bg-white/5'}`}>
                      <Icon className={selectedPest === pest.id ? 'text-wheat' : 'text-white/20'} size={20} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${selectedPest === pest.id ? 'text-white' : 'text-white/30'}`}>{pest.label}</span>
                  </button>
                )
              })}
            </div>
          </FormSection>

          {/* Step 2: Affected crop */}
          <FormSection number="2" title="Which crop is affected?">
            <div className="grid grid-cols-2 gap-3">
              {crops.slice(0, 6).map(crop => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-[24px] border text-sm font-black transition-all
                    ${selectedCrop === crop.id
                      ? 'border-forest-light bg-forest/20 text-wheat shadow-2xl'
                      : 'border-white/5 bg-white/[0.02] text-white/30 hover:bg-white/5'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedCrop === crop.id ? 'bg-forest/40' : 'bg-white/5'}`}>
                    <Sprout size={16} />
                  </div>
                  <span className="uppercase tracking-widest text-[10px]">{crop.localName}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 3: Severity */}
          <FormSection number="3" title="How severe is it?">
            <div className="flex gap-3">
              {(Object.entries(severityConfig) as [Severity, typeof severityConfig[Severity]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeverity(key)}
                  className={`
                    flex-1 py-4 px-4 rounded-[24px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
                    ${severity === key ? cfg.color + ' scale-105 shadow-2xl' : 'border-white/5 bg-white/[0.02] text-white/20'}
                  `}
                >
                  <cfg.Icon size={14} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 4: Location */}
          <FormSection number="4" title="Your location (optional)">
            <div className="relative group">
              <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-wheat transition-colors" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Kampala, Jinja, Mbale..."
                className="
                  w-full pl-12 pr-6 py-5 bg-white/[0.02] border border-white/5 rounded-[24px]
                  text-sm text-white placeholder-white/10 focus:outline-none focus:border-wheat/30
                  transition-all font-medium
                "
              />
            </div>
          </FormSection>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedPest || !selectedCrop || submitting}
            className={`
              w-full py-6 rounded-[24px] font-display font-black text-xs uppercase tracking-[0.3em]
              flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl
              ${selectedPest && selectedCrop
                ? 'bg-white text-black hover:scale-[1.02] active:scale-95'
                : 'bg-white/5 text-white/10 cursor-not-allowed'
              }
            `}
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Send size={16} />
                Deploy Intelligence
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <span className="w-6 h-6 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black flex items-center justify-center shrink-0">
          {number}
        </span>
        <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">{title}</p>
      </div>
      {children}
    </div>
  )
}
