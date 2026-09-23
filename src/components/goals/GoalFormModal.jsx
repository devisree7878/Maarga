import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, FieldGroup } from '../ui/Field';
import { CATEGORY_COLORS } from '../../data/schema';
import { useApp } from '../../context/AppContext';
import { Check } from 'lucide-react';

const empty = { name: '', description: '', target: '', current: '', unit: 'Custom', deadline: '', color: CATEGORY_COLORS[0] };
const unitPresets = ['Problems', 'Hours', 'Days', 'Projects', 'Applications', 'Custom'];

export default function GoalFormModal({ open, onClose, goal }) {
  const { addGoal, updateGoal } = useApp();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(goal ? { ...goal } : empty);
  }, [open, goal]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form, target: Number(form.target) || 0, current: Number(form.current) || 0 };
    if (goal) updateGoal(goal.id, payload);
    else addGoal(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? 'Edit Goal' : 'Add Goal'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>{goal ? 'Save Changes' : 'Add Goal'}</Button></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Goal name">
          <Input autoFocus value={form.name} onChange={set('name')} placeholder="e.g. Become strong in DSA" />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Optional details..." />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Target">
            <Input type="number" value={form.target} onChange={set('target')} placeholder="300" />
          </FieldGroup>
          <FieldGroup label="Current">
            <Input type="number" value={form.current} onChange={set('current')} placeholder="0" />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Unit">
            <Select value={form.unit} onChange={set('unit')}>
              {unitPresets.map((u) => <option key={u}>{u}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Deadline">
            <Input type="date" value={form.deadline} onChange={set('deadline')} />
          </FieldGroup>
        </div>
        <FieldGroup label="Color">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: form.color === c ? '#fff' : 'transparent' }}
              >
                {form.color === c && <Check size={13} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </FieldGroup>
      </form>
    </Modal>
  );
}
