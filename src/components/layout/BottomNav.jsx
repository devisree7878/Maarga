import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Code2, BarChart3, MoreHorizontal, Brain, Target, Settings, X, Gamepad2, Users, CalendarDays, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const primary = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
];

const more = [
  { to: '/days', label: 'Plan', icon: CalendarDays },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/mistakes', label: 'Mistakes', icon: Brain },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const moreItems = isAdmin ? [...more, { to: '/admin', label: 'Admin', icon: ShieldCheck }] : more;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[65] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fadeIn" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--border))] rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] anim-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">More</p>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-2))]"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => { navigate(item.to); setOpen(false); }}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] active:scale-[0.97] transition-transform ${
                    item.to === '/admin' ? 'text-amber-400' : 'text-[rgb(var(--text-muted))]'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[rgb(var(--surface))]/90 backdrop-blur-lg border-t border-[rgb(var(--border-soft))] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 flex-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'accent-text' : 'text-[rgb(var(--text-dim))]'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 flex-1 text-[10px] font-medium text-[rgb(var(--text-dim))]"
          >
            <MoreHorizontal size={20} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
