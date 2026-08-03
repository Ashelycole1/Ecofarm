-- EcoFarm COMPLETE Supabase Schema (Re-runnable)

-- 1. Profiles (Linked to Clerk User IDs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Clerk User ID
    full_name TEXT,
    email TEXT,
    phone_number TEXT,
    role TEXT CHECK (role IN ('farmer', 'buyer', 'delivery')),
    trust_tier TEXT DEFAULT 'pending',
    sustainability_score INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pest Alerts (Aggregated view)
CREATE TABLE IF NOT EXISTS public.pest_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pest_type_id TEXT NOT NULL,
    crop_id TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
    report_count INTEGER DEFAULT 1,
    last_reported TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Detailed Pest Reports
CREATE TABLE IF NOT EXISTS public.pest_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    pest_type_id TEXT NOT NULL,
    crop_id TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
    notes TEXT,
    image_url TEXT, -- For AI analysis persistence
    ai_diagnosis JSONB, -- Stores the JSON from Gemini analysis
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Soil Health Reports
CREATE TABLE IF NOT EXISTS public.soil_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    farm_id TEXT,
    ph_level NUMERIC,
    moisture_pct NUMERIC,
    nitrogen_level NUMERIC,
    ai_advice TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Planting Schedules (Saved Plans)
CREATE TABLE IF NOT EXISTS public.planting_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    crop_name TEXT NOT NULL,
    region TEXT NOT NULL,
    schedule_data JSONB NOT NULL, -- Stores the full 4-crop AI JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Logistics Tracking (Trips & Coords)
CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    farmer_id TEXT,
    status TEXT DEFAULT 'in-progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coordinates (
    id BIGSERIAL PRIMARY KEY,
    trip_id TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Village Elder Chat Persistence
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    text TEXT NOT NULL,
    sender TEXT CHECK (sender IN ('user', 'elder')),
    language TEXT DEFAULT 'English',
    metadata JSONB, -- Stores AI brief and icons
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── SECURITY POLICIES (RLS) ──────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES TO AVOID "ALREADY EXISTS" ERRORS
DO $$ 
BEGIN
    -- Drop select policies
    DROP POLICY IF EXISTS "Allow public read on everything" ON public.profiles;
    DROP POLICY IF EXISTS "Allow public read on pest_alerts" ON public.pest_alerts;
    DROP POLICY IF EXISTS "Allow public read on pest_reports" ON public.pest_reports;
    DROP POLICY IF EXISTS "Allow public read on soil_reports" ON public.soil_reports;
    DROP POLICY IF EXISTS "Allow public read on planting_schedules" ON public.planting_schedules;
    DROP POLICY IF EXISTS "Allow public read on trips" ON public.trips;
    DROP POLICY IF EXISTS "Allow public read on coordinates" ON public.coordinates;
    DROP POLICY IF EXISTS "Allow public read on chat_messages" ON public.chat_messages;

    -- Drop insert policies
    DROP POLICY IF EXISTS "Allow insert on all" ON public.profiles;
    DROP POLICY IF EXISTS "Allow insert on pest_reports" ON public.pest_reports;
    DROP POLICY IF EXISTS "Allow insert on soil_reports" ON public.soil_reports;
    DROP POLICY IF EXISTS "Allow insert on planting_schedules" ON public.planting_schedules;
    DROP POLICY IF EXISTS "Allow insert on trips" ON public.trips;
    DROP POLICY IF EXISTS "Allow insert on coordinates" ON public.coordinates;
    DROP POLICY IF EXISTS "Allow insert on chat_messages" ON public.chat_messages;
END $$;

-- RE-CREATE POLICIES
CREATE POLICY "Allow public read on everything" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read on pest_alerts" ON public.pest_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read on pest_reports" ON public.pest_reports FOR SELECT USING (true);
CREATE POLICY "Allow public read on soil_reports" ON public.soil_reports FOR SELECT USING (true);
CREATE POLICY "Allow public read on planting_schedules" ON public.planting_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read on trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public read on coordinates" ON public.coordinates FOR SELECT USING (true);
CREATE POLICY "Allow public read on chat_messages" ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Allow insert on all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on pest_reports" ON public.pest_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on soil_reports" ON public.soil_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on planting_schedules" ON public.planting_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on coordinates" ON public.coordinates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
