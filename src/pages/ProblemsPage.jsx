import React, { useMemo, useState } from 'react';
import { Plus, Code2, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import StatCard from '../components/dashboard/StatCard';
import EmptyState from '../components/ui/EmptyState';
import ProblemRow from '../components/problems/ProblemRow';
import ProblemFormModal from '../components/problems/ProblemFormModal';
import { useApp } from '../context/AppContext';
import { problemStats } from '../utils/statsUtils';
import { Target, CheckCircle2, Users, Layers } from 'lucide-react';

const difficultyFilters = ['All', 'Easy', 'Medium', 'Hard'];

export default function ProblemsPage() {
  const { data } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [difficulty, setDifficulty] = useState('All');
  const [query, setQuery] = useState('');

  const stats = problemStats(data);

  const problems = useMemo(() => {
    let list = [...data.problems].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (difficulty !== 'All') list = list.filter((p) => p.difficulty === difficulty);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.topic || '').toLowerCase().includes(q) || (p.platform || '').toLowerCase().includes(q));
    }
    return list;
  }, [data.problems, difficulty, query]);

  return (
    <div>
      <Header title="Problems" subtitle="Every problem you've solved, tracked" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Layers} label="Total" value={stats.total} accentColor="#6366F1" />
          <StatCard icon={Target} label="Easy" value={stats.easy} accentColor="#10B981" />
          <StatCard icon={Target} label="Medium" value={stats.medium} accentColor="#F59E0B" />
          <StatCard icon={Target} label="Hard" value={stats.hard} accentColor="#EF4444" />
          <StatCard icon={CheckCircle2} label="Independent" value={stats.independent} sub={`${stats.assisted} assisted`} accentColor="#06B6D4" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {difficultyFilters.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  difficulty === d ? 'accent-bg text-white' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-xs outline-none focus:ring-2 accent-ring"
            />
          </div>
          <Button size="sm" className="sm:ml-auto" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={14} /> Add Problem
          </Button>
        </div>

        {problems.length === 0 ? (
          <EmptyState icon={Code2} title="No problems yet" description="Log problems as you solve them to build your track record." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> Add Problem</Button>} />
        ) : (
          <div className="space-y-2">
            {problems.map((p) => (
              <ProblemRow key={p.id} problem={p} onEdit={(prob) => { setEditing(prob); setFormOpen(true); }} showDay />
            ))}
          </div>
        )}
      </div>

      <ProblemFormModal open={formOpen} onClose={() => setFormOpen(false)} problem={editing} />
    </div>
  );
}
