"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Package, MapPin, Truck, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [eta, setEta] = useState(15); // Simulated minutes
  const [distance, setDistance] = useState(2.4); // Simulated km

  useEffect(() => {
    const supabase = getSupabase();
    if (!tripId) return;

    const fetchInitial = async () => {
      if (!supabase) {
        setErrorMsg('Supabase configuration missing.');
        setStatus('error');
        return;
      }
      try {
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
        } else {
          setErrorMsg('No coordinates found for this Trip ID.');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('[Supabase Error]', err);
        setErrorMsg('Could not fetch initial location.');
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
          
          // Update simulated values
          setEta(prev => Math.max(1, prev - 1));
          setDistance(prev => Math.max(0.1, prev - 0.2));
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [tripId]);

  return (
    <div className="flex flex-col h-[70vh] sm:h-[600px] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in">
      {/* Top Floating Status */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start">
        <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'tracking' ? 'bg-[#FF9800]' : 'bg-white/30'}`} />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">
              {status === 'connecting' ? 'Searching...' : 'In Transit'}
            </span>
          </div>
        </div>

        {status === 'tracking' && (
          <div className="px-4 py-2 rounded-2xl bg-[#FF9800] shadow-lg pointer-events-auto animate-bounce-subtle">
            <span className="text-black text-[10px] font-black italic uppercase">Arriving in {eta}m</span>
          </div>
        )}
      </div>

      {/* Map - Takes up full background */}
      <div className="absolute inset-0 z-0">
        <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
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
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-forest/20 border-2 border-[#FF9800]/30 p-1">
                  <div className="w-full h-full rounded-xl bg-forest/40 flex items-center justify-center text-2xl">
                    👨‍🌾
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#FF9800] text-black text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                  Safe Farmer
                </div>
              </div>
              <div>
                <h3 className="text-white font-display font-black text-xl leading-tight">Farmer Aaron</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-[#FF9800] text-[10px]">★</span>)}
                  </div>
                  <span className="text-white/40 text-[10px] font-bold">4.9 • 1,200+ trips</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <p className="text-white/40 text-[8px] uppercase font-black tracking-tighter">Plate Number</p>
                <p className="text-wheat font-mono font-bold text-sm">ECO-2024</p>
              </div>
            </div>
          </div>

          {/* Trip Progress Bar */}
          <div className="relative pt-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF9800] transition-all duration-1000" 
                style={{ width: status === 'tracking' ? '65%' : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs">Farm</span>
                <span className="text-white/30 text-[9px]">Mbarara</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[#FF9800] font-bold text-xs">{distance}km</span>
                <span className="text-white/30 text-[9px]">Remaining</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm transition-all active:scale-95"
            >
              <RefreshCw size={18} className="text-wheat" /> Refresh
            </button>
            <a 
              href="tel:+256700000000"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FF9800] text-black font-black text-sm transition-all active:scale-95 shadow-lg shadow-[#FF9800]/20"
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
