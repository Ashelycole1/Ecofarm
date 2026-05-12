'use client'

import { useFirebase } from '@/context/FirebaseContext'
import { AlertTriangle, Droplets, Wind, Thermometer, RefreshCw, Sun, Cloud, CloudRain, Zap, CloudSun } from 'lucide-react'

const statusColors: Record<string, string> = {
  sunny:  'safe',
  cloudy: 'safe',
  rainy:  'warning',
  stormy: 'alert',
  drought:'alert',
}

function WeatherIcon({ status, size = 24, className = "" }: { status: string; size?: number; className?: string }) {
  switch (status) {
    case 'sunny': return <Sun size={size} className={`text-wheat ${className}`} />
    case 'cloudy': return <CloudSun size={size} className={`text-white/60 ${className}`} />
    case 'rainy': return <CloudRain size={size} className={`text-rain ${className}`} />
    case 'stormy': return <Zap size={size} className={`text-alert ${className}`} />
    case 'drought': return <Sun size={size} className={`text-alert animate-pulse ${className}`} />
    default: return <Cloud size={size} className={`text-white/40 ${className}`} />
  }
}

export default function WeatherWidget() {
  const { weather, isLoading, refreshWeather } = useFirebase()

  if (isLoading || !weather) {
    return (
      <div className="nature-card p-5 space-y-3">
        <div className="skeleton h-3 w-1/3 mb-1" />
        <div className="skeleton h-12 w-1/2" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[0,1,2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const status = statusColors[weather.status] || 'safe'
  const isAlert = status === 'alert'
  const isWarning = status === 'warning'

  return (
    <div className={`relative overflow-hidden rounded-[32px] p-8 shadow-2xl transition-all duration-700 border border-white/5 ${
      isAlert ? 'bg-alert/10' : isWarning ? 'bg-warning/10' : 'bg-white/[0.02]'
    }`}>
      {/* Massive Visual Glow */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${
        isAlert ? 'bg-alert' : isWarning ? 'bg-warning' : 'bg-safe'
      }`} />

      {/* Header with Traffic Light Badge */}
      <div className="flex items-start justify-between mb-10 relative z-10">
        <div className={`px-5 py-2 rounded-full border flex items-center gap-2 ${
          isAlert ? 'bg-alert text-white border-white/20' : isWarning ? 'bg-warning text-black border-black/10' : 'bg-safe text-white border-white/10'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${isAlert ? 'bg-white' : isWarning ? 'bg-black' : 'bg-white'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {isAlert ? 'STAY HOME' : isWarning ? 'WEAR BOOTS' : 'GOOD HARVEST'}
          </span>
        </div>
        <button
          onClick={refreshWeather}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all active:scale-90"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Impact Symbols */}
      <div className="flex items-center gap-8 mb-10 relative z-10">
        <div className={`p-6 rounded-3xl bg-white/5 border border-white/10 ${isAlert ? 'animate-pulse' : 'float-anim'}`}>
          <WeatherIcon status={weather.status} size={64} />
        </div>
        <div>
          <div className="text-6xl font-black text-white tracking-tighter leading-none mb-2">
            {weather.temperature}°
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-wheat" />
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
              {weather.location}
            </p>
          </div>
        </div>
      </div>

      {/* Large-Scale Iconic Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
        <IconicPill icon={<CloudRain size={20} />} value={`${weather.rainfall}mm`} label="RAIN" status={weather.rainfall > 5 ? 'warning' : 'green'} />
        <IconicPill icon={<Wind size={20} />} value={`${weather.windSpeed}k`} label="WIND" status={weather.windSpeed > 20 ? 'red' : 'green'} />
        <IconicPill icon={<Thermometer size={20} />} value={`${weather.humidity}%`} label="HUMID" status="green" />
      </div>

      {/* Traffic Light 5-Day Forecast */}
      <div className="grid grid-cols-5 gap-3 relative z-10 pt-6 border-t border-white/5">
        {weather.forecast.map((day, i) => {
          const dayStatus = statusColors[day.status] || 'safe'
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 rounded-2xl py-4 border transition-all ${
                dayStatus === 'alert' ? 'bg-alert/20 border-alert/30' : 
                dayStatus === 'warning' ? 'bg-warning/20 border-warning/30' : 
                'bg-white/5 border-white/10'
              }`}
            >
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{day.day}</span>
              <WeatherIcon status={day.status} size={18} />
              <div className={`w-1 h-1 rounded-full ${
                dayStatus === 'alert' ? 'bg-alert' : dayStatus === 'warning' ? 'bg-warning' : 'bg-safe'
              }`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IconicPill({ icon, value, label, status }: { icon: React.ReactNode; value: string; label: string; status: 'red' | 'warning' | 'green' }) {
  const color = status === 'red' ? 'text-alert' : status === 'warning' ? 'text-warning' : 'text-safe'
  return (
    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all shadow-lg">
      <span className={`${color} mb-3 transition-transform group-hover:scale-110`}>{icon}</span>
      <span className="text-xs font-black text-white">{value}</span>
      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">{label}</span>
    </div>
  )
}
