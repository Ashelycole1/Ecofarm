-- =======================================================
-- 1. Enable PostGIS Extension
-- =======================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =======================================================
-- 2. Create Drivers Table
-- =======================================================
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL,
    rating NUMERIC(2,1) DEFAULT 5.0,
    is_available BOOLEAN DEFAULT true,
    location GEOGRAPHY(POINT, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Optional: Create a spatial index for faster distance queries
CREATE INDEX IF NOT EXISTS drivers_location_gix
  ON public.drivers USING GIST (location);

-- =======================================================
-- 3. Seed Mock Drivers in Uganda (Kampala & Luwero)
-- =======================================================
INSERT INTO public.drivers (name, vehicle_type, vehicle_plate, rating, is_available, location)
VALUES
('Kato Emmanuel', 'Toyota Dyna', 'UBB 123A', 4.9, true, ST_GeogFromText('SRID=4326;POINT(32.5825 0.3476)')),
('Mukasa John', 'Boda Boda', 'UEX 999F', 4.7, true, ST_GeogFromText('SRID=4326;POINT(32.5850 0.3500)')),
('Nakato Sarah', 'Isuzu Elf', 'UCD 456B', 4.8, true, ST_GeogFromText('SRID=4326;POINT(32.4000 0.8500)')), -- Luwero area
('Opio Peter', 'Tractor', 'UAA 111A', 4.5, true, ST_GeogFromText('SRID=4326;POINT(32.5900 0.3400)'))
ON CONFLICT DO NOTHING;

-- =======================================================
-- 4. Create Matchmaking RPC (Remote Procedure Call)
-- =======================================================
CREATE OR REPLACE FUNCTION public.find_nearest_driver(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 50000 -- 50km default search radius
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    rating NUMERIC,
    dist_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.vehicle_type,
        d.vehicle_plate,
        d.rating,
        -- Calculate distance in meters using PostGIS ST_Distance
        ST_Distance(d.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS dist_meters
    FROM public.drivers d
    WHERE d.is_available = true
      -- Ensure driver is within the radius
      AND ST_DWithin(d.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY dist_meters ASC
    LIMIT 1; -- Return only the single nearest driver
END;
$$;
