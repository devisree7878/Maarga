import React, { useMemo, useState } from 'react';
import { Plus, Brain, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import MistakeRow from '../components/mistakes/MistakeRow';
import MistakeFormModal from '../components/mistakes/MistakeFormModal';
import { useApp } from '../context/AppContext';
import { todayISO } from '../utils/dateUtils';

const statusFilters = ['All', 'Unresolved', 'Reviewing', 'Resolved'];

export default function MistakesPage() {
  const { data } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('All');

  const today = todayISO();

  const reviewToday = useMemo(
    () => data.mistakes.filter((m) => m.revisitDate && m.revisitDate <= today && m.status !== 'Resolved'),
    [data.mistakes, today]
  );

  const mistakes = useMemo(() => {
    let list = [...data.mistakes].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (status !== 'All') list = list.filter((m) => m.status === status);
    return list;
  }, [data.mistakes, status]);

  return (
    <div>
      <Header title="Mistake Journal" subtitle="Learn from every miss" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-6">
        {reviewToday.length > 0 && (
          <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-amber-400" />
              <p className="text-sm font-semibold text-amber-400">Review Today ({reviewToday.length})</p>
            </div>
            <div className="space-y-2">
              {reviewToday.map((m) => (
                <MistakeRow key={m.id} mistake={m} onEdit={(mis) => { setEditing(mis); setFormOpen(true); }} showDay />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  status === s ? 'accent-bg text-white' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Log Mistake</Button>
        </div>

        {mistakes.length === 0 ? (
          <EmptyState icon={Brain} title="No mistakes logged" description="Log mistakes as you make them — future you will thank you." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Log Mistake</Button>} />
        ) : (
          <div className="space-y-2">
            {mistakes.map((m) => (
              <MistakeRow key={m.id} mistake={m} onEdit={(mis) => { setEditing(mis); setFormOpen(true); }} showDay />
            ))}
          </div>
        )}
      </div>

      <MistakeFormModal open={formOpen} onClose={() => setFormOpen(false)} mistake={editing} />
    </div>
  );
}
