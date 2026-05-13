"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Package, MapPin, Truck, RefreshCw, AlertCircle, Navigation, Star, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-ink-faint font-body text-xs font-bold animate-pulse bg-bone-low">
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

  useEffect(() => {
    if (distance !== null && distance <= 0.1 && status === 'tracking') {
      setTripCompleted(true);
    }
  }, [distance, status]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
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
        const { data: tripData, error: tripErr } = await supabase
          .from('trips')
          .select('*, drivers(*)')
          .eq('id', tripId)
          .single();

        if (tripErr) throw tripErr;

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
          
          if (destination) {
            fetchORSStats(lat, lng, destination[0], destination[1]);
          }

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
      <div className="flex flex-col h-[75vh] sm:h-[650px] relative rounded-2xl overflow-hidden border border-border-soft shadow-card-sm animate-fade-in bg-white">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-20 h-20 bg-safe/10 rounded-full flex items-center justify-center mb-4">
            <div className="w-14 h-14 bg-safe rounded-full flex items-center justify-center text-white shadow-sm">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <h2 className="font-display font-bold text-ink text-3xl mb-1">Delivery Arrived!</h2>
          <p className="font-body text-ink-muted mb-6 max-w-[280px] text-xs leading-relaxed">
            Your Eco-Rider has reached the destination. Please confirm receipt and rate the driver.
          </p>
          
          <div className="bg-bone-low border border-border-soft p-5 rounded-2xl w-full max-w-sm mb-6 shadow-inner">
            <h3 className="font-body font-bold text-ink text-xs mb-3">How was your driver?</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-95"
                >
                  <Star 
                    size={32} 
                    fill={rating >= star ? "#FF9800" : "transparent"} 
                    className={rating >= star ? "text-[#FF9800]" : "text-border-soft"} 
                  />
                </button>
              ))}
            </div>
            
            <textarea 
              placeholder="Leave a compliment or comment..." 
              className="w-full bg-white border border-border-soft rounded-xl p-3 font-body text-xs text-ink focus:border-forest outline-none resize-none h-16 shadow-inner"
            />
          </div>

          <button 
            disabled={rating === 0}
            className={`btn-primary w-full max-w-sm py-3 text-xs font-bold transition-all ${
              rating > 0 
                ? 'opacity-100' 
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            Submit Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] sm:h-[650px] relative rounded-2xl overflow-hidden border border-border-soft shadow-card-sm animate-fade-in bg-bone-low">
      {/* Top Floating Status */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start gap-2">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-white border border-border-soft shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'tracking' ? 'bg-sienna' : 'bg-border-soft'}`} />
              <span className="font-body text-ink text-[9px] font-bold uppercase tracking-wider">
                {status === 'connecting' ? 'Searching...' : 'In Transit'}
              </span>
            </div>
          </div>
          
          {destination && (
            <div className="px-3.5 py-1.5 rounded-full bg-forest text-white shadow-sm flex items-center gap-1.5">
              <MapPin size={12} />
              <span className="font-body text-[9px] font-bold tracking-wider">Home point set</span>
            </div>
          )}
        </div>

        {status === 'tracking' && eta !== null && (
          <div className="px-3.5 py-1.5 rounded-full bg-sienna shadow-sm pointer-events-auto text-white">
            <span className="font-body text-[9px] font-bold tracking-wider uppercase">Arriving in {eta}m</span>
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
            <div className="bg-sienna text-white px-4 py-2 rounded-full font-body text-xs font-bold shadow-md animate-pulse">
              Tap map to set delivery spot
            </div>
          </div>
        )}

        {status === 'connecting' && !currentPosition && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
            <div className="w-12 h-12 rounded-full border-4 border-border-soft border-t-forest animate-spin mb-3" />
            <p className="font-body text-xs font-bold text-ink-muted animate-pulse">Finding your delivery...</p>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-[1001] transition-transform duration-500 ease-out bg-white border-t border-border-soft rounded-t-3xl shadow-xl"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1 bg-border-soft rounded-full mx-auto mt-3 mb-4" />

        <div className="px-6 pb-6 space-y-4">
          {/* Driver Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-bone-low border border-border-soft flex items-center justify-center text-xl shadow-inner shrink-0">
                  👨‍🌾
                </div>
                <div className="absolute -bottom-1 -right-1 bg-safe text-white text-[6px] font-bold px-1 rounded uppercase tracking-tighter">
                  Verified
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-ink text-base leading-tight">Farmer Aaron</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-body text-ink-muted text-[9px] font-bold uppercase tracking-wider">{address}</span>
                </div>
              </div>
            </div>
            
            {!destination ? (
              <button 
                onClick={() => setIsSelectingDest(true)}
                className="btn-primary py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider"
              >
                Set Location
              </button>
            ) : (
              <div className="text-right flex flex-col gap-0.5 items-end">
                <p className="font-body text-ink-faint text-[8px] uppercase font-bold tracking-wider">ECO-2024</p>
                <p className="font-body text-forest font-bold text-[10px] underline cursor-pointer hover:text-forest-dark" onClick={() => setIsSelectingDest(true)}>Change Home</p>
                <button onClick={() => setTripCompleted(true)} className="text-[8px] font-body bg-bone-low text-ink-muted px-2 py-0.5 rounded border border-border-soft mt-1 hover:bg-bone">Force Arrival</button>
              </div>
            )}
          </div>

          {/* Trip Progress Bar */}
          <div className="relative pt-1">
            <div className="h-1.5 w-full bg-bone-low rounded-full overflow-hidden border border-border-soft">
              <div 
                className="h-full bg-sienna transition-all duration-1000" 
                style={{ width: destination ? '75%' : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 font-body text-[10px]">
              <div className="flex flex-col">
                <span className="font-bold text-ink">Farmer</span>
                <span className="text-ink-muted text-[8px]">In Transit</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-sienna">{distance !== null ? `${distance}km` : '--'}</span>
                <span className="text-ink-muted text-[8px]">to your home</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button 
              onClick={handleUseMySyncLocation}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-bone-low border border-border-soft font-body text-ink text-xs font-bold transition-all active:scale-95 hover:bg-bone"
            >
              <Navigation size={14} className="text-forest" /> 
              <span>My Location</span>
            </button>
            <a 
              href="tel:+256700000000"
              className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center"
            >
               Call Driver
            </a>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 text-center">
          <AlertCircle className="text-alert mb-3" size={40} />
          <h3 className="font-display font-bold text-ink text-xl mb-1">Something went wrong</h3>
          <p className="font-body text-ink-muted text-xs mb-5">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary py-2.5 px-5 text-xs font-bold"
          >
            Retry Tracking
          </button>
        </div>
      )}
    </div>
  );
}
