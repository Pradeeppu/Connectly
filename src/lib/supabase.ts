import { createClient } from '@supabase/supabase-js';

const PROD_SUPABASE_URL = 'https://sqespeeynplutruytjmg.supabase.co';
const PROD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXNwZWV5bnBsdXRydXl0am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NTU0NDAsImV4cCI6MjExMDIzMTQ0MH0.O8sgF1ZhskfRglV7WIWloC9vHMhJEyMA_p12O24Hg5o';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  PROD_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  PROD_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE') && 
  !supabaseAnonKey.includes('YOUR_SUPABASE')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Connectly: Supabase credentials not found or using placeholder. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
  );
}

// Fallback dummy URL to allow client instantiation without immediate throw if missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-connectly.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
