import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Lazily create client only when both env vars are present
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// Helper: Insert a batch of coordinates to Supabase
export const syncCoordinates = async (
  coords: { trip_id: string; lat: number; lng: number; timestamp: number }[]
): Promise<{ error: Error | null }> => {
  const client = getSupabase();
  if (!client) {
    console.warn('[Supabase] Missing env variables. Buffering offline only.');
    return { error: null };
  }
  const { error } = await client.from('coordinates').insert(coords);
  return { error };
};
