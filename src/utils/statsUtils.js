import { isoForDay } from './dateUtils';

// Day status priority helper
export function dayTaskStats(data, dayNumber) {
  const tasks = data.tasks.filter((t) => t.dayNumber === dayNumber);
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pct };
}

export function computeStreaks(data) {
  const duration = data.settings.duration;
  let current = 0;
  let longest = 0;
  let running = 0;
  let streakBroken = false;

  // Walk from day 1 to duration in order; a "completed" day extends the
  // running streak, a "missed" day breaks it, "not_started"/"in_progress"
  // (future/untouched) days don't affect it.
  for (let i = 1; i <= duration; i++) {
    const day = data.days[i];
    if (!day) continue;
    if (day.status === 'completed') {
      running += 1;
      longest = Math.max(longest, running);
    } else if (day.status === 'missed') {
      running = 0;
    }
    // in_progress / not_started: no-op, preserves running count
  }

  // Current streak = trailing run of completed days ending at the most
  // recent completed/missed day (i.e. ignore untouched trailing days).
  let lastTouched = 0;
  for (let i = 1; i <= duration; i++) {
    if (data.days[i] && (data.days[i].status === 'completed' || data.days[i].status === 'missed')) {
      lastTouched = i;
    }
  }
  let trail = 0;
  for (let i = lastTouched; i >= 1; i--) {
    const day = data.days[i];
    if (day.status === 'completed') trail += 1;
    else if (day.status === 'missed') break;
    else continue;
  }
  current = trail;

  return { current, longest };
}

export function computeOverallStats(data) {
  const duration = data.settings.duration;
  const days = Object.values(data.days);
  const completedDays = days.filter((d) => d.status === 'completed').length;
  const missedDays = days.filter((d) => d.status === 'missed').length;
  const remaining = duration - completedDays - missedDays;
  const progressPct = duration === 0 ? 0 : (completedDays / duration) * 100;

  const totalStudyMinutes = data.studyLogs.reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
  const totalProblems = data.problems.length;
  const tasksCompleted = data.tasks.filter((t) => t.completed).length;
  const tasksTotal = data.tasks.length;
  const taskCompletionRate = tasksTotal === 0 ? 0 : (tasksCompleted / tasksTotal) * 100;

  const { current, longest } = computeStreaks(data);

  return {
    duration,
    completedDays,
    missedDays,
    remaining,
    progressPct,
    totalStudyMinutes,
    totalProblems,
    tasksCompleted,
    tasksTotal,
    taskCompletionRate,
    currentStreak: current,
    longestStreak: longest,
  };
}

export function problemStats(data) {
  const problems = data.problems;
  const total = problems.length;
  const easy = problems.filter((p) => p.difficulty === 'Easy').length;
  const medium = problems.filter((p) => p.difficulty === 'Medium').length;
  const hard = problems.filter((p) => p.difficulty === 'Hard').length;
  const independent = problems.filter((p) => p.independent).length;
  const assisted = total - independent;
  return { total, easy, medium, hard, independent, assisted };
}

export function studyStats(data) {
  const logs = data.studyLogs;
  const totalMinutes = logs.reduce((s, l) => s + (Number(l.minutes) || 0), 0);
  const byDay = {};
  logs.forEach((l) => {
    byDay[l.dayNumber] = (byDay[l.dayNumber] || 0) + Number(l.minutes || 0);
  });
  const daysWithStudy = Object.keys(byDay).length;
  const avgPerActiveDay = daysWithStudy === 0 ? 0 : totalMinutes / daysWithStudy;

  const now = new Date();
  const startISO = data.settings.startDate;
  let weekMinutes = 0;
  let monthMinutes = 0;
  logs.forEach((l) => {
    const iso = isoForDay(startISO, l.dayNumber);
    const d = new Date(iso);
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7 && diffDays >= 0) weekMinutes += Number(l.minutes || 0);
    if (diffDays <= 30 && diffDays >= 0) monthMinutes += Number(l.minutes || 0);
  });

  return { totalMinutes, weekMinutes, monthMinutes, avgPerActiveDay, daysWithStudy };
}

export function categoryDistribution(data) {
  const map = {};
  data.categories.forEach((c) => { map[c.id] = { ...c, minutes: 0, tasks: 0 }; });
  data.studyLogs.forEach((l) => {
    if (map[l.categoryId]) map[l.categoryId].minutes += Number(l.minutes || 0);
  });
  data.tasks.forEach((t) => {
    if (map[t.categoryId]) map[t.categoryId].tasks += 1;
  });
  return Object.values(map);
}

// Per-day time series across the whole challenge, used for line/bar charts.
export function dailySeries(data) {
  const duration = data.settings.duration;
  const series = [];
  for (let i = 1; i <= duration; i++) {
    const studyMinutes = data.studyLogs.filter((l) => l.dayNumber === i).reduce((s, l) => s + Number(l.minutes || 0), 0);
    const problemsSolved = data.problems.filter((p) => p.dayNumber === i).length;
    const stats = dayTaskStats(data, i);
    series.push({ day: i, studyMinutes, studyHours: +(studyMinutes / 60).toFixed(2), problemsSolved, taskCompletion: stats.pct, status: data.days[i].status });
  }
  return series;
}

// Groups the daily series into 7-day weekly buckets for a productivity view.
export function weeklyProductivity(data) {
  const series = dailySeries(data);
  const weeks = [];
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7);
    const weekNum = Math.floor(i / 7) + 1;
    const studyMinutes = chunk.reduce((s, d) => s + d.studyMinutes, 0);
    const problemsSolved = chunk.reduce((s, d) => s + d.problemsSolved, 0);
    const completedDays = chunk.filter((d) => d.status === 'completed').length;
    weeks.push({ week: `W${weekNum}`, studyHours: +(studyMinutes / 60).toFixed(1), problemsSolved, completedDays });
  }
  return weeks;
}

export function heatmapData(data) {
  const duration = data.settings.duration;
  const result = [];
  for (let i = 1; i <= duration; i++) {
    const day = data.days[i];
    const stats = dayTaskStats(data, i);
    const minutes = data.studyLogs.filter((l) => l.dayNumber === i).reduce((s, l) => s + Number(l.minutes || 0), 0);
    result.push({ day: i, status: day.status, taskPct: stats.pct, minutes });
  }
  return result;
}
