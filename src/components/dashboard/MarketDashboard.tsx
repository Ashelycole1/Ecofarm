'use client'

import { TrendingUp, TrendingDown, ShoppingCart, Phone, RefreshCcw, MapPin, Navigation, Info, Store, Wheat, Coffee, Cherry, Leaf, Box } from 'lucide-react'
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
  Icon: any
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
    Icon: Wheat,
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
    Icon: Box,
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
    Icon: Leaf,
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

  const categories = [
    { name: 'All', Icon: Store },
    { name: 'Vegetables', Icon: Leaf },
    { name: 'Grains', Icon: Wheat },
    { name: 'Root Crops', Icon: Box },
    { name: 'Cash Crops', Icon: Coffee },
    { name: 'Fruits', Icon: Cherry },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Premium Header */}
      <div 
        className="p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden bg-white/[0.02]"
      >
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-2">
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">Farm Intel</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-safe" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">10 FARMS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-wheat" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">5 ECO MARKETS</span>
              </div>
            </div>
          </div>
          <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Find Nearest Button */}
      <button 
        className="w-full py-6 rounded-[32px] font-display font-black text-white text-base flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all border border-white/10 bg-forest hover:bg-forest-light"
      >
        <MapPin size={22} className="text-wheat" />
        FIND NEAREST ECO-BUYER
      </button>

      {/* Live Map with Category Chips Overlay */}
      <div 
        className="h-[500px] rounded-[40px] overflow-hidden relative border border-white/5 shadow-2xl bg-black/40"
      >
        {/* Category Chips Over Map */}
        <div className="absolute top-6 left-6 right-6 z-[1000] flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex-shrink-0 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2.5 ${
                activeCategory === cat.name 
                ? 'bg-white text-black border-white shadow-2xl scale-105' 
                : 'bg-black/60 text-white/40 border-white/5 backdrop-blur-xl hover:bg-black/80'
              }`}
            >
              <cat.Icon size={14} />
              {cat.name}
            </button>
          ))}
        </div>

        <MapComponent 
          currentPosition={currentPosition} 
          routeCoordinates={[]} 
        />
        
        <div className="absolute bottom-8 right-8 z-[1000]">
           <button 
            className="w-14 h-14 rounded-2xl bg-white text-black shadow-2xl flex items-center justify-center active:scale-90 transition-all"
            onClick={() => {
               if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition((pos) => {
                   setCurrentPosition([pos.coords.latitude, pos.coords.longitude]);
                 });
               }
            }}
           >
             <Navigation size={22} fill="currentColor" />
           </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 rounded-[32px] skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="flex flex-col rounded-[32px] overflow-hidden transition-all hover:translate-y-[-8px] duration-300 border border-white/5 bg-white/[0.02] shadow-2xl"
            >
              {/* Product Icon Hero */}
              <div
                className="flex items-center justify-center py-12 bg-white/[0.02] border-b border-white/5"
              >
                <product.Icon size={64} className="text-wheat/40" />
              </div>

              {/* Product Details */}
              <div className="p-6 flex flex-col flex-1 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">{product.name}</h3>
                    <span className={`text-[10px] font-black flex items-center gap-1 ${
                      product.trend === 'up' ? 'text-safe' : 'text-alert'
                    }`}>
                      {product.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {product.percentage}
                    </span>
                  </div>
                  <p className="text-white/30 text-xs leading-relaxed font-medium line-clamp-2">{product.description}</p>
                </div>

                {/* Price & Availability */}
                <div className="rounded-2xl p-5 bg-black/40 border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Regional Price</span>
                    <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">In Stock</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="font-display font-black text-wheat text-2xl leading-none">
                        {product.price.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1.5">UGX {product.unit}</span>
                    </div>
                    <span className="text-safe text-xs font-black uppercase tracking-widest bg-safe/10 px-2 py-1 rounded-lg border border-safe/20">{product.available}</span>
                  </div>
                </div>

                {/* Farmer Info */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Store size={14} className="text-white/40" />
                  </div>
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{product.farmerName}</span>
                </div>

                {/* Buy Now Button */}
                <a
                  href={buildWhatsappUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-5 rounded-2xl font-black text-white text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all bg-[#25D366] hover:bg-[#128C7E] shadow-2xl active:scale-95"
                >
                  <Phone size={16} />
                  Contact via WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart CTA */}
      <div
        className="flex items-center gap-4 p-6 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
          <ShoppingCart className="text-white/20" size={20} />
        </div>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest leading-relaxed">
          Prices are current regional averages updated daily. Click "Contact via WhatsApp" to connect with farmers directly.
        </p>
      </div>
    </div>
  )
}
