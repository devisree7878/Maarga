import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing (e.g. local dev without a .env yet), we still export
// a client so the app doesn't crash at import time — auth calls will simply
// fail with a clear error surfaced in the UI instead of a white screen.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Create a .env file (see .env.example).'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// The one email allowed to see the admin dashboard. Never trust the client
// for authorization decisions — this constant only drives UI. The real
// enforcement happens via the `profiles.role` column + RLS policies set by
// the migration (matched server-side to this same address).
export const ADMIN_EMAIL = 'devisreeadmin@gmail.com';
