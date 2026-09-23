import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GoalCard from '../components/goals/GoalCard';
import GoalFormModal from '../components/goals/GoalFormModal';
import { useApp } from '../context/AppContext';

export default function GoalsPage() {
  const { data } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <Header title="Goals" subtitle="Define your own finish lines" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Add Goal</Button>
        </div>

        {data.goals.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Create a custom goal — anything you want to track toward, in any unit." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Add Goal</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.goals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={(goal) => { setEditing(goal); setFormOpen(true); }} />
            ))}
          </div>
        )}
      </div>

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} goal={editing} />
    </div>
  );
}
