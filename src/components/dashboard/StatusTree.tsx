import { useApp } from '@/context/AppContext'
import { Sprout, TreePine, Droplets, Leaf, AlertTriangle, CheckCircle2, Info, CloudRain, Sun, Thermometer } from 'lucide-react'

interface StatusTreeProps {
  compact?: boolean
}

export default function StatusTree({ compact = false }: StatusTreeProps) {
  const { farmStatus, isLoading } = useApp()

  if (isLoading || !farmStatus) {
    return (
      <div className="modern-card p-10 flex flex-col items-center space-y-3">
        <div className="skeleton w-32 h-32 rounded-full" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    )
  }

  return (
    <div className="modern-card p-8 flex flex-col items-center text-center relative overflow-hidden h-full">
      {/* Header Pills */}
      <div className="flex items-center justify-between w-full mb-10">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-eco-dark">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          FARM IS HEALTHY
        </div>
        <div className="modern-pill bg-eco-gold/10 text-eco-gold">
          EXPERT VIEW
        </div>
      </div>

      {/* Main Visual */}
      <div className="relative mb-8">
        <div className="w-36 h-36 rounded-full bg-eco-sidebar flex items-center justify-center relative z-10">
          <div className="w-28 h-28 rounded-full bg-eco-tile/50 blur-xl absolute" />
          <TreePine size={48} className="text-forest relative z-10" />
        </div>
      </div>

      <div className="mb-10">
        <h4 className="text-2xl font-display font-black text-eco-dark uppercase tracking-tight mb-1">
          {farmStatus.overall === 'green' ? 'GOOD SOIL' : 'SOIL UPDATE'}
        </h4>
        <p className="text-xs text-black/40 font-bold uppercase tracking-widest">
          {farmStatus.message || 'Initializing farm status...'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <ModernStat label="WATER" value={`${farmStatus.waterLevel}%`} />
        <ModernStat label="SOIL" value={`${farmStatus.soilHealth}%`} />
        <ModernStat label="SUN" value="85%" />
      </div>
    </div>
  )
}

function ModernStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="modern-tile flex flex-col items-center justify-center gap-1">
      <span className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-sm font-black text-eco-dark">{value}</span>
    </div>
  )
}
