import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const hasValidUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl);
const hasValidKey = supabaseAnonKey.length > 20 && !/^(your_|eyJ\.\.\.|<)/i.test(supabaseAnonKey);

export const supabase = hasValidUrl && hasValidKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!supabase;
