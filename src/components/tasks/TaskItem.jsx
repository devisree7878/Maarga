import React, { useState } from 'react';
import { Check, Pencil, Copy, ArrowRightLeft, Trash2, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import { useApp } from '../../context/AppContext';

export default function TaskItem({ task, category, onEdit, onMove, canMoveUp, canMoveDown, onReorder }) {
  const { toggleTask, deleteTask, duplicateTask } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${task.completed ? 'bg-[rgb(var(--surface-2))]/50 border-[rgb(var(--border-soft))]' : 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]'}`}>
      <button
        onClick={() => toggleTask(task.id)}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
          task.completed ? 'accent-bg border-transparent' : 'border-[rgb(var(--border))] hover:border-[rgb(var(--text-dim))]'
        }`}
      >
        {task.completed && <Check size={13} className="text-white" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-[rgb(var(--text-dim))]' : 'text-[rgb(var(--text))]'}`}>{task.title}</p>
        </div>
        {task.description && <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{task.description}</p>}
        <div className="flex items-center flex-wrap gap-1.5 mt-2">
          {category && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-[rgb(var(--border))]" style={{ color: category.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: category.color }} />
              {category.name}
            </span>
          )}
          <Badge tone={task.priority}>{task.priority}</Badge>
          {task.estTime && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[rgb(var(--text-dim))]">
              <Clock size={10} /> {task.estTime}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button disabled={!canMoveUp} onClick={() => onReorder(-1)} className="p-1 rounded text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] disabled:opacity-20"><ChevronUp size={14} /></button>
        <button disabled={!canMoveDown} onClick={() => onReorder(1)} className="p-1 rounded text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] disabled:opacity-20"><ChevronDown size={14} /></button>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Pencil size={13} /></button>
        <button onClick={() => duplicateTask(task.id)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Copy size={13} /></button>
        <button onClick={() => onMove(task)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><ArrowRightLeft size={13} /></button>
        {confirmDelete ? (
          <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg text-red-400 bg-red-500/10">
            <Trash2 size={13} />
          </button>
        ) : (
          <button onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000); }} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
