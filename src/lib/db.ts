import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
  synced: boolean;
}

interface EcoTrackDB extends DBSchema {
  trips: {
    key: string;
    value: Trip;
  };
  coordinates: {
    key: number;
    value: Coordinate;
    indexes: { 'by-trip': string };
  };
}

let dbPromise: Promise<IDBPDatabase<EcoTrackDB>> | null = null;

export const getDB = () => {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<EcoTrackDB>('eco-track-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('trips')) {
          db.createObjectStore('trips', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('coordinates')) {
          const coordStore = db.createObjectStore('coordinates', { keyPath: 'id', autoIncrement: true });
          coordStore.createIndex('by-trip', 'tripId');
        }
      },
    });
  }
  return dbPromise;
};

export const startTrip = async (farmerId: string): Promise<Trip> => {
  const db = await getDB();
  if (!db) throw new Error('DB not available');

  const trip: Trip = {
    id: crypto.randomUUID(),
    farmerId,
    startTime: Date.now(),
    status: 'in-progress',
  };

  await db.add('trips', trip);
  return trip;
};

export const endTrip = async (tripId: string): Promise<Trip | undefined> => {
  const db = await getDB();
  if (!db) return;

  const trip = await db.get('trips', tripId);
  if (trip) {
    trip.endTime = Date.now();
    trip.status = 'completed';
    await db.put('trips', trip);
  }
  return trip;
};

export const addCoordinate = async (coord: Omit<Coordinate, 'id' | 'synced'>): Promise<void> => {
  const db = await getDB();
  if (!db) return;

  await db.add('coordinates', { ...coord, synced: false });
};

export const getTripCoordinates = async (tripId: string): Promise<Coordinate[]> => {
  const db = await getDB();
  if (!db) return [];

  return db.getAllFromIndex('coordinates', 'by-trip', tripId);
};
