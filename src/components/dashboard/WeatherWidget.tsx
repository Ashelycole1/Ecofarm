'use client'

import { useFirebase } from '@/context/FirebaseContext'
import { AlertTriangle, Droplets, Wind, Thermometer, RefreshCw } from 'lucide-react'

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  stormy: '⛈️',
  drought: '🌵',
}

const weatherBg: Record<string, string> = {
  sunny:  'from-amber-600/30 to-wheat/10',
  cloudy: 'from-sky-600/30 to-sky/10',
  rainy:  'from-rain/30 to-sky-dark/10',
  stormy: 'from-purple-800/30 to-earth-dark/10',
  drought:'from-alert/20 to-wheat-dark/10',
}

export default function WeatherWidget() {
  const { weather, isLoading, refreshWeather } = useFirebase()

  if (isLoading || !weather) {
    return (
      <div className="nature-card p-5 animate-pulse">
        <div className="h-4 bg-forest-light/30 rounded w-1/3 mb-3" />
        <div className="h-10 bg-forest-light/20 rounded w-1/2 mb-2" />
        <div className="h-3 bg-forest-light/20 rounded w-2/3" />
      </div>
    )
  }

  const bg = weatherBg[weather.status] || weatherBg.cloudy
  const icon = weatherIcons[weather.status] || '🌤️'

  return (
    <div className={`relative overflow-hidden rounded-leaf bg-gradient-to-br ${bg} border border-white/10 p-5 shadow-card`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest font-medium">
            📍 {weather.location}, {weather.region}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            Updated {new Date(weather.lastUpdated).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={refreshWeather}
          id="weather-refresh-btn"
          className="touch-target rounded-full p-1 text-white/40 hover:text-wheat transition-colors"
          aria-label="Refresh weather"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Main temp display */}
      <div className="flex items-end gap-4 mb-5">
        <div className="float-anim text-6xl leading-none select-none">{icon}</div>
        <div>
          <div className="text-5xl font-display font-bold text-white high-contrast-text">
            {weather.temperature}°
          </div>
          <div className="text-sm text-white/60 mt-0.5">
            Feels like {weather.feelsLike}°C
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatPill icon={<Droplets size={13} />} label="Rain" value={`${weather.rainfall}mm`} color="text-rain" />
        <StatPill icon={<Wind size={13} />} label="Wind" value={`${weather.windSpeed}km/h`} color="text-white/70" />
        <StatPill icon={<Thermometer size={13} />} label="Humidity" value={`${weather.humidity}%`} color="text-sky" />
      </div>

      {/* 5-day mini forecast */}
      <div className="grid grid-cols-5 gap-1">
        {weather.forecast.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1 bg-black/10 rounded-lg py-2 px-1">
            <span className="text-[9px] text-white/50 font-medium uppercase">{day.day}</span>
            <span className="text-lg leading-none">{weatherIcons[day.status] ?? '🌤️'}</span>
            <span className="text-[10px] text-white font-semibold">{day.high}°</span>
            {day.rainfall > 0 && (
              <span className="text-[8px] text-rain">{day.rainfall}mm</span>
            )}
          </div>
        ))}
      </div>

      {/* UV Index warning */}
      {weather.uvIndex >= 7 && (
        <div className="mt-3 flex items-center gap-2 bg-wheat/10 rounded-leaf-sm px-3 py-2 border border-wheat/20 relative">
          <div className="absolute -top-1.5 right-2 bg-forest-dark border border-wheat/30 px-1.5 py-0.5 rounded-full">
            <span className="text-[7px] font-bold text-wheat uppercase tracking-tighter">AI Insight</span>
          </div>
          <AlertTriangle size={13} className="text-wheat shrink-0" />
          <p className="text-xs text-wheat/90">High UV index ({weather.uvIndex}). Wear a hat when farming.</p>
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
    <div className="flex flex-col items-center bg-black/15 rounded-lg py-2 px-1 gap-0.5">
      <span className={`${color} opacity-80`}>{icon}</span>
      <span className="text-[9px] text-white/40 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  )
}
