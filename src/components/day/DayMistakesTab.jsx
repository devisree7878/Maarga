import React, { useMemo, useState } from 'react';
import { Plus, Brain } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import MistakeRow from '../mistakes/MistakeRow';
import MistakeFormModal from '../mistakes/MistakeFormModal';
import { useApp } from '../../context/AppContext';

export default function DayMistakesTab({ dayNumber }) {
  const { data } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const mistakes = useMemo(() => data.mistakes.filter((m) => m.dayNumber === dayNumber), [data.mistakes, dayNumber]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">{mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} logged</p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Log Mistake</Button>
      </div>

      {mistakes.length === 0 ? (
        <EmptyState icon={Brain} title="No mistakes logged" description="Log what went wrong to review it later." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Log Mistake</Button>} />
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => (
            <MistakeRow key={m.id} mistake={m} onEdit={(mis) => { setEditing(mis); setFormOpen(true); }} />
          ))}
        </div>
      )}

      <MistakeFormModal open={formOpen} onClose={() => setFormOpen(false)} dayNumber={dayNumber} mistake={editing} />
    </div>
  );
}
