import React from 'react';
import { Flame, Target } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { computeOverallStats } from '../../utils/statsUtils';
import { currentDayNumber } from '../../utils/dateUtils';

export default function Hero() {
  const { data } = useApp();
  const { openDay } = useUI();
  const { profile } = useAuth();
  const stats = computeOverallStats(data);
  const todayDay = currentDayNumber(data.settings.startDate, data.settings.duration);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full accent-gradient opacity-[0.08] blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          {profile?.goal && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))] mb-3">
              <Target size={15} className="accent-text" /> Goal: {profile.goal}
            </p>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgb(var(--text-dim))] mb-2">ELEVORA · Turn your goals into daily progress.</p>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-4xl md:text-5xl font-black text-[rgb(var(--text))]">DAY {todayDay}</span>
            <span className="text-xl md:text-2xl font-bold text-[rgb(var(--text-dim))]">/ {stats.duration}</span>
          </div>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-1 font-mono">{stats.completedDays} / {stats.duration} DAYS COMPLETED · {stats.progressPct.toFixed(2)}%</p>
        </div>

        <button
          onClick={() => openDay(todayDay)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl accent-bg text-white text-sm font-semibold hover:brightness-110 transition-all shadow-glow self-start md:self-auto"
        >
          Open Today's Plan
        </button>
      </div>

      <div className="relative mt-6">
        <ProgressBar value={stats.progressPct} height="h-3" />
        <div className="flex items-center justify-between mt-2 text-xs text-[rgb(var(--text-muted))] font-mono">
          <span>{stats.remaining} DAYS REMAINING</span>
          <span className="flex items-center gap-1 text-orange-400 font-semibold">
            <Flame size={13} className="fill-orange-400/30" /> {stats.currentStreak} DAY STREAK
          </span>
        </div>
      </div>
    </div>
  );
}
