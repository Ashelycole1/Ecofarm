'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ChevronDown, ChevronUp, Calendar, Droplets, Clock, Sprout } from 'lucide-react'
import type { Crop } from '@/lib/mockData'

const statusConfig = {
  optimal: { label: 'Optimal Now',   bg: 'bg-safe/10',  border: 'border-safe/30',  text: 'text-safe',  dot: 'bg-safe'  },
  good:    { label: 'Good Window',   bg: 'bg-rain/10',  border: 'border-rain/30',  text: 'text-rain',  dot: 'bg-rain'  },
  caution: { label: 'Wait a Bit',    bg: 'bg-wheat/10', border: 'border-wheat/40', text: 'text-wheat', dot: 'bg-wheat' },
  avoid:   { label: 'Avoid Now',     bg: 'bg-alert/10', border: 'border-alert/30', text: 'text-alert', dot: 'bg-alert' },
}

const waterIcons = { low: 'LOW', medium: 'MED', high: 'HIGH' }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bone-low rounded-xl p-2.5 border border-border-soft flex flex-col items-center gap-0.5 shadow-inner">
      <span className="text-ink-muted">{icon}</span>
      <span className="font-body text-[9px] font-bold text-ink-muted uppercase tracking-wider">{label}</span>
      <span className="font-display text-xs text-ink font-bold mt-0.5">{value}</span>
    </div>
  )
}

function CropCard({ crop }: { crop: Crop }) {
  const [expanded, setExpanded] = useState(false)
  
  const validStatus = Object.keys(statusConfig).includes(crop.status) ? crop.status : 'caution'
  const cfg = statusConfig[validStatus as keyof typeof statusConfig]
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className={`mh-card border ${cfg.border} bg-white transition-all duration-300 overflow-hidden`}>
      <button
        className="w-full flex items-center gap-4 p-5 text-left"
        onClick={() => setExpanded(e => !e)}
        id={`crop-card-${crop.id}`}
        aria-expanded={expanded}
      >
        <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center border border-forest/20 text-forest shrink-0">
          <Sprout size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-ink text-lg leading-tight tracking-tight">{crop.name}</p>
            <span className={`px-2.5 py-1 rounded-full font-body text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.border} border ${cfg.text} leading-none`}>
              {cfg.label}
            </span>
          </div>
          <p className="font-body text-[10px] text-ink-muted mt-1 uppercase font-bold tracking-wider">
            &quot;{crop.localName || 'Local Seed'}&quot; · {crop.region ? crop.region.join(', ') : 'Uganda'}
          </p>
        </div>

        <span className={`text-ink-muted shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} />
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-bone-dim/40 pt-5">
          <div className="bg-bone-low rounded-xl p-4 border border-border-soft">
            <p className="font-body text-xs text-ink-muted leading-relaxed font-medium">{crop.tip}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={<Droplets size={14} />} label="Water" value={waterIcons[crop.waterNeed as keyof typeof waterIcons] || 'MED'} />
            <MiniStat icon={<Clock size={14} />} label="Harvest" value={`${crop.harvestWeeks || 12}W`} />
            <MiniStat icon={<Calendar size={14} />} label="Season" value={`${crop.plantingMonths?.length || 2} WINDOWS`} />
          </div>

          <div className="pt-1">
            <p className="font-body text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2">Planting Months</p>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_NAMES.map((m, i) => {
                const month = i + 1
                const isPlanting = crop.plantingMonths?.includes(month)
                const isCurrent = month === currentMonth
                return (
                  <span
                    key={month}
                    className={`font-body text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                      isPlanting
                        ? isCurrent
                          ? 'bg-sienna text-white border-sienna shadow-sm'
                          : 'bg-forest text-white border-forest shadow-sm'
                        : 'bg-bone-low text-ink-faint border-transparent'
                    }`}
                  >
                    {m}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlantingCalendar() {
  const { crops, generatePlantingSchedule, isGeneratingAI } = useApp()
  const [filter, setFilter] = useState<'all' | 'optimal' | 'good' | 'caution'>('all')
  
  const [selectedRegion, setSelectedRegion] = useState('Central (Kampala)')
  const [selectedCrop, setSelectedCrop] = useState('Maize')
  const [aiCustomCrops, setAiCustomCrops] = useState<Crop[] | null>(null)

  const activeCrops = aiCustomCrops || crops
  const filtered = filter === 'all' ? activeCrops : activeCrops.filter(c => c.status === filter)

  const handleGenerate = async () => {
    setFilter('all')
    const result = await generatePlantingSchedule(selectedCrop, selectedRegion)
    if (result) {
      setAiCustomCrops(result)
    } else {
      alert("AI Generation failed. Ensure API keys are set correctly.")
    }
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border-soft pb-4">
        <h2 className="font-display font-bold text-ink text-4xl tracking-tight">Cropping Calendar</h2>
        <p className="font-body text-xs font-bold text-ink-muted tracking-wide">
          {MONTH_NAMES[new Date().getMonth()]} — Custom AI schedules
        </p>
      </div>

      {/* AI Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select 
          value={selectedRegion} 
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="mh-input py-3 bg-white"
        >
          <option>Central (Kampala)</option>
          <option>Northern (Gulu)</option>
          <option>Western (Mbarara)</option>
          <option>Eastern (Mbale)</option>
        </select>

        <select 
          value={selectedCrop} 
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="mh-input py-3 bg-white"
        >
          <option>Maize</option>
          <option>Beans</option>
          <option>Cassava</option>
          <option>Matooke</option>
          <option>Coffee</option>
        </select>

        <button 
          onClick={handleGenerate}
          disabled={isGeneratingAI}
          className="btn-primary py-3 px-4 text-xs font-bold w-full"
        >
          {isGeneratingAI ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="animate-spin" size={16} /> Generating...
            </span>
          ) : (
            'Generate AI Schedule'
          )}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap pt-2">
        {(['all', 'optimal', 'good', 'caution'] as const).map(f => {
          const cfg = f === 'all' ? null : statusConfig[f]
          return (
            <button
              key={f}
              id={`calendar-filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full font-body text-xs font-bold transition-all border ${
                filter === f
                  ? 'bg-forest text-white border-forest shadow-sm'
                  : 'bg-white text-ink-muted hover:text-ink border-border-soft shadow-card-sm'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                <span>{f === 'all' ? '🌿 All Crops' : cfg?.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Crop list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {filtered.map((crop, index) => (
          <CropCard key={crop.id || index} crop={crop} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center bg-white rounded-xl border border-border-soft py-12 space-y-2">
            <p className="font-display font-bold text-lg text-ink">No scheduled crops match this condition</p>
            <p className="font-body text-xs text-ink-muted">Try switching filtering tabs or generate a new customized AI forecast.</p>
          </div>
        )}
      </div>
    </div>
  )
}
