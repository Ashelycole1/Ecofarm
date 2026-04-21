"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js/Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  currentPosition: [number, number] | null;
  routeCoordinates: [number, number][];
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

export default function MapComponent({ currentPosition, routeCoordinates }: MapComponentProps) {
  const defaultCenter: [number, number] = [0.3476, 32.5825]; // Kampala, Uganda as default

  return (
    <MapContainer
      center={currentPosition || defaultCenter}
      zoom={14}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {currentPosition && (
        <>
          <Marker position={currentPosition} />
          <RecenterAutomatically position={currentPosition} />
        </>
      )}
      {routeCoordinates.length > 0 && (
        <Polyline positions={routeCoordinates} color="rgba(16, 185, 129, 0.8)" weight={4} />
      )}
    </MapContainer>
  );
}
