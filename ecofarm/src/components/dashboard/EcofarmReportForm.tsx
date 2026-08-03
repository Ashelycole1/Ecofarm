'use client'

import { useState } from 'react'
import { X, Send, MapPin, AlertTriangle, Cloud, Sprout, Droplets, Thermometer, Info } from 'lucide-react'

interface EcofarmReportFormProps {
  onClose: () => void;
  userPos?: [number, number] | null;
}

const CATEGORIES = [
  { id: 'pest', label: 'Pest/Disease', icon: Sprout, color: '#FF5252' },
  { id: 'soil', label: 'Soil Health', icon: Info, color: '#8D6E63' },
  { id: 'water', label: 'Water/Irrigation', icon: Droplets, color: '#42A5F5' },
  { id: 'weather', label: 'Weather Event', icon: Cloud, color: '#78909C' },
  { id: 'harvest', label: 'Harvest Update', icon: Thermometer, color: '#66BB6A' },
]

export default function EcofarmReportForm({ onClose, userPos }: EcofarmReportFormProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<string>('pest')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false)
      setIsDone(true)
      setTimeout(onClose, 2000)
    }, 1200)
  }

  if (isDone) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-forest-deep border border-white/10 rounded-3xl p-8 text-center animate-scale-in">
          <div className="w-20 h-20 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-4 text-leaf animate-bounce">
            <Send size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Report Received</h2>
          <p className="text-white/50 text-sm">Thank you! Your intelligence helps the community grow stronger.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#061412] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-white font-black text-lg uppercase tracking-tight">Farm Intelligence Report</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase">Share real-time situational data</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-white/40 text-[10px] font-black uppercase mb-3 tracking-widest">Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${isActive
                            ? 'bg-forest text-white border-white/20 shadow-lg shadow-forest/20 scale-105'
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                          }`}
                      >
                        <Icon size={20} style={{ color: isActive ? '#fff' : cat.color }} />
                        <span className="text-[10px] font-bold uppercase text-center">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-wheat transition-all active:scale-95"
              >
                Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div>
                  <label className="block text-white/40 text-[10px] font-black uppercase mb-2 tracking-widest">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the situation..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-forest/50 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] font-black uppercase mb-2 tracking-widest">Urgency</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setUrgency(level)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${urgency === level
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-white/5 text-white/30 border-white/5'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {userPos && (
                  <div className="flex items-center gap-2 p-3 bg-forest/20 rounded-xl border border-forest/30">
                    <MapPin size={14} className="text-leaf" />
                    <span className="text-white/60 text-[10px] font-bold">Location automatically tagged from GPS</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white/50 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description}
                  className="flex-[2] py-4 rounded-2xl bg-forest text-wheat font-black text-xs uppercase tracking-widest hover:bg-forest-light transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer info */}
        <div className="px-6 py-4 bg-white/5 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <p className="text-white/30 text-[9px] font-medium leading-tight">
            Verified updates are added to the Farm Intelligence Map after review by a Village Elder.
          </p>
        </div>
      </div>
    </div>
  )
}
