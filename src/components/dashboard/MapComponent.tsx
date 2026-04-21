"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom pulsing marker for SafeBoda feel
const createPulsingIcon = (color: string) => L.divIcon({
  html: `<div class="marker-pulse" style="background-color: ${color}"></div>`,
  className: 'custom-div-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Google Maps style Blue Dot for User
const userIcon = L.divIcon({
  html: `
    <div class="user-marker-container">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  className: 'user-marker-wrapper',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const truckIcon = createPulsingIcon('#FF9800'); // SafeBoda Orange

interface MapComponentProps {
  currentPosition: [number, number] | null;
  routeCoordinates: [number, number][];
  destination?: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
}

const RecenterAutomatically = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export default function MapComponent({ 
  currentPosition, 
  routeCoordinates, 
  destination,
  onMapClick 
}: MapComponentProps) {
  const defaultCenter: [number, number] = [0.3476, 32.5825];
  const [mapType, setMapType] = useState<'m' | 's' | 'y'>('m'); // m: roadmap, s: satellite, y: hybrid

  return (
    <div style={{ height: '100%', width: '100%' }} className="leaflet-container-wrapper relative">
      <style jsx global>{`
        .marker-pulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .user-marker-container {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-marker-dot {
          width: 14px;
          height: 14px;
          background: #4285F4;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          z-index: 2;
        }
        .user-marker-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(66, 133, 244, 0.25);
          border-radius: 50%;
          animation: user-pulse 2s ease-out infinite;
          z-index: 1;
        }
        @keyframes user-pulse {
          0% { transform: scale(0.4); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
        }
      `}</style>

      {/* Map Type Toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setMapType(mapType === 'm' ? 's' : 'm')}
          className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[10px] font-bold uppercase shadow-xl transition-all active:scale-95"
        >
          {mapType === 'm' ? 'Sat' : 'Map'}
        </button>
      </div>

      <MapContainer
        center={currentPosition || defaultCenter}
        zoom={15}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={mapType}
          attribution='&copy; Google Maps'
          url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
        />
        
        <MapEvents onMapClick={onMapClick} />

        {currentPosition && (
          <>
            <Marker position={currentPosition} icon={truckIcon} />
            <RecenterAutomatically position={currentPosition} />
          </>
        )}

        {destination && (
          <Marker position={destination} icon={userIcon} />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="rgba(255, 152, 0, 0.6)" weight={4} />
        )}

        {currentPosition && destination && (
          <Polyline 
            positions={[currentPosition, destination]} 
            color="#FF9800" 
            weight={3} 
            dashArray="1, 10" 
            lineCap="round"
          />
        )}
      </MapContainer>
    </div>
  );
}
