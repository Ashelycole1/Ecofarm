import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Insert a batch of coordinates to Supabase
export const syncCoordinates = async (
  coords: { trip_id: string; lat: number; lng: number; timestamp: number }[]
): Promise<{ error: any }> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing env variables. Buffering offline only.');
    return { error: null };
  }
  const { error } = await supabase.from('coordinates').insert(coords);
  return { error };
};
