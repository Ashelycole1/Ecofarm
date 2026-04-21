"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  WifiOff, 
  Wifi, 
  CheckCircle2, 
  RefreshCw, 
  QrCode, 
  X, 
  Map as MapIcon,
  ChevronRight
} from 'lucide-react';
import { 
  db, 
  addCoordinate, 
  getUnsyncedCoordinates, 
  markCoordinatesSynced,
  type Trip,
  startTrip as dbStartTrip
} from '@/lib/db';
import { syncCoordinates, getSupabase } from '@/lib/supabaseClient';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-forest/10 animate-pulse rounded-2xl flex items-center justify-center text-white/20">Loading Map Engine...</div>
});

export default function EcoTrack() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [address, setAddress] = useState('Determining location...');
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [canGenerateQR, setCanGenerateQR] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const destination: [number, number] = [0.3200, 32.5900]; // Mock Market Location (e.g. Kalerwe)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Requirement 2: Reverse Geocoding (Nominatim) ──────────────────────────
  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const addr = data.address;
      const display = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "Kampala District";
      setAddress(display);
    } catch (err) {
      console.warn('Geocoding failed');
    }
  };

  // ── Requirement 3: Routing & ETA (OSRM - OpenSource Alternative to ORS) ─────
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      // Using OSRM Public API (Free/Open Source)
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setDistance((route.distance / 1000).toFixed(1) + ' km');
        setEta(Math.round(route.duration / 60) + ' min');
        
        // Requirement 5: Radius Check (50m)
        if (route.distance < 50) {
          setCanGenerateQR(true);
        }
      }
    } catch (err) {
      console.warn('Routing failed');
    }
  };

  // ── Requirement 4: Offline Sync (Dexie.js) ───────────────────────────────
  useEffect(() => {
    if (isOnline && currentTrip) {
      const sync = async () => {
        setSyncing(true);
        const unsynced = await getUnsyncedCoordinates();
        if (unsynced.length > 0) {
          const payload = unsynced.map(c => ({
            trip_id: c.tripId,
            lat: c.lat,
            lng: c.lng,
            timestamp: c.timestamp
          }));
          const { error } = await syncCoordinates(payload);
          if (!error) {
            await markCoordinatesSynced(unsynced.map(c => c.id!));
          }
        }
        setSyncing(false);
      };
      const interval = setInterval(sync, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, currentTrip]);

  const handleStartTrip = async () => {
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const trip = await dbStartTrip('farmer-001');
    setCurrentTrip(trip);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newPos: [number, number] = [lat, lng];
        const timestamp = pos.timestamp;

        setCurrentPosition(newPos);
        setRouteCoordinates(prev => [...prev, newPos]);

        // 1. Reverse Geocoding
        fetchAddress(lat, lng);
        
        // 2. Routing/ETA
        fetchRoute(newPos, destination);

        // 3. Offline Store (Dexie)
        await addCoordinate({ tripId: trip.id, lat, lng, timestamp });

        // 4. Real-time Sync (Supabase)
        if (navigator.onLine) {
          syncCoordinates([{ trip_id: trip.id, lat, lng, timestamp }]);
        }
      },
      (err) => console.error('[GEO ERROR]', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const generateQR = () => {
    if (!currentTrip) return;
    const data = `shipment:${currentTrip.id}:${Date.now()}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
    setQrUrl(url);
    setShowQR(true);
  };

  const copyTripId = () => {
    if (currentTrip) {
      navigator.clipboard.writeText(currentTrip.id);
      alert('Trip ID copied! Share this with your buyer.');
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header Panel */}
      <div 
        className="p-5 rounded-3xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(45,102,95,0.40) 0%, rgba(13,36,34,0.85) 100%)',
          border: '1px solid rgba(61,138,129,0.25)',
        }}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-forest/30 border border-white/10">
              <Truck className="text-leaf" size={20} />
            </div>
            <div>
              <h2 className="text-white font-display font-black text-lg">Eco-Track Pro</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Logistics & Real-time Fleet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncing && <RefreshCw size={12} className="text-wheat animate-spin" />}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              isOnline ? 'bg-safe/15 text-safe border border-safe/20' : 'bg-alert/15 text-alert border border-alert/20'
            }`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </div>
          </div>
        </div>

        {currentTrip && (
          <div className="mt-5 p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between animate-slide-up">
            <div className="flex flex-col">
              <span className="text-white/30 text-[9px] uppercase font-black">Active Trip ID</span>
              <span className="text-wheat font-mono text-xs font-bold">{currentTrip.id.split('-')[0]}...</span>
            </div>
            <button 
              onClick={copyTripId}
              className="px-4 py-2 rounded-xl bg-forest/40 text-white text-[10px] font-bold hover:bg-forest/60 transition-all active:scale-95"
            >
              Share ID
            </button>
          </div>
        )}
      </div>

      {/* Map & Live Stats */}
      <div 
        className="h-[400px] rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl"
        style={{ background: 'rgba(13,36,34,0.80)' }}
      >
        <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
        
        {/* Floating Address Overlay (Nominatim) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 pointer-events-auto shadow-xl">
             <div className="w-8 h-8 rounded-full bg-forest/40 flex items-center justify-center shrink-0">
               <MapPin className="text-wheat" size={16} />
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-white/40 text-[8px] uppercase font-black tracking-tighter">Current Location</p>
               <p className="text-white text-xs font-bold truncate">{address}</p>
             </div>
          </div>
        </div>

        {/* ETA Panel */}
        {eta && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-[#FF9800] p-4 rounded-2xl flex items-center justify-between pointer-events-auto shadow-2xl border-t border-white/20">
              <div className="flex items-center gap-3">
                <Navigation className="text-black" size={20} />
                <div>
                  <p className="text-black/60 text-[8px] font-black uppercase">Market Destination</p>
                  <p className="text-black font-black text-sm uppercase italic">Optimized Route Active</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-black font-black text-xl leading-none">{eta}</p>
                <p className="text-black/60 text-[8px] font-black uppercase">{distance}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-1 gap-3">
        {!currentTrip ? (
          <button 
            onClick={handleStartTrip}
            className="w-full py-5 rounded-3xl bg-forest text-white font-display font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-forest/20 active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg, #2D665F 0%, #1A3E3A 100%)' }}
          >
            <Truck size={24} /> START DELIVERY
          </button>
        ) : (
          <div className="flex gap-3">
             <button 
              onClick={() => {
                if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
                setCurrentTrip(null);
                setCurrentPosition(null);
                setRouteCoordinates([]);
              }}
              className="flex-[2] py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              onClick={generateQR}
              disabled={!canGenerateQR}
              className={`flex-[3] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                canGenerateQR 
                  ? 'bg-wheat text-forest active:scale-95' 
                  : 'bg-white/5 text-white/20 grayscale cursor-not-allowed'
              }`}
            >
              <QrCode size={18} /> {canGenerateQR ? 'GENERATE DELIVERY QR' : 'REACH DESTINATION'}
            </button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div 
            className="relative w-full max-w-sm rounded-[40px] p-8 flex flex-col items-center gap-6 animate-zoom-in"
            style={{ 
              background: 'linear-gradient(160deg, #1A3E3A 0%, #061412 100%)',
              border: '2px solid rgba(242,201,76,0.3)'
            }}
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mb-2" />
            <div className="text-center">
              <h3 className="text-wheat font-display font-black text-2xl uppercase italic">Delivery Verified</h3>
              <p className="text-white/50 text-xs mt-1">Buyer scans this to confirm arrival</p>
            </div>
            
            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-wheat">
              <img src={qrUrl} alt="Delivery QR" className="w-48 h-48" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-white/30 text-[10px] uppercase font-black">Shipment ID</p>
              <p className="text-white font-mono text-sm">{currentTrip?.id}</p>
            </div>

            <button 
              onClick={() => setShowQR(false)}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
