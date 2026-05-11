"use client";
// Diagnostic comment for commit test


import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Circle, Popup, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Map as MapIcon, Layers, Info, Plus, Maximize2, Minimize2 } from 'lucide-react';

import type { Farm, EcoMarket } from '@/lib/db';
import EcofarmReportForm from './EcofarmReportForm';

// ── Icons & Markers ─────────────────────────────────────────────────────────

// Pulsing marker for deliveries (SafeBoda Orange)
const createPulsingIcon = (color: string) => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
    html: `<div class="marker-pulse" style="background-color: ${color}; --pulse-color: ${color}b3"></div>`,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};


// User location dot (Google Style Blue dot)
const getUserIcon = () => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
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
};

// Generic Farm/Market dot
const createDotIcon = (color: string) => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
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
};

// Market Pin
const createMarketIcon = (color: string) => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
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
};

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
  onLocationFound?: (lat: number, lng: number) => void;
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

const MapLocate = ({ onLocationFound, isLocating, setIsLocating }: { 
  onLocationFound?: (lat: number, lng: number) => void;
  isLocating: boolean;
  setIsLocating: (val: boolean) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (isLocating) {
      map.locate({ setView: true, maxZoom: 16 });
    }
  }, [isLocating, map]);

  useMapEvents({
    locationfound(e) {
      setIsLocating(false);
      if (onLocationFound) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      }
    },
    locationerror() {
      setIsLocating(false);
    }
  });

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
  onLocationFound,
  farmMarkers = [],
  marketMarkers = [],
  onFarmClick,
  showFarms = true,
  heatmapPoints = [],
  showHeatmap = false
}: MapComponentProps) {

  const defaultCenter: [number, number] = [0.3476, 32.5825];
  const [tileSource, setTileSource] = useState<'eco' | 'sat'>('eco');
  const [mode, setMode] = useState<'day' | 'night'>('day');
  const [isLocating, setIsLocating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLocateMe = () => {
    setIsLocating(true);
  };

  // Auto-locate on first load
  useEffect(() => {
    setIsLocating(true);
  }, []);

  const handleToggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ height: '100%', width: '100%' }} 
      className={`leaflet-container-wrapper relative group ${isFullScreen ? 'bg-[#061412]' : ''}`}
    >
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
          filter: ${mode === 'night' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'brightness(0.9) contrast(1.1)'};
        }
        .leaflet-container {
          background: #061412 !important;
        }
      `}</style>

      {showReportModal && (
        <EcofarmReportForm 
          onClose={() => setShowReportModal(false)} 
          userPos={currentPosition}
        />
      )}

      {/* Map Type Indicator */}
      <div className="absolute bottom-24 left-4 z-[1000] pointer-events-none">
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
          <span className="text-[10px] font-black text-wheat uppercase tracking-widest">
            {tileSource === 'eco' ? '🌿 Eco Intelligence' : '🛰️ Satellite View'}
            {mode === 'night' ? ' · 🌙 Night Mode' : ''}
          </span>
        </div>
      </div>

      <MapContainer
        center={currentPosition || defaultCenter}
        zoom={14}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        {/* Controls Overlay moved inside MapContainer context */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none">
          <div className="flex flex-col gap-1 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
            <button 
              onClick={() => setTileSource('eco')}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                tileSource === 'eco' ? 'bg-forest text-white border border-white/20' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <span className="text-xs">🌿</span>
              <span className="text-[7px] font-black uppercase mt-0.5">Eco</span>
            </button>
            <button 
              onClick={() => setTileSource('sat')}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                tileSource === 'sat' ? 'bg-forest text-white border border-white/20' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <span className="text-xs">🛰️</span>
              <span className="text-[7px] font-black uppercase mt-0.5">Sat</span>
            </button>
            <div className="h-px bg-white/10 mx-2 my-0.5" />
            <button 
              onClick={() => setMode('day')}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                mode === 'day' ? 'bg-forest text-white border border-white/20' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <span className="text-xs">☀️</span>
              <span className="text-[7px] font-black uppercase mt-0.5">Day</span>
            </button>
            <button 
              onClick={() => setMode('night')}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                mode === 'night' ? 'bg-forest text-white border border-white/20' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <span className="text-xs">🌙</span>
              <span className="text-[7px] font-black uppercase mt-0.5">Night</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 pointer-events-auto">
            <button 
              onClick={() => setShowReportModal(true)}
              className="w-10 h-10 rounded-xl bg-forest border border-white/20 flex flex-col items-center justify-center text-wheat shadow-xl transition-all active:scale-95 hover:bg-forest-light"
              title="Report Update"
            >
              <Plus size={18} />
              <span className="text-[6px] font-black uppercase">Report</span>
            </button>

            <button 
              onClick={handleToggleFullScreen}
              className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all active:scale-95 hover:bg-black/80"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button 
              onClick={handleLocateMe}
              className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all active:scale-95 hover:bg-black/80"
              title="My Location"
            >
              <LocateFixed size={18} className={isLocating ? 'animate-pulse text-leaf' : ''} />
            </button>

            <ZoomControl />
          </div>
        </div>
        <TileLayer
          key={`${tileSource}-${mode}`}
          attribution='&copy; CartoDB'
          url={tileSource === 'sat' 
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`}
        />
        
        <ScaleControl position="bottomleft" />
        
        <MapEvents onMapClick={onMapClick} />
        <MapLocate onLocationFound={onLocationFound} isLocating={isLocating} setIsLocating={setIsLocating} />

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
          <Marker position={destination} icon={getUserIcon()} />
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
