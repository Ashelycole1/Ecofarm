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
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-700 border-2 ${
      isAlert ? 'bg-alert/10 border-alert/30' : isWarning ? 'bg-warning/10 border-warning/30' : 'bg-forest/40 border-safe/20'
    }`}>
      {/* Massive Visual Glow for Zero-Reading */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${
        isAlert ? 'bg-alert' : isWarning ? 'bg-warning' : 'bg-safe'
      }`} />

      {/* Header with Traffic Light Badge */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${
          isAlert ? 'bg-alert text-white border-white/20' : isWarning ? 'bg-warning text-black border-black/10' : 'bg-safe text-white border-white/10'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${isAlert ? 'bg-white' : isWarning ? 'bg-black' : 'bg-white'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isAlert ? 'STAY HOME' : isWarning ? 'WEAR BOOTS' : 'GOOD HARVEST'}
          </span>
        </div>
        <button
          onClick={refreshWeather}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Impact Symbols */}
      <div className="flex items-center gap-6 mb-8 relative z-10">
        <div className={`text-7xl drop-shadow-2xl transition-transform duration-700 hover:scale-110 ${isAlert ? 'animate-pulse' : 'float-anim'}`}>
          {weatherIcons[weather.status] || '🌤️'}
        </div>
        <div>
          <div className="text-6xl font-black text-white tracking-tighter leading-none mb-1">
            {weather.temperature}°
          </div>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">
            📍 {weather.location}
          </p>
        </div>
      </div>

      {/* Large-Scale Iconic Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <IconicPill icon={<CloudRain size={24} />} value={`${weather.rainfall}mm`} label="RAIN" status={weather.rainfall > 5 ? 'warning' : 'green'} />
        <IconicPill icon={<Wind size={24} />} value={`${weather.windSpeed}k`} label="WIND" status={weather.windSpeed > 20 ? 'red' : 'green'} />
        <IconicPill icon={<Thermometer size={24} />} value={`${weather.humidity}%`} label="HUMID" status="green" />
      </div>

      {/* Traffic Light 5-Day Forecast */}
      <div className="grid grid-cols-5 gap-2 relative z-10 pt-4 border-t border-white/5">
        {weather.forecast.map((day, i) => {
          const dayStatus = statusColors[day.status] || 'safe'
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 rounded-2xl py-3 border transition-all ${
                dayStatus === 'alert' ? 'bg-alert/20 border-alert/30' : 
                dayStatus === 'warning' ? 'bg-warning/20 border-warning/30' : 
                'bg-white/5 border-white/5'
              }`}
            >
              <span className="text-[8px] text-white/40 font-black uppercase">{day.day}</span>
              <span className="text-xl leading-none my-1">{weatherIcons[day.status] ?? '🌤️'}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
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
    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
      <span className={`${color} mb-3 transition-transform group-hover:scale-125`}>{icon}</span>
      <span className="text-sm font-black text-white">{value}</span>
      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">{label}</span>
    </div>
  )
}
