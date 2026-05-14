/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useApp } from '@/context/AppContext'
import { getSupabase } from '@/lib/supabaseClient'
import { 
  TrendingUp, TrendingDown, ShoppingCart, Phone, RefreshCcw, 
  MapPin, Navigation, Info, Store, Wheat, Coffee, Cherry, Leaf, 
  Box, ArrowUpRight, Compass, Search, Plus, X, Image as ImageIcon, 
  MessageSquare, CheckCircle2, AlertCircle 
} from 'lucide-react'
import { findNearestEcoBuyer, getProximityRoute } from '@/lib/farmIntelligence'
import type { EcoMarket } from '@/lib/db'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-white/5 animate-pulse rounded-2xl" />
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketListing {
  id: string
  userId: string
  farmerName: string
  title: string
  category: string
  priceUgx: number
  unit: string
  stockAmount: number
  stockUnit: string
  statusBadge: string
  gradeOrType: string
  description: string
  imageUrl: string
  whatsappContact: string
  createdAt: string
}

// Mock Markets for Farm Intel
const MOCK_MARKETS: EcoMarket[] = [
  { id: 'm1', name: 'Nakawa Eco-Hub', lat: 0.3348, lng: 32.6105, type: 'eco_buyer', accepts_organic: true, description: 'Direct export hub for organic grains.' },
  { id: 'm2', name: 'Kalerwe Green Market', lat: 0.3540, lng: 32.5780, type: 'market', accepts_organic: true, description: 'Local community market.' },
  { id: 'm3', name: 'Kawempe Cooperative', lat: 0.3750, lng: 32.5580, type: 'cooperative', accepts_organic: true, description: 'Bulk buyer for legumes.' },
  { id: 'm4', name: 'Mengo Organic Traders', lat: 0.3020, lng: 32.5650, type: 'eco_buyer', accepts_organic: true },
];

// Premium Default Listings matching the reference perfectly
const initialListings: MarketListing[] = [
  {
    id: 'm1',
    userId: 'system',
    farmerName: 'James Okello',
    title: 'White Maize',
    category: 'Grains',
    priceUgx: 1200,
    unit: 'KG',
    stockAmount: 45,
    stockUnit: 'Tons',
    statusBadge: 'Harvest Ready',
    gradeOrType: 'Grade A Organic',
    description: 'Sun-dried high-yield white maize, moisture-controlled for optimal storage and milling quality.',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
    whatsappContact: '+256700000001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    userId: 'system',
    farmerName: 'Grace Namukasa',
    title: 'Nambale Beans',
    category: 'Grains',
    priceUgx: 3500,
    unit: 'KG',
    stockAmount: 12,
    stockUnit: 'Tons',
    statusBadge: 'In Transit',
    gradeOrType: 'Hand-Sorted',
    description: 'Premium long-grain red kidney beans, known for rapid cooking and high protein content.',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80',
    whatsappContact: '+256700000002',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm3',
    userId: 'system',
    farmerName: 'Robert Tumwine',
    title: 'Matooke',
    category: 'Fruits',
    priceUgx: 25000,
    unit: 'Bunch',
    stockAmount: 180,
    stockUnit: 'Bunches',
    statusBadge: 'Harvest Ready',
    gradeOrType: 'Farm Fresh',
    description: 'Freshly harvested cooking bananas, selected for uniform size and perfect starch density.',
    imageUrl: 'https://images.unsplash.com/photo-1543218024-57a70143c369?auto=format&fit=crop&w=800&q=80',
    whatsappContact: '+256700000003',
    createdAt: new Date().toISOString()
  }
]

function buildWhatsappUrl(contact: string, title: string, price: number, unit: string): string {
  const cleanPhone = contact.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Hello, I'm interested in your premium listing of *${title}* listed at ${price.toLocaleString()} UGX / ${unit} on AgriRoot Premium Marketplace. Please let me know if it's currently available.`
  )
  return `https://wa.me/${cleanPhone}?text=${message}`
}

function getCardinalDirection(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  let dir = "";
  if (Math.abs(dLat) > Math.abs(dLng)) {
    dir = dLat > 0 ? "North" : "South";
  } else {
    dir = dLng > 0 ? "East" : "West";
  }
  return dir;
}

