import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

const empty = {
  title: '',
  description: '',
  categoryId: '',
  priority: 'Medium',
  estTime: '',
  notes: '',
  reminderTime: '',
  reminderEnabled: false,
};

export default function TaskFormModal({ open, onClose, dayNumber, task }) {
  const { data, addTask, updateTask } = useApp();
  const [form, setForm] = useState(empty);

  const activeCategories = data.categories
    .filter((c) => c.active !== false)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (!open) return;

    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        categoryId: task.categoryId || '',
        priority: task.priority || 'Medium',
        estTime: task.estTime || '',
        notes: task.notes || '',
        reminderTime: task.reminderTime || '',
        reminderEnabled: task.reminderEnabled === true,
      });
    } else {
      setForm({
        ...empty,
        categoryId: activeCategories[0]?.id || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const set = (key) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) return;

    const payload = {
      ...form,
      title: form.title.trim(),
      categoryId: form.categoryId || null,

      // Don't enable a reminder without a time.
      reminderEnabled:
        Boolean(form.reminderEnabled && form.reminderTime),
    };

    if (task) {
      updateTask(task.id, payload);
    } else {
      addTask({
        dayNumber,
        ...payload,
      });
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={submit}>
            {task ? 'Save Changes' : 'Add Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">

        <FieldGroup label="Title">
          <Input
            autoFocus
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Solve 3 array problems"
          />
        </FieldGroup>

        <FieldGroup label="Description">
          <Textarea
            rows={2}
            value={form.description}
            onChange={set('description')}
            placeholder="Optional details..."
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">

          <FieldGroup label="Category">
            <Select
              value={form.categoryId}
              onChange={set('categoryId')}
            >
              <option value="">Uncategorized</option>

              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup label="Priority">
            <Select
              value={form.priority}
              onChange={set('priority')}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Select>
          </FieldGroup>

        </div>

        <FieldGroup label="Estimated time">
          <Input
            value={form.estTime}
            onChange={set('estTime')}
            placeholder="45m"
          />
        </FieldGroup>

        {/* REMINDER */}
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">

          <div className="flex items-center justify-between gap-3">

            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text))]">
                Reminder
              </p>

              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
                Get a notification and beep at the selected time.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  reminderEnabled: !f.reminderEnabled,
                }))
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.reminderEnabled
                  ? 'accent-bg'
                  : 'bg-[rgb(var(--surface-3))]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.reminderEnabled
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>

          </div>

          {form.reminderEnabled && (
            <div className="mt-4">

              <FieldGroup label="Reminder time">
                <Input
                  type="time"
                  value={form.reminderTime}
                  onChange={set('reminderTime')}
                />
              </FieldGroup>

              <p className="text-[11px] text-[rgb(var(--text-dim))] mt-2">
                The reminder will be triggered at this time on the selected day.
              </p>

            </div>
          )}

        </div>

        <FieldGroup label="Notes">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={set('notes')}
            placeholder="Optional notes..."
          />
        </FieldGroup>

      </form>
    </Modal>
  );
}