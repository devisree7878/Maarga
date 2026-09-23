import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

export default function MoveTaskModal({ open, onClose, task }) {
  const { data, moveTask } = useApp();
  const [dayNumber, setDayNumber] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const activeCategories = data.categories.filter((c) => c.active !== false).sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (open && task) {
      setDayNumber(task.dayNumber);
      setCategoryId(task.categoryId || '');
    }
  }, [open, task]);

  const submit = (e) => {
    e.preventDefault();
    const dn = Math.min(Math.max(Number(dayNumber) || 1, 1), data.settings.duration);
    moveTask(task.id, dn, categoryId || null);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Move</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-[rgb(var(--text-muted))]">Moving <span className="text-[rgb(var(--text))] font-medium">"{task.title}"</span></p>
        <FieldGroup label={`Move to day (1 - ${data.settings.duration})`}>
          <Input type="number" min={1} max={data.settings.duration} value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Move to category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </FieldGroup>
      </form>
    </Modal>
  );
}
