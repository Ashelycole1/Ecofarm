import Dexie, { type EntityTable } from 'dexie';

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

class EcoTrackDB extends Dexie {
  trips!: EntityTable<Trip, 'id'>;
  coordinates!: EntityTable<Coordinate, 'id'>;

  constructor() {
    super('eco-track-db');
    this.version(1).stores({
      trips: 'id, status',
      coordinates: '++id, tripId, synced',
    });
  }
}

export const db = typeof window !== 'undefined' ? new EcoTrackDB() : null;

export const startTrip = async (farmerId: string): Promise<Trip> => {
  const trip: Trip = {
    id: crypto.randomUUID(),
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
  await db?.coordinates.add({ ...coord, synced: false });
};

export const getUnsyncedCoordinates = async (): Promise<Coordinate[]> => {
  return (await db?.coordinates.where('synced').equals(0).toArray()) ?? [];
};

export const markCoordinatesSynced = async (ids: number[]): Promise<void> => {
  await db?.coordinates.where('id').anyOf(ids).modify({ synced: true });
};

export const getTripCoordinates = async (tripId: string): Promise<Coordinate[]> => {
  return (await db?.coordinates.where('tripId').equals(tripId).toArray()) ?? [];
};
