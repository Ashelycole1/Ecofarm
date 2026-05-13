-- community_posts table for EcoFarm Community Feed
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT 'Farmer',
    author_avatar TEXT,
    author_role TEXT DEFAULT 'farmer',
    content TEXT NOT NULL,
    image_url TEXT,
    post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'pest_alert', 'tip', 'market')),
    pest_severity TEXT CHECK (pest_severity IN ('low', 'medium', 'high')),
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT '{}',
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read on community_posts" ON public.community_posts;
    DROP POLICY IF EXISTS "Allow insert on community_posts" ON public.community_posts;
    DROP POLICY IF EXISTS "Allow update on community_posts" ON public.community_posts;
END $$;

-- 4. Allow everyone to read posts
CREATE POLICY "Allow public read on community_posts"
    ON public.community_posts FOR SELECT USING (true);

-- 5. Allow registered users to insert posts
CREATE POLICY "Allow insert on community_posts"
    ON public.community_posts FOR INSERT WITH CHECK (true);

-- 6. Allow post owners and anyone to update (for likes)
CREATE POLICY "Allow update on community_posts"
    ON public.community_posts FOR UPDATE USING (true);

-- 7. Create Storage bucket for community images (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'community_posts table created successfully' as status;
