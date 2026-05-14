-- community_comments table for EcoFarm Community Feed
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT 'Farmer',
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read on community_comments" ON public.community_comments;
    DROP POLICY IF EXISTS "Allow insert on community_comments" ON public.community_comments;
END $$;

-- 4. Allow everyone to read comments
CREATE POLICY "Allow public read on community_comments"
    ON public.community_comments FOR SELECT USING (true);

-- 5. Allow registered users to insert comments
CREATE POLICY "Allow insert on community_comments"
    ON public.community_comments FOR INSERT WITH CHECK (true);

-- 6. Trigger to update comments_count on community_posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.community_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.community_posts
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_post_comments_count ON public.community_comments;
CREATE TRIGGER tr_update_post_comments_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;

SELECT 'community_comments table and trigger created successfully' as status;
