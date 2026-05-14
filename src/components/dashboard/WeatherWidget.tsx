'use client'

import { useApp } from '@/context/AppContext'
import { RefreshCw, Sun, Droplets, Wind, Thermometer } from 'lucide-react'

export default function WeatherWidget() {
  const { weather, isLoading, refreshWeather, t } = useApp()

  if (isLoading || !weather) {
    return (
      <div className="mh-card p-8 flex flex-col justify-between space-y-6 min-h-[380px] bg-white border border-border-soft animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-1/3 bg-bone-low rounded-full" />
          <div className="h-8 w-8 bg-bone-low rounded-full" />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-bone-low rounded-2xl" />
          <div className="h-16 w-1/2 bg-bone-low rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-14 bg-bone-low rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mh-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[380px] bg-white border border-border-soft group/weather">
      {/* Warm ambient background sunburst accent */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-ochre-gold/10 rounded-full blur-3xl pointer-events-none transition-all group-hover/weather:scale-110 duration-700" />

      {/* Header Panel */}
      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bone-low border border-border-soft shadow-inner">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="font-body text-[10px] font-bold tracking-wider uppercase text-ink">
            {t('weather.title')}
          </span>
        </div>
        <button
          onClick={refreshWeather}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-bone-low border border-border-soft text-ink-muted hover:text-ochre hover:bg-white hover:border-border-soft transition-all active:scale-95 shadow-sm"
          title="Refresh Weather Data"
        >
          <RefreshCw size={14} className="group-hover/weather:rotate-45 transition-transform duration-500" />
        </button>
      </div>

      {/* Main Temperature and Icon Stack */}
      <div className="flex items-center gap-6 my-6 relative z-10">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-bone-low border border-border-soft flex items-center justify-center shadow-inner shrink-0 group-hover/weather:border-ochre-light/50 transition-colors duration-500 relative">
          <div className="absolute inset-0 rounded-2xl bg-ochre-light/10 scale-0 group-hover/weather:scale-100 transition-transform duration-500 pointer-events-none" />
          <Sun size={40} className="text-ochre-light animate-[spin_20s_linear_infinite]" />
        </div>

        <div className="flex flex-col">
          <div className="font-display font-bold text-6xl md:text-7xl text-ink tracking-tight leading-none">
            {weather.temperature}°
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-light" />
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {weather.location || 'Your Farm'}
            </span>
          </div>
        </div>
      </div>

      {/* Environmental Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full relative z-10 pt-2 border-t border-border-soft/60">
        <WeatherStat label={t('weather.rain')} value={`${weather.rainfall}mm`} icon={<Droplets size={10} className="text-sienna" />} />
        <WeatherStat label={t('weather.wind')} value={`${weather.windSpeed}k`} icon={<Wind size={10} className="text-ink-faint" />} />
        <WeatherStat label={t('weather.humidity')} value={`${weather.humidity}%`} icon={<Thermometer size={10} className="text-forest" />} />
      </div>
    </div>
  )
}

function WeatherStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-bone-low border border-border-soft rounded-xl p-2.5 flex flex-col items-center justify-center shadow-inner group-hover/weather:bg-white transition-colors duration-300">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-body text-[9px] font-bold text-ink-faint uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-display font-bold text-base text-ink mt-0.5">{value}</span>
    </div>
  )
}

function WeatherStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-bone-low border border-border-soft rounded-xl p-2.5 flex flex-col items-center justify-center shadow-inner group-hover/weather:bg-white transition-colors duration-300">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-body text-[9px] font-bold text-ink-faint uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-display font-bold text-base text-ink mt-0.5">{value}</span>
    </div>
  )
}
