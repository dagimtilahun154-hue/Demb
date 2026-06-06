import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ExpoExtra = Record<string, string | undefined>;

const constants = Constants as typeof Constants & {
  manifest?: { extra?: ExpoExtra };
  manifest2?: { extra?: { expoClient?: { extra?: ExpoExtra } } };
};

const expoExtra =
  (constants.expoConfig?.extra as ExpoExtra | undefined) ??
  constants.manifest?.extra ??
  constants.manifest2?.extra?.expoClient?.extra ??
  {};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  expoExtra.EXPO_PUBLIC_SUPABASE_URL ||
  expoExtra.supabaseUrl ||
  '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  expoExtra.EXPO_PUBLIC_SUPABASE_KEY ||
  expoExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  expoExtra.supabaseKey ||
  expoExtra.supabaseAnonKey ||
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
