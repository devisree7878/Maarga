import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

const empty = { name: '', platform: '', url: '', difficulty: 'Medium', topic: '', date: '', timeTaken: '', attempts: 1, independent: true, notes: '', dayNumber: '' };

export default function ProblemFormModal({ open, onClose, dayNumber, problem }) {
  const { data, addProblem, updateProblem } = useApp();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(
        problem
          ? { ...problem, dayNumber: problem.dayNumber || '' }
          : { ...empty, dayNumber: dayNumber || '', date: new Date().toISOString().slice(0, 10) }
      );
    }
  }, [open, problem, dayNumber]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form, dayNumber: form.dayNumber ? Number(form.dayNumber) : null, attempts: Number(form.attempts) || 1 };
    if (problem) updateProblem(problem.id, payload);
    else addProblem(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={problem ? 'Edit Problem' : 'Add Problem'}
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>{problem ? 'Save Changes' : 'Add Problem'}</Button></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Problem name">
          <Input autoFocus value={form.name} onChange={set('name')} placeholder="e.g. Two Sum" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Platform">
            <Input value={form.platform} onChange={set('platform')} placeholder="LeetCode, Codeforces..." />
          </FieldGroup>
          <FieldGroup label="Topic">
            <Input value={form.topic} onChange={set('topic')} placeholder="Arrays, DP..." />
          </FieldGroup>
        </div>
        <FieldGroup label="URL">
          <Input value={form.url} onChange={set('url')} placeholder="https://..." />
        </FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="Difficulty">
            <Select value={form.difficulty} onChange={set('difficulty')}>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </Select>
          </FieldGroup>
          <FieldGroup label="Date">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FieldGroup>
          <FieldGroup label="Day # (optional)">
            <Input type="number" min={1} max={data.settings.duration} value={form.dayNumber} onChange={set('dayNumber')} placeholder="—" />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Time taken">
            <Input value={form.timeTaken} onChange={set('timeTaken')} placeholder="25m" />
          </FieldGroup>
          <FieldGroup label="Attempts">
            <Input type="number" min={1} value={form.attempts} onChange={set('attempts')} />
          </FieldGroup>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={form.independent} onChange={(e) => setForm((f) => ({ ...f, independent: e.target.checked }))} className="w-4 h-4 rounded accent-[rgb(var(--accent))]" />
          <span className="text-sm text-[rgb(var(--text-muted))]">Solved independently (no help/solution used)</span>
        </label>
        <FieldGroup label="Notes">
          <Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Approach, complexity, gotchas..." />
        </FieldGroup>
      </form>
    </Modal>
  );
}
