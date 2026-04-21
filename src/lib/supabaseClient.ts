import { createClient, SupabaseClient } from '@supabase/supabase-js';

// FALLBACK CREDENTIALS (Added by all means necessary for Vercel deployment)
const FALLBACK_URL = 'https://iucvpwciggxwnmhrqpdi.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Y3Zwd2NpZ2d4d25taHJxcGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTM0OTMsImV4cCI6MjA5MjM2OTQ5M30.JKTt2jaKqvqjnI8c9XlKdRRFAs8D766nDxCJUkpwHa0';

const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;
  return { url, key };
};

let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (_supabase) return _supabase;
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
};

// For backward compatibility
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

export const syncCoordinates = async (
  coords: { trip_id: string; lat: number; lng: number; timestamp: number }[]
): Promise<{ error: any }> => {
  const client = getSupabase();
  if (!client) {
    console.warn('[Supabase] Missing configuration.');
    return { error: null };
  }
  const { error } = await client.from('coordinates').insert(coords);
  return { error };
};
