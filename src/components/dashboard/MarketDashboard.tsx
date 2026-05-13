/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { getSupabase } from '@/lib/supabaseClient'
import { 
  Search, Plus, X, Image as ImageIcon, MessageSquare, 
  Phone, MapPin, Store, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react'

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

export default function MarketDashboard() {
  const { user } = useApp()
  const [listings, setListings] = useState<MarketListing[]>(initialListings)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

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
        // Combine DB listings with premium defaults for full populated view
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

  // Pre-fill user's phone if available when opening form
  useEffect(() => {
    if (user && user.phoneNumber) {
      setWhatsappContact(user.phoneNumber)
    } else {
      setWhatsappContact('+2567')
    }
  }, [user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!title.trim() || !priceUgx || !stockAmount || !description.trim() || !whatsappContact.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (!user || user.isGuest) {
      setFormError('Please sign in to upload produce images and publish listings.')
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
        } else {
          console.warn('Storage upload error, using local base64/fallback:', uploadError)
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
        const { error: insertError } = await supabase.from('market_listings').insert([newRecord])
        if (insertError) {
          console.warn('DB Insert error, updating local inline view:', insertError)
        } else {
          fetchListings()
        }
      }

      // Immediately append locally so the farmer sees it instantly
      const localAppended: MarketListing = {
        id: `local-${Date.now()}`,
        userId: user.uid,
        farmerName: user.displayName || 'Verified Farmer',
        title: title.trim(),
        category,
        priceUgx: Number(priceUgx),
        unit,
        stockAmount: Number(stockAmount),
        stockUnit,
        statusBadge,
        gradeOrType: gradeOrType.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        whatsappContact: whatsappContact.trim(),
        createdAt: new Date().toISOString()
      }

      setListings(prev => [localAppended, ...prev])
      setFormSuccess('Produce successfully listed on the Premium Marketplace!')
      
      // Reset form
      setTitle('')
      setPriceUgx('')
      setStockAmount('')
      setDescription('')
      setImageFile(null)
      setImagePreview(null)
      setTimeout(() => {
        setShowAddForm(false)
        setFormSuccess('')
      }, 1500)

    } catch (err: any) {
      setFormError(err.message || 'Failed to publish listing. Please verify your connection.')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredListings = listings.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.gradeOrType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Header section matching reference precisely */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-soft pb-8">
        <div className="space-y-2 max-w-xl">
          <p className="font-body text-xs font-extrabold text-sienna tracking-[0.2em] uppercase">
            Premium Marketplace
          </p>
          <h1 className="font-display font-bold text-ink text-4xl md:text-5xl tracking-tight">
            Market Intel
          </h1>
          <p className="font-body text-base text-ink-muted leading-relaxed pt-1">
            Real-time agricultural data and direct connections to verified regional eco-buyers across the continent.
          </p>
        </div>

        {/* Search Input directly matching reference */}
        <div className="w-full md:w-80 space-y-2 shrink-0">
          <label className="block font-body text-xs font-bold text-ink">
            Find Nearest Eco-Buyer
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter region or buyer name..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-border-soft rounded-xl font-body text-sm text-ink placeholder:text-ink-faint shadow-card-sm outline-none focus:border-forest-tint transition-all"
            />
          </div>
        </div>
      </div>

      {/* Primary Actions Bar */}
      <div className="flex justify-between items-center bg-bone-low p-4 rounded-xl border border-border-soft">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-forest" />
          <span className="font-body text-xs font-bold text-ink">
            Verified Direct Sales Hub
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary py-2.5 px-4 text-xs font-bold"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showAddForm ? 'Close Form' : 'List Your Produce'}</span>
        </button>
      </div>

      {/* Expandable Produce Upload Form */}
      {showAddForm && (
        <div className="mh-card p-6 md:p-8 border-forest-light bg-white animate-slide-up space-y-6">
          <div className="border-b border-border-soft pb-4">
            <h3 className="font-display font-bold text-2xl text-ink">List New Produce</h3>
            <p className="font-body text-xs text-ink-muted">Upload high-quality images and enter your direct WhatsApp link for buyers.</p>
          </div>

          {formSuccess && (
            <div className="p-4 rounded-xl bg-safe/10 border border-safe text-safe flex items-center gap-3 font-body text-xs font-bold">
              <CheckCircle2 size={18} />
              {formSuccess}
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-xl bg-alert-container border border-alert/20 text-alert flex items-center gap-3 font-body text-xs font-bold">
              <AlertCircle size={18} />
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateListing} className="space-y-6">
            {/* Image upload widget */}
            <div className="space-y-2">
              <label className="block font-body text-xs font-bold text-ink">Produce Image *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-soft hover:border-forest rounded-2xl p-6 text-center cursor-pointer bg-bone-low/50 transition-all relative overflow-hidden group"
              >
                {imagePreview ? (
                  <div className="relative h-48 w-full rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Produce Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                      Click to Change Image
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-card-sm flex items-center justify-center mx-auto text-forest">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="font-body text-sm font-bold text-ink">Click to upload produce photo</p>
                      <p className="font-body text-xs text-ink-muted mt-1">PNG, JPG, WebP up to 10MB</p>
                    </div>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Produce Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Premium White Maize"
                  className="mh-input py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mh-input py-2.5 bg-white"
                >
                  <option value="Grains">Grains</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Root Crops">Root Crops</option>
                  <option value="Cash Crops">Cash Crops</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Grade / Quality Label</label>
                <input
                  type="text"
                  value={gradeOrType}
                  onChange={e => setGradeOrType(e.target.value)}
                  placeholder="e.g. Grade A Organic"
                  className="mh-input py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Price (UGX) *</label>
                <input
                  type="number"
                  required
                  value={priceUgx}
                  onChange={e => setPriceUgx(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1200"
                  className="mh-input py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Pricing Unit</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="mh-input py-2.5 bg-white"
                >
                  <option value="KG">per KG</option>
                  <option value="Bunch">per Bunch</option>
                  <option value="Bag">per Bag</option>
                  <option value="Ton">per Ton</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Available Stock *</label>
                <input
                  type="number"
                  required
                  value={stockAmount}
                  onChange={e => setStockAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="mh-input py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Stock Unit</label>
                <select
                  value={stockUnit}
                  onChange={e => setStockUnit(e.target.value)}
                  className="mh-input py-2.5 bg-white"
                >
                  <option value="Tons">Tons</option>
                  <option value="Bunches">Bunches</option>
                  <option value="Bags">Bags</option>
                  <option value="KGs">KGs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">Status Badge</label>
                <select
                  value={statusBadge}
                  onChange={e => setStatusBadge(e.target.value)}
                  className="mh-input py-2.5 bg-white"
                >
                  <option value="Harvest Ready">Harvest Ready</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Cured & Stored">Cured & Stored</option>
                  <option value="Fresh Picked">Fresh Picked</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-body text-xs font-bold text-ink">WhatsApp Contact Number *</label>
                <input
                  type="text"
                  required
                  value={whatsappContact}
                  onChange={e => setWhatsappContact(e.target.value)}
                  placeholder="+256700000000"
                  className="mh-input py-2.5 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-body text-xs font-bold text-ink">Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe product density, drying methods, sorting standards, or delivery routes..."
                className="mh-input resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary"
              >
                {formLoading ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listings Grid mirroring AgriRoot Premium Layout perfectly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-2">
        {filteredListings.map(item => {
          const isTransit = item.statusBadge.toLowerCase().includes('transit')
          const badgeBg = isTransit ? 'bg-[#FADBD8]' : 'bg-[#F5CBA7]/40'
          const badgeText = isTransit ? 'text-[#78281F]' : 'text-[#7E5109]'

          return (
            <div
              key={item.id}
              className="mh-card flex flex-col overflow-hidden bg-white group"
            >
              {/* Product Image Hero Container */}
              <div className="relative h-64 w-full overflow-hidden bg-bone-low">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Overlapping Price / Stock Glass Blocks matching layout precisely */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  {/* Price Block */}
                  <div className="flex-1 bg-white/85 backdrop-blur-md rounded-xl p-3 border border-white/40 shadow-sm flex flex-col justify-center">
                    <span className="font-body text-[10px] font-extrabold text-ink-muted uppercase tracking-wider">
                      Price / {item.unit}
                    </span>
                    <span className="font-display font-bold text-ink text-lg leading-tight mt-0.5 truncate">
                      {item.priceUgx.toLocaleString()} UGX
                    </span>
                  </div>

                  {/* Stock Block */}
                  <div className="flex-1 bg-forest/90 backdrop-blur-md rounded-xl p-3 border border-forest-light/20 shadow-sm flex flex-col justify-center text-white">
                    <span className="font-body text-[10px] font-extrabold text-forest-light uppercase tracking-wider">
                      Stock
                    </span>
                    <span className="font-display font-bold text-white text-lg leading-tight mt-0.5 truncate">
                      {item.stockAmount} {item.stockUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                <div className="space-y-3">
                  {/* Title row with badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-2xl text-ink leading-tight">
                      {item.title}
                    </h3>
                    <span className={`font-body text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${badgeBg} ${badgeText}`}>
                      {item.statusBadge}
                    </span>
                  </div>

                  {/* Subtitle row with sienna dot */}
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sienna shrink-0" />
                    <span className="font-body text-xs font-bold text-ink-muted tracking-wide">
                      {item.gradeOrType}
                    </span>
                  </div>

                  {/* Description paragraph */}
                  <p className="font-body text-xs text-ink-muted leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {/* Action button matching reference precisely */}
                <div className="pt-2 border-t border-bone-dim/40 mt-auto space-y-3">
                  {item.farmerName && item.farmerName !== 'Verified Farmer' && (
                    <div className="flex items-center justify-between text-[11px] font-body text-ink-faint px-1">
                      <span>Listed by:</span>
                      <span className="font-bold text-ink-muted">{item.farmerName}</span>
                    </div>
                  )}

                  <a
                    href={buildWhatsappUrl(item.whatsappContact, item.title, item.priceUgx, item.unit)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl font-body font-bold text-xs text-white bg-[#0d8268] hover:bg-[#0a6b55] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare size={16} fill="currentColor" />
                    <span>Contact via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-16 bg-bone-low rounded-2xl border border-border-soft space-y-3">
          <p className="font-display font-bold text-xl text-ink">No produce listings found</p>
          <p className="font-body text-xs text-ink-muted">Try adjusting your region or search keywords.</p>
        </div>
      )}
    </div>
  )
}
