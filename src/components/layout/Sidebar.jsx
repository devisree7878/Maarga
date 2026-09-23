import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Code2, Brain, Target, BarChart3, Settings, Flame, Gamepad2, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { computeOverallStats } from '../../utils/statsUtils';
import { currentDayNumber } from '../../utils/dateUtils';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/days', label: 'Plan', icon: CalendarDays },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/mistakes', label: 'Mistakes', icon: Brain },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { data } = useApp();
  const { isAdmin } = useAuth();
  const stats = computeOverallStats(data);
  const todayDay = currentDayNumber(data.settings.startDate, data.settings.duration);

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-[rgb(var(--border-soft))] bg-[rgb(var(--surface))] h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-glow">
          <Sparkles size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-extrabold text-[15px] leading-none tracking-tight">ELEVORA</p>
          <p className="text-[10px] text-[rgb(var(--text-dim))] mt-1">Daily goals. Real progress.</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-none">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]'
              }`
            }
          >
            <item.icon size={17} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-amber-400 hover:bg-[rgb(var(--surface-2))]"
          >
            <ShieldCheck size={17} strokeWidth={2} />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-3 mx-3 mb-4 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-[rgb(var(--text-muted))]">Day {todayDay} / {stats.duration}</span>
          <span className="text-[11px] font-mono font-semibold accent-text">{stats.progressPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[rgb(var(--surface-3))] overflow-hidden mb-2">
          <div className="h-full rounded-full accent-gradient" style={{ width: `${stats.progressPct}%` }} />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-orange-400 font-semibold">
          <Flame size={12} className="fill-orange-400/30" />
          {stats.currentStreak} day streak
        </div>
      </div>
    </aside>
  );
}
