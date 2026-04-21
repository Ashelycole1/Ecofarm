'use client'

import { TrendingUp, TrendingDown, ShoppingCart, Phone, RefreshCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-white/5 animate-pulse rounded-2xl" />
})

// Farmer phone numbers (replace with real numbers in production)
const FARMER_WHATSAPP = '+256700000000'

interface Product {
  id: string
  name: string
  emoji: string
  description: string
  price: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  percentage: string
  available: string // e.g. "200 kg"
  farmerName: string
}

const products: Product[] = [
  {
    id: 'p1',
    name: 'White Maize',
    emoji: '🌽',
    description: 'Grade A Ugandan white maize, sun-dried and sorted. Ready for posho milling.',
    price: 1200,
    unit: 'per kg',
    trend: 'up',
    percentage: '+4.2%',
    available: '500 kg',
    farmerName: 'James Okello',
  },
  {
    id: 'p2',
    name: 'Nambale Beans',
    emoji: '🫘',
    description: 'High-protein Nambale beans from Busoga region. Clean & hand-sorted.',
    price: 3500,
    unit: 'per kg',
    trend: 'down',
    percentage: '-1.5%',
    available: '150 kg',
    farmerName: 'Grace Namukasa',
  },
  {
    id: 'p3',
    name: 'Matooke',
    emoji: '🍌',
    description: 'Fresh green matooke bunches from Mbarara. Harvested within 24 hours.',
    price: 15000,
    unit: 'per bunch',
    trend: 'up',
    percentage: '+12.0%',
    available: '80 bunches',
    farmerName: 'Robert Tumwine',
  },
]

function buildWhatsappUrl(product: Product): string {
  const message = encodeURIComponent(
    `Hello, I'm interested in buying *${product.name}* at UGX ${product.price.toLocaleString()} ${product.unit}.\n\nAvailable stock: ${product.available}\n\nPlease confirm availability and delivery options. Thank you!`
  )
  return `https://wa.me/${FARMER_WHATSAPP.replace(/\D/g, '')}?text=${message}`
}

export default function MarketDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-white">🛒 Marketplace</h2>
          <p className="text-xs text-white/40 mt-0.5">Fresh produce · Buy direct from farmers</p>
        </div>
        <button
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600) }}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{ background: 'rgba(46,125,50,0.25)', border: '1px solid rgba(67,160,71,0.30)' }}
        >
          <RefreshCcw className={`text-leaf ${loading ? 'animate-spin' : ''}`} size={15} />
        </button>
      </div>

      {/* Live Supply Map - Integrated as requested */}
      <div 
        className="h-48 rounded-2xl overflow-hidden relative border border-white/10"
        style={{ background: 'rgba(13,36,34,0.60)' }}
      >
        <MapComponent 
          currentPosition={[0.3476, 32.5825]} 
          routeCoordinates={[[0.3476, 32.5825], [0.3500, 32.5900]]} 
        />
        <div className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Regional Supply Active</span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className="flex flex-col rounded-2xl overflow-hidden transition-all hover:scale-[1.02] duration-200"
              style={{
                background: 'linear-gradient(160deg, rgba(46,125,50,0.22) 0%, rgba(6,38,10,0.80) 100%)',
                border: '1px solid rgba(67,160,71,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
            >
              {/* Product Image / Emoji Hero */}
              <div
                className="flex items-center justify-center py-8 text-6xl"
                style={{ background: 'rgba(46,125,50,0.15)' }}
              >
                {product.emoji}
              </div>

              {/* Product Details */}
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-white text-base">{product.name}</h3>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${
                      product.trend === 'up' ? 'text-safe' : product.trend === 'down' ? 'text-alert' : 'text-wheat'
                    }`}>
                      {product.trend === 'up' && <TrendingUp size={12} />}
                      {product.trend === 'down' && <TrendingDown size={12} />}
                      {product.percentage}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{product.description}</p>
                </div>

                {/* Price & Availability */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(0,0,0,0.30)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">Price</span>
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">In Stock</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="font-display font-black text-wheat text-lg">
                      UGX {product.price.toLocaleString()}
                    </span>
                    <span className="text-safe text-xs font-semibold">{product.available}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{product.unit}</p>
                </div>

                {/* Farmer Info */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-forest/50 flex items-center justify-center text-xs">
                    👨‍🌾
                  </div>
                  <span className="text-white/50 text-xs">{product.farmerName}</span>
                </div>

                {/* Buy Now Button */}
                <a
                  href={buildWhatsappUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto w-full py-3.5 rounded-xl font-display font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.30)',
                  }}
                >
                  <Phone size={16} />
                  Buy via WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart CTA */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <ShoppingCart className="text-white/30 shrink-0" size={18} />
        <p className="text-[11px] text-white/35 leading-relaxed">
          Prices are current regional averages updated daily. Click &quot;Buy via WhatsApp&quot; to contact the farmer directly and arrange delivery.
        </p>
      </div>
    </div>
  )
}
