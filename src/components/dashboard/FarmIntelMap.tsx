"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, RefreshCw, Info, X, Truck, Layers } from 'lucide-react';
import type { Farm, EcoMarket } from '@/lib/db';
import { mockFarmsGIS, mockEcoMarkets, CROP_CATEGORY_COLORS, CROP_CATEGORY_LABELS } from '@/lib/gisData';
import { findNearestEcoBuyer, getProximityRoute, rankFarmsByDistance, getCropCategoryColor, haversineDistance, formatETA } from '@/lib/farmIntelligence';
import TrustBadge from './TrustBadge';
import type { MapComponentProps } from './MapComponent';


// ── Dynamic map import (no SSR) ────────────────────────────────────────────────
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-forest/10 animate-pulse text-white/30 text-sm">
      Loading Intelligence Map...
    </div>
  ),
});

// ── Farm Popup ─────────────────────────────────────────────────────────────────
function FarmPopup({ farm, onClose, onRoute }: { farm: Farm; onClose: () => void; onRoute: (farm: Farm) => void }) {
  return (
    <div
      className="absolute bottom-6 left-4 right-4 z-[1100] animate-slide-up"
      style={{
        background: 'linear-gradient(160deg, rgba(26,62,58,0.97) 0%, rgba(6,20,18,0.99) 100%)',
        border: '1px solid rgba(61,138,129,0.3)',
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-black text-base leading-tight">{farm.name}</h3>
            <p className="text-white/40 text-[10px] uppercase font-bold mt-0.5">{farm.cropType} · {farm.plotSizeHa} ha</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <TrustBadge tier={farm.trust_tier} is_certified_organic={farm.is_certified_organic} score={farm.sustainability_score} size="sm" />

        {farm.audited_by && (
          <p className="text-white/30 text-[9px]">Audited by: <span className="text-white/50 font-bold">{farm.audited_by}</span></p>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-white/5 text-center">
            <p className="text-forest-light text-[8px] uppercase font-black">Score</p>
            <p className="text-white font-black text-sm">{farm.sustainability_score}%</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 text-center">
            <p className="text-forest-light text-[8px] uppercase font-black">Plot</p>
            <p className="text-white font-black text-sm">{farm.plotSizeHa}ha</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 text-center" style={{ background: `${getCropCategoryColor(farm.cropCategory)}18`, border: `1px solid ${getCropCategoryColor(farm.cropCategory)}40` }}>
            <p className="text-[8px] uppercase font-black" style={{ color: getCropCategoryColor(farm.cropCategory) }}>Crop</p>
            <p className="text-white font-black text-[10px]">{farm.cropType.split(' ')[0]}</p>
          </div>
        </div>

        <button
          onClick={() => onRoute(farm)}
          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2D665F 0%, #1A3E3A 100%)', color: '#F2C94C', border: '1px solid rgba(242,201,76,0.2)' }}
        >
          <Truck size={14} />
          Route to Nearest Buyer
        </button>
      </div>
    </div>
  );
}

// ── Route Info Panel ────────────────────────────────────────────────────────────
function RoutePanel({ distanceKm, durationMin, market, onClose }: {
  distanceKm: number; durationMin: number; market: EcoMarket; onClose: () => void;
}) {
  return (
    <div
      className="absolute top-4 left-4 right-16 z-[1100]"
      style={{
        background: '#F59E0B',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(245,158,11,0.4)',
      }}
    >
      <div className="p-3 flex items-center justify-between gap-3">
        <Navigation size={16} className="text-black shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-black font-black text-xs truncate">{market.name}</p>
          <p className="text-black/60 text-[9px]">{distanceKm} km · {formatETA(durationMin)}</p>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
          <X size={10} className="text-black" />
        </button>
      </div>
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────────────────────
function MapLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-6 right-4 z-[1100] p-3 rounded-2xl"
      style={{
        background: 'rgba(6,20,18,0.92)',
        border: '1px solid rgba(61,138,129,0.2)',
        backdropFilter: 'blur(16px)',
        minWidth: '140px',
      }}
    >
      <p className="text-white/40 text-[8px] uppercase font-black mb-2">Crop Types</p>
      {Object.entries(CROP_CATEGORY_LABELS).map(([cat, label]) => (
        <div key={cat} className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CROP_CATEGORY_COLORS[cat as keyof typeof CROP_CATEGORY_COLORS] }} />
          <span className="text-white/60 text-[9px]">{label}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-2 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
          <span className="text-white/60 text-[9px]">🛒 Eco Market</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────
export default function FarmIntelMap() {
  const [farms] = useState<Farm[]>(mockFarmsGIS);
  const [markets] = useState<EcoMarket[]>(mockEcoMarkets);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number; market: EcoMarket } | null>(null);
  const [nearMe, setNearMe] = useState<(EcoMarket & { distanceKm: number }) | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [locating, setLocating] = useState(false);
  const [nearMeMsg, setNearMeMsg] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Generate heatmap points from farms
  const heatmapPoints = farms.map(f => ({
    lat: f.lat,
    lng: f.lng,
    intensity: f.sustainability_score / 100,
    color: f.is_certified_organic ? '#22C55E' : '#F59E0B'
  }));


  // Filter farms by category
  const filteredFarms = mapFilter === 'all' ? farms : farms.filter(f => f.cropCategory === mapFilter);

  // Build extra markers for farms & markets to pass into MapComponent
  const farmMarkers = filteredFarms.map(f => {
    const isConfidential = f.trust_tier === 'unverified' || f.trust_tier === 'pending';
    // If confidential, we obscure the precise location slightly
    const displayLat = isConfidential ? Math.floor(f.lat * 100) / 100 : f.lat;
    const displayLng = isConfidential ? Math.floor(f.lng * 100) / 100 : f.lng;

    return {
      position: { lat: displayLat, lng: displayLng },
      color: getCropCategoryColor(f.cropCategory),
      label: f.name,
      data: f,
      type: 'farm' as const,
      isConfidential
    };
  });

  const marketMarkers = markets.map(m => ({
    position: { lat: m.lat, lng: m.lng },
    color: '#60A5FA',
    label: m.name,
    data: m,
    type: 'market' as const,
  }));


  const handleNearMe = useCallback(() => {
    setLocating(true);
    setNearMeMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos([lat, lng]);
        const nearest = findNearestEcoBuyer(lat, lng, markets);
        setNearMe(nearest);
        setNearMeMsg(`${nearest.name} — ${nearest.distanceKm.toFixed(1)} km away`);

        setLoadingRoute(true);
        const route = await getProximityRoute(lat, lng, nearest.lat, nearest.lng);
        setRouteCoords(route.polyline);
        setDestination([nearest.lat, nearest.lng]);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, market: nearest });
        setLoadingRoute(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setNearMeMsg('Could not get your location.');
      }
    );
  }, [markets]);

  const handleFarmRoute = useCallback(async (farm: Farm) => {
    if (!userPos) {
      setNearMeMsg('Tap "Near Me" first to set your location.');
      return;
    }
    setLoadingRoute(true);
    setSelectedFarm(null);
    const nearest = findNearestEcoBuyer(farm.lat, farm.lng, markets);
    const route = await getProximityRoute(farm.lat, farm.lng, nearest.lat, nearest.lng);
    setRouteCoords(route.polyline);
    setDestination([nearest.lat, nearest.lng]);
    setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, market: nearest });
    setLoadingRoute(false);
  }, [userPos, markets]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,rgba(45,102,95,0.35) 0%,rgba(13,36,34,0.80) 100%)', border: '1px solid rgba(61,138,129,0.2)' }}
      >
        <div>
          <h2 className="text-white font-display font-black text-base">Farm Intelligence Map</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
            {farms.length} Farms · {markets.length} Eco Markets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(v => !v)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${showHeatmap ? 'bg-leaf text-white border-leaf shadow-lg shadow-leaf/20' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            title="Toggle Soil Health Heatmap"
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => setShowLegend(v => !v)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-all"
            title="Map Info"
          >
            <Info size={14} />
          </button>
        </div>

      </div>

      {/* Near Me Button */}
      <button
        onClick={handleNearMe}
        disabled={locating || loadingRoute}
        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
        }}
      >
        {locating ? <RefreshCw size={16} className="animate-spin" /> : <MapPin size={16} />}
        {locating ? 'Locating You...' : '🌿 Find Nearest Eco-Buyer'}
      </button>

      {nearMeMsg && (
        <div
          className="px-4 py-2.5 rounded-xl text-sm font-bold animate-fade-in"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}
        >
          📍 {nearMeMsg}
        </div>
      )}

      {/* Map */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ height: '420px', border: '1px solid rgba(61,138,129,0.2)' }}
      >
        {/* Map Filters */}
        <div className="absolute top-3 left-3 right-3 z-[1100] flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
          <button onClick={() => setMapFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${mapFilter==='all' ? 'bg-white text-[#061412] border-white' : 'bg-[#061412]/80 text-white/60 border-white/20 backdrop-blur-sm'}`}>
            All
          </button>
          {Object.entries(CROP_CATEGORY_LABELS).map(([cat, label]) => {
            const active = mapFilter === cat;
            const col = CROP_CATEGORY_COLORS[cat as keyof typeof CROP_CATEGORY_COLORS];
            return (
              <button key={cat} onClick={() => setMapFilter(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? 'text-white border-transparent' : 'bg-[#061412]/80 text-white/60 border-white/20 backdrop-blur-sm'}`}
                style={active ? {backgroundColor: col, borderColor: col} : {}}
              >
                {label}
              </button>
            );
          })}
        </div>

        <MapComponent
          currentPosition={userPos}
          onLocationFound={(lat, lng) => setUserPos([lat, lng])}
          routeCoordinates={routeCoords}
          destination={destination}
          farmMarkers={farmMarkers}
          marketMarkers={marketMarkers}
          onFarmClick={(farm) => setSelectedFarm(farm as Farm)}
          showHeatmap={showHeatmap}
          heatmapPoints={heatmapPoints}
        />


        {/* Route info */}
        {routeInfo && (
          <RoutePanel
            distanceKm={routeInfo.distanceKm}
            durationMin={routeInfo.durationMin}
            market={routeInfo.market}
            onClose={() => { setRouteInfo(null); setRouteCoords([]); setDestination(null); }}
          />
        )}

        {/* Loading overlay */}
        {loadingRoute && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[900]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#22C55E]/30 border-t-[#22C55E] rounded-full animate-spin" />
              <p className="text-white text-xs font-bold">Calculating route...</p>
            </div>
          </div>
        )}

        {/* Farm popup */}
        {selectedFarm && (
          <FarmPopup
            farm={selectedFarm}
            onClose={() => setSelectedFarm(null)}
            onRoute={handleFarmRoute}
          />
        )}

        {/* Legend */}
        <MapLegend visible={showLegend} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'High-Trust Farms', value: farms.filter(f => f.trust_tier === 'high').length, color: '#F59E0B', icon: '🏆' },
          { label: 'Certified Organic', value: farms.filter(f => f.is_certified_organic).length, color: '#22C55E', icon: '🌿' },
          { label: 'Eco Markets', value: markets.filter(m => m.accepts_organic).length, color: '#3B82F6', icon: '🛒' },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="p-3 rounded-2xl text-center"
            style={{ background: `${color}12`, border: `1px solid ${color}30` }}
          >
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="font-black text-white text-xl">{value}</div>
            <div className="text-[9px] uppercase font-bold" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
