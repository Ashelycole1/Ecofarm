'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { pestTypes } from '@/lib/mockData'
import { Send, CheckCircle, MapPin, AlertTriangle, Bug, Ghost, Microscope, CloudRain, Wind, Sprout, Info, AlertCircle } from 'lucide-react'

const severityConfig = {
  low:    { label: 'Low',    color: 'border-safe/30 bg-safe/10 text-safe',   Icon: Info },
  medium: { label: 'Medium', color: 'border-warn/30 bg-warn/10 text-warn',   Icon: AlertTriangle },
  high:   { label: 'High',   color: 'border-alert/30 bg-alert/10 text-alert', Icon: AlertCircle },
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

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="w-5 h-5 rounded-full bg-forest/10 border border-forest/20 text-forest text-[10px] font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <p className="font-body text-xs font-bold text-ink-muted uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function PestAlertForm() {
  const { crops, submitPestReport, pestReports } = useApp()
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
    <div className="mh-card p-6 md:p-8 border border-border-soft bg-white space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border-soft pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink tracking-tight">Report a Pest</h2>
          <p className="font-body text-xs text-ink-muted font-bold tracking-wide mt-0.5">Help your community by sharing sightings</p>
        </div>
        <div className="text-right">
          <p className="font-body text-[9px] text-ink-muted font-bold uppercase tracking-wider">Community reports</p>
          <p className="font-display text-xl font-bold text-forest leading-tight mt-0.5">{pestReports.length + 93}</p>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 flex flex-col items-center text-center gap-4 animate-fade-in rounded-2xl bg-safe/10 border border-safe/20">
          <div className="w-16 h-16 bg-safe/20 rounded-full flex items-center justify-center text-safe">
            <CheckCircle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-ink text-xl tracking-tight">Report Logged</h3>
            <p className="font-body text-xs text-ink-muted max-w-[220px]">Thank you. Your intelligence helps protect nearby farmers.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select pest type */}
          <FormSection number="1" title="What pest did you see?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {pestTypes.map(pest => {
                const Icon = pestIcons[pest.id] || Bug
                return (
                  <button
                    key={pest.id}
                    type="button"
                    onClick={() => setSelectedPest(pest.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border font-body text-xs font-bold transition-all ${
                      selectedPest === pest.id
                        ? 'border-forest bg-forest/10 text-forest shadow-sm'
                        : 'border-border-soft bg-bone-low text-ink-muted hover:text-ink hover:bg-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="truncate w-full text-center">{pest.label}</span>
                  </button>
                )
              })}
            </div>
          </FormSection>

          {/* Step 2: Affected crop */}
          <FormSection number="2" title="Which crop is affected?">
            <div className="grid grid-cols-2 gap-2.5">
              {crops.slice(0, 6).map(crop => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border font-body text-xs font-bold transition-all ${
                    selectedCrop === crop.id
                      ? 'border-forest bg-forest text-white shadow-sm'
                      : 'border-border-soft bg-bone-low text-ink-muted hover:text-ink hover:bg-white'
                  }`}
                >
                  <Sprout size={16} className="shrink-0" />
                  <span className="truncate text-left">{crop.localName}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 3: Severity */}
          <FormSection number="3" title="How severe is it?">
            <div className="flex gap-2.5">
              {(Object.entries(severityConfig) as [Severity, typeof severityConfig[Severity]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeverity(key)}
                  className={`flex-1 py-3 px-3 rounded-xl border font-body text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    severity === key ? cfg.color + ' shadow-sm border-current' : 'border-border-soft bg-bone-low text-ink-muted hover:text-ink'
                  }`}
                >
                  <cfg.Icon size={14} />
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 4: Location */}
          <FormSection number="4" title="Your location (optional)">
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Kampala, Jinja, Mbale..."
                className="mh-input py-3 pl-11"
              />
            </div>
          </FormSection>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedPest || !selectedCrop || submitting}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Send size={16} />
                <span>Deploy Intelligence</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
