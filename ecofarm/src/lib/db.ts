import Dexie, { type EntityTable } from 'dexie';

// ── Existing Types ─────────────────────────────────────────────────────────────
export interface Trip {
  id: string;
  farmerId: string;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed';
}

export interface Coordinate {
  id?: number;
  tripId: string;
  lat: number;
  lng: number;
  timestamp: number;
  synced: 0 | 1;
}

// ── New GIS & Intelligence Types ───────────────────────────────────────────────
export type CropCategory = 'leafy' | 'grain' | 'root' | 'cash' | 'legume' | 'fruit';
export type TrustTier = 'high' | 'verified' | 'pending' | 'unverified';
export type AIReportTag = 'Healthy' | 'Pest Risk' | 'Irrigation Needed' | 'Analyzing...';

export interface Farm {
  id: string;
  farmerId: string;
  name: string;
  lat: number;
  lng: number;
  cropType: string;
  cropCategory: CropCategory;
  plotSizeHa: number;
  is_certified_organic: boolean;
  trust_tier: TrustTier;
  sustainability_score: number;   // 0–100
  audited_by?: string;
  last_audit?: string;
  phone?: string;
}

export interface EcoMarket {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'eco_buyer' | 'market' | 'cooperative';
  accepts_organic: boolean;
  description?: string;
}

export interface SoilReport {
  id?: number;
  farmId: string;
  ph: number;                  // 3.5–8.5
  moisture: number;            // 0–100 %
  nitrogen: number;            // 0–100 ppm approx
  rainfall_mm: number;
  notes: string;
  timestamp: number;
  synced: 0 | 1;
  aiTag?: AIReportTag;
  aiAdvice?: string;
  language?: string;
}

export interface MarketPrice {
  id?: number;
  cropId: string;
  cropName: string;
  pricePerKg: number;          // UGX
  marketName: string;
  timestamp: number;
  synced: 0 | 1;
}

// ── Dexie Database ─────────────────────────────────────────────────────────────
class EcoFarmDB extends Dexie {
  trips!: EntityTable<Trip, 'id'>;
  coordinates!: EntityTable<Coordinate, 'id'>;
  farms!: EntityTable<Farm, 'id'>;
  ecoMarkets!: EntityTable<EcoMarket, 'id'>;
  soilReports!: EntityTable<SoilReport, 'id'>;
  marketPrices!: EntityTable<MarketPrice, 'id'>;

  constructor() {
    super('eco-farm-db');

    // v1: original trip tracking
    this.version(1).stores({
      trips: 'id, status',
      coordinates: '++id, tripId, synced',
    });

    // v2: GIS intelligence layer (additive, no data loss)
    this.version(2).stores({
      trips: 'id, status',
      coordinates: '++id, tripId, synced',
      farms: 'id, farmerId, cropCategory, trust_tier',
      ecoMarkets: 'id, type, accepts_organic',
      soilReports: '++id, farmId, synced, aiTag',
      marketPrices: '++id, cropId, synced',
    });
  }
}

export const db = typeof window !== 'undefined' ? new EcoFarmDB() : null;

// ── Trip Operations ────────────────────────────────────────────────────────────
export const startTrip = async (farmerId: string): Promise<Trip> => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const trip: Trip = {
    id: uuid,
    farmerId,
    startTime: Date.now(),
    status: 'in-progress',
  };
  await db?.trips.add(trip);
  return trip;
};

export const endTrip = async (tripId: string): Promise<Trip | undefined> => {
  const trip = await db?.trips.get(tripId);
  if (trip) {
    trip.endTime = Date.now();
    trip.status = 'completed';
    await db?.trips.put(trip);
  }
  return trip;
};

export const addCoordinate = async (
  coord: Omit<Coordinate, 'id' | 'synced'>
): Promise<void> => {
  await db?.coordinates.add({ ...coord, synced: 0 });
};

export const getUnsyncedCoordinates = async (): Promise<Coordinate[]> => {
  // Dexie indexes work best with numbers (0/1) instead of booleans
  return (await db?.coordinates.where('synced').equals(0).toArray()) ?? [];
};

export const markCoordinatesSynced = async (ids: (number | undefined)[]): Promise<void> => {
  const validIds = ids.filter((id): id is number => id !== undefined);
  if (validIds.length === 0) return;
  await db?.coordinates.where('id').anyOf(validIds).modify({ synced: 1 });
};

export const getTripCoordinates = async (tripId: string): Promise<Coordinate[]> => {
  return (await db?.coordinates.where('tripId').equals(tripId).toArray()) ?? [];
};

// ── Farm Operations ────────────────────────────────────────────────────────────
export const seedFarms = async (farms: Farm[]): Promise<void> => {
  const existing = await db?.farms.count();
  if (!existing) await db?.farms.bulkAdd(farms);
};

export const getAllFarms = async (): Promise<Farm[]> => {
  return (await db?.farms.toArray()) ?? [];
};

export const seedMarkets = async (markets: EcoMarket[]): Promise<void> => {
  const existing = await db?.ecoMarkets.count();
  if (!existing) await db?.ecoMarkets.bulkAdd(markets);
};

export const getAllMarkets = async (): Promise<EcoMarket[]> => {
  return (await db?.ecoMarkets.toArray()) ?? [];
};

// ── Soil Report Operations ─────────────────────────────────────────────────────
export const addSoilReport = async (
  report: Omit<SoilReport, 'id' | 'synced'>
): Promise<number> => {
  return (await db?.soilReports.add({ ...report, synced: 0 })) as number;
};

export const updateSoilReportTag = async (
  id: number,
  aiTag: AIReportTag,
  aiAdvice: string
): Promise<void> => {
  await db?.soilReports.update(id, { aiTag, aiAdvice });
};

export const getUnsyncedSoilReports = async (): Promise<SoilReport[]> => {
  return (await db?.soilReports.where('synced').equals(0).toArray()) ?? [];
};

export const markSoilReportsSynced = async (ids: number[]): Promise<void> => {
  await db?.soilReports.where('id').anyOf(ids).modify({ synced: 1 });
};

export const getRecentSoilReports = async (limit = 10): Promise<SoilReport[]> => {
  const all = (await db?.soilReports.orderBy('timestamp').reverse().limit(limit).toArray()) ?? [];
  return all;
};

// ── Market Price Operations ────────────────────────────────────────────────────
export const upsertMarketPrices = async (prices: Omit<MarketPrice, 'id' | 'synced'>[]): Promise<void> => {
  const toAdd = prices.map(p => ({ ...p, synced: 1 }));
  await db?.marketPrices.bulkAdd(toAdd as MarketPrice[]).catch(() => {}); // ignore duplicates
};

export const getLatestMarketPrices = async (): Promise<MarketPrice[]> => {
  return (await db?.marketPrices.orderBy('timestamp').reverse().toArray()) ?? [];
};
