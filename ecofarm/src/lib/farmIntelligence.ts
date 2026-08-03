import type { Farm, EcoMarket } from './db';

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  market: EcoMarket;
}

// ── Haversine Distance (km) ───────────────────────────────────────────────────
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Find Nearest Eco-Buyer ────────────────────────────────────────────────────
export function findNearestEcoBuyer(
  userLat: number,
  userLng: number,
  markets: EcoMarket[]
): EcoMarket & { distanceKm: number } {
  const ranked = markets
    .filter(m => m.accepts_organic)
    .map(m => ({
      ...m,
      distanceKm: haversineDistance(userLat, userLng, m.lat, m.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return ranked[0];
}

// ── Rank All Markets by Distance ──────────────────────────────────────────────
export function rankMarketsByDistance(
  userLat: number,
  userLng: number,
  markets: EcoMarket[]
): Array<EcoMarket & { distanceKm: number }> {
  return markets
    .map(m => ({
      ...m,
      distanceKm: haversineDistance(userLat, userLng, m.lat, m.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Rank Farms by Distance ────────────────────────────────────────────────────
export function rankFarmsByDistance(
  userLat: number,
  userLng: number,
  farms: Farm[]
): Array<Farm & { distanceKm: number }> {
  return farms
    .map(f => ({
      ...f,
      distanceKm: haversineDistance(userLat, userLng, f.lat, f.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Get Route via OSRM (free, no billing needed) ──────────────────────────────
export async function getProximityRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<{ distanceKm: number; durationMin: number; polyline: [number, number][] }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) throw new Error('No route found');

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    return {
      distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
      durationMin: Math.round(route.duration / 60),
      polyline: coords,
    };
  } catch {
    // Fallback: straight line if OSRM is unavailable
    const dist = haversineDistance(originLat, originLng, destLat, destLng);
    return {
      distanceKm: parseFloat(dist.toFixed(1)),
      durationMin: Math.round((dist / 30) * 60), // ~30km/h avg
      polyline: [[originLat, originLng], [destLat, destLng]],
    };
  }
}

// ── Crop Category Color ────────────────────────────────────────────────────────
export function getCropCategoryColor(category: string): string {
  const map: Record<string, string> = {
    leafy:  '#22C55E',
    grain:  '#EAB308',
    root:   '#F97316',
    cash:   '#A855F7',
    legume: '#3B82F6',
    fruit:  '#EC4899',
  };
  return map[category] ?? '#6B7280';
}

// ── ETA String ────────────────────────────────────────────────────────────────
export function formatETA(durationMin: number): string {
  if (durationMin < 60) return `${durationMin} min`;
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
