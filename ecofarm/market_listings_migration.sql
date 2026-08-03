-- market_listings table for EcoFarm Premium Marketplace
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL DEFAULT 'Farmer',
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Grains',
    price_ugx NUMERIC NOT NULL,
    unit TEXT DEFAULT 'KG',
    stock_amount NUMERIC NOT NULL,
    stock_unit TEXT DEFAULT 'Tons',
    status_badge TEXT DEFAULT 'Harvest Ready',
    grade_or_type TEXT DEFAULT 'Grade A Organic',
    description TEXT NOT NULL,
    image_url TEXT,
    whatsapp_contact TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read on market_listings" ON public.market_listings;
    DROP POLICY IF EXISTS "Allow insert on market_listings" ON public.market_listings;
    DROP POLICY IF EXISTS "Allow update on market_listings" ON public.market_listings;
END $$;

-- 4. Allow everyone to read listings
CREATE POLICY "Allow public read on market_listings"
    ON public.market_listings FOR SELECT USING (true);

-- 5. Allow registered users to insert listings
CREATE POLICY "Allow insert on market_listings"
    ON public.market_listings FOR INSERT WITH CHECK (true);

-- 6. Allow listing owners to update
CREATE POLICY "Allow update on market_listings"
    ON public.market_listings FOR UPDATE USING (true);

-- 7. Create Storage bucket for market images (if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('market-images', 'market-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'market_listings table created successfully' as status;
