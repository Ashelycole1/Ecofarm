'use client'

import { useState } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { ChevronDown, ChevronUp, Calendar, Droplets, Clock } from 'lucide-react'
import type { Crop } from '@/lib/mockData'

const statusConfig = {
  optimal: { label: 'Optimal Now',   bg: 'bg-safe/15',  border: 'border-safe/40',  text: 'text-safe',  dot: 'bg-safe'  },
  good:    { label: 'Good Window',   bg: 'bg-rain/10',  border: 'border-rain/30',  text: 'text-rain',  dot: 'bg-rain'  },
  caution: { label: 'Wait a Bit',    bg: 'bg-wheat/10', border: 'border-wheat/40', text: 'text-wheat', dot: 'bg-wheat' },
  avoid:   { label: 'Avoid Now',     bg: 'bg-alert/10', border: 'border-alert/30', text: 'text-alert', dot: 'bg-alert' },
}

const waterIcons = { low: '💧', medium: '💧💧', high: '💧💧💧' }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function CropCard({ crop }: { crop: Crop }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig[crop.status]
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className={`crop-row rounded-leaf border ${cfg.border} ${cfg.bg} transition-all duration-300 overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
        id={`crop-card-${crop.id}`}
        aria-expanded={expanded}
      >
        {/* Emoji */}
        <span className="text-3xl shrink-0">{crop.emoji}</span>

        {/* Name & badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm leading-tight">{crop.name}</p>
            <span className={`badge ${cfg.bg} ${cfg.border} border ${cfg.text} leading-none`}>
              <span className={`status-dot ${cfg.dot} mr-1`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 italic">&ldquo;{crop.localName}&rdquo; · {crop.region.join(', ')}</p>
        </div>

        {/* Expand arrow */}
        <span className={`${cfg.text} shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Tip */}
          <div className="bg-forest-dark/40 rounded-leaf-sm p-3">
            <p className="text-xs text-white/80 leading-relaxed">💡 {crop.tip}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={<Droplets size={11} />} label="Water" value={waterIcons[crop.waterNeed]} />
            <MiniStat icon={<Clock size={11} />} label="Harvest" value={`${crop.harvestWeeks}w`} />
            <MiniStat icon={<Calendar size={11} />} label="Season" value={`${crop.plantingMonths.length} windows`} />
          </div>

          {/* Planting month pills */}
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Planting Months</p>
            <div className="flex flex-wrap gap-1">
              {MONTH_NAMES.map((m, i) => {
                const month = i + 1
                const isPlanting = crop.plantingMonths.includes(month)
                const isCurrent = month === currentMonth
                return (
                  <span
                    key={month}
                    className={`
                      text-[10px] px-2 py-0.5 rounded-full font-medium transition-all
                      ${isPlanting
                        ? isCurrent
                          ? 'bg-wheat text-forest-dark ring-1 ring-wheat/80'
                          : 'bg-forest text-white/90'
                        : 'bg-white/5 text-white/25'
                      }
                    `}
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

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-2 flex flex-col items-center gap-0.5">
      <span className="text-white/40">{icon}</span>
      <span className="text-[9px] text-white/40 uppercase">{label}</span>
      <span className="text-xs text-white font-semibold">{value}</span>
    </div>
  )
}

export default function PlantingCalendar() {
  const { crops } = useFirebase()
  const [filter, setFilter] = useState<'all' | 'optimal' | 'good' | 'caution'>('all')

  const filtered = filter === 'all' ? crops : crops.filter(c => c.status === filter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-lg high-contrast-text">Planting Calendar</h2>
          <p className="text-xs text-white/40">
            {MONTH_NAMES[new Date().getMonth()]} — {crops.filter(c => c.status === 'optimal').length} crops at peak season
          </p>
        </div>
        <span className="text-2xl">📅</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'optimal', 'good', 'caution'] as const).map(f => {
          const cfg = f === 'all' ? null : statusConfig[f]
          return (
            <button
              key={f}
              id={`calendar-filter-${f}`}
              onClick={() => setFilter(f)}
              className={`
                shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all
                ${filter === f
                  ? 'bg-forest text-wheat shadow-nature'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                }
              `}
            >
              {cfg && <span className={`status-dot ${cfg.dot} mr-1.5`} />}
              {f === 'all' ? '🌿 All Crops' : cfg?.label}
            </button>
          )
        })}
      </div>

      {/* Crop list */}
      <div className="space-y-2">
        {filtered.map(crop => (
          <CropCard key={crop.id} crop={crop} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-white/30 py-8 text-sm">No crops in this category</div>
        )}
      </div>
    </div>
  )
}
