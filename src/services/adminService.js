
import { supabase } from '../lib/supabaseClient';
const ADMIN_EMAIL = 'devisreeadmin@gmail.com';

/**
 * Verify that the logged-in user is the ELEVORA administrator.
 */
export async function verifyAdmin() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error('Unable to verify administrator.');
  }

  if (!user) {
    throw new Error('Please log in first.');
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error('Access denied. Administrator account required.');
  }

  return user;
}

/**
 * Load statistics for the admin dashboard.
 */
export async function fetchAdminStats() {
  await verifyAdmin();

  // -----------------------------
  // DATE CALCULATIONS
  // -----------------------------

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);
  monthStart.setHours(0, 0, 0, 0);

  // -----------------------------
  // TOTAL REGISTERED USERS
  // -----------------------------

  const {
    count: totalUsers,
    error: usersError,
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    });

  if (usersError) {
    throw new Error(
      `Could not load users: ${usersError.message}`
    );
  }

  // -----------------------------
  // ACTIVE TODAY
  // -----------------------------

  const {
    count: activeToday,
    error: todayError,
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .gte('last_active_at', todayStart.toISOString());

  if (todayError) {
    throw new Error(
      `Could not load today's activity: ${todayError.message}`
    );
  }

  // -----------------------------
  // ACTIVE THIS WEEK
  // -----------------------------

  const {
    count: activeThisWeek,
    error: weekError,
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .gte('last_active_at', weekStart.toISOString());

  if (weekError) {
    throw new Error(
      `Could not load weekly activity: ${weekError.message}`
    );
  }

  // -----------------------------
  // ACTIVE THIS MONTH
  // -----------------------------

  const {
    count: activeThisMonth,
    error: monthError,
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .gte('last_active_at', monthStart.toISOString());

  if (monthError) {
    throw new Error(
      `Could not load monthly activity: ${monthError.message}`
    );
  }

  // -----------------------------
  // COMPLETED TASKS
  // -----------------------------

  let tasksCompleted = 0;

  const {
    count: completedTasks,
    error: tasksError,
  } = await supabase
    .from('tasks')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('completed', true);

  if (!tasksError) {
    tasksCompleted = completedTasks || 0;
  }

  // -----------------------------
  // GAME SESSIONS
  // -----------------------------

  let gamesPlayed = 0;
  let gameSessions = [];

  const {
    data: games,
    error: gamesError,
  } = await supabase
    .from('game_sessions')
    .select('game_type, created_at');

  if (!gamesError && games) {
    gameSessions = games;
    gamesPlayed = games.length;
  }

  // -----------------------------
  // GAMES BY TYPE
  // -----------------------------

  const gameTypeMap = {};

  gameSessions.forEach((game) => {
    const type = game.game_type || 'Unknown';

    gameTypeMap[type] =
      (gameTypeMap[type] || 0) + 1;
  });

  // -----------------------------
  // REGISTRATIONS — LAST 30 DAYS
  // -----------------------------

  const {
    data: registrationUsers,
    error: registrationError,
  } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', monthStart.toISOString())
    .order('created_at', {
      ascending: true,
    });

  if (registrationError) {
    throw new Error(
      `Could not load registration statistics: ${registrationError.message}`
    );
  }

  const registrationsMap = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    registrationsMap[key] = 0;
  }

  (registrationUsers || []).forEach((user) => {
    const key = new Date(user.created_at)
      .toISOString()
      .slice(0, 10);

    if (registrationsMap[key] !== undefined) {
      registrationsMap[key]++;
    }
  });

  const registrationsLast30Days =
    Object.entries(registrationsMap).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

  // -----------------------------
  // ACTIVE USERS — LAST 30 DAYS
  // -----------------------------

  const {
    data: activeUsersData,
    error: activeUsersError,
  } = await supabase
    .from('profiles')
    .select('id, last_active_at')
    .gte(
      'last_active_at',
      monthStart.toISOString()
    )
    .not('last_active_at', 'is', null);

  if (activeUsersError) {
    throw new Error(
      `Could not load activity statistics: ${activeUsersError.message}`
    );
  }

  const activeUsersMap = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    activeUsersMap[key] = new Set();
  }

  (activeUsersData || []).forEach((user) => {
    if (!user.last_active_at) return;

    const key = new Date(user.last_active_at)
      .toISOString()
      .slice(0, 10);

    if (activeUsersMap[key]) {
      activeUsersMap[key].add(user.id);
    }
  });

  const activeUsersLast30Days =
    Object.entries(activeUsersMap).map(
      ([date, users]) => ({
        date,
        count: users.size,
      })
    );

  // -----------------------------
  // RETURN DATA
  // -----------------------------

  return {
    total_users: totalUsers || 0,

    active_today: activeToday || 0,

    active_this_week: activeThisWeek || 0,

    active_this_month: activeThisMonth || 0,

    tasks_completed: tasksCompleted,

    games_played: gamesPlayed,

    game_sessions_by_type: gameTypeMap,

    registrations_last_30_days:
      registrationsLast30Days,

    active_users_last_30_days:
      activeUsersLast30Days,
  };
}