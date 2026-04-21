import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  };
};

let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (_supabase) return _supabase;
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
};

// For backward compatibility with existing imports
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

export const syncCoordinates = async (
  coords: { trip_id: string; lat: number; lng: number; timestamp: number }[]
): Promise<{ error: any }> => {
  const client = getSupabase();
  if (!client) {
    console.warn('[Supabase] Missing env variables. Buffering offline only.');
    return { error: null };
  }
  const { error } = await client.from('coordinates').insert(coords);
  return { error };
};
