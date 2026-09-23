import { isoFromDate, todayISO } from '../data/schema';

export { todayISO };

export function dateForDay(startDateISO, dayNumber) {
  const [y, m, d] = startDateISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setDate(start.getDate() + (dayNumber - 1));
  return start;
}

export function isoForDay(startDateISO, dayNumber) {
  return isoFromDate(dateForDay(startDateISO, dayNumber));
}

export function formatShort(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatLong(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatWeekday(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

// Returns the day number (1-indexed) whose computed date matches today,
// clamped into [1, duration]. Used to highlight "today" on the calendar.
export function currentDayNumber(startDateISO, duration) {
  const [y, m, d] = startDateISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), duration);
}

export function isPastOrToday(dateISO) {
  return dateISO <= todayISO();
}

export function minutesToHM(mins) {
  const m = Math.round(mins || 0);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export function formatTime(dateStr, format24 = true) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: format24 !== 24 && format24 !== true });
}
