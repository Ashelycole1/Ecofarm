"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Circle, Popup, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Map as MapIcon, Layers, Info } from 'lucide-react';

import type { Farm, EcoMarket } from '@/lib/db';

// ── Icons & Markers ─────────────────────────────────────────────────────────

// Pulsing marker for deliveries (SafeBoda Orange)
const createPulsingIcon = (color: string) => L.divIcon({
  html: `<div class="marker-pulse" style="background-color: ${color}; --pulse-color: ${color}b3"></div>`,
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


export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0 to 1
  color?: string;
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
  heatmapPoints?: HeatmapPoint[];
  showHeatmap?: boolean;
}


// ── Helpers ─────────────────────────────────────────────────────────────────

const RecenterAutomatically = ({ position, zoom }: { position: [number, number] | null; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      if (zoom) {
        map.setView(position, zoom, { animate: true });
      } else {
        map.panTo(position);
      }
    }
  }, [position, map, zoom]);
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

// ── Custom Controls ──────────────────────────────────────────────────────────
const ZoomControl = () => {
  const map = useMap();
  return (
    <div className="flex flex-col gap-1">
      <button 
        onClick={() => map.zoomIn()}
        className="w-10 h-10 rounded-t-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all active:scale-95"
      >
        <span className="text-xl font-bold">+</span>
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-10 h-10 rounded-b-xl bg-black/60 backdrop-blur-md border border-white/20 border-t-0 flex items-center justify-center text-white hover:bg-black/80 transition-all active:scale-95"
      >
        <span className="text-xl font-bold">−</span>
      </button>
    </div>
  );
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
  showFarms = true,
  heatmapPoints = [],
  showHeatmap = false
}: MapComponentProps) {

  const defaultCenter: [number, number] = [0.3476, 32.5825];
  const [mapType, setMapType] = useState<'m' | 's' | 'y' | 'p' | 'h'>('m'); // m: roadmap, s: satellite, y: hybrid, p: terrain, h: roads only
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // In a real app we'd update currentPosition via a callback, 
        // but here we just center the map as a temporary visual aid if prop isn't set
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

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
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 var(--pulse-color, rgba(46, 125, 50, 0.7)); }
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
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
        <div className="flex flex-col gap-1 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
          {[
            { id: 'm', label: 'Road', icon: '🗺️' },
            { id: 's', label: 'Sat', icon: '🛰️' },
            { id: 'y', label: 'Hyb', icon: '🌍' },
            { id: 'p', label: 'Ter', icon: '🏔️' },
          ].map((type) => (
            <button 
              key={type.id}
              onClick={() => setMapType(type.id as any)}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                mapType === type.id 
                ? 'bg-forest text-white border border-white/20' 
                : 'text-white/40 hover:bg-white/5'
              }`}
              title={type.label}
            >
              <span className="text-xs">{type.icon}</span>
              <span className="text-[7px] font-black uppercase mt-0.5">{type.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleLocateMe}
          className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all active:scale-95 hover:bg-black/80"
          title="My Location"
        >
          <LocateFixed size={18} className={isLocating ? 'animate-pulse text-leaf' : ''} />
        </button>

        <ZoomControl />
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
        
        <ScaleControl position="bottomleft" />
        
        <MapEvents onMapClick={onMapClick} />

        {/* Heatmap Overlay */}
        {showHeatmap && heatmapPoints.map((p, i) => (
          <Circle 
            key={`heat-${i}`}
            center={[p.lat, p.lng]}
            radius={1200}
            pathOptions={{
              fillColor: p.color || '#22C55E',
              fillOpacity: p.intensity * 0.3,
              color: 'transparent',
              stroke: false
            }}
          />
        ))}

        {/* User / Driver Position */}

        {currentPosition && (
          <>
            <Marker position={currentPosition} icon={createPulsingIcon('#FF9800')} zIndexOffset={1000}>
              <Popup className="custom-popup">
                <div className="p-1 font-bold text-xs">Your Location</div>
              </Popup>
            </Marker>
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
            >
              <Popup>
                <div className="p-1">
                  <p className="font-black text-xs text-forest">{m.label}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Confidential Location</p>
                </div>
              </Popup>
            </Circle>
          ) : (
            <Marker 
              key={`farm-${i}`} 
              position={[m.position.lat, m.position.lng]} 
              icon={createDotIcon(m.color)}
              eventHandlers={{ click: () => onFarmClick?.(m.data) }}
            >
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <p className="font-black text-sm text-forest">{m.label}</p>
                  {'cropType' in m.data && (
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                      🌾 {m.data.cropType}
                    </p>
                  )}
                  <button 
                    onClick={() => onFarmClick?.(m.data)}
                    className="mt-2 w-full py-1.5 bg-forest text-white text-[9px] font-black uppercase rounded-lg"
                  >
                    View Intelligence
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Market Markers */}
        {marketMarkers.map((m, i) => (
          <Marker 
            key={`market-${i}`} 
            position={[m.position.lat, m.position.lng]} 
            icon={createMarketIcon(m.color)}
            eventHandlers={{ click: () => onFarmClick?.(m.data) }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-black text-sm text-blue-600">{m.label}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">🏬 Eco Market</p>
              </div>
            </Popup>
          </Marker>
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
