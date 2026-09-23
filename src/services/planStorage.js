// Per-user plan persistence, backed by Supabase (`user_plans` table, one
// row per user, protected by RLS to user_id = auth.uid()).
//
// This intentionally keeps the SAME data shape the app already used with
// localStorage (see data/schema.js) so every existing component/reducer in
// AppContext.jsx keeps working untouched — only *where* the blob lives
// changed (per-browser → per-user-account, real multi-device sync, RLS).

import { supabase } from '../lib/supabaseClient';
import { createDefaultData, resizeDays } from '../data/schema';

export async function loadPlanData(userId, duration) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load plan data', error);
    return migrateAndValidate(null, duration);
  }
  return migrateAndValidate(data?.plan_data, duration);
}

export async function savePlanData(userId, planData) {
  const { error } = await supabase
    .from('user_plans')
    .upsert({ user_id: userId, plan_data: planData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) {
    console.error('Failed to save plan data', error);
    return false;
  }
  return true;
}

// Ensures older/partial/empty blobs still have every key the app expects,
// so the app never crashes on missing fields (same role the old
// localStorage `migrateAndValidate` played). `duration` (the caller's
// current source of truth — profiles.schedule_days) always wins: the days
// map is resized to exactly match it, rather than trusting whatever
// duration happens to be embedded in the stored blob. This keeps a
// just-changed schedule duration correct even if this load races with the
// debounced save that persists it (see Settings > Schedule).
function migrateAndValidate(data, duration) {
  const fallback = createDefaultData(duration);
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return fallback;
  return {
    meta: data.meta || fallback.meta,
    settings: { ...fallback.settings, ...(data.settings || {}), duration },
    categories: Array.isArray(data.categories) ? data.categories : fallback.categories,
    days: resizeDays(data.days && typeof data.days === 'object' ? data.days : {}, duration),
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    studyLogs: Array.isArray(data.studyLogs) ? data.studyLogs : [],
    problems: Array.isArray(data.problems) ? data.problems : [],
    mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
  };
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `elevora-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readImportFile(file, duration) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup file');
        resolve(migrateAndValidate(parsed, duration));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
