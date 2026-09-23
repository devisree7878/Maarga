import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input, Select, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../data/schema';

function Icon({ name, ...props }) {
  const Cmp = Icons[name] || Icons.Circle;
  return <Cmp {...props} />;
}

export default function CategoryManager() {
  const { data, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState('uncategorize');
  const [deleteTargetCat, setDeleteTargetCat] = useState('');
  const [form, setForm] = useState({ name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] });

  const sorted = [...data.categories].sort((a, b) => a.order - b.order);

  const startAdd = () => {
    setForm({ name: '', color: CATEGORY_COLORS[sorted.length % CATEGORY_COLORS.length], icon: CATEGORY_ICONS[sorted.length % CATEGORY_ICONS.length] });
    setEditingId(null);
    setAdding(true);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    setEditingId(cat.id);
    setAdding(true);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) updateCategory(editingId, form);
    else addCategory(form);
    setAdding(false);
  };

  const move = (cat, dir) => {
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    reorderCategories(next);
  };

  const openDelete = (cat) => {
    setDeleteTarget(cat);
    setDeleteMode('uncategorize');
    setDeleteTargetCat(sorted.find((c) => c.id !== cat.id)?.id || '');
  };

  const confirmDelete = () => {
    deleteCategory(deleteTarget.id, deleteMode, deleteMode === 'move' ? deleteTargetCat : null);
    setDeleteTarget(null);
  };

  const usageCount = (catId) =>
    data.tasks.filter((t) => t.categoryId === catId).length + data.studyLogs.filter((l) => l.categoryId === catId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[rgb(var(--text))]">Categories</p>
        <Button size="sm" onClick={startAdd}><Plus size={14} /> Add Category</Button>
      </div>

      <div className="space-y-2">
        {sorted.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>
              <Icon name={cat.icon} size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[rgb(var(--text))] truncate">{cat.name}</p>
              <p className="text-[11px] text-[rgb(var(--text-dim))]">{usageCount(cat.id)} item{usageCount(cat.id) !== 1 ? 's' : ''} tagged</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button disabled={i === 0} onClick={() => move(cat, -1)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] disabled:opacity-20"><ChevronUp size={14} /></button>
              <button disabled={i === sorted.length - 1} onClick={() => move(cat, 1)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] disabled:opacity-20"><ChevronDown size={14} /></button>
              <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"><Icons.Pencil size={13} /></button>
              <button onClick={() => openDelete(cat)} className="p-1.5 rounded-lg text-[rgb(var(--text-dim))] hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-[rgb(var(--text-dim))] text-center py-8">No categories yet. Add your first one.</p>}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
        footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={submit}>{editingId ? 'Save Changes' : 'Add Category'}</Button></>}
      >
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup label="Name">
            <Input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. System Design" />
          </FieldGroup>
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
          <FieldGroup label="Icon">
            <div className="grid grid-cols-9 gap-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  className={`aspect-square rounded-lg flex items-center justify-center border transition-colors ${
                    form.icon === ic ? 'accent-border bg-[rgb(var(--surface-3))]' : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-3))]'
                  }`}
                >
                  <Icon name={ic} size={15} className="text-[rgb(var(--text-muted))]" />
                </button>
              ))}
            </div>
          </FieldGroup>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete Category</Button></>}
      >
        <p className="text-sm text-[rgb(var(--text-muted))] mb-4">
          This category is used by {deleteTarget ? usageCount(deleteTarget.id) : 0} item(s). Choose what happens to them — nothing is ever deleted silently.
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[rgb(var(--border))] cursor-pointer">
            <input type="radio" checked={deleteMode === 'uncategorize'} onChange={() => setDeleteMode('uncategorize')} className="accent-[rgb(var(--accent))]" />
            <span className="text-sm">Move items to "Uncategorized"</span>
          </label>
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[rgb(var(--border))] cursor-pointer">
            <input type="radio" checked={deleteMode === 'move'} onChange={() => setDeleteMode('move')} className="accent-[rgb(var(--accent))]" />
            <span className="text-sm">Move items to another category</span>
          </label>
          {deleteMode === 'move' && (
            <Select value={deleteTargetCat} onChange={(e) => setDeleteTargetCat(e.target.value)} className="ml-8 w-[calc(100%-2rem)]">
              {sorted.filter((c) => c.id !== deleteTarget?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </div>
      </Modal>
    </div>
  );
}
