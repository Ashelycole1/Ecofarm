'use client'

import { TrendingUp, TrendingDown, RefreshCcw, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MarketItem {
  id: string
  name: string
  price: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  percentage: string
  lastUpdated: string
}

const staticMarketData: MarketItem[] = [
  { id: 'm1', name: 'Maize (White)', price: 1200, unit: 'UGX/kg', trend: 'up', percentage: '+4.2%', lastUpdated: 'Today, 08:30 AM' },
  { id: 'm2', name: 'Beans (Nambale)', price: 3500, unit: 'UGX/kg', trend: 'down', percentage: '-1.5%', lastUpdated: 'Today, 08:30 AM' },
  { id: 'm3', name: 'Matooke (Bunch)', price: 15000, unit: 'UGX/bunch', trend: 'up', percentage: '+12.0%', lastUpdated: 'Yesterday, 16:00 PM' },
  { id: 'm4', name: 'Cassava (Fresh)', price: 800, unit: 'UGX/kg', trend: 'stable', percentage: '0.0%', lastUpdated: 'Today, 09:15 AM' },
]

export default function MarketDashboard() {
  const [data, setData] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMarketData = () => {
    setLoading(true)
    // Simulating API Fetch
    setTimeout(() => {
      setData(staticMarketData)
      setLoading(false)
    }, 800)
  }

  useEffect(() => {
    fetchMarketData()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Market Prices</h2>
          <p className="text-xs text-white/40">Estimated national averages</p>
        </div>
        <button
          onClick={fetchMarketData}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 hover:border-forest-light/40 transition-all"
          style={{ background: 'rgba(45,102,95,0.25)' }}
        >
          <RefreshCcw className={`text-wheat ${loading ? 'animate-spin' : ''}`} size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))
        ) : (
          data.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(45,102,95,0.18) 0%, rgba(13,36,34,0.55) 100%)',
                border: '1px solid rgba(61,138,129,0.18)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="space-y-0.5">
                <h3 className="font-bold text-white text-sm">{item.name}</h3>
                <div className="flex items-center gap-1 text-xs text-white/45">
                  <DollarSign size={11} />
                  <span>{item.price.toLocaleString()} {item.unit}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className={`flex items-center gap-1 font-black text-sm ${
                  item.trend === 'up'   ? 'text-safe' :
                  item.trend === 'down' ? 'text-alert' : 'text-wheat'
                }`}>
                  {item.trend === 'up'   && <TrendingUp size={15} strokeWidth={2.5} />}
                  {item.trend === 'down' && <TrendingDown size={15} strokeWidth={2.5} />}
                  {item.percentage}
                </div>
                <span className="text-[9px] text-white/25 uppercase tracking-wide">{item.lastUpdated}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] text-white/30 text-center leading-relaxed">
          Market prices are estimated regional averages for analytical purposes. Real-time API sync coming soon.
        </p>
      </div>
    </div>
  )
}
