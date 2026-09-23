import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { CheckCircle2, XCircle, Flame, Trophy, BookOpen, Code2, ListChecks, TrendingUp, Brain, Gamepad2, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  computeOverallStats, dailySeries, weeklyProductivity, categoryDistribution, heatmapData,
} from '../utils/statsUtils';
import { minutesToHM } from '../utils/dateUtils';
import { ACCENTS } from '../data/schema';
import { fetchMyGameSessions, summarizeGameSessions, GAME_TYPES } from '../services/gamesService';

const heatColor = {
  not_started: 'rgb(var(--surface-3))',
  in_progress: '#60A5FA',
  completed: '#34D399',
  missed: '#F87171',
};

function ChartCard({ title, children, height = 260 }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </Card>
  );
}

const axisColor = 'rgb(var(--text-dim))';
const gridColor = 'rgb(var(--border))';

const tooltipStyle = {
  background: 'rgb(var(--surface-2))',
  border: '1px solid rgb(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  color: 'rgb(var(--text))',
};

export default function AnalyticsPage() {
  const { data } = useApp();
  const { user } = useAuth();
  const stats = computeOverallStats(data);
  const accentHex = `rgb(${ACCENTS[data.settings.accent]?.accent || ACCENTS.indigo.accent})`;
  const accent2Hex = `rgb(${ACCENTS[data.settings.accent]?.accent2 || ACCENTS.indigo.accent2})`;

  const series = useMemo(() => dailySeries(data), [data]);
  const weekly = useMemo(() => weeklyProductivity(data), [data]);
  const categories = useMemo(() => categoryDistribution(data).filter((c) => c.minutes > 0 || c.tasks > 0), [data]);
  const heatmap = useMemo(() => heatmapData(data), [data]);
  const mistakesReviewed = data.mistakes.filter((m) => m.status !== 'Unresolved').length;

  const [gameSessions, setGameSessions] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetchMyGameSessions(user.id, 100).then((rows) => {
      if (!cancelled) {
        setGameSessions(rows);
        setGamesLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user.id]);
  const gameSummary = useMemo(() => summarizeGameSessions(gameSessions), [gameSessions]);

  const activeSeries = series.filter((d) => d.status !== 'not_started');

  const hasAnyActivity = stats.tasksTotal > 0 || stats.totalProblems > 0 || stats.totalStudyMinutes > 0 || gameSessions.length > 0;

  return (
    <div>
      <Header title="Analytics" subtitle="Real data from your own plan" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-6">
        {!hasAnyActivity && !gamesLoading && (
          <Card className="p-6 text-sm text-[rgb(var(--text-muted))] text-center">
            No activity yet. Complete your first task to start tracking your progress.
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Completed Days" value={stats.completedDays} accentColor="#10B981" />
          <StatCard icon={XCircle} label="Missed Days" value={stats.missedDays} accentColor="#EF4444" />
          <StatCard icon={Flame} label="Current Streak" value={stats.currentStreak} accentColor="#F97316" />
          <StatCard icon={Trophy} label="Longest Streak" value={stats.longestStreak} accentColor="#F59E0B" />
          <StatCard icon={BookOpen} label="Total Study" value={minutesToHM(stats.totalStudyMinutes)} accentColor="#06B6D4" />
          <StatCard icon={TrendingUp} label="Avg Hrs / Active Day" value={activeSeries.length ? minutesToHM(stats.totalStudyMinutes / Math.max(1, activeSeries.length)) : '0m'} accentColor="#6366F1" />
          <StatCard icon={Code2} label="Total Problems" value={stats.totalProblems} accentColor="#EC4899" />
          <StatCard icon={ListChecks} label="Task Completion" value={`${stats.taskCompletionRate.toFixed(0)}%`} sub={`${stats.tasksCompleted}/${stats.tasksTotal}`} accentColor="#8B5CF6" />
          <StatCard icon={Brain} label="Mistakes Reviewed" value={mistakesReviewed} sub={`of ${data.mistakes.length}`} accentColor="#F43F5E" />
          <StatCard icon={Gamepad2} label="Games Played" value={gamesLoading ? '—' : gameSummary.totalGames} accentColor="#14B8A6" />
          <StatCard icon={Trophy} label="Avg Game Score" value={gamesLoading ? '—' : `${gameSummary.averageScore}%`} accentColor="#F59E0B" />
          <StatCard icon={Trophy} label="Best Game Score" value={gamesLoading ? '—' : `${gameSummary.bestScore}%`} accentColor="#10B981" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Study Hours Over Time">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentHex} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accentHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={{ stroke: gridColor }} interval={9} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Day ${l}`} formatter={(v) => [`${v}h`, 'Study']} />
              <Area type="monotone" dataKey="studyHours" stroke={accentHex} fill="url(#studyGrad)" strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Problems Solved Over Time">
            <BarChart data={series}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={{ stroke: gridColor }} interval={9} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Day ${l}`} formatter={(v) => [v, 'Problems']} />
              <Bar dataKey="problemsSolved" fill="#EC4899" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Daily Task Completion">
            <LineChart data={series}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={{ stroke: gridColor }} interval={9} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Day ${l}`} formatter={(v) => [`${v}%`, 'Completion']} />
              <Line type="monotone" dataKey="taskCompletion" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Weekly Productivity">
            <BarChart data={weekly}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={{ stroke: gridColor }} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
              <Bar dataKey="studyHours" name="Study Hrs" fill={accentHex} radius={[3, 3, 0, 0]} />
              <Bar dataKey="problemsSolved" name="Problems" fill="#EC4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completedDays" name="Days Done" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Category Distribution (Study Time)">
            {categories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[rgb(var(--text-dim))]">Log study time to see this chart.</div>
            ) : (
              <PieChart>
                <Pie data={categories} dataKey="minutes" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {categories.map((c) => <Cell key={c.id} fill={c.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Math.round(v)}m`, 'Time']} />
                <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
              </PieChart>
            )}
          </ChartCard>

          <ChartCard title="Goal Progress">
            {data.goals.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[rgb(var(--text-dim))]">No goals yet — add one to track it here.</div>
            ) : (
              <BarChart
                layout="vertical"
                data={data.goals.map((g) => ({ name: g.name, pct: g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0, color: g.color }))}
                margin={{ left: 10 }}
              >
                <CartesianGrid stroke={gridColor} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Progress']} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {data.goals.map((g, i) => <Cell key={i} fill={g.color} />)}
                </Bar>
              </BarChart>
            )}
          </ChartCard>
        </div>

        <Card className="p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Game Performance</p>
          {gamesLoading ? (
            <div className="h-24 flex items-center justify-center text-[rgb(var(--text-dim))]"><Loader2 size={16} className="animate-spin" /></div>
          ) : gameSessions.length === 0 ? (
            <p className="text-sm text-[rgb(var(--text-muted))]">No games played yet. Play a brain game to start tracking this.</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {Object.entries(GAME_TYPES).map(([key, label]) => {
                const count = gameSummary.byType[key] || 0;
                return (
                  <div key={key} className="p-3.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))]">
                    <p className="text-xs text-[rgb(var(--text-muted))]">{label}</p>
                    <p className="text-xl font-bold text-[rgb(var(--text))] font-mono">{count}</p>
                    <p className="text-[11px] text-[rgb(var(--text-dim))]">sessions played</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Activity Heatmap</p>
          <div className="grid grid-cols-12 sm:grid-cols-[repeat(15,minmax(0,1fr))] md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5">
            {heatmap.map((d) => (
              <div
                key={d.day}
                title={`Day ${d.day} · ${d.status.replace('_', ' ')} · ${d.taskPct}% tasks · ${minutesToHM(d.minutes)}`}
                className="aspect-square rounded-md"
                style={{ background: heatColor[d.status], opacity: d.status === 'not_started' ? 0.5 : 0.35 + Math.min(0.65, (d.taskPct / 100) * 0.65 + 0.2) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[11px] text-[rgb(var(--text-dim))]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: heatColor.not_started }} /> Not started</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: heatColor.in_progress }} /> In progress</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: heatColor.completed }} /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: heatColor.missed }} /> Missed</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
