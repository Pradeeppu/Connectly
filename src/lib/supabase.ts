import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://sqespeeynplutruytjmg.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE') && 
  !supabaseAnonKey.includes('YOUR_SUPABASE')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Connectly: Supabase publishable key not detected. Set VITE_SUPABASE_PUBLISHABLE_KEY in your Vercel or .env settings.'
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
