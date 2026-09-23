import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Bumps profiles.last_active_at whenever an authenticated user is actively
// using the app — once on mount/login, then every 5 minutes while the tab
// stays open. This is what the admin dashboard's "Active Today/Week/Month"
// cards are computed from (see get_admin_stats() in the SQL migration).
export function useTrackActivity() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return undefined;

    const ping = () => {
      supabase.rpc('touch_last_active').then(({ error }) => {
        if (error) console.error('touch_last_active failed', error);
      });
    };

    ping();
    const interval = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
