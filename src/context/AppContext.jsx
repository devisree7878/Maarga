import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadPlanData, savePlanData, exportData as exportDataFile, readImportFile } from '../services/planStorage';
import { genId, blankTask, blankProblem, blankMistake, blankGoal, blankStudyLog, ACCENTS, resizeDays, createDefaultData } from '../data/schema';

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

function dayHasActivity(data, dayNumber) {
  return (
    data.tasks.some((t) => t.dayNumber === dayNumber) ||
    data.studyLogs.some((l) => l.dayNumber === dayNumber) ||
    data.problems.some((p) => p.dayNumber === dayNumber)
  );
}

function touchDay(data, dayNumber) {
  const day = data.days[dayNumber];
  if (!day) return data;
  if (day.status === 'completed' || day.status === 'missed') return data;
  const hasActivity = dayHasActivity(data, dayNumber);
  const nextStatus = hasActivity ? 'in_progress' : 'not_started';
  if (nextStatus === day.status) return data;
  return { ...data, days: { ...data.days, [dayNumber]: { ...day, status: nextStatus } } };
}

function reducer(data, action) {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;

    case 'UPDATE_SETTINGS':
      return { ...data, settings: { ...data.settings, ...action.payload } };

    case 'SET_START_DATE':
      return { ...data, settings: { ...data.settings, startDate: action.payload } };

    case 'SET_DURATION': {
      const duration = action.payload;
      if (duration === data.settings.duration) return data;
      return { ...data, settings: { ...data.settings, duration }, days: resizeDays(data.days, duration) };
    }

    // ---------- Categories ----------
    case 'ADD_CATEGORY': {
      const order = data.categories.length;
      const cat = { id: genId('cat'), order, active: true, ...action.payload };
      return { ...data, categories: [...data.categories, cat] };
    }
    case 'UPDATE_CATEGORY': {
      const { id, changes } = action.payload;
      return { ...data, categories: data.categories.map((c) => (c.id === id ? { ...c, ...changes } : c)) };
    }
    case 'REORDER_CATEGORIES': {
      return { ...data, categories: action.payload.map((c, i) => ({ ...c, order: i })) };
    }
    case 'DELETE_CATEGORY': {
      const { id, mode, targetCategoryId } = action.payload; // mode: 'move' | 'uncategorize'
      const categories = data.categories.filter((c) => c.id !== id);
      const remap = (item) => {
        if (item.categoryId !== id) return item;
        return { ...item, categoryId: mode === 'move' ? targetCategoryId : null };
      };
      return {
        ...data,
        categories,
        tasks: data.tasks.map(remap),
        studyLogs: data.studyLogs.map(remap),
      };
    }

    // ---------- Tasks ----------
    case 'ADD_TASK': {
      const { dayNumber, categoryId } = action.payload;
      const orderCount = data.tasks.filter((t) => t.dayNumber === dayNumber).length;
      const task = { ...blankTask(dayNumber, categoryId), ...action.payload, order: orderCount };
      const next = { ...data, tasks: [...data.tasks, task] };
      return touchDay(next, dayNumber);
    }
    case 'UPDATE_TASK': {
      const { id, changes } = action.payload;
      return { ...data, tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)) };
    }
    case 'DELETE_TASK': {
      const task = data.tasks.find((t) => t.id === action.payload);
      const next = { ...data, tasks: data.tasks.filter((t) => t.id !== action.payload) };
      return task ? touchDay(next, task.dayNumber) : next;
    }
    case 'TOGGLE_TASK': {
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.id === action.payload ? { ...t, completed: !t.completed } : t)),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = data.tasks.find((t) => t.id === action.payload);
      if (!task) return data;
      const orderCount = data.tasks.filter((t) => t.dayNumber === task.dayNumber).length;
      const copy = { ...task, id: genId('task'), title: `${task.title} (copy)`, completed: false, order: orderCount, createdAt: new Date().toISOString() };
      return { ...data, tasks: [...data.tasks, copy] };
    }
    case 'MOVE_TASK': {
      const { id, dayNumber, categoryId } = action.payload;
      const task = data.tasks.find((t) => t.id === id);
      const fromDay = task ? task.dayNumber : null;
      let next = {
        ...data,
        tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...(dayNumber !== undefined ? { dayNumber } : {}), ...(categoryId !== undefined ? { categoryId } : {}) } : t)),
      };
      if (dayNumber !== undefined && fromDay !== null && fromDay !== dayNumber) {
        next = touchDay(next, fromDay);
        next = touchDay(next, dayNumber);
      }
      return next;
    }
    case 'REORDER_TASKS': {
      // payload: { dayNumber, orderedIds }
      const { dayNumber, orderedIds } = action.payload;
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.dayNumber === dayNumber && orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t)),
      };
    }

    // ---------- Study Logs ----------
    case 'ADD_STUDY_LOG': {
      const log = { ...blankStudyLog(action.payload.dayNumber, action.payload.categoryId), ...action.payload };
      const next = { ...data, studyLogs: [...data.studyLogs, log] };
      return touchDay(next, log.dayNumber);
    }
    case 'UPDATE_STUDY_LOG': {
      const { id, changes } = action.payload;
      return { ...data, studyLogs: data.studyLogs.map((l) => (l.id === id ? { ...l, ...changes } : l)) };
    }
    case 'DELETE_STUDY_LOG': {
      const log = data.studyLogs.find((l) => l.id === action.payload);
      const next = { ...data, studyLogs: data.studyLogs.filter((l) => l.id !== action.payload) };
      return log ? touchDay(next, log.dayNumber) : next;
    }

    // ---------- Problems ----------
    case 'ADD_PROBLEM': {
      const problem = { ...blankProblem(action.payload.dayNumber), ...action.payload };
      let next = { ...data, problems: [...data.problems, problem] };
      if (problem.dayNumber) next = touchDay(next, problem.dayNumber);
      return next;
    }
    case 'UPDATE_PROBLEM': {
      const { id, changes } = action.payload;
      return { ...data, problems: data.problems.map((p) => (p.id === id ? { ...p, ...changes } : p)) };
    }
    case 'DELETE_PROBLEM': {
      return { ...data, problems: data.problems.filter((p) => p.id !== action.payload) };
    }

    // ---------- Mistakes ----------
    case 'ADD_MISTAKE': {
      const mistake = { ...blankMistake(action.payload.dayNumber), ...action.payload };
      return { ...data, mistakes: [...data.mistakes, mistake] };
    }
    case 'UPDATE_MISTAKE': {
      const { id, changes } = action.payload;
      return { ...data, mistakes: data.mistakes.map((m) => (m.id === id ? { ...m, ...changes } : m)) };
    }
    case 'DELETE_MISTAKE': {
      return { ...data, mistakes: data.mistakes.filter((m) => m.id !== action.payload) };
    }

    // ---------- Goals ----------
    case 'ADD_GOAL': {
      const goal = { ...blankGoal(), ...action.payload };
      return { ...data, goals: [...data.goals, goal] };
    }
    case 'UPDATE_GOAL': {
      const { id, changes } = action.payload;
      return { ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)) };
    }
    case 'DELETE_GOAL': {
      return { ...data, goals: data.goals.filter((g) => g.id !== action.payload) };
    }

    // ---------- Days ----------
    case 'UPDATE_DAY_NOTES': {
      const { dayNumber, notes } = action.payload;
      return { ...data, days: { ...data.days, [dayNumber]: { ...data.days[dayNumber], notes } } };
    }
    case 'COMPLETE_DAY': {
      const dayNumber = action.payload;
      const day = data.days[dayNumber];
      return {
        ...data,
        days: {
          ...data.days,
          [dayNumber]: { ...day, status: 'completed', completedAt: new Date().toISOString(), missedAt: null, missedReason: '' },
        },
      };
    }
    case 'MARK_DAY_MISSED': {
      const { dayNumber, reason } = action.payload;
      const day = data.days[dayNumber];
      return {
        ...data,
        days: {
          ...data.days,
          [dayNumber]: { ...day, status: 'missed', missedAt: new Date().toISOString(), missedReason: reason || '', completedAt: null },
        },
      };
    }
    case 'REOPEN_DAY': {
      const dayNumber = action.payload;
      const day = data.days[dayNumber];
      const hasActivity = dayHasActivity(data, dayNumber);
      return {
        ...data,
        days: {
          ...data.days,
          [dayNumber]: { ...day, status: hasActivity ? 'in_progress' : 'not_started', completedAt: null, missedAt: null, missedReason: '' },
        },
      };
    }

    // ---------- Data management ----------
    case 'IMPORT_DATA':
      return action.payload;
    case 'RESET_DATA':
      return action.payload;

    default:
      return data;
  }
}

