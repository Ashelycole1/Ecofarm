"use client";

import { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Farm, EcoMarket } from '@/lib/db';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

// ── Pulsing Truck Marker (SafeBoda Orange) ─────────────────────────────────
const TruckMarker = () => (
  <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <style>{`
      @keyframes truck-pulse {
        0%   { transform: scale(0.6); opacity: 0.8; }
        70%  { transform: scale(2.0); opacity: 0; }
        100% { transform: scale(0.6); opacity: 0; }
      }
      .truck-pulse-ring {
        position: absolute;
        width: 36px;
        height: 36px;
        background: rgba(255, 152, 0, 0.35);
        border-radius: 50%;
        animation: truck-pulse 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      }
      .truck-dot {
        width: 14px;
        height: 14px;
        background: #FF9800;
        border: 2.5px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(255,152,0,0.7);
        z-index: 2;
        position: relative;
      }
    `}</style>
    <div className="truck-pulse-ring" />
    <div className="truck-dot" />
  </div>
);

// ── Google Blue Dot User Marker ───────────────────────────────────────────
const UserDotMarker = () => (
  <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <style>{`
      @keyframes user-pulse {
        0%   { transform: scale(0.3); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .user-pulse-ring {
        position: absolute;
        width: 44px;
        height: 44px;
        background: rgba(66, 133, 244, 0.25);
        border-radius: 50%;
        animation: user-pulse 2s ease-out infinite;
      }
      .user-blue-dot {
        width: 16px;
        height: 16px;
        background: #4285F4;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(66,133,244,0.5);
        z-index: 2;
        position: relative;
      }
    `}</style>
    <div className="user-pulse-ring" />
    <div className="user-blue-dot" />
  </div>
);

// ── Color Dot Farm Marker ────────────────────────────────────────────────────
const ColorDotMarker = ({ color }: { color: string }) => (
  <div style={{
    width: 16, height: 16, borderRadius: '50%',
    background: color,
    border: '2.5px solid rgba(255,255,255,0.9)',
    boxShadow: `0 2px 8px ${color}80, 0 0 0 3px ${color}25`,
    cursor: 'pointer',
    transition: 'transform 0.15s',
  }} />
);

// ── Market Pin Marker ─────────────────────────────────────────────────────────
const MarketPinMarker = ({ color }: { color: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{
      width: 20, height: 20, borderRadius: '50% 50% 50% 0',
      background: color, transform: 'rotate(-45deg)',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: `0 3px 10px ${color}80`,
      cursor: 'pointer',
    }} />
  </div>
);

// ── Polyline Renderer (uses Maps API directly) ────────────────────────────
interface PolylineProps {
  path: google.maps.LatLngLiteral[];
  color: string;
  weight?: number;
  dashed?: boolean;
}

function GooglePolyline({ path, color, weight = 4, dashed = false }: PolylineProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    if (!polylineRef.current) {
      polylineRef.current = new mapsLib.Polyline({
        map,
        path,
        strokeColor: color,
        strokeWeight: weight,
        strokeOpacity: dashed ? 0 : 0.85,
        icons: dashed
          ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, scale: 3 }, offset: '0', repeat: '12px' }]
          : undefined,
      });
    } else {
      polylineRef.current.setPath(path);
      polylineRef.current.setOptions({ strokeColor: color });
    }

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapsLib, JSON.stringify(path), color]);

  return null;
}

// ── Circle Renderer (for Confidential Locations) ──────────────────────────
interface CircleProps {
  center: google.maps.LatLngLiteral;
  radius: number;
  color: string;
  onClick?: () => void;
}

function GoogleCircle({ center, radius, color, onClick }: CircleProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (!circleRef.current) {
      circleRef.current = new mapsLib.Circle({
        map,
        center,
        radius,
        fillColor: color,
        fillOpacity: 0.15,
        strokeColor: color,
        strokeOpacity: 0.4,
        strokeWeight: 2,
      });
      google.maps.event.addListener(circleRef.current, 'click', () => {
        onClickRef.current?.();
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setOptions({ fillColor: color, strokeColor: color });
    }

    return () => {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    };
  }, [map, mapsLib, center.lat, center.lng, radius, color]);

  return null;
}

// ── Map Click Handler ──────────────────────────────────────────────────────
interface MapClickHandlerProps {
  onMapClick?: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onMapClick) return;
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, onMapClick]);
  return null;
}

