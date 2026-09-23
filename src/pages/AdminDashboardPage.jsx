import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, CheckCircle2, Gamepad2, Loader2, ShieldAlert } from 'lucide-react';
import Card from '../components/ui/Card';
import { fetchAdminStats } from '../services/adminService';

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2 text-[rgb(var(--text-muted))]">
        <Icon size={15} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-black text-[rgb(var(--text))] font-mono">{value}</p>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message || 'Could not load admin statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <Loader2 size={22} className="animate-spin text-[rgb(var(--text-dim))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert size={26} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm text-[rgb(var(--text))] font-medium mb-1">Couldn't load admin stats</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">{error}</p>
        </Card>
      </div>
    );
  }

  const registrations = (stats.registrations_last_30_days || []).map((r) => ({ date: r.date.slice(5), count: r.count }));
  const activeUsers = (stats.active_users_last_30_days || []).map((r) => ({ date: r.date.slice(5), count: r.count }));
  const byType = Object.entries(stats.game_sessions_by_type || {}).map(([type, count]) => ({ type, count }));

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[rgb(var(--text))]">Admin Dashboard</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">Platform-wide statistics — visible only to the ELEVORA administrator</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Users" value={stats.total_users} />
          <StatCard icon={UserCheck} label="Active Today" value={stats.active_today} />
          <StatCard icon={UserCheck} label="Active This Week" value={stats.active_this_week} />
          <StatCard icon={UserCheck} label="Active This Month" value={stats.active_this_month} />
          <StatCard icon={CheckCircle2} label="Tasks Completed" value={stats.tasks_completed} />
          <StatCard icon={Gamepad2} label="Games Played" value={stats.games_played} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-4 md:p-5">
            <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">New Registrations (30 days)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-soft))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 md:p-5">
            <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Daily Active Users (30 days)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activeUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-soft))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Games by Type</p>
          {byType.length === 0 ? (
            <p className="text-sm text-[rgb(var(--text-muted))]">No games played yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-soft))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
