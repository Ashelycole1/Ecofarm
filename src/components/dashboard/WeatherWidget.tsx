import { useFirebase } from '@/context/FirebaseContext'
import { AlertTriangle, Droplets, Wind, Thermometer, RefreshCw, Sun, Cloud, CloudRain, Zap } from 'lucide-react'

const weatherIcons: Record<string, string> = {
  sunny:  '☀️',
  cloudy: '⛅',
  rainy:  '🌧️',
  stormy: '⛈️',
  drought:'🌵',
}

const statusColors: Record<string, string> = {
  sunny:  'safe',
  cloudy: 'safe',
  rainy:  'warning',
  stormy: 'alert',
  drought:'alert',
}

export default function WeatherWidget() {
  const { weather, isLoading, refreshWeather } = useFirebase()

  if (isLoading || !weather) {
    return (
      <div className="modern-card p-10 space-y-4">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-20 w-1/2" />
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="modern-card p-8 flex flex-col relative overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-10">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-eco-dark">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          GOOD HARVEST
        </div>
        <button
          onClick={refreshWeather}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-black/5 bg-white text-black/20 hover:text-eco-gold transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Weather Display */}
      <div className="flex items-center gap-8 mb-12">
        <div className="w-24 h-24 rounded-[32px] bg-white border border-black/5 shadow-sm flex items-center justify-center">
          <Sun size={44} className="text-eco-gold" />
        </div>
        <div>
          <div className="text-7xl font-display font-black text-eco-dark leading-none">
            {weather.temperature}°
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-eco-gold text-xs">●</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/30">YOUR FARM</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 w-full mt-auto">
        <ModernStat label="RAIN" value={`${weather.rainfall}mm`} />
        <ModernStat label="WIND" value={`${weather.windSpeed}k`} />
        <ModernStat label="HUMID" value={`${weather.humidity}%`} />
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

function IconicPill({ icon, value, label, status }: { icon: React.ReactNode; value: string; label: string; status: 'red' | 'warning' | 'green' }) {
  const color = status === 'red' ? 'text-alert' : status === 'warning' ? 'text-warning' : 'text-safe'
  return (
    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
      <span className={`${color} mb-3 transition-transform group-hover:scale-125`}>{icon}</span>
      <span className="text-sm font-black text-white">{value}</span>
      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">{label}</span>
    </div>
  )
}
