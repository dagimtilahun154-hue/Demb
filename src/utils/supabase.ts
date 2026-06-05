import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const isServerRender = typeof window === 'undefined';

export const hasSupabaseConfig =
  Boolean(supabaseUrl && supabaseKey) &&
  !supabaseKey.includes('<') &&
  !supabaseKey.toLowerCase().includes('replace');

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: isServerRender ? undefined : AsyncStorage,
        autoRefreshToken: !isServerRender,
        persistSession: !isServerRender,
        detectSessionInUrl: false,
      },
    })
  : null;
