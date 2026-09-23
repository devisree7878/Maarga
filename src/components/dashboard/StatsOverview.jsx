import React from 'react';
import { CheckCircle2, Clock, TrendingUp, Flame, Trophy, BookOpen, Code2, ListChecks } from 'lucide-react';
import StatCard from './StatCard';
import { useApp } from '../../context/AppContext';
import { computeOverallStats } from '../../utils/statsUtils';
import { minutesToHM } from '../../utils/dateUtils';

export default function StatsOverview() {
  const { data } = useApp();
  const stats = computeOverallStats(data);

  const cards = [
    { icon: CheckCircle2, label: 'Completed Days', value: stats.completedDays, sub: `of ${stats.duration}`, color: '#10B981' },
    { icon: Clock, label: 'Remaining Days', value: stats.remaining, color: '#3B82F6' },
    { icon: TrendingUp, label: 'Overall Progress', value: `${stats.progressPct.toFixed(1)}%`, color: '#6366F1' },
    { icon: Flame, label: 'Current Streak', value: stats.currentStreak, sub: 'days', color: '#F97316' },
    { icon: Trophy, label: 'Longest Streak', value: stats.longestStreak, sub: 'days', color: '#F59E0B' },
    { icon: BookOpen, label: 'Study Hours', value: minutesToHM(stats.totalStudyMinutes), color: '#06B6D4' },
    { icon: Code2, label: 'Problems Solved', value: stats.totalProblems, color: '#EC4899' },
    { icon: ListChecks, label: 'Tasks Completed', value: stats.tasksCompleted, sub: `of ${stats.tasksTotal}`, color: '#8B5CF6' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accentColor={c.color} />
      ))}
    </div>
  );
}
