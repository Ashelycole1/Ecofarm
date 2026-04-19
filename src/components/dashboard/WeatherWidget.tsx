'use client'

import { useFirebase } from '@/context/FirebaseContext'
import { AlertTriangle, Droplets, Wind, Thermometer, RefreshCw } from 'lucide-react'

const weatherIcons: Record<string, string> = {
  sunny:  '☀️',
  cloudy: '⛅',
  rainy:  '🌧️',
  stormy: '⛈️',
  drought:'🌵',
}

const weatherAccent: Record<string, string> = {
  sunny:  'rgba(242,201,76,0.18)',
  cloudy: 'rgba(135,206,235,0.18)',
  rainy:  'rgba(79,195,247,0.18)',
  stormy: 'rgba(126,87,194,0.18)',
  drought:'rgba(255,107,107,0.18)',
}

export default function WeatherWidget() {
  const { weather, isLoading, refreshWeather } = useFirebase()

  if (isLoading || !weather) {
    return (
      <div className="nature-card p-5 space-y-3">
        <div className="skeleton h-3 w-1/3 mb-1" />
        <div className="skeleton h-12 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[0,1,2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const accentColor = weatherAccent[weather.status] || weatherAccent.cloudy
  const icon = weatherIcons[weather.status] || '🌤️'

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-white/[0.12] p-5 shadow-card"
      style={{
        background: `linear-gradient(145deg, ${accentColor} 0%, rgba(13,36,34,0.65) 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Subtle glow blob */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">
            📍 {weather.location}, {weather.region}
          </p>
          <p className="text-[10px] text-white/25 mt-0.5">
            Updated {new Date(weather.lastUpdated).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={refreshWeather}
          id="weather-refresh-btn"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-wheat hover:bg-forest/30 transition-all"
          aria-label="Refresh weather"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main temp */}
      <div className="flex items-end gap-4 mb-5 relative z-10">
        <div className="float-anim text-6xl leading-none select-none">{icon}</div>
        <div>
          <div className="text-5xl font-display font-bold text-white high-contrast-text leading-none">
            {weather.temperature}°
          </div>
          <div className="text-sm text-white/50 mt-1">
            Feels like {weather.feelsLike}°C
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
        <StatPill icon={<Droplets size={13} />} label="Rain"     value={`${weather.rainfall}mm`}   color="text-rain" />
        <StatPill icon={<Wind size={13} />}     label="Wind"     value={`${weather.windSpeed}km/h`} color="text-white/70" />
        <StatPill icon={<Thermometer size={13} />} label="Humidity" value={`${weather.humidity}%`} color="text-sky" />
      </div>

      {/* 5-day mini forecast */}
      <div className="grid grid-cols-5 gap-1.5 relative z-10">
        {weather.forecast.map((day, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 px-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[9px] text-white/45 font-semibold uppercase">{day.day}</span>
            <span className="text-base leading-none">{weatherIcons[day.status] ?? '🌤️'}</span>
            <span className="text-[10px] text-white font-bold">{day.high}°</span>
            {day.rainfall > 0 && (
              <span className="text-[8px] text-rain">{day.rainfall}mm</span>
            )}
          </div>
        ))}
      </div>

      {/* UV Index warning */}
      {weather.uvIndex >= 7 && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-wheat/20 bg-wheat/8 relative z-10">
          <div className="absolute -top-2 right-3 bg-forest-dark/90 border border-wheat/25 px-2 py-0.5 rounded-full">
            <span className="text-[8px] font-black text-wheat uppercase tracking-wider">AI Insight</span>
          </div>
          <AlertTriangle size={13} className="text-wheat shrink-0" />
          <p className="text-xs text-wheat/90">High UV ({weather.uvIndex}). Wear a hat when farming.</p>
        </div>
      )}
    </div>
  )
}

function StatPill({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="flex flex-col items-center py-2.5 px-1 gap-1 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className={`${color}`}>{icon}</span>
      <span className="text-[9px] text-white/35 uppercase tracking-wide font-semibold">{label}</span>
      <span className="text-[11px] font-bold text-white">{value}</span>
    </div>
  )
}
