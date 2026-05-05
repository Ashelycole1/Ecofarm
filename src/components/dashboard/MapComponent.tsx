"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import type { Farm, EcoMarket } from '@/lib/db';

// ── Icons & Markers ─────────────────────────────────────────────────────────

// Pulsing marker for deliveries (SafeBoda Orange)
const createPulsingIcon = (color: string) => L.divIcon({
  html: `<div class="marker-pulse" style="background-color: ${color}"></div>`,
  className: 'custom-div-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// User location dot (Google Style Blue dot)
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

// Generic Farm/Market dot
const createDotIcon = (color: string) => L.divIcon({
  html: `
    <div style="
      width: 16px; height: 16px; border-radius: 50%;
      background: ${color};
      border: 2.5px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px ${color}80;
    "></div>
  `,
  className: 'dot-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Market Pin
const createMarketIcon = (color: string) => L.divIcon({
  html: `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="
        width: 20px; height: 20px; border-radius: 50% 50% 50% 0;
        background: ${color}; transform: rotate(-45deg);
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 3px 10px ${color}80;
      "></div>
    </div>
  `,
  className: 'market-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 20]
});

// ── Types ───────────────────────────────────────────────────────────────────

export interface FarmMarkerData {
  position: { lat: number; lng: number };
  color: string;
  label: string;
  data: Farm | EcoMarket;
  type: 'farm' | 'market';
  isConfidential?: boolean;
}

export interface MapComponentProps {
  currentPosition: [number, number] | null;
  routeCoordinates?: [number, number][];
  destination?: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
  farmMarkers?: FarmMarkerData[];
  marketMarkers?: FarmMarkerData[];
  onFarmClick?: (item: Farm | EcoMarket) => void;
  showFarms?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const RecenterAutomatically = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position);
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

// ── Component ───────────────────────────────────────────────────────────────

export default function MapComponent({ 
  currentPosition, 
  routeCoordinates = [], 
  destination,
  onMapClick,
  farmMarkers = [],
  marketMarkers = [],
  onFarmClick,
  showFarms = true
}: MapComponentProps) {
  const defaultCenter: [number, number] = [0.3476, 32.5825];
  const [mapType, setMapType] = useState<'m' | 's' | 'y'>('m'); // m: roadmap, s: satellite

  return (
    <div style={{ height: '100%', width: '100%' }} className="leaflet-container-wrapper relative group">
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
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
        }
        .leaflet-tile {
          filter: brightness(0.9) contrast(1.1);
        }
        .leaflet-container {
          background: #061412 !important;
        }
      `}</style>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setMapType(mapType === 'm' ? 's' : 'm')}
          className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[10px] font-bold uppercase shadow-xl transition-all active:scale-95 hover:bg-black/80"
          title="Toggle Map Type"
        >
          {mapType === 'm' ? 'Sat' : 'Map'}
        </button>
      </div>

      <MapContainer
        center={currentPosition || defaultCenter}
        zoom={14}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={mapType}
          attribution='&copy; Google Maps'
          url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
        />
        
        <MapEvents onMapClick={onMapClick} />

        {/* User / Driver Position */}
        {currentPosition && (
          <>
            <Marker position={currentPosition} icon={createPulsingIcon('#FF9800')} zIndexOffset={1000} />
            <RecenterAutomatically position={currentPosition} />
          </>
        )}

        {/* Farm Markers */}
        {showFarms && farmMarkers.map((m, i) => (
          m.isConfidential ? (
            <Circle 
              key={`farm-circle-${i}`} 
              center={[m.position.lat, m.position.lng]} 
              radius={800} 
              pathOptions={{ fillColor: m.color, color: m.color, fillOpacity: 0.15 }}
              eventHandlers={{ click: () => onFarmClick?.(m.data) }}
            />
          ) : (
            <Marker 
              key={`farm-${i}`} 
              position={[m.position.lat, m.position.lng]} 
              icon={createDotIcon(m.color)}
              eventHandlers={{ click: () => onFarmClick?.(m.data) }}
            />
          )
        ))}

        {/* Market Markers */}
        {marketMarkers.map((m, i) => (
          <Marker 
            key={`market-${i}`} 
            position={[m.position.lat, m.position.lng]} 
            icon={createMarketIcon(m.color)}
            eventHandlers={{ click: () => onFarmClick?.(m.data) }}
          />
        ))}

        {/* Destination Position */}
        {destination && (
          <Marker position={destination} icon={userIcon} />
        )}

        {/* Route Trail */}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="rgba(46, 125, 50, 0.6)" weight={4} />
        )}

        {/* Path line from current to destination */}
        {currentPosition && destination && (
          <Polyline 
            positions={[currentPosition, destination]} 
            color="#22C55E" 
            weight={3} 
            dashArray="10, 10" 
          />
        )}
      </MapContainer>
    </div>
  );
}
