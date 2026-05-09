import { useFirebase } from '@/context/FirebaseContext'
import { Sprout, TreePine, Droplets, Leaf, AlertTriangle, CheckCircle2, Info, CloudRain, Sun, Thermometer } from 'lucide-react'

interface StatusTreeProps {
  compact?: boolean
}

export default function StatusTree({ compact = false }: StatusTreeProps) {
  const { farmStatus, isLoading } = useFirebase()

  if (isLoading || !farmStatus) {
    return (
      <div className="nature-card p-6 flex flex-col items-center space-y-3">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    )
  }

  const isRed    = farmStatus.overall === 'red'
  const isYellow = farmStatus.overall === 'yellow'
  const isGreen  = farmStatus.overall === 'green'

  const statusBg = {
    green:  'bg-safe/10',
    yellow: 'bg-warning/10',
    red:    'bg-alert/10',
  }[farmStatus.overall]

  const statusColor = {
    green:  'text-safe',
    yellow: 'text-warning',
    red:    'text-alert',
  }[farmStatus.overall]

  const StatusIcon = isRed ? AlertTriangle : isYellow ? Info : CheckCircle2

  return (
    <div className={`nature-card p-5 flex flex-col items-center text-center animate-slide-up relative overflow-hidden group border-2 ${
      isRed ? 'border-alert/30 animate-pulse-slow' : isYellow ? 'border-warning/30' : 'border-safe/20'
    }`}>
      {/* Massive Status Indicator for Zero-Reading */}
      <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-1000 ${
        isRed ? 'bg-alert' : isYellow ? 'bg-warning' : 'bg-safe'
      }`} />

      {/* AI Ribbon */}
      <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl border-b border-l border-white/10 flex items-center gap-1.5 z-10"
           style={{ background: 'rgba(45,102,95,0.40)', backdropFilter: 'blur(12px)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-wheat animate-ping-slow" />
        <span className="text-[9px] font-black text-wheat tracking-widest uppercase">Expert View</span>
      </div>

      {!compact && (
        <div className="flex items-center gap-2 mb-6 self-start w-full relative z-10">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusBg} ${statusColor} border border-current/20`}>
            <StatusIcon size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isRed ? 'CRITICAL ALERT' : isYellow ? 'WATCH CLOSELY' : 'FARM IS HEALTHY'}
            </span>
          </div>
        </div>
      )}

      {/* Main Impact Icon - Physical Symbols */}
      <div className="relative mb-6 flex items-center justify-center z-10">
        <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-30 transition-all duration-1000 ${
          isRed ? 'bg-alert' : isYellow ? 'bg-warning' : 'bg-safe'
        }`} />
        
        <div className={`p-8 rounded-full bg-white/5 border border-white/10 relative transition-transform duration-700 ${isRed ? 'scale-90' : 'scale-110'}`}>
          {isRed ? (
            <Droplets size={64} className="text-alert drop-shadow-[0_0_15px_rgba(255,112,67,0.4)] animate-bounce" />
          ) : isYellow ? (
            <Thermometer size={64} className="text-warning drop-shadow-[0_0_15px_rgba(242,201,76,0.4)]" />
          ) : (
            <TreePine size={64} className="text-safe drop-shadow-[0_0_15px_rgba(102,187,106,0.4)] tree-sway" />
          )}
          
          <div className="absolute -top-1 -right-1 text-2xl">
            {isRed ? '🚨' : isYellow ? '⚠️' : '🌻'}
          </div>
        </div>
      </div>

      {/* Status message group */}
      <div className="w-full space-y-5 relative z-10">
        <div>
          <h4 className={`text-xl font-display font-black uppercase tracking-tight ${statusColor} leading-none mb-2`}>
            {isRed ? 'DRY SOIL' : isYellow ? 'WINDY DAY' : 'GOOD SOIL'}
          </h4>
          <p className="text-xs text-white/60 font-medium leading-relaxed max-w-[240px] mx-auto">
            {farmStatus.message}
          </p>
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <BigStat label="💧 WATER" value={farmStatus.waterLevel} status={farmStatus.waterLevel < 30 ? 'red' : 'green'} />
            <BigStat label="🌱 SOIL" value={farmStatus.soilHealth} status={farmStatus.soilHealth < 50 ? 'yellow' : 'green'} />
            <BigStat label="☀️ SUN" value={85} status="green" />
          </div>
        )}
      </div>
    </div>
  )
}

function BigStat({ label, value, status }: { label: string; value: number; status: 'red' | 'yellow' | 'green' }) {
  const color = status === 'red' ? 'text-alert' : status === 'yellow' ? 'text-warning' : 'text-safe'
  const bg = status === 'red' ? 'bg-alert/10' : status === 'yellow' ? 'bg-warning/10' : 'bg-safe/10'

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl ${bg} border border-white/5`}>
      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}%</span>
    </div>
  )
}
