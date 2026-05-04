"use client";

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, Package, DollarSign, Search, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface RequestRiderProps {
  onRiderFound: (tripId: string) => void;
}

export default function RequestRider({ onRiderFound }: RequestRiderProps) {
  const [step, setStep] = useState<'details' | 'searching' | 'found'>('details');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loadSize, setLoadSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [driver, setDriver] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Simple pseudo-random price generator based on load
  useEffect(() => {
    if (pickup && dropoff) {
      const base = loadSize === 'small' ? 15000 : loadSize === 'medium' ? 35000 : 80000;
      setEstimatedPrice(base + Math.floor(Math.random() * 5000));
    } else {
      setEstimatedPrice(0);
    }
  }, [pickup, dropoff, loadSize]);

  const handleRequest = async () => {
    if (!pickup || !dropoff) return;
    setStep('searching');
    setErrorMsg('');
    
    try {
      // 1. Geocode the pickup location using Nominatim (OpenStreetMap)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup + ', Uganda')}`);
      const geoData = await geoRes.json();
      
      let lat = 0.3476; // Default to Kampala
      let lng = 32.5825;
      
      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }

      // 2. Call Supabase PostGIS RPC to find nearest driver
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data: nearestDrivers, error } = await supabase
        .rpc('find_nearest_driver', {
          lat: lat,
          lng: lng,
          radius_meters: 50000 // Search within 50km
        });

      if (error) throw error;

      if (!nearestDrivers || nearestDrivers.length === 0) {
        throw new Error("No available drivers found nearby. Please try again later.");
      }

      const matchedDriver = nearestDrivers[0];
      setDriver(matchedDriver);
      setStep('found');
      
      // 3. Hand off to Tracking after 2.5 seconds
      setTimeout(() => {
        // We simulate a trip ID. In production, you'd insert a trip row into a trips table.
        const mockTripId = `trip-${matchedDriver.id.substr(0, 8)}`;
        onRiderFound(mockTripId);
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to find driver.");
      setStep('details');
    }
  };

  if (step === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] bg-black/20 rounded-3xl border border-white/10 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-[#FF9800]/20 absolute animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-48 h-48 rounded-full border border-[#FF9800]/10 absolute animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="w-64 h-64 rounded-full border border-[#FF9800]/5 absolute animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 w-20 h-20 bg-[#FF9800] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#FF9800]/30 animate-pulse">
          <Search size={32} className="text-black" />
        </div>
        <h3 className="relative z-10 text-white font-display font-black text-2xl mb-2">Finding Eco-Rider...</h3>
        <p className="relative z-10 text-white/50 text-sm max-w-[200px]">Broadcasting your load to nearby available trucks.</p>
      </div>
    );
  }

  if (step === 'found') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] bg-black/20 rounded-3xl border border-safe/20 relative overflow-hidden animate-fade-in">
        <div className="w-24 h-24 bg-safe/20 rounded-full flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-safe rounded-full flex items-center justify-center text-black">
            <CheckCircle2 size={32} />
          </div>
        </div>
        <h3 className="text-white font-display font-black text-2xl mb-2">Rider Found!</h3>
        <p className="text-white/70 text-sm mb-6">Driver is 5 minutes away.</p>
        
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-forest/40 flex items-center justify-center text-xl border-2 border-safe/50">
            👨‍🌾
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold">{driver?.name || 'Farmer Driver'}</h4>
            <p className="text-white/40 text-xs">{driver?.vehicle_type} · {driver?.vehicle_plate}</p>
            {driver?.dist_meters && (
              <p className="text-white/30 text-[10px] mt-1">{(driver.dist_meters / 1000).toFixed(1)} km away</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-safe text-xs font-black">★ {driver?.rating || '4.9'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A1A18] rounded-3xl border border-white/10 p-5 shadow-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#FF9800]/20 border border-[#FF9800]/30">
          <Truck className="text-[#FF9800]" size={20} />
        </div>
        <div>
          <h2 className="text-white font-display font-black text-xl">Request Eco-Rider</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">On-Demand Farm Logistics</p>
        </div>
      </div>

      <div className="space-y-4 mb-8 relative">
        {errorMsg && (
          <div className="bg-alert/10 border border-alert/30 text-alert p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
        <div className="absolute left-[19px] top-[24px] bottom-[24px] w-0.5 bg-white/10" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-forest/40 border border-white/10 flex items-center justify-center shrink-0">
            <Navigation className="text-wheat" size={16} />
          </div>
          <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-1 px-3 focus-within:border-wheat/30 transition-colors">
            <label className="text-[9px] uppercase font-black text-white/30 block pt-1">Pickup Farm</label>
            <input 
              type="text" 
              placeholder="E.g. Luwero Farm District"
              className="w-full bg-transparent text-white text-sm font-semibold outline-none pb-1"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-[#FF9800]/20 border border-[#FF9800]/30 flex items-center justify-center shrink-0">
            <MapPin className="text-[#FF9800]" size={16} />
          </div>
          <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-1 px-3 focus-within:border-[#FF9800]/30 transition-colors">
            <label className="text-[9px] uppercase font-black text-white/30 block pt-1">Dropoff Market</label>
            <input 
              type="text" 
              placeholder="E.g. Nakasero Market, Kampala"
              className="w-full bg-transparent text-white text-sm font-semibold outline-none pb-1"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs uppercase font-black text-white/40 block mb-3">Load Size</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'small', label: 'Boda', icon: '🏍️', weight: '< 50kg' },
            { id: 'medium', label: 'Pickup', icon: '🛻', weight: '< 500kg' },
            { id: 'large', label: 'Truck', icon: '🚛', weight: '> 1 Ton' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setLoadSize(type.id as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                loadSize === type.id 
                  ? 'bg-forest/40 border-wheat/50 text-wheat shadow-lg' 
                  : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/5'
              }`}
            >
              <span className="text-2xl mb-1">{type.icon}</span>
              <span className="font-bold text-xs">{type.label}</span>
              <span className="text-[8px] opacity-60 uppercase">{type.weight}</span>
            </button>
          ))}
        </div>
      </div>

      {estimatedPrice > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FF9800]/10 border border-[#FF9800]/20 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF9800]/20 flex items-center justify-center">
              <DollarSign className="text-[#FF9800]" size={18} />
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase">Estimated Fare</p>
              <p className="text-[#FF9800] font-black text-lg">UGX {estimatedPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleRequest}
        disabled={!pickup || !dropoff}
        className={`w-full py-4 rounded-2xl font-black text-lg uppercase flex items-center justify-center gap-2 transition-all ${
          pickup && dropoff
            ? 'bg-[#FF9800] text-black shadow-[0_0_20px_rgba(255,152,0,0.4)] active:scale-[0.98]'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        }`}
      >
        Find Nearest Rider <ChevronRight size={20} />
      </button>
    </div>
  );
}
