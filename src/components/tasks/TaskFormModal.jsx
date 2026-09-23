import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

const empty = { title: '', description: '', categoryId: '', priority: 'Medium', estTime: '', notes: '' };

export default function TaskFormModal({ open, onClose, dayNumber, task }) {
  const { data, addTask, updateTask } = useApp();
  const [form, setForm] = useState(empty);
  const activeCategories = data.categories.filter((c) => c.active !== false).sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (open) {
      setForm(
        task
          ? { title: task.title, description: task.description, categoryId: task.categoryId || '', priority: task.priority, estTime: task.estTime, notes: task.notes }
          : { ...empty, categoryId: activeCategories[0]?.id || '' }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (task) {
      updateTask(task.id, { ...form, categoryId: form.categoryId || null });
    } else {
      addTask({ dayNumber, ...form, categoryId: form.categoryId || null });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Add Task'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{task ? 'Save Changes' : 'Add Task'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Title">
          <Input autoFocus value={form.title} onChange={set('title')} placeholder="e.g. Solve 3 array problems" />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Optional details..." />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Category">
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Uncategorized</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup label="Estimated time (e.g. 45m, 2h)">
          <Input value={form.estTime} onChange={set('estTime')} placeholder="45m" />
        </FieldGroup>
        <FieldGroup label="Notes">
          <Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional notes..." />
        </FieldGroup>
      </form>
    </Modal>
  );
}
