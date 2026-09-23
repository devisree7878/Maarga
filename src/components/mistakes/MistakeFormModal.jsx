import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

const empty = { problem: '', topic: '', date: '', whatWentWrong: '', correctApproach: '', missingConcept: '', prevention: '', revisitDate: '', status: 'Unresolved', dayNumber: '' };

export default function MistakeFormModal({ open, onClose, dayNumber, mistake }) {
  const { data, addMistake, updateMistake } = useApp();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(
        mistake
          ? { ...mistake, dayNumber: mistake.dayNumber || '' }
          : { ...empty, dayNumber: dayNumber || '', date: new Date().toISOString().slice(0, 10) }
      );
    }
  }, [open, mistake, dayNumber]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.problem.trim() && !form.topic.trim()) return;
    const payload = { ...form, dayNumber: form.dayNumber ? Number(form.dayNumber) : null };
    if (mistake) updateMistake(mistake.id, payload);
    else addMistake(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mistake ? 'Edit Mistake' : 'Log Mistake'}
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>{mistake ? 'Save Changes' : 'Log Mistake'}</Button></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Problem">
            <Input autoFocus value={form.problem} onChange={set('problem')} placeholder="e.g. LRU Cache" />
          </FieldGroup>
          <FieldGroup label="Topic">
            <Input value={form.topic} onChange={set('topic')} placeholder="e.g. Linked List" />
          </FieldGroup>
        </div>
        <FieldGroup label="What went wrong?">
          <Textarea rows={2} value={form.whatWentWrong} onChange={set('whatWentWrong')} placeholder="Describe the mistake..." />
        </FieldGroup>
        <FieldGroup label="Correct approach">
          <Textarea rows={2} value={form.correctApproach} onChange={set('correctApproach')} placeholder="What should have been done..." />
        </FieldGroup>
        <FieldGroup label="Missing concept">
          <Input value={form.missingConcept} onChange={set('missingConcept')} placeholder="e.g. Doubly linked list + hashmap" />
        </FieldGroup>
        <FieldGroup label="Prevention">
          <Textarea rows={2} value={form.prevention} onChange={set('prevention')} placeholder="How to avoid this next time..." />
        </FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="Date">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FieldGroup>
          <FieldGroup label="Revisit date">
            <Input type="date" value={form.revisitDate} onChange={set('revisitDate')} />
          </FieldGroup>
          <FieldGroup label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option>Unresolved</option><option>Reviewing</option><option>Resolved</option>
            </Select>
          </FieldGroup>
        </div>
      </form>
    </Modal>
  );
}
