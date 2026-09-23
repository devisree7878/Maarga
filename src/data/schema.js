// Central data schema + factory functions for ELEVORA
// This file defines the shape of everything persisted to localStorage.

export const DURATION = 120;

export const ACCENTS = {
  indigo: { name: 'Indigo', accent: '99 102 241', accent2: '129 140 248' },
  violet: { name: 'Violet', accent: '168 85 247', accent2: '192 132 252' },
  teal: { name: 'Teal', accent: '20 184 166', accent2: '45 212 191' },
  rose: { name: 'Rose', accent: '244 63 94', accent2: '251 113 133' },
  amber: { name: 'Amber', accent: '245 158 11', accent2: '251 191 36' },
  blue: { name: 'Blue', accent: '59 130 246', accent2: '96 165 250' },
  emerald: { name: 'Emerald', accent: '16 185 129', accent2: '52 211 153' },
};

export const CATEGORY_ICONS = [
  'Code2', 'Braces', 'ListChecks', 'FolderKanban', 'Brain', 'RotateCcw',
  'Calculator', 'Network', 'FileText', 'MessageSquare', 'Briefcase', 'User',
  'BookOpen', 'Target', 'Layers', 'Terminal', 'Database', 'Cpu',
];

export const CATEGORY_COLORS = [
  '#6366F1', '#F97316', '#EF4444', '#10B981', '#8B5CF6', '#06B6D4',
  '#F59E0B', '#EC4899', '#14B8A6', '#84CC16', '#3B82F6', '#F43F5E',
];

export function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return isoFromDate(d);
}

export function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function defaultCategories() {
  return [
    { id: genId('cat'), name: 'Java', color: '#F97316', icon: 'Braces', order: 0, active: true },
    { id: genId('cat'), name: 'DSA', color: '#6366F1', icon: 'Network', order: 1, active: true },
    { id: genId('cat'), name: 'LeetCode', color: '#F59E0B', icon: 'Code2', order: 2, active: true },
    { id: genId('cat'), name: 'Project', color: '#10B981', icon: 'FolderKanban', order: 3, active: true },
    { id: genId('cat'), name: 'CS Fundamentals', color: '#06B6D4', icon: 'Cpu', order: 4, active: true },
    { id: genId('cat'), name: 'Revision', color: '#8B5CF6', icon: 'RotateCcw', order: 5, active: true },
  ];
}

export function defaultSettings(duration = DURATION) {
  return {
    theme: 'dark',
    accent: 'indigo',
    startDate: todayISO(),
    duration,
    timeFormat: 24,
    notifications: false,
  };
}

export function defaultDays(duration = DURATION) {
  const days = {};
  for (let i = 1; i <= duration; i++) {
    days[i] = {
      day: i,
      status: 'not_started', // not_started | in_progress | completed | missed
      completedAt: null,
      missedAt: null,
      missedReason: '',
      notes: '',
    };
  }
  return days;
}

// Resizes an existing days map to a new duration, keeping every day's
// existing status/history where the day number still fits, and adding
// fresh "not_started" days for any newly-added range. Used when a user
// changes their schedule duration in Settings (ELEVORA supports dynamic
// schedules of any length, not just a fixed 120 days).
export function resizeDays(days, newDuration) {
  const next = {};
  for (let i = 1; i <= newDuration; i++) {
    next[i] = days[i] || {
      day: i,
      status: 'not_started',
      completedAt: null,
      missedAt: null,
      missedReason: '',
      notes: '',
    };
  }
  return next;
}

// `duration` is the user's chosen schedule length (ELEVORA lets each user
// pick 10/20/30/60/90/120/180/365 days during onboarding) — this is never
// hardcoded to 120 anymore.
export function createDefaultData(duration = DURATION) {
  return {
    meta: { version: 1, createdAt: new Date().toISOString() },
    settings: defaultSettings(duration),
    categories: defaultCategories(),
    days: defaultDays(duration),
    tasks: [],
    studyLogs: [],
    problems: [],
    mistakes: [],
    goals: [],
  };
}

// Blank templates used by forms
export function blankTask(dayNumber, categoryId) {
  return {
    id: genId('task'),
    dayNumber,
    categoryId: categoryId || null,
    title: '',
    description: '',
    priority: 'Medium',
    estTime: '',
    actualTime: '',
    completed: false,
    notes: '',
    order: 0,
    createdAt: new Date().toISOString(),
  };
}

export function blankProblem(dayNumber) {
  return {
    id: genId('prob'),
    dayNumber: dayNumber || null,
    name: '',
    platform: '',
    url: '',
    difficulty: 'Medium',
    topic: '',
    date: todayISO(),
    timeTaken: '',
    attempts: 1,
    independent: true,
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

export function blankMistake(dayNumber) {
  return {
    id: genId('mistake'),
    dayNumber: dayNumber || null,
    problem: '',
    topic: '',
    date: todayISO(),
    whatWentWrong: '',
    correctApproach: '',
    missingConcept: '',
    prevention: '',
    revisitDate: '',
    status: 'Unresolved',
    createdAt: new Date().toISOString(),
  };
}

export function blankGoal() {
  return {
    id: genId('goal'),
    name: '',
    description: '',
    target: 0,
    current: 0,
    unit: 'Custom',
    deadline: '',
    color: '#6366F1',
    createdAt: new Date().toISOString(),
  };
}

export function blankStudyLog(dayNumber, categoryId) {
  return {
    id: genId('study'),
    dayNumber,
    categoryId: categoryId || null,
    minutes: 0,
    notes: '',
    createdAt: new Date().toISOString(),
  };
}
