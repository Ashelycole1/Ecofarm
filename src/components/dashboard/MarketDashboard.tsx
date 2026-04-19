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
          <h2 className="font-display font-bold text-xl text-wheat">Market Prices</h2>
          <p className="text-xs text-white/50">Estimated national averages</p>
        </div>
        <button 
          onClick={fetchMarketData}
          className="p-2 border border-white/10 rounded-full bg-forest/40 hover:bg-forest transition-colors"
        >
          <RefreshCcw className={`text-wheat ${loading ? 'animate-spin' : ''}`} size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nature-card p-4 animate-pulse">
               <div className="h-5 bg-white/10 rounded w-1/3 mb-4"></div>
               <div className="h-8 bg-white/10 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          data.map(item => (
            <div key={item.id} className="nature-card p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-white/90 text-md">{item.name}</h3>
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <DollarSign size={12} />
                  <span>{item.price.toLocaleString()} {item.unit}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`flex flex-col items-end`}>
                  <div className={`flex items-center gap-1 font-black ${
                    item.trend === 'up' ? 'text-safe' : 
                    item.trend === 'down' ? 'text-alert' : 'text-wheat'
                  }`}>
                    {item.trend === 'up' && <TrendingUp size={16} strokeWidth={3} />}
                    {item.trend === 'down' && <TrendingDown size={16} strokeWidth={3} />}
                    {item.percentage}
                  </div>
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">{item.lastUpdated}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 mt-4 bg-black/20 rounded-leaf-sm border border-white/5">
         <p className="text-[10px] text-white/40 text-center leading-relaxed">
           Market prices are estimated regional averages provided for analytical purposes. Real-time API sync is disabled for this demonstration.
         </p>
      </div>
    </div>
  )
}
