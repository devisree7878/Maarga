import React, { useState } from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const statusColors = {
  Unresolved: 'bg-red-500/10 text-red-400 border-red-500/25',
  Reviewing: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
};

export default function MistakeRow({ mistake, onEdit, showDay = false }) {
  const { deleteMistake, updateMistake } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="p-3.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">{mistake.problem || mistake.topic}</p>
          {mistake.topic && mistake.problem && <p className="text-xs text-[rgb(var(--text-muted))]">{mistake.topic}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(mistake)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Pencil size={13} /></button>
          {confirmDelete ? (
            <button onClick={() => deleteMistake(mistake.id)} className="p-1.5 rounded-lg text-red-400 bg-red-500/10"><Trash2 size={13} /></button>
          ) : (
            <button onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000); }} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
          )}
        </div>
      </div>
      {mistake.whatWentWrong && <p className="text-xs text-[rgb(var(--text-muted))] mt-2"><span className="text-[rgb(var(--text-dim))]">Went wrong: </span>{mistake.whatWentWrong}</p>}
      {mistake.correctApproach && <p className="text-xs text-[rgb(var(--text-muted))] mt-1"><span className="text-[rgb(var(--text-dim))]">Correct approach: </span>{mistake.correctApproach}</p>}
      <div className="flex items-center flex-wrap gap-2 mt-2.5">
        <select
          value={mistake.status}
          onChange={(e) => updateMistake(mistake.id, { status: e.target.value })}
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border cursor-pointer bg-transparent ${statusColors[mistake.status]}`}
        >
          <option>Unresolved</option><option>Reviewing</option><option>Resolved</option>
        </select>
        {showDay && mistake.dayNumber && <span className="text-[11px] text-[rgb(var(--text-dim))]">Day {mistake.dayNumber}</span>}
        {mistake.revisitDate && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[rgb(var(--text-dim))]">
            <Calendar size={10} /> Revisit {mistake.revisitDate}
          </span>
        )}
      </div>
    </div>
  );
}
