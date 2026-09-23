import React, { useState } from 'react';
import { Pencil, Trash2, ExternalLink, CheckCircle2, Users } from 'lucide-react';
import Badge from '../ui/Badge';
import { useApp } from '../../context/AppContext';

export default function ProblemRow({ problem, onEdit, showDay = false }) {
  const { deleteProblem } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">{problem.name}</p>
          <Badge tone={problem.difficulty}>{problem.difficulty}</Badge>
          {problem.independent ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 size={11} /> Independent</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400"><Users size={11} /> Assisted</span>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-[rgb(var(--text-muted))]">
          {problem.platform && <span>{problem.platform}</span>}
          {problem.topic && <span>· {problem.topic}</span>}
          {showDay && problem.dayNumber && <span>· Day {problem.dayNumber}</span>}
          {problem.date && <span>· {problem.date}</span>}
          {problem.timeTaken && <span>· {problem.timeTaken}</span>}
          {problem.attempts > 1 && <span>· {problem.attempts} attempts</span>}
        </div>
        {problem.notes && <p className="text-xs text-[rgb(var(--text-dim))] mt-1.5">{problem.notes}</p>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {problem.url && (
          <a href={problem.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]">
            <ExternalLink size={13} />
          </a>
        )}
        <button onClick={() => onEdit(problem)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Pencil size={13} /></button>
        {confirmDelete ? (
          <button onClick={() => deleteProblem(problem.id)} className="p-1.5 rounded-lg text-red-400 bg-red-500/10"><Trash2 size={13} /></button>
        ) : (
          <button onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000); }} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
        )}
      </div>
    </div>
  );
}
