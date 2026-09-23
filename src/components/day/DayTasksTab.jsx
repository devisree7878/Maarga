import React, { useMemo, useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import TaskItem from '../tasks/TaskItem';
import TaskFormModal from '../tasks/TaskFormModal';
import MoveTaskModal from '../tasks/MoveTaskModal';
import { useApp } from '../../context/AppContext';

export default function DayTasksTab({ dayNumber }) {
  const { data, reorderTasks } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [movingTask, setMovingTask] = useState(null);

  const categoryMap = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.id, c])), [data.categories]);

  const tasks = useMemo(
    () => data.tasks.filter((t) => t.dayNumber === dayNumber).sort((a, b) => a.order - b.order),
    [data.tasks, dayNumber]
  );

  const reorder = (task, dir) => {
    const idx = tasks.findIndex((t) => t.id === task.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= tasks.length) return;
    const ids = tasks.map((t) => t.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    reorderTasks(dayNumber, ids);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">{tasks.filter((t) => t.completed).length} / {tasks.length} completed</p>
        <Button size="sm" onClick={() => { setEditingTask(null); setFormOpen(true); }}>
          <Plus size={14} /> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add your first task for this day to get started."
          action={<Button size="sm" onClick={() => { setEditingTask(null); setFormOpen(true); }}><Plus size={14} /> Add Task</Button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <TaskItem
              key={t.id}
              task={t}
              category={categoryMap[t.categoryId]}
              onEdit={(task) => { setEditingTask(task); setFormOpen(true); }}
              onMove={setMovingTask}
              canMoveUp={i > 0}
              canMoveDown={i < tasks.length - 1}
              onReorder={(dir) => reorder(t, dir)}
            />
          ))}
        </div>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} dayNumber={dayNumber} task={editingTask} />
      <MoveTaskModal open={!!movingTask} onClose={() => setMovingTask(null)} task={movingTask} />
    </div>
  );
}
