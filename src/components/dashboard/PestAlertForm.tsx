'use client'

import { useState } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { pestTypes } from '@/lib/mockData'
import { Send, CheckCircle, MapPin, AlertTriangle } from 'lucide-react'

const severityConfig = {
  low:    { label: 'Low',    color: 'border-safe/50 bg-safe/10 text-safe',   emoji: '🟢' },
  medium: { label: 'Medium', color: 'border-wheat/50 bg-wheat/10 text-wheat', emoji: '🟡' },
  high:   { label: 'High',   color: 'border-alert/50 bg-alert/10 text-alert', emoji: '🔴' },
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-lg high-contrast-text">Report a Pest</h2>
          <p className="text-xs text-white/40 mt-0.5">Help your community by sharing pest sightings</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30">Community reports</p>
          <p className="text-lg font-bold text-wheat">{pestReports.length + 93}</p>
        </div>
      </div>

      {submitted ? (
        /* Success state */
        <div className="nature-card p-8 flex flex-col items-center text-center gap-3 animate-fade-in">
          <CheckCircle size={48} className="text-safe float-anim" />
          <h3 className="font-display font-bold text-white text-lg">Report Submitted!</h3>
          <p className="text-sm text-white/60">Thank you. Your report helps protect nearby farmers.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Select pest type */}
          <FormSection number="1" title="What pest did you see?">
            <div className="grid grid-cols-4 gap-2">
              {pestTypes.map(pest => (
                <button
                  key={pest.id}
                  type="button"
                  id={`pest-type-${pest.id}`}
                  onClick={() => setSelectedPest(pest.id)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-leaf-sm border transition-all duration-200
                    ${selectedPest === pest.id
                      ? 'border-wheat bg-wheat/15 scale-105 shadow-glow-wheat'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                    }
                  `}
                  aria-pressed={selectedPest === pest.id}
                  title={pest.description}
                >
                  <span className="text-2xl leading-none">{pest.emoji}</span>
                  <span className="text-[9px] text-white/70 font-medium text-center leading-tight">{pest.label}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 2: Affected crop */}
          <FormSection number="2" title="Which crop is affected?">
            <div className="grid grid-cols-2 gap-2">
              {crops.slice(0, 6).map(crop => (
                <button
                  key={crop.id}
                  type="button"
                  id={`affected-crop-${crop.id}`}
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-leaf-sm border text-sm font-medium transition-all
                    ${selectedCrop === crop.id
                      ? 'border-forest-light bg-forest/40 text-wheat'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-xl">{crop.emoji}</span>
                  <span className="text-xs leading-tight">{crop.localName}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 3: Severity */}
          <FormSection number="3" title="How severe is it?">
            <div className="flex gap-2">
              {(Object.entries(severityConfig) as [Severity, typeof severityConfig[Severity]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  id={`severity-${key}`}
                  onClick={() => setSeverity(key)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-leaf-sm border text-xs font-semibold transition-all
                    ${severity === key ? cfg.color + ' scale-105' : 'border-white/10 bg-white/5 text-white/50'}
                  `}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </FormSection>

          {/* Step 4: Location (optional) */}
          <FormSection number="4" title="Your location (optional)">
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                id="pest-report-location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Kampala, Jinja, Mbale…"
                className="
                  w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-leaf-sm
                  text-sm text-white placeholder-white/30 focus:outline-none focus:border-forest-light/60
                  transition-colors
                "
              />
            </div>
          </FormSection>

          {/* Notes */}
          <div>
            <textarea
              id="pest-report-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes (optional)…"
              rows={2}
              className="
                w-full px-4 py-3 bg-white/5 border border-white/10 rounded-leaf-sm
                text-sm text-white placeholder-white/30 focus:outline-none focus:border-forest-light/60
                transition-colors resize-none
              "
            />
          </div>

          {/* Validation warning */}
          {(!selectedPest || !selectedCrop) && (
            <div className="flex items-center gap-2 text-xs text-wheat/70">
              <AlertTriangle size={12} />
              <span>Please select a pest type and affected crop to submit.</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="pest-report-submit"
            disabled={!selectedPest || !selectedCrop || submitting}
            className={`
              w-full py-4 rounded-leaf font-display font-bold text-sm uppercase tracking-wider
              flex items-center justify-center gap-2 transition-all duration-200
              ${selectedPest && selectedCrop
                ? 'bg-forest text-wheat shadow-nature hover:bg-forest-light hover:shadow-glow-green'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-wheat/30 border-t-wheat rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send size={15} />
                Submit Report
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-forest-light text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <p className="text-sm font-semibold text-white/80">{title}</p>
      </div>
      {children}
    </div>
  )
}
