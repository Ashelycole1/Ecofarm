"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Truck, MapPin, Navigation, WifiOff, Wifi, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  startTrip,
  endTrip,
  addCoordinate,
  getTripCoordinates,
  getUnsyncedCoordinates,
  markCoordinatesSynced,
  type Trip,
} from '@/lib/db';
import { syncCoordinates } from '@/lib/supabaseClient';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm animate-pulse">
      Loading Map...
    </div>
  ),
});

export default function EcoTrack() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // ── Network status listeners ───────────────────────────────────────────────
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const onOnline = () => { setIsOffline(false); flushOfflineCoords(); };
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Flush offline-buffered coords to Supabase ─────────────────────────────
  const flushOfflineCoords = useCallback(async () => {
    setSyncing(true);
    const unsynced = await getUnsyncedCoordinates();
    if (unsynced.length === 0) { setSyncing(false); return; }

    const payload = unsynced.map(c => ({
      trip_id: c.tripId,
      lat: c.lat,
      lng: c.lng,
      timestamp: c.timestamp,
    }));

    const { error } = await syncCoordinates(payload);
    if (!error) {
      const ids = unsynced.map(c => c.id!);
      await markCoordinatesSynced(ids);
    }
    setSyncing(false);
  }, []);

  // ── Start trip ─────────────────────────────────────────────────────────────
  const handleStartTrip = async () => {
    const trip = await startTrip('farmer-001');
    setCurrentTrip(trip);
    setRouteCoordinates([]);
    setShowQR(false);

    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newPos: [number, number] = [lat, lng];

        setCurrentPosition(newPos);
        setRouteCoordinates(prev => [...prev, newPos]);

        // Always save to Dexie
        await addCoordinate({ tripId: trip.id, lat, lng, timestamp: pos.timestamp });

        // If online, also push to Supabase immediately
        if (navigator.onLine) {
          await syncCoordinates([{ trip_id: trip.id, lat, lng, timestamp: pos.timestamp }]);
        }
      },
      (err) => console.error('[GEO]', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  // ── End trip & generate QR ─────────────────────────────────────────────────
  const handleEndTrip = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!currentTrip) return;

    const updatedTrip = await endTrip(currentTrip.id);
    if (!updatedTrip) return;

    const coords = await getTripCoordinates(updatedTrip.id);

    const summary = encodeURIComponent(JSON.stringify({
      id: updatedTrip.id,
      farmer: updatedTrip.farmerId,
      start: new Date(updatedTrip.startTime).toISOString(),
      end: new Date(updatedTrip.endTime!).toISOString(),
      totalPoints: coords.length,
      origin: coords[0] ? `${coords[0].lat.toFixed(4)},${coords[0].lng.toFixed(4)}` : 'N/A',
    }));

    // Use GoQR.me API
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${summary}`);
    setShowQR(true);
    setCurrentTrip(null);

    // Flush any remaining offline data
    if (navigator.onLine) flushOfflineCoords();
  };

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
            <Truck className="text-leaf" size={22} />
          </div>
          <div>
            <h2 className="text-white font-display font-bold text-base">Eco-Track Delivery</h2>
            <p className="text-white/50 text-xs">Real-time GPS Logistics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-wheat flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" /> Syncing...
            </span>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOffline
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-safe/15 text-safe border-safe/30'
          }`}>
            {isOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
            <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="flex-1 min-h-[300px] relative rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(61,138,129,0.20)', background: 'rgba(13,36,34,0.60)' }}
      >
        {showQR ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-10 p-6 text-center gap-4">
            <CheckCircle2 className="text-leaf" size={40} />
            <h3 className="text-white font-display font-bold text-xl">Delivery Confirmed!</h3>
            <p className="text-white/60 text-sm max-w-xs">Have the buyer scan this QR to verify delivery.</p>
            <div className="p-3 bg-white rounded-2xl shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Delivery QR Code" width={220} height={220} />
            </div>
            <button
              onClick={() => { setShowQR(false); setRouteCoordinates([]); setCurrentPosition(null); }}
              className="mt-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background: 'rgba(45,102,95,0.40)', border: '1px solid rgba(61,138,129,0.40)' }}
            >
              Start New Trip
            </button>
          </div>
        ) : (
          <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
        )}
      </div>

      {/* Controls */}
      {!currentTrip ? (
        <button
          onClick={handleStartTrip}
          className="w-full py-4 rounded-2xl font-display font-bold text-white text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #3D8A81 0%, #2D665F 100%)',
            boxShadow: '0 6px 24px rgba(45,102,95,0.40)',
          }}
        >
          <Navigation size={20} /> Start Trip
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="py-4 rounded-2xl flex flex-col items-center justify-center gap-1"
            style={{ background: 'rgba(45,102,95,0.20)', border: '1px solid rgba(61,138,129,0.20)' }}
          >
            <span className="text-white/50 text-[10px] uppercase tracking-widest">Status</span>
            <span className="text-leaf font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-leaf animate-pulse" />
              Tracking
            </span>
          </div>
          <button
            onClick={handleEndTrip}
            className="py-4 rounded-2xl font-display font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)',
              boxShadow: '0 6px 24px rgba(229,57,53,0.35)',
            }}
          >
            <MapPin size={18} /> Confirm Delivery
          </button>
        </div>
      )}
    </div>
  );
}
