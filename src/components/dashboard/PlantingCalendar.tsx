'use client'

import { useState } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { ChevronDown, ChevronUp, Calendar, Droplets, Clock } from 'lucide-react'
import type { Crop } from '@/lib/mockData'

import { GoogleGenerativeAI } from '@google/generative-ai'

// ... same status, icons, and CropCard components ...
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
  
  // Safe fallback for status styling
  const validStatus = Object.keys(statusConfig).includes(crop.status) ? crop.status : 'caution'
  const cfg = statusConfig[validStatus as keyof typeof statusConfig]
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className={`crop-row rounded-leaf border ${cfg.border} ${cfg.bg} transition-all duration-300 overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
        id={`crop-card-${crop.id}`}
        aria-expanded={expanded}
      >
        <span className="text-3xl shrink-0">{crop.emoji || '🌱'}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm leading-tight">{crop.name}</p>
            <span className={`badge ${cfg.bg} ${cfg.border} border ${cfg.text} leading-none`}>
              <span className={`status-dot ${cfg.dot} mr-1`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 italic">&ldquo;{crop.localName || 'Local Seed'}&rdquo; · {crop.region ? crop.region.join(', ') : 'Uganda'}</p>
        </div>

        <span className={`${cfg.text} shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div className="bg-forest-dark/40 rounded-leaf-sm p-3">
            <p className="text-xs text-white/80 leading-relaxed">💡 {crop.tip}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={<Droplets size={11} />} label="Water" value={waterIcons[crop.waterNeed as keyof typeof waterIcons] || '💧💧'} />
            <MiniStat icon={<Clock size={11} />} label="Harvest" value={`${crop.harvestWeeks || 12}w`} />
            <MiniStat icon={<Calendar size={11} />} label="Season" value={`${crop.plantingMonths?.length || 2} windows`} />
          </div>

          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Planting Months</p>
            <div className="flex flex-wrap gap-1">
              {MONTH_NAMES.map((m, i) => {
                const month = i + 1
                const isPlanting = crop.plantingMonths?.includes(month)
                const isCurrent = month === currentMonth
                return (
                  <span
                    key={month}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all
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
  
  const [selectedRegion, setSelectedRegion] = useState('Central (Kampala)')
  const [selectedCrop, setSelectedCrop] = useState('Maize')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiCustomCrops, setAiCustomCrops] = useState<Crop[] | null>(null)

  const activeCrops = aiCustomCrops || crops
  const filtered = filter === 'all' ? activeCrops : activeCrops.filter(c => c.status === filter)

  const generateSchedule = async () => {
    setIsGenerating(true)
    setFilter('all')
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const prompt = `Generate a highly specific planting calendar JSON array of 3 distinct varieties or complementary options for growing ${selectedCrop} in the ${selectedRegion} region of Uganda. 
        Each object must strictly match this exact JSON schema:
        { "id": "string", "name": "string", "localName": "string", "region": ["string"], "status": "optimal" | "good" | "caution" | "avoid", "tip": "string", "waterNeed": "low" | "medium" | "high", "harvestWeeks": number, "plantingMonths": number[], "emoji": "string", "plantingDate": "string", "tips": "string" }
        Return ONLY valid raw JSON array, without markdown. Treat "tip" and "tips" similarly.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
      const calendarCrops = JSON.parse(text)
      
      setAiCustomCrops(calendarCrops)
    } catch (err) {
      console.warn("AI Generation Failed for Calendar", err)
      alert("AI Generation failed. Ensure API key is set and try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-white text-lg high-contrast-text">Cropping Calendar</h2>
        <p className="text-xs text-white/40">
          {MONTH_NAMES[new Date().getMonth()]} — Custom AI schedules
        </p>
      </div>

      {/* AI Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
         <select 
           value={selectedRegion} 
           onChange={(e) => setSelectedRegion(e.target.value)}
           className="w-full bg-black/40 border border-white/10 rounded-leaf-sm p-2 text-xs text-white"
         >
           <option>Central (Kampala)</option>
           <option>Northern (Gulu)</option>
           <option>Western (Mbarara)</option>
           <option>Eastern (Mbale)</option>
         </select>

         <select 
           value={selectedCrop} 
           onChange={(e) => setSelectedCrop(e.target.value)}
           className="w-full bg-black/40 border border-white/10 rounded-leaf-sm p-2 text-xs text-white"
         >
           <option>Maize</option>
           <option>Beans</option>
           <option>Cassava</option>
           <option>Matooke</option>
           <option>Coffee</option>
         </select>

         <button 
           onClick={generateSchedule}
           disabled={isGenerating}
           className="sm:col-span-1 col-span-2 py-2.5 rounded-leaf bg-forest/40 border border-white/10 text-wheat font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-forest transition-colors"
         >
           {isGenerating ? <><Clock className="animate-spin" size={14} /> Generating...</> : 'Generate AI Schedule'}
         </button>
      </div>
      <button 
        onClick={generateSchedule}
        disabled={isGenerating}
        className="sm:hidden w-full py-2.5 rounded-leaf bg-forest/40 border border-white/10 text-wheat font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-forest transition-colors"
      >
        {isGenerating ? <><Clock className="animate-spin" size={14} /> Generating...</> : "Generate AI Schedule"}
      </button>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-2">
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
              {f === 'all' ? '🌿 All' : cfg?.label}
            </button>
          )
        })}
      </div>

      {/* Crop list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {filtered.map((crop, index) => (
          <CropCard key={crop.id || index} crop={crop} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-white/30 py-8 text-sm">No crops in this category</div>
        )}
      </div>
    </div>
  )
}
