// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // keep session persistence and auto refresh on (recommended for browser apps)
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
