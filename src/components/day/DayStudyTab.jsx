import React, { useMemo, useState } from 'react';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Input, Select, Textarea, FieldGroup } from '../ui/Field';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { minutesToHM } from '../../utils/dateUtils';

export default function DayStudyTab({ dayNumber }) {
  const { data, addStudyLog, deleteStudyLog } = useApp();
  const [open, setOpen] = useState(false);
  const activeCategories = data.categories.filter((c) => c.active !== false).sort((a, b) => a.order - b.order);
  const [form, setForm] = useState({ categoryId: activeCategories[0]?.id || '', hours: '', minutes: '', notes: '' });

  const logs = useMemo(() => data.studyLogs.filter((l) => l.dayNumber === dayNumber), [data.studyLogs, dayNumber]);
  const categoryMap = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.id, c])), [data.categories]);
  const total = logs.reduce((s, l) => s + Number(l.minutes || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    const mins = (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0);
    if (mins <= 0) return;
    addStudyLog({ dayNumber, categoryId: form.categoryId || null, minutes: mins, notes: form.notes });
    setForm({ categoryId: activeCategories[0]?.id || '', hours: '', minutes: '', notes: '' });
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">Total logged: <span className="text-[rgb(var(--text))] font-tabular">{minutesToHM(total)}</span></p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Log Study</Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={BookOpen} title="No study time logged" description="Track how much time you spend on each category today." action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Log Study</Button>} />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => {
            const cat = categoryMap[l.categoryId];
            return (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color || '#888' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{cat?.name || 'Uncategorized'}</p>
                    {l.notes && <p className="text-xs text-[rgb(var(--text-dim))] truncate">{l.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-semibold accent-text">{minutesToHM(l.minutes)}</span>
                  <button onClick={() => deleteStudyLog(l.id)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Study Time" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Log Time</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup label="Category">
            <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Uncategorized</option>
              {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Hours">
              <Input type="number" min={0} value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="0" />
            </FieldGroup>
            <FieldGroup label="Minutes">
              <Input type="number" min={0} max={59} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} placeholder="0" />
            </FieldGroup>
          </div>
          <FieldGroup label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </FieldGroup>
        </form>
      </Modal>
    </div>
  );
}
