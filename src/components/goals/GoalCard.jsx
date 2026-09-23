import React, { useState } from 'react';
import { Pencil, Trash2, Calendar, Plus, Minus } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { useApp } from '../../context/AppContext';

export default function GoalCard({ goal, onEdit }) {
  const { deleteGoal, updateGoal } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;

  const bump = (delta) => updateGoal(goal.id, { current: Math.max(0, goal.current + delta) });

  return (
    <div className="p-4 rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[rgb(var(--text))] truncate">{goal.name}</p>
          {goal.description && <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{goal.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Pencil size={13} /></button>
          {confirmDelete ? (
            <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg text-red-400 bg-red-500/10"><Trash2 size={13} /></button>
          ) : (
            <button onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000); }} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono text-[rgb(var(--text-muted))]">{goal.current} / {goal.target} {goal.unit}</span>
          <span className="text-xs font-mono font-semibold" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
        </div>
        <ProgressBar value={pct} color={goal.color} />
      </div>

      <div className="flex items-center justify-between mt-3.5">
        <div className="flex items-center gap-1.5">
          <button onClick={() => bump(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"><Minus size={13} /></button>
          <button onClick={() => bump(1)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"><Plus size={13} /></button>
        </div>
        {goal.deadline && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[rgb(var(--text-dim))]">
            <Calendar size={10} /> {goal.deadline}
          </span>
        )}
      </div>
    </div>
  );
}
