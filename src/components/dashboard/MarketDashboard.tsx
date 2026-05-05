'use client'

import { TrendingUp, TrendingDown, ShoppingCart, Phone, RefreshCcw, MapPin, Navigation } from 'lucide-react'
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
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    
    // Fetch real-time location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition([pos.coords.latitude, pos.coords.longitude])
        },
        (err) => {
          console.warn('Geolocation error:', err)
          // Fallback to Kampala default if user denies location
          setCurrentPosition([0.3476, 32.5825])
        }
      )
    }

    return () => clearTimeout(timer)
  }, [])

  const categories = ['All', 'Leafy / Vegetables', 'Grains', 'Root Crops', 'Cash Crops', 'Legumes', 'Fruits']

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Premium Header from Image */}
      <div 
        className="p-5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6,20,18,0.95) 0%, rgba(13,36,34,0.98) 100%)',
        }}
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">Farm Intelligence Map</h2>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">10 FARMS</span>
              <span className="text-white/20 text-[10px]">•</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">5 ECO MARKETS</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
        </div>
      </div>

      {/* Find Nearest Button */}
      <button 
        className="w-full py-5 rounded-3xl font-display font-black text-white text-base flex items-center justify-center gap-3 shadow-2xl shadow-forest/20 active:scale-[0.98] transition-all border border-white/20"
        style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)' }}
      >
        <MapPin size={22} />
        🌿 FIND NEAREST ECO-BUYER
      </button>

      {/* Live Map with Category Chips Overlay */}
      <div 
        className="h-[450px] rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl"
        style={{ background: 'rgba(13,36,34,0.80)' }}
      >
        {/* Category Chips Over Map */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                activeCategory === cat 
                ? 'bg-white text-forest border-white shadow-xl scale-105' 
                : 'bg-black/40 text-white/60 border-white/10 backdrop-blur-md hover:bg-black/60'
              }`}
            >
              {cat === 'Leafy / Vegetables' && '🥬 '}
              {cat === 'Grains' && '🌾 '}
              {cat === 'Root Crops' && '🥔 '}
              {cat === 'Cash Crops' && '☕ '}
              {cat === 'Legumes' && '🫘 '}
              {cat === 'Fruits' && '🍎 '}
              {cat}
            </button>
          ))}
        </div>

        <MapComponent 
          currentPosition={currentPosition} 
          routeCoordinates={[]} 
        />
        
        <div className="absolute bottom-6 right-6 z-[1000]">
           <button 
            className="w-12 h-12 rounded-2xl bg-white text-forest shadow-2xl flex items-center justify-center active:scale-90 transition-all"
            onClick={() => {
               if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition((pos) => {
                   setCurrentPosition([pos.coords.latitude, pos.coords.longitude]);
                 });
               }
            }}
           >
             <Navigation size={20} fill="currentColor" />
           </button>
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
