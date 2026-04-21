"use client";

import { useEffect } from 'react';
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

const truckIcon = createPulsingIcon('#FF9800'); // SafeBoda Orange
const homeIcon = createPulsingIcon('#2D665F');  // EcoFarm Teal

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
        @keyframes pulse-ring {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
        }
      `}</style>
      <MapContainer
        center={currentPosition || defaultCenter}
        zoom={14}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={onMapClick} />

        {currentPosition && (
          <>
            <Marker position={currentPosition} icon={truckIcon} />
            <RecenterAutomatically position={currentPosition} />
          </>
        )}

        {destination && (
          <Marker position={destination} icon={homeIcon} />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="rgba(255, 152, 0, 0.4)" weight={3} dashArray="5, 10" />
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
