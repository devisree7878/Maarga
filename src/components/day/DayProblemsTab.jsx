import React, { useMemo, useState } from 'react';
import { Plus, Code2 } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import ProblemRow from '../problems/ProblemRow';
import ProblemFormModal from '../problems/ProblemFormModal';
import { useApp } from '../../context/AppContext';

export default function DayProblemsTab({ dayNumber }) {
  const { data } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const problems = useMemo(() => data.problems.filter((p) => p.dayNumber === dayNumber), [data.problems, dayNumber]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">{problems.length} problem{problems.length !== 1 ? 's' : ''} logged</p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Add Problem</Button>
      </div>

      {problems.length === 0 ? (
        <EmptyState icon={Code2} title="No problems logged" description="Track problems you solve on this day." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Add Problem</Button>} />
      ) : (
        <div className="space-y-2">
          {problems.map((p) => (
            <ProblemRow key={p.id} problem={p} onEdit={(prob) => { setEditing(prob); setFormOpen(true); }} />
          ))}
        </div>
      )}

      <ProblemFormModal open={formOpen} onClose={() => setFormOpen(false)} dayNumber={dayNumber} problem={editing} />
    </div>
  );
}
