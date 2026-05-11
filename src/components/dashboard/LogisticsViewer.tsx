"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Package, MapPin, Truck, RefreshCw, AlertCircle, Navigation, Star, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm animate-pulse">
      Loading Live Map...
    </div>
  ),
});

interface LogisticsViewerProps {
  tripId: string;
}

export default function LogisticsViewer({ tripId }: LogisticsViewerProps) {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<'connecting' | 'tracking' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [address, setAddress] = useState('Locating...');
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null); 
  const [distance, setDistance] = useState<number | null>(null); 
  const [isSelectingDest, setIsSelectingDest] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [rating, setRating] = useState(0);

  // Check for trip completion
  useEffect(() => {
    if (distance !== null && distance <= 0.1 && status === 'tracking') {
      setTripCompleted(true);
    }
  }, [distance, status]);

  // ── Helper: Haversine Distance ──────────────────────────────────────────
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchORSStats = useCallback(async (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    try {
      if (orsKey) {
        const res = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${orsKey}&start=${lon1},${lat1}&end=${lon2},${lat2}`);
        const data = await res.json();
        if (data.features && data.features[0]) {
          const props = data.features[0].properties.summary;
          setDistance(Number((props.distance / 1000).toFixed(1)));
          setEta(Math.round(props.duration / 60));
          return;
        }
      }
      
      // Basic fallback if no key
      const d = calculateDistance(lat1, lon1, lat2, lon2);
      setDistance(Number(d.toFixed(1)));
      setEta(Math.round(d * 4));
    } catch (err) {
      console.warn('ORS stats failed');
    }
  }, []);

  const fetchAddress = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const addr = data.address;
      const display = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "Kampala District";
      setAddress(display);
    } catch (err) {
      console.warn('Geocoding failed');
    }
  }, []);

  const handleUseMySyncLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newDest: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setDestination(newDest);
        setIsSelectingDest(false);
        if (currentPosition) {
          const d = calculateDistance(currentPosition[0], currentPosition[1], newDest[0], newDest[1]);
          setDistance(Number(d.toFixed(1)));
          setEta(Math.round(d * 4));
        }
      }, (err) => {
        alert("Could not get your location. Please select it on the map.");
      });
    }
  }, [currentPosition]);

  useEffect(() => {
    // Auto-locate on mount
    if (!destination) {
      handleUseMySyncLocation();
    }
    
    const supabase = getSupabase();
    if (!tripId) return;

    const fetchInitial = async () => {
      if (!supabase) {
        setErrorMsg('Supabase configuration missing.');
        setStatus('error');
        return;
      }
      try {
        // 1. Fetch Trip & Driver Metadata
        const { data: tripData, error: tripErr } = await supabase
          .from('trips')
          .select('*, drivers(*)')
          .eq('id', tripId)
          .single();

        if (tripErr) throw tripErr;

        // 2. Fetch Initial Coordinates
        const { data, error } = await supabase
          .from('coordinates')
          .select('lat, lng, timestamp')
          .eq('trip_id', tripId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const coords = data.map(d => [d.lat, d.lng] as [number, number]);
          setRouteCoordinates(coords);
          setCurrentPosition(coords[coords.length - 1]);
          setStatus('tracking');
          
          if (destination) {
            const d = calculateDistance(coords[coords.length - 1][0], coords[coords.length - 1][1], destination[0], destination[1]);
            setDistance(Number(d.toFixed(1)));
            setEta(Math.round(d * 4));
          }
        }
      } catch (err: any) {
        console.error('[Supabase Error]', err);
        setErrorMsg('Could not fetch trip information.');
        setStatus('error');
      }
    };

    fetchInitial();

    if (!supabase) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`trip_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coordinates',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const { lat, lng } = payload.new;
          const newPos: [number, number] = [lat, lng];
          setCurrentPosition(newPos);
          setRouteCoordinates(prev => [...prev, newPos]);
          setStatus('tracking');
          
          // Calculate distance/ETA if destination is set
          if (destination) {
            fetchORSStats(lat, lng, destination[0], destination[1]);
          }

          // Reverse Geocoding
          fetchAddress(lat, lng);
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [tripId, destination, handleUseMySyncLocation, fetchORSStats, fetchAddress]);

  if (tripCompleted) {
    return (
      <div className="flex flex-col h-[75vh] sm:h-[650px] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in bg-[#0A1A18]">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
          <div className="w-24 h-24 bg-safe/20 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
            <div className="w-16 h-16 bg-safe rounded-full flex items-center justify-center text-black">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <h2 className="text-white font-display font-black text-3xl mb-2">Delivery Arrived!</h2>
          <p className="text-white/60 mb-8 max-w-[250px] text-sm">Your Eco-Rider has reached the destination. Please confirm receipt and rate the driver.</p>
          
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl w-full max-w-sm mb-8">
            <h3 className="text-white font-bold text-sm mb-4">How was your driver?</h3>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star 
                    size={36} 
                    fill={rating >= star ? "#FF9800" : "transparent"} 
                    className={rating >= star ? "text-[#FF9800]" : "text-white/20"} 
                  />
                </button>
              ))}
            </div>
            
            <textarea 
              placeholder="Leave a compliment or comment..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#FF9800]/50 outline-none resize-none h-20"
            />
          </div>

          <button 
            disabled={rating === 0}
            className={`w-full max-w-sm py-4 rounded-2xl font-black text-lg uppercase transition-all ${
              rating > 0 
                ? 'bg-[#FF9800] text-black shadow-[0_0_20px_rgba(255,152,0,0.4)] active:scale-[0.98]' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            Submit Review
          </button>
        </div>
        
        {/* Background confeti/blur effect */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-safe/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] sm:h-[650px] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in">
      {/* Top Floating Status */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start gap-2">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'tracking' ? 'bg-[#FF9800]' : 'bg-white/30'}`} />
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                {status === 'connecting' ? 'Searching...' : 'In Transit'}
              </span>
            </div>
          </div>
          
          {destination && (
            <div className="px-4 py-2 rounded-2xl bg-forest/40 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
              <MapPin size={12} className="text-wheat" />
              <span className="text-white text-[10px] font-bold">Home point set</span>
            </div>
          )}
        </div>

        {status === 'tracking' && eta !== null && (
          <div className="px-4 py-2 rounded-2xl bg-[#FF9800] shadow-lg pointer-events-auto animate-bounce-subtle">
            <span className="text-black text-[10px] font-black italic uppercase">Arriving in {eta}m</span>
          </div>
        )}
      </div>

      {/* Map - Takes up full background */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          currentPosition={currentPosition} 
          routeCoordinates={routeCoordinates}
          destination={destination}
          onMapClick={isSelectingDest ? (lat, lng) => {
            setDestination([lat, lng]);
            setIsSelectingDest(false);
            if (currentPosition) {
              const d = calculateDistance(currentPosition[0], currentPosition[1], lat, lng);
              setDistance(Number(d.toFixed(1)));
              setEta(Math.round(d * 4));
            }
          } : undefined}
        />
        
        {isSelectingDest && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-[#FF9800] text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl animate-pulse border-2 border-white">
              Tap map to set delivery spot
            </div>
          </div>
        )}

        {status === 'connecting' && !currentPosition && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10">
            <div className="w-20 h-20 rounded-full border-4 border-[#FF9800]/20 border-t-[#FF9800] animate-spin mb-4" />
            <p className="text-white font-bold animate-pulse">Finding your delivery...</p>
          </div>
        )}
      </div>

      {/* SafeBoda Style Bottom Sheet */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-[1001] transition-transform duration-500 ease-out translate-y-0"
        style={{
          background: 'linear-gradient(180deg, rgba(13,36,34,0.95) 0%, rgba(6,20,18,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(61,138,129,0.3)',
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5" />

        <div className="px-6 pb-8 space-y-6">
          {/* Driver Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-forest/20 border-2 border-[#FF9800]/30 p-1">
                  <div className="w-full h-full rounded-xl bg-forest/40 flex items-center justify-center text-2xl">
                    👨‍🌾
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#FF9800] text-black text-[7px] font-black px-1 py-0.5 rounded-md uppercase">
                  Safe Farmer
                </div>
              </div>
              <div>
                <h3 className="text-white font-display font-black text-lg leading-tight">Farmer Aaron</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#FF9800] text-[8px] font-black uppercase">{address}</span>
                </div>
              </div>
            </div>
            
            {!destination ? (
              <button 
                onClick={() => setIsSelectingDest(true)}
                className="bg-[#FF9800] text-black text-[10px] font-black px-4 py-2 rounded-xl uppercase shadow-lg shadow-[#FF9800]/20 active:scale-95 transition-all"
              >
                Set Location
              </button>
            ) : (
              <div className="text-right flex flex-col gap-1 items-end">
                <p className="text-white/40 text-[8px] uppercase font-black">ECO-2024</p>
                <p className="text-wheat font-bold text-xs underline cursor-pointer" onClick={() => setIsSelectingDest(true)}>Change Home</p>
                {/* Developer debug button to force arrival */}
                <button onClick={() => setTripCompleted(true)} className="text-[8px] bg-white/10 px-2 py-0.5 rounded text-white/50 mt-1">Force Arrival</button>
              </div>
            )}
          </div>

          {/* Trip Progress Bar */}
          <div className="relative pt-2">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF9800] transition-all duration-1000" 
                style={{ width: destination ? '75%' : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-white font-bold text-[10px]">Farmer</span>
                <span className="text-white/30 text-[8px]">In Transit</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[#FF9800] font-bold text-[10px]">{distance !== null ? `${distance}km` : '--'}</span>
                <span className="text-white/30 text-[8px]">to your home</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleUseMySyncLocation}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs transition-all active:scale-95"
            >
              <Navigation size={14} className="text-wheat" /> My Location
            </button>
            <a 
              href="tel:+256700000000"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FF9800] text-black font-black text-xs transition-all active:scale-95 shadow-lg shadow-[#FF9800]/20"
            >
               Call Driver
            </a>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center">
          <AlertCircle className="text-[#FF9800] mb-4" size={48} />
          <h3 className="text-white font-black text-xl mb-2">Something went wrong</h3>
          <p className="text-white/60 text-sm mb-6">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-2xl bg-[#FF9800] text-black font-black uppercase text-xs"
          >
            Retry Tracking
          </button>
        </div>
      )}
    </div>
  );
}
