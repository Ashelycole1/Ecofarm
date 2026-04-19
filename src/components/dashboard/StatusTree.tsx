'use client'

import { useFirebase } from '@/context/FirebaseContext'
import { Sprout, TreePine, Droplets, Leaf } from 'lucide-react'

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

  const statusColor = {
    green:  'text-safe',
    yellow: 'text-wheat',
    red:    'text-alert',
  }[farmStatus.overall]

  const statusLabel = {
    green:  '🌿 All Good',
    yellow: '⚠️ Caution',
    red:    '🚨 Alert',
  }[farmStatus.overall]

  // Choose icon based on health/size
  const Icon = farmStatus.treeHealth > 80 ? TreePine : Sprout

  return (
    <div className="nature-card p-5 flex flex-col items-center text-center animate-slide-up relative overflow-hidden group">
      {/* AI Ribbon */}
      <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl border-b border-l border-white/10 flex items-center gap-1.5"
           style={{ background: 'rgba(45,102,95,0.30)', backdropFilter: 'blur(8px)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-wheat animate-ping-slow" />
        <span className="text-[9px] font-black text-wheat tracking-widest uppercase">AI Insight</span>
      </div>

      {!compact && (
        <div className="flex items-center gap-2 mb-4 self-start w-full">
          <span className="text-xs uppercase tracking-widest text-white/40 font-medium">Farm Health Index</span>
          <span className={`badge ${statusColor} bg-current/10 border border-current/30 ml-auto px-2 py-0.5`} style={{ color: 'inherit' }}>
            <span className={`status-dot ${isRed ? 'bg-alert' : isYellow ? 'bg-wheat' : 'bg-safe'} animate-pulse mr-1`} />
            {statusLabel}
          </span>
        </div>
      )}

      {/* Main Impact Icon */}
      <div className="relative mb-4 flex items-center justify-center">
        {/* Glow behind icon */}
        <div className={`absolute w-32 h-32 rounded-full blur-2xl opacity-20 transition-all duration-1000 ${
          isRed ? 'bg-alert shadow-[0_0_50px_rgba(255,112,67,0.5)]' : 
          isYellow ? 'bg-wheat shadow-[0_0_50px_rgba(242,201,76,0.5)]' : 
          'bg-safe shadow-[0_0_30px_rgba(102,187,106,0.5)]'
        }`} />
        
        <div className={`transition-all duration-700 transform ${isRed ? 'scale-90' : 'scale-110'} flex items-center justify-center p-6 rounded-full bg-white/5 border border-white/5`}>
          <Icon 
            size={compact ? 48 : 64} 
            strokeWidth={1.5}
            className={`transition-all duration-700 ${statusColor} drop-shadow-lg ${isGreen ? 'tree-sway' : 'animate-pulse'}`}
          />
          
          {/* Floating dew drops if thirsty/red */}
          {(isRed || isYellow) && (
            <>
              <Droplets size={16} className="absolute -top-1 -right-1 text-rain rain-drop opacity-60" style={{ animationDelay: '0s' }} />
              <Droplets size={12} className="absolute -bottom-2 -left-3 text-rain rain-drop opacity-40" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </div>
      </div>

      {/* Status message group */}
      <div className="w-full space-y-3">
        <div className="space-y-1">
          <p className={`text-md font-display font-bold ${statusColor} high-contrast-text tracking-wide`}>
            {farmStatus.message}
          </p>
          
          {farmStatus.aiAdvice && (
            <div
              className="mt-4 text-left relative overflow-hidden rounded-xl p-4 animate-fade-in"
              style={{ background: 'rgba(13,36,34,0.60)', border: '1px solid rgba(61,138,129,0.20)' }}
            >
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: 'linear-gradient(180deg, #2D665F, #3D8A81)' }} />
              <div className="flex items-center gap-2 mb-2 pl-1">
                <Leaf size={12} className="text-forest-light" />
                <span className="text-[9px] font-black text-forest-light uppercase tracking-wider">Agricultural AI Insight</span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed pl-1">
                {farmStatus.aiAdvice}
              </p>
            </div>
          )}
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <StatSmall label="Tree" value={farmStatus.treeHealth} color={isRed ? 'red' : isYellow ? 'yellow' : 'green'} />
            <StatSmall label="Water" value={farmStatus.waterLevel} color={farmStatus.waterLevel < 40 ? 'red' : 'green'} />
            <StatSmall label="Soil" value={farmStatus.soilHealth} color={farmStatus.soilHealth < 50 ? 'yellow' : 'green'} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatSmall({ label, value, color }: { label: string; value: number; color: string }) {
  const barColor = color === 'red' ? 'bg-alert' : color === 'yellow' ? 'bg-wheat' : 'bg-safe'
  const textColor = color === 'red' ? 'text-alert' : color === 'yellow' ? 'text-wheat' : 'text-safe'

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter mb-1">{label}</span>
      <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[10px] font-black ${textColor}`}>{value}%</span>
    </div>
  )
}
