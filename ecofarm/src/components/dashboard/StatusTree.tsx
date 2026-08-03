import { useApp } from '@/context/AppContext'
import { TreePine, Droplets, Sun, Sparkles } from 'lucide-react'

interface StatusTreeProps {
  compact?: boolean
}

export default function StatusTree({ compact = false }: StatusTreeProps) {
  const { farmStatus, isLoading, t } = useApp()

  if (isLoading || !farmStatus) {
    return (
      <div className="mh-card p-8 flex flex-col items-center justify-center space-y-4 min-h-[360px] bg-white border border-border-soft animate-pulse">
        <div className="w-28 h-28 rounded-full bg-bone-low border border-border-soft" />
        <div className="h-4 w-1/2 bg-bone-low rounded-full" />
        <div className="h-3 w-1/3 bg-bone-low rounded-full" />
      </div>
    )
  }

  const isHealthy = farmStatus.overall === 'green'

  return (
    <div className="mh-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[380px] bg-white border border-border-soft group/tree">
      {/* Subtle top background decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-forest-pale/20 rounded-full blur-3xl pointer-events-none transition-all group-hover/tree:scale-110 duration-700" />

      {/* Header Badges */}
      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bone-low border border-border-soft shadow-inner">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isHealthy ? 'bg-safe' : 'bg-warn'}`} />
          <span className="font-body text-[10px] font-bold tracking-wider uppercase text-ink">
            {isHealthy ? t('status.health') + ': Optimal' : t('status.health') + ': Caution'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-ochre-light/10 border border-ochre-light/20 text-ochre text-[10px] font-body font-bold tracking-wider">
          <Sparkles size={12} className="text-ochre-light" />
          <span>{t('status.tree')}</span>
        </div>
      </div>

      {/* Main Centerpiece Visual */}
      <div className="flex flex-col items-center justify-center my-6 relative z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-[-16px] rounded-full border border-forest-light/30 border-dashed animate-[spin_30s_linear_infinite] pointer-events-none" />
          <div className="absolute inset-[-8px] rounded-full border border-forest-light/40 pointer-events-none" />
          <div className="w-28 h-28 rounded-full bg-bone-low border border-border-soft flex items-center justify-center shadow-inner relative group-hover/tree:border-forest-light transition-colors duration-500">
            <div className="absolute inset-0 rounded-full bg-forest-pale/40 scale-0 group-hover/tree:scale-100 transition-transform duration-500 pointer-events-none" />
            <TreePine size={48} className="text-forest relative z-10 transition-transform duration-500 group-hover/tree:scale-110" />
          </div>
        </div>

        <div className="text-center mt-6 max-w-[260px]">
          <h4 className="font-display font-bold text-2xl text-ink tracking-tight leading-tight">
            {isHealthy ? t('status.health') : 'Alert'}
          </h4>
          <p className="font-body text-xs text-ink-muted font-bold tracking-wide mt-1 line-clamp-2">
            {farmStatus.message || 'Nutrient density and moisture content align with target planting thresholds.'}
          </p>
        </div>
      </div>

      {/* Metrics Footer Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full relative z-10 pt-2 border-t border-border-soft/60">
        <StatBlock label={t('status.water')} value={`${farmStatus.waterLevel}%`} />
        <StatBlock label={t('status.soil')} value={`${farmStatus.soilHealth}%`} />
        <StatBlock label={t('status.pests')} value="Low" />
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bone-low border border-border-soft rounded-xl p-2.5 flex flex-col items-center justify-center shadow-inner group-hover/tree:bg-white transition-colors duration-300">
      <span className="font-body text-[9px] font-bold text-ink-faint uppercase tracking-wider">{label}</span>
      <span className="font-display font-bold text-base text-ink mt-0.5">{value}</span>
    </div>
  )
}