// AppProvider now persists per-user, in Supabase (`user_plans`, RLS'd to
// auth.uid()), rather than a single shared localStorage blob. It is mounted
// beneath the auth + onboarding gates in App.jsx, so `userId` and
// `initialDuration` (the user's chosen schedule_days) are always present.
export function AppProvider({ userId, initialDuration, children }) {
  const [data, dispatch] = useReducer(reducer, null);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    skipNextSave.current = true;

    loadPlanData(userId, initialDuration).then((loaded) => {
      if (cancelled) return;
      dispatch({ type: 'SET_DATA', payload: loaded });
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, initialDuration]);

  useEffect(() => {
    if (!ready || !data) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Debounce writes so rapid edits (typing, toggling) don't hammer the DB.
    saveTimer.current = setTimeout(() => {
      savePlanData(userId, data);
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [data, ready, userId]);

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    if (data.settings.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [data?.settings.theme]);

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    const accent = ACCENTS[data.settings.accent] || ACCENTS.indigo;
    root.style.setProperty('--accent', accent.accent);
    root.style.setProperty('--accent-2', accent.accent2);
  }, [data?.settings.accent]);

  const value = useMemo(() => data, [data]);

  if (!ready || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--accent))] animate-spin" />
      </div>
    );
  }

  return (
    <AppStateContext.Provider value={value}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

// High-level action creators bundled into a single hook for ergonomic use
// across components, e.g. const { addTask, completeDay } = useApp();
export function useApp() {
  const data = useAppState();
  const dispatch = useAppDispatch();

  return {
    data,
    dispatch,
    updateSettings: (changes) => dispatch({ type: 'UPDATE_SETTINGS', payload: changes }),
    setStartDate: (iso) => dispatch({ type: 'SET_START_DATE', payload: iso }),
    setDuration: (duration) => dispatch({ type: 'SET_DURATION', payload: duration }),

    addCategory: (payload) => dispatch({ type: 'ADD_CATEGORY', payload }),
    updateCategory: (id, changes) => dispatch({ type: 'UPDATE_CATEGORY', payload: { id, changes } }),
    reorderCategories: (list) => dispatch({ type: 'REORDER_CATEGORIES', payload: list }),
    deleteCategory: (id, mode, targetCategoryId) => dispatch({ type: 'DELETE_CATEGORY', payload: { id, mode, targetCategoryId } }),

    addTask: (payload) => dispatch({ type: 'ADD_TASK', payload }),
    updateTask: (id, changes) => dispatch({ type: 'UPDATE_TASK', payload: { id, changes } }),
    deleteTask: (id) => dispatch({ type: 'DELETE_TASK', payload: id }),
    toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', payload: id }),
    duplicateTask: (id) => dispatch({ type: 'DUPLICATE_TASK', payload: id }),
    moveTask: (id, dayNumber, categoryId) => dispatch({ type: 'MOVE_TASK', payload: { id, dayNumber, categoryId } }),
    reorderTasks: (dayNumber, orderedIds) => dispatch({ type: 'REORDER_TASKS', payload: { dayNumber, orderedIds } }),

    addStudyLog: (payload) => dispatch({ type: 'ADD_STUDY_LOG', payload }),
    updateStudyLog: (id, changes) => dispatch({ type: 'UPDATE_STUDY_LOG', payload: { id, changes } }),
    deleteStudyLog: (id) => dispatch({ type: 'DELETE_STUDY_LOG', payload: id }),

    addProblem: (payload) => dispatch({ type: 'ADD_PROBLEM', payload }),
    updateProblem: (id, changes) => dispatch({ type: 'UPDATE_PROBLEM', payload: { id, changes } }),
    deleteProblem: (id) => dispatch({ type: 'DELETE_PROBLEM', payload: id }),

    addMistake: (payload) => dispatch({ type: 'ADD_MISTAKE', payload }),
    updateMistake: (id, changes) => dispatch({ type: 'UPDATE_MISTAKE', payload: { id, changes } }),
    deleteMistake: (id) => dispatch({ type: 'DELETE_MISTAKE', payload: id }),

    addGoal: (payload) => dispatch({ type: 'ADD_GOAL', payload }),
    updateGoal: (id, changes) => dispatch({ type: 'UPDATE_GOAL', payload: { id, changes } }),
    deleteGoal: (id) => dispatch({ type: 'DELETE_GOAL', payload: id }),

    updateDayNotes: (dayNumber, notes) => dispatch({ type: 'UPDATE_DAY_NOTES', payload: { dayNumber, notes } }),
    completeDay: (dayNumber) => dispatch({ type: 'COMPLETE_DAY', payload: dayNumber }),
    markDayMissed: (dayNumber, reason) => dispatch({ type: 'MARK_DAY_MISSED', payload: { dayNumber, reason } }),
    reopenDay: (dayNumber) => dispatch({ type: 'REOPEN_DAY', payload: dayNumber }),

    exportData: () => exportDataFile(data),
    importData: async (file) => {
      const imported = await readImportFile(file, data.settings.duration);
      dispatch({ type: 'IMPORT_DATA', payload: imported });
    },
    resetAllData: () => {
      const fresh = createDefaultData(data.settings.duration);
      dispatch({ type: 'RESET_DATA', payload: fresh });
    },
  };
}