export default function MarketDashboard() {
  const { user } = useApp()
  const [listings, setListings] = useState<MarketListing[]>(initialListings)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Geospatial State
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [nearestBuyer, setNearestBuyer] = useState<EcoMarket | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; polyline: [number, number][] } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Grains')
  const [priceUgx, setPriceUgx] = useState<number | ''>('')
  const [unit, setUnit] = useState('KG')
  const [stockAmount, setStockAmount] = useState<number | ''>('')
  const [stockUnit, setStockUnit] = useState('Tons')
  const [statusBadge, setStatusBadge] = useState('Harvest Ready')
  const [gradeOrType, setGradeOrType] = useState('Grade A Organic')
  const [description, setDescription] = useState('')
  const [whatsappContact, setWhatsappContact] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = getSupabase()

  const fetchListings = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('market_listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const mapped: MarketListing[] = data.map(row => ({
          id: row.id,
          userId: row.user_id,
          farmerName: row.farmer_name || 'Verified Farmer',
          title: row.title,
          category: row.category || 'Grains',
          priceUgx: Number(row.price_ugx),
          unit: row.unit || 'KG',
          stockAmount: Number(row.stock_amount),
          stockUnit: row.stock_unit || 'Tons',
          statusBadge: row.status_badge || 'Harvest Ready',
          gradeOrType: row.grade_or_type || 'Grade A Organic',
          description: row.description,
          imageUrl: row.image_url || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
          whatsappContact: row.whatsapp_contact || '+256700000000',
          createdAt: row.created_at
        }))
        setListings([...mapped, ...initialListings])
      } else {
        setListings(initialListings)
      }
    } catch (err) {
      console.warn('Could not fetch dynamic market listings:', err)
      setListings(initialListings)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
    if (!supabase) return
    const channel = supabase
      .channel('market_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_listings' }, fetchListings)
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [supabase])

  useEffect(() => {
    if (user && user.phoneNumber) {
      setWhatsappContact(user.phoneNumber)
    } else {
      setWhatsappContact('+2567')
    }
  }, [user])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setCurrentPosition([0.3476, 32.5825]) // Default Kampala
      )
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleFindNearest = async () => {
    if (!currentPosition) return;
    setIsNavigating(true);
    try {
      const nearest = findNearestEcoBuyer(currentPosition[0], currentPosition[1], MOCK_MARKETS);
      setNearestBuyer(nearest);
      const route = await getProximityRoute(currentPosition[0], currentPosition[1], nearest.lat, nearest.lng);
      setRouteInfo({
        distance: route.distanceKm,
        duration: route.durationMin,
        polyline: route.polyline
      });
    } catch (err) {
      console.warn('Proximity search failed');
    } finally {
      setIsNavigating(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!title.trim() || !priceUgx || !stockAmount || !description.trim() || !whatsappContact.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (!user || user.isGuest) {
      setFormError('Please sign in to publish listings.')
      return
    }

    setFormLoading(true)
    try {
      let finalImageUrl = imagePreview || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80'

      if (supabase && imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `market/${user.uid}_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('market-images')
          .upload(path, imageFile, { upsert: true })

        if (!uploadError) {
          const { data } = supabase.storage.from('market-images').getPublicUrl(path)
          finalImageUrl = data.publicUrl
        }
      }

      const newRecord = {
        user_id: user.uid,
        farmer_name: user.displayName || 'Verified Farmer',
        title: title.trim(),
        category,
        price_ugx: Number(priceUgx),
        unit,
        stock_amount: Number(stockAmount),
        stock_unit: stockUnit,
        status_badge: statusBadge,
        grade_or_type: gradeOrType.trim(),
        description: description.trim(),
        image_url: finalImageUrl,
        whatsapp_contact: whatsappContact.trim(),
        created_at: new Date().toISOString()
      }

      if (supabase) {
        await supabase.from('market_listings').insert([newRecord])
        fetchListings()
      }

      setFormSuccess('Produce successfully listed on the Premium Marketplace!')
      setTitle(''); setPriceUgx(''); setStockAmount(''); setDescription(''); setImageFile(null); setImagePreview(null);
      setTimeout(() => { setShowAddForm(false); setFormSuccess(''); }, 1500)

    } catch (err: any) {
      setFormError(err.message || 'Failed to publish listing.')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredListings = listings.filter(item => 
    (activeCategory === 'All' || item.category === activeCategory) &&
    (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const categories = [
    { name: 'All', Icon: Store },
    { name: 'Grains', Icon: Wheat },
    { name: 'Fruits', Icon: Leaf },
    { name: 'Vegetables', Icon: Box },
    { name: 'Cash Crops', Icon: Coffee },
  ]

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-soft pb-8">
        <div className="space-y-2 max-w-xl">
          <p className="font-body text-xs font-extrabold text-sienna tracking-[0.2em] uppercase">Premium Marketplace</p>
          <h1 className="font-display font-bold text-ink text-4xl md:text-5xl tracking-tight">Market Intel</h1>
          <p className="font-body text-base text-ink-muted leading-relaxed pt-1">
            Real-time agricultural data and direct connections to verified regional eco-buyers.
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2 shrink-0">
          <label className="block font-body text-xs font-bold text-ink">Search Listings</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-border-soft rounded-xl font-body text-sm text-ink outline-none focus:border-forest transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-bone-low p-4 rounded-xl border border-border-soft">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-forest" />
              <span className="font-body text-xs font-bold text-ink">Verified Direct Sales Hub</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? 'Close Form' : 'List Your Produce'}
            </button>
          </div>

          {showAddForm && (
            <div className="mh-card p-6 border-forest-light bg-white animate-slide-up space-y-6">
              <h3 className="font-display font-bold text-xl text-ink">List New Produce</h3>
              {formSuccess && <div className="p-3 rounded-lg bg-safe/10 text-safe text-xs font-bold">{formSuccess}</div>}
              {formError && <div className="p-3 rounded-lg bg-alert/10 text-alert text-xs font-bold">{formError}</div>}
              <form onSubmit={handleCreateListing} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="mh-input" />
                    <select value={category} onChange={e=>setCategory(e.target.value)} className="mh-input">
                      <option>Grains</option><option>Fruits</option><option>Vegetables</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input type="number" placeholder="Price" value={priceUgx} onChange={e=>setPriceUgx(e.target.value===''? '':Number(e.target.value))} className="mh-input" />
                    <input type="text" placeholder="Unit (KG)" value={unit} onChange={e=>setUnit(e.target.value)} className="mh-input" />
                    <input type="number" placeholder="Stock" value={stockAmount} onChange={e=>setStockAmount(e.target.value===''? '':Number(e.target.value))} className="mh-input" />
                    <input type="text" placeholder="Stock Unit" value={stockUnit} onChange={e=>setStockUnit(e.target.value)} className="mh-input" />
                 </div>
                 <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="mh-input h-24" />
                 <input type="text" placeholder="WhatsApp Contact" value={whatsappContact} onChange={e=>setWhatsappContact(e.target.value)} className="mh-input" />
                 <button type="submit" disabled={formLoading} className="btn-primary w-full py-3">{formLoading ? 'Publishing...' : 'Publish Listing'}</button>
              </form>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${
                  activeCategory === cat.name ? 'bg-forest text-white border-forest' : 'bg-white text-ink-muted border-border-soft'
                }`}
              >
                <cat.Icon size={14} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredListings.map(item => (
              <div key={item.id} className="mh-card flex flex-col overflow-hidden bg-white group">
                <div className="relative h-48 w-full overflow-hidden bg-bone-low">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                    <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-white/40 text-center">
                      <p className="text-[8px] font-bold text-ink-muted uppercase">Price</p>
                      <p className="text-xs font-bold text-ink">{item.priceUgx.toLocaleString()} UGX</p>
                    </div>
                    <div className="flex-1 bg-forest/90 backdrop-blur-sm rounded-lg p-2 text-center text-white">
                      <p className="text-[8px] font-bold text-forest-light uppercase">Stock</p>
                      <p className="text-xs font-bold">{item.stockAmount} {item.stockUnit}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3 flex flex-col flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-bold text-lg text-ink leading-tight">{item.title}</h3>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-bone-low text-ink-muted uppercase">{item.statusBadge}</span>
                  </div>
                  <p className="text-xs text-ink-muted line-clamp-2 flex-1">{item.description}</p>
                  <a
                    href={buildWhatsappUrl(item.whatsappContact, item.title, item.priceUgx, item.unit)}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg bg-[#0d8268] text-white text-[10px] font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} fill="currentColor" />
                    Contact Seller
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="mh-card p-6 bg-forest text-white space-y-4">
             <div className="flex items-center gap-3">
                <Compass className="text-wheat" size={24} />
                <h3 className="font-display font-bold text-xl uppercase tracking-tight">Proximity Intel</h3>
             </div>
             <p className="text-xs text-white/70 leading-relaxed">Find verified eco-buyers and market hubs nearest to your current location.</p>
             <button 
                onClick={handleFindNearest}
                disabled={isNavigating}
                className="w-full py-4 rounded-xl bg-white text-forest font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isNavigating ? <RefreshCcw className="animate-spin" size={18} /> : <MapPin size={18} />}
                {isNavigating ? 'LOCATING...' : 'FIND NEAREST HUB'}
             </button>
          </div>

          <div className="h-[400px] rounded-2xl overflow-hidden relative border border-border-soft shadow-sm bg-bone-low">
            <MapComponent 
              currentPosition={currentPosition} 
              routeCoordinates={routeInfo?.polyline || []}
              destination={nearestBuyer ? [nearestBuyer.lat, nearestBuyer.lng] : null}
              marketMarkers={MOCK_MARKETS.map(m => ({
                position: { lat: m.lat, lng: m.lng },
                color: '#2D665F',
                label: m.name,
                data: m,
                type: 'market'
              }))}
            />
            {nearestBuyer && routeInfo && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-border-soft shadow-xl animate-in slide-in-from-bottom-2">
                <p className="text-[8px] font-bold text-ink-muted uppercase mb-1">Recommended Hub</p>
                <h4 className="font-bold text-ink text-sm mb-2">{nearestBuyer.name}</h4>
                <div className="flex justify-between text-[10px]">
                  <span className="text-forest font-bold">{routeInfo.distance} KM</span>
                  <span className="text-ink-muted font-bold">~{routeInfo.duration} MIN</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
