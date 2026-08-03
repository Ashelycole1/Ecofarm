"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
  loading: () => <div className="h-full w-full bg-bone-low animate-pulse rounded-2xl flex items-center justify-center font-body text-xs text-ink-muted font-bold">Loading Map Engine...</div>
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
  const destination: [number, number] = [0.3200, 32.5900];

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

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    
    try {
      if (orsKey) {
        const res = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${orsKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`);
        const data = await res.json();
        if (data.features && data.features[0]) {
          const props = data.features[0].properties.summary;
          setDistance((props.distance / 1000).toFixed(1) + ' km');
          setEta(Math.round(props.duration / 60) + ' min');
          if (props.distance < 50) setCanGenerateQR(true);
          return;
        }
      }

      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setDistance((route.distance / 1000).toFixed(1) + ' km');
        setEta(Math.round(route.duration / 60) + ' min');
        if (route.distance < 50) setCanGenerateQR(true);
      }
    } catch (err) {
      console.warn('Routing failed');
    }
  };

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

    const supabase = getSupabase();
    if (supabase && isOnline) {
      await supabase.from('trips').insert([{
        id: trip.id,
        farmer_id: 'farmer-001',
        status: 'in-progress',
        created_at: new Date(trip.startTime).toISOString()
      }]);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newPos: [number, number] = [lat, lng];
        const timestamp = pos.timestamp;

        setCurrentPosition(newPos);
        setRouteCoordinates(prev => [...prev, newPos]);

        fetchAddress(lat, lng);
        fetchRoute(newPos, destination);

        await addCoordinate({ tripId: trip.id, lat, lng, timestamp });

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
    <div className="flex flex-col gap-5 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="mh-card p-6 bg-white border border-border-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-forest/10 border border-forest/20 shadow-inner">
              <Truck className="text-forest" size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-ink text-xl leading-tight">Eco-Track Pro</h2>
              <p className="font-body text-ink-muted text-[10px] uppercase tracking-wider font-bold mt-0.5">Logistics & Real-time Fleet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncing && <RefreshCw size={12} className="text-forest animate-spin" />}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[9px] font-bold uppercase tracking-wider ${
              isOnline ? 'bg-safe/10 text-safe border border-safe/20' : 'bg-alert-container text-alert border border-alert/20'
            }`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
            </div>
          </div>
        </div>

        {currentTrip && (
          <div className="mt-4 p-3 rounded-xl bg-bone-low border border-border-soft flex items-center justify-between animate-slide-up shadow-inner">
            <div className="flex flex-col">
              <span className="font-body text-ink-muted text-[9px] uppercase font-bold tracking-wider">Active Trip ID</span>
              <span className="font-mono text-ink text-xs font-bold mt-0.5">{currentTrip.id.split('-')[0]}...</span>
            </div>
            <button 
              onClick={copyTripId}
              className="btn-ghost py-1.5 px-3 text-[10px] font-bold"
            >
              Share ID
            </button>
          </div>
        )}
      </div>

      {/* Map & Live Stats */}
      <div className="h-[400px] rounded-2xl overflow-hidden relative border border-border-soft shadow-card-sm bg-bone-low">
        <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
        
        {/* Floating Address Overlay (Nominatim) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-border-soft p-3 rounded-xl flex items-center gap-3 pointer-events-auto shadow-sm">
             <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
               <MapPin className="text-forest" size={16} />
             </div>
             <div className="flex-1 min-w-0">
               <p className="font-body text-ink-muted text-[8px] uppercase font-bold tracking-wider">Current Location</p>
               <p className="font-body text-ink text-xs font-bold truncate mt-0.5">{address}</p>
             </div>
          </div>
        </div>

        {/* ETA Panel */}
        {eta && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-sienna p-4 rounded-xl flex items-center justify-between pointer-events-auto shadow-md text-white">
              <div className="flex items-center gap-3">
                <Navigation size={20} />
                <div>
                  <p className="font-body text-[8px] font-bold uppercase tracking-wider opacity-80">Market Destination</p>
                  <p className="font-body font-bold text-xs uppercase italic mt-0.5">Optimized Route Active</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-xl leading-none">{eta}</p>
                <p className="font-body text-[8px] font-bold uppercase tracking-wider opacity-80 mt-1">{distance}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-1 gap-2 pt-1">
        {!currentTrip ? (
          <button 
            onClick={handleStartTrip}
            className="btn-primary py-4 w-full text-xs font-bold flex items-center justify-center gap-2"
          >
            <Truck size={18} /> 
            <span>START DELIVERY</span>
          </button>
        ) : (
          <div className="flex gap-2">
             <button 
              onClick={() => {
                if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
                setCurrentTrip(null);
                setCurrentPosition(null);
                setRouteCoordinates([]);
              }}
              className="flex-[2] py-3 rounded-xl bg-white border border-border-soft text-ink font-body text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-bone-low transition-all"
            >
              <X size={16} /> 
              <span>Cancel</span>
            </button>
            <button 
              onClick={generateQR}
              disabled={!canGenerateQR}
              className={`flex-[3] py-3 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                canGenerateQR 
                  ? 'bg-forest text-white active:scale-95' 
                  : 'bg-bone-low text-ink-faint border border-border-soft cursor-not-allowed'
              }`}
            >
              <QrCode size={16} /> 
              <span>{canGenerateQR ? 'GENERATE DELIVERY QR' : 'REACH DESTINATION'}</span>
            </button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-5 bg-white border border-border-soft shadow-xl animate-zoom-in">
            <div className="text-center">
              <h3 className="font-display font-bold text-2xl text-ink">Delivery Verified</h3>
              <p className="font-body text-xs text-ink-muted mt-0.5">Buyer scans this to confirm arrival</p>
            </div>
            
            <div className="p-4 bg-white rounded-xl shadow-inner border border-border-soft">
              <Image src={qrUrl} alt="Delivery QR" width={192} height={192} className="w-48 h-48" />
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <p className="font-body text-ink-muted text-[9px] uppercase font-bold tracking-wider">Shipment ID</p>
              <p className="font-mono text-ink text-xs font-bold">{currentTrip?.id}</p>
            </div>

            <button 
              onClick={() => setShowQR(false)}
              className="btn-ghost py-2.5 w-full text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
