"use client";

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, DollarSign, Search, CheckCircle2, ChevronRight, AlertCircle, Bike, Box, Loader2, Star } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-forest/10 animate-pulse" />
});

interface RequestRiderProps {
  onRiderFound: (tripId: string) => void;
}

export default function RequestRider({ onRiderFound }: RequestRiderProps) {
  const [step, setStep] = useState<'details' | 'searching' | 'found'>('details');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loadSize, setLoadSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [driver, setDriver] = useState<{name?: string, vehicle_type?: string, vehicle_plate?: string, dist_meters?: number, rating?: string, id: string} | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);

  useEffect(() => {
    if (pickup && dropoff) {
      const base = loadSize === 'small' ? 15000 : loadSize === 'medium' ? 35000 : 80000;
      const distMult = routeDistance ? parseFloat(routeDistance) * 1500 : 0;
      setEstimatedPrice(base + distMult + Math.floor(Math.random() * 5000));
    } else {
      setEstimatedPrice(0);
    }
  }, [pickup, dropoff, loadSize, routeDistance]);

  useEffect(() => {
    const geocode = async () => {
      try {
        if (pickup.length > 3) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup + ', Uganda')}`);
          const data = await res.json();
          if (data && data.length > 0) setPickupCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
        if (dropoff.length > 3) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff + ', Uganda')}`);
          const data = await res.json();
          if (data && data.length > 0) setDropoffCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.warn('Geocoding preview failed');
      }
    };
    
    const timer = setTimeout(geocode, 1500); 
    return () => clearTimeout(timer);
  }, [pickup, dropoff]);

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const R = 6371; 
      const dLat = (dropoffCoords[0] - pickupCoords[0]) * Math.PI / 180;
      const dLon = (dropoffCoords[1] - pickupCoords[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickupCoords[0] * Math.PI / 180) * Math.cos(dropoffCoords[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      setRouteDistance(dist.toFixed(1));
    }
  }, [pickupCoords, dropoffCoords]);

  const handleRequest = async () => {
    if (!pickup || !dropoff) return;
    setStep('searching');
    setErrorMsg('');
    
    try {
      let lat = pickupCoords ? pickupCoords[0] : 0.3476; 
      let lng = pickupCoords ? pickupCoords[1] : 32.5825;
      
      if (!pickupCoords) {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup + ', Uganda')}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }

      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data: nearestDrivers, error } = await supabase
        .rpc('find_nearest_driver', {
          lat: lat,
          lng: lng,
          radius_meters: 50000 
        });

      if (error) throw error;

      if (!nearestDrivers || nearestDrivers.length === 0) {
        throw new Error("No available drivers found nearby. Please try again later.");
      }

      const matchedDriver = nearestDrivers[0];
      setDriver(matchedDriver);
      
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert([{
          farmer_id: 'farmer-001',
          driver_id: matchedDriver.id,
          pickup_address: pickup,
          dropoff_address: dropoff,
          estimated_price: estimatedPrice,
          status: 'in-progress'
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      setStep('found');
      
      setTimeout(() => {
        onRiderFound(tripData.id);
      }, 2500);

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to find driver.";
      setErrorMsg(errorMessage);
      setStep('details');
    }
  };

  if (step === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] bg-black/40 rounded-[40px] border border-white/5 relative overflow-hidden animate-fade-in shadow-2xl">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-wheat/20 absolute animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-48 h-48 rounded-full border border-wheat/10 absolute animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="w-64 h-64 rounded-full border border-wheat/5 absolute animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-pulse">
          <Search size={32} className="text-black" />
        </div>
        <h3 className="relative z-10 text-white font-display font-black text-3xl mb-3 uppercase tracking-tight">Finding Eco-Rider</h3>
        <p className="relative z-10 text-white/30 text-[10px] font-black uppercase tracking-widest max-w-[200px]">Broadcasting load to nearest verified logistics node.</p>
      </div>
    );
  }

  if (step === 'found') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] bg-black/40 rounded-[40px] border border-safe/20 relative overflow-hidden animate-fade-in shadow-2xl">
        <div className="w-24 h-24 bg-safe/10 rounded-full flex items-center justify-center mb-8 border border-safe/20">
          <div className="w-16 h-16 bg-safe rounded-full flex items-center justify-center text-black shadow-2xl">
            <CheckCircle2 size={32} />
          </div>
        </div>
        <h3 className="text-white font-display font-black text-3xl mb-3 uppercase tracking-tight">Node Matched</h3>
        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-10">Driver is inbound · ETA 5 mins</p>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] w-full flex items-center gap-5 text-left shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-wheat border border-white/10 shadow-xl">
             <Truck size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-black text-sm uppercase tracking-tight">{driver?.name || 'Logistic Partner'}</h4>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">{driver?.vehicle_type} · {driver?.vehicle_plate}</p>
          </div>
          <div className="text-right flex items-center gap-1">
            <Star size={10} className="text-wheat fill-wheat" />
            <div className="text-wheat text-xs font-black tracking-widest">{driver?.rating || '4.9'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] sm:h-[650px] relative rounded-[40px] overflow-hidden border border-white/5 shadow-2xl animate-fade-in bg-[#051412]">
      
      <div className="absolute inset-0 z-0">
        <MapComponent 
          currentPosition={pickupCoords || null}
          destination={dropoffCoords || null}
          routeCoordinates={pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : []}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#051412] via-[#051412]/80 to-transparent pointer-events-none" />
      </div>

      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl p-2.5 pr-6 rounded-full border border-white/10 shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-wheat/20 flex items-center justify-center border border-wheat/30">
            <Truck className="text-wheat" size={18} />
          </div>
          <div>
            <h2 className="text-white font-display font-black text-xs uppercase tracking-widest">Request Logistics</h2>
          </div>
        </div>
        
        {routeDistance && (
          <div className="bg-white text-black px-4 py-2 rounded-full font-black text-[9px] shadow-2xl uppercase tracking-widest">
            {routeDistance} KM RADIUS
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-3xl border-t border-white/5 p-8 rounded-t-[48px] max-h-[85%] overflow-y-auto custom-scrollbar shadow-2xl">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

      <div className="space-y-5 mb-10 relative">
        {errorMsg && (
          <div className="bg-alert/10 border border-alert/20 text-alert p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
        <div className="absolute left-[23px] top-[28px] bottom-[28px] w-0.5 bg-white/5" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
            <Navigation className="text-wheat/40" size={18} />
          </div>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-[24px] p-2 px-4 focus-within:border-wheat/30 transition-all">
            <label className="text-[9px] uppercase font-black text-white/20 block pt-1 tracking-widest">Pickup Node</label>
            <input 
              type="text" 
              placeholder="E.g. Luwero District"
              className="w-full bg-transparent text-white text-sm font-black outline-none pb-1 placeholder:text-white/10"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
            <MapPin className="text-wheat/40" size={18} />
          </div>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-[24px] p-2 px-4 focus-within:border-wheat/30 transition-all">
            <label className="text-[9px] uppercase font-black text-white/20 block pt-1 tracking-widest">Dropoff Node</label>
            <input 
              type="text" 
              placeholder="E.g. Nakasero Market"
              className="w-full bg-transparent text-white text-sm font-black outline-none pb-1 placeholder:text-white/10"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-10">
        <label className="text-[10px] uppercase font-black text-white/20 block mb-5 px-1 tracking-[0.2em]">Deployment Scale</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'small', label: 'Boda', Icon: Bike, weight: '< 50kg' },
            { id: 'medium', label: 'Pickup', Icon: Box, weight: '< 500kg' },
            { id: 'large', label: 'Truck', Icon: Truck, weight: '> 1 Ton' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setLoadSize(type.id as 'small' | 'medium' | 'large')}
              className={`flex flex-col items-center justify-center p-5 rounded-[32px] border transition-all duration-300 ${
                loadSize === type.id 
                  ? 'bg-white text-black border-white shadow-2xl scale-105' 
                  : 'bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${loadSize === type.id ? 'bg-black/5' : 'bg-white/5'}`}>
                <type.Icon size={20} />
              </div>
              <span className="font-black text-[10px] uppercase tracking-tight">{type.label}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${loadSize === type.id ? 'text-black/40' : 'text-white/10'}`}>{type.weight}</span>
            </button>
          ))}
        </div>
      </div>

      {estimatedPrice > 0 && (
        <div className="mb-10 p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-between animate-slide-up shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-wheat/10 flex items-center justify-center border border-wheat/20 shadow-xl">
              <DollarSign className="text-wheat" size={20} />
            </div>
            <div>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Protocol Fare</p>
              <p className="text-white font-black text-2xl tracking-tighter uppercase">UGX {estimatedPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleRequest}
        disabled={!pickup || !dropoff}
        className={`w-full py-6 rounded-[28px] font-display font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl ${
          pickup && dropoff
            ? 'bg-white text-black hover:scale-[1.02] active:scale-95'
            : 'bg-white/5 text-white/10 cursor-not-allowed'
        }`}
      >
        Find Logistic Node <ChevronRight size={18} />
      </button>
      </div>
    </div>
  );
}