// ── Auto-Recenter ──────────────────────────────────────────────────────────
function AutoRecenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && position) {
      map.panTo({ lat: position[0], lng: position[1] });
    }
  }, [map, position]);
  return null;
}

// ── Main MapComponent ──────────────────────────────────────────────────────
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
  routeCoordinates: [number, number][];
  destination?: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
  farmMarkers?: FarmMarkerData[];
  marketMarkers?: FarmMarkerData[];
  onFarmClick?: (item: Farm | EcoMarket) => void;
}

function InnerMap({ currentPosition, routeCoordinates, destination, onMapClick, farmMarkers = [], marketMarkers = [], onFarmClick }: MapComponentProps) {
  const routePath: google.maps.LatLngLiteral[] = routeCoordinates.map(([lat, lng]) => ({ lat, lng }));
  const destLatLng = destination ? { lat: destination[0], lng: destination[1] } : null;
  const currLatLng = currentPosition ? { lat: currentPosition[0], lng: currentPosition[1] } : null;
  const dashedPath = currLatLng && destLatLng ? [currLatLng, destLatLng] : [];
  // Use green for farm-to-market routes, orange for delivery
  const routeColor = farmMarkers.length > 0 ? 'rgba(34,197,94,0.8)' : 'rgba(255,152,0,0.7)';
  const dashColor  = farmMarkers.length > 0 ? '#22C55E' : '#FF9800';

  return (
    <>
      <AutoRecenter position={currentPosition} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Route trail */}
      {routePath.length > 1 && (
        <GooglePolyline path={routePath} color={routeColor} weight={4} />
      )}

      {/* Dashed line from current → destination */}
      {dashedPath.length === 2 && (
        <GooglePolyline path={dashedPath} color={dashColor} weight={3} dashed />
      )}

      {/* Farm markers (color-coded by crop category) */}
      {farmMarkers.map((m, i) => (
        m.isConfidential ? (
          <GoogleCircle 
            key={`farm-circle-${i}`} 
            center={m.position} 
            radius={800} 
            color={m.color} 
            onClick={() => onFarmClick?.(m.data)} 
          />
        ) : (
          <AdvancedMarker key={`farm-${i}`} position={m.position} onClick={() => onFarmClick?.(m.data)}>
            <ColorDotMarker color={m.color} />
          </AdvancedMarker>
        )
      ))}

      {/* Market / eco-buyer markers */}
      {marketMarkers.map((m, i) => (
        <AdvancedMarker key={`market-${i}`} position={m.position} onClick={() => onFarmClick?.(m.data)}>
          <MarketPinMarker color={m.color} />
        </AdvancedMarker>
      ))}

      {/* Truck / Farmer position */}
      {currentPosition && (
        <AdvancedMarker position={{ lat: currentPosition[0], lng: currentPosition[1] }}>
          <TruckMarker />
        </AdvancedMarker>
      )}

      {/* Destination (user home / buyer location) */}
      {destination && (
        <AdvancedMarker position={{ lat: destination[0], lng: destination[1] }}>
          <UserDotMarker />
        </AdvancedMarker>
      )}
    </>
  );
}

export default function MapComponent(props: MapComponentProps) {
  const { currentPosition } = props;
  const defaultCenter = { lat: 0.3476, lng: 32.5825 }; // Kampala, Uganda
  const center = currentPosition
    ? { lat: currentPosition[0], lng: currentPosition[1] }
    : defaultCenter;

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map Type Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setMapTypeId(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            letterSpacing: '0.04em',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {mapTypeId === 'roadmap' ? 'Sat' : 'Map'}
        </button>
      </div>

      <APIProvider apiKey={API_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={center}
          defaultZoom={15}
          mapTypeId={mapTypeId}
          disableDefaultUI={false}
          gestureHandling="greedy"
          style={{ height: '100%', width: '100%' }}
          styles={[
            { elementType: 'geometry', stylers: [{ color: '#0d2422' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8a9aaa' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0d2422' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3f3c' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d2422' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d665f' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#061412' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d9087' }] },
            { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#163230' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3e3a' }] },
            { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d665f' }] },
          ]}
        >
          <InnerMap {...props} />
        </Map>
      </APIProvider>
    </div>
  );
}
