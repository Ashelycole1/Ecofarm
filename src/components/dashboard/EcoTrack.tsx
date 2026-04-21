"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { startTrip, endTrip, addCoordinate, getTripCoordinates, Trip } from '@/lib/db';
import { Truck, MapPin, CheckCircle, Navigation, WifiOff } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center text-white/50">Loading Map...</div>
});

export default function EcoTrack() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [tripSummary, setTripSummary] = useState<string>('');
  
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartTrip = async () => {
    try {
      const trip = await startTrip('farmer-123'); // Mock farmer ID
      setCurrentTrip(trip);
      setRouteCoordinates([]);
      setShowQR(false);

      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const newPos: [number, number] = [latitude, longitude];
            
            setCurrentPosition(newPos);
            setRouteCoordinates(prev => [...prev, newPos]);

            await addCoordinate({
              tripId: trip.id,
              lat: latitude,
              lng: longitude,
              timestamp: position.timestamp
            });
          },
          (error) => console.error("Geolocation error:", error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    } catch (error) {
      console.error("Failed to start trip:", error);
    }
  };

  const handleEndTrip = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (currentTrip) {
      const updatedTrip = await endTrip(currentTrip.id);
      if (updatedTrip) {
        const coords = await getTripCoordinates(updatedTrip.id);
        const summary = JSON.stringify({
          id: updatedTrip.id,
          farmer: updatedTrip.farmerId,
          start: updatedTrip.startTime,
          end: updatedTrip.endTime,
          points: coords.length
        });
        setTripSummary(summary);
        setShowQR(true);
      }
      setCurrentTrip(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Truck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Eco-Track Delivery</h2>
            <p className="text-white/60 text-sm">Real-time GPS Logistics</p>
          </div>
        </div>
        
        {isOffline && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-500/30">
            <WifiOff className="w-4 h-4" />
            <span className="hidden sm:inline">Offline Storage Active</span>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 min-h-[300px] relative bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-inner">
        {showQR ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-6 text-center">
            <div className="bg-white p-4 rounded-xl shadow-2xl mb-4">
              <QRCodeSVG value={tripSummary} size={200} />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2 flex items-center gap-2">
              <CheckCircle className="text-emerald-400" /> Delivery Confirmed
            </h3>
            <p className="text-white/70 text-sm max-w-xs mb-6">Scan this code at the hub to sync delivery data and verify arrival.</p>
            <button 
              onClick={() => setShowQR(false)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
            >
              Close
            </button>
          </div>
        ) : (
          <MapComponent currentPosition={currentPosition} routeCoordinates={routeCoordinates} />
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        {!currentTrip ? (
          <button
            onClick={handleStartTrip}
            className="col-span-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" /> Start Trip
          </button>
        ) : (
          <>
            <div className="py-4 bg-white/10 rounded-xl flex flex-col items-center justify-center border border-white/10">
              <span className="text-white/60 text-xs uppercase tracking-wider mb-1">Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Tracking
              </span>
            </div>
            <button
              onClick={handleEndTrip}
              className="py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" /> Confirm Delivery
            </button>
          </>
        )}
      </div>
    </div>
  );
}
