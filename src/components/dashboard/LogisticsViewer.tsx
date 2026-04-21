"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Package, MapPin, Truck, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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

  useEffect(() => {
    if (!tripId) return;

    const fetchInitial = async () => {
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
        }
      } catch (err: any) {
        console.error('[Supabase Error]', err);
        setErrorMsg('Could not fetch initial location.');
      }
    };

    fetchInitial();

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(45,102,95,0.30) 0%, rgba(13,36,34,0.75) 100%)',
          border: '1px solid rgba(61,138,129,0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(45,102,95,0.35)' }}>
            <Package className="text-leaf" size={22} />
          </div>
          <div>
            <h2 className="text-white font-display font-bold text-base">Track Delivery</h2>
            <p className="text-white/50 text-xs">Live route from farm to you</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'connecting' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/50">
              <RefreshCw size={12} className="animate-spin" />
              Connecting...
            </div>
          ) : status === 'error' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alert/15 text-xs text-alert border border-alert/20">
              <AlertCircle size={12} />
              Error
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe/15 text-xs text-safe border border-safe/20">
              <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              Live Updates
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div
        className="flex-1 min-h-[400px] h-[400px] relative rounded-2xl overflow-hidden shadow-inner"
        style={{ border: '1px solid rgba(61,138,129,0.30)', background: 'rgba(13,36,34,0.80)' }}
      >
        {status === 'connecting' && !currentPosition ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
            <RefreshCw className="text-wheat animate-spin mb-3" size={32} />
            <p className="text-white/60 text-sm">Searching for delivery truck...</p>
          </div>
        ) : errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-6 text-center">
            <AlertCircle className="text-alert mb-3" size={32} />
            <p className="text-white font-bold">{errorMsg}</p>
            <p className="text-white/50 text-xs mt-2">Make sure the Trip ID is correct and tracking is active.</p>
          </div>
        ) : null}
        <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
      </div>

      {/* Info Card */}
      {currentPosition && (
        <div
          className="p-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/20 flex items-center justify-center">
              <Truck className="text-wheat" size={20} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">On the way</p>
              <p className="text-white/40 text-[10px] uppercase">Current Lat/Lng: {currentPosition[0].toFixed(4)}, {currentPosition[1].toFixed(4)}</p>
            </div>
          </div>
          <button 
            className="px-4 py-2 rounded-xl bg-forest/30 text-wheat text-xs font-bold hover:bg-forest/50 transition-all"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
