import React, { useState, useMemo } from 'react';
import { ListChecks, BookOpen, Code2, Brain, FileText, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import Panel from '../ui/Panel';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import { Textarea, FieldGroup } from '../ui/Field';
import Tabs from '../ui/Tabs';
import DayTasksTab from './DayTasksTab';
import DayStudyTab from './DayStudyTab';
import DayProblemsTab from './DayProblemsTab';
import DayMistakesTab from './DayMistakesTab';
import DayNotesTab from './DayNotesTab';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { dateForDay, formatLong } from '../../utils/dateUtils';
import { dayTaskStats } from '../../utils/statsUtils';

const statusLabels = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', missed: 'Missed' };

export default function DayPanel() {
  const { selectedDay, closeDay, openDay } = useUI();
  const { data, completeDay, markDayMissed, reopenDay } = useApp();
  const [tab, setTab] = useState('tasks');
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [missModalOpen, setMissModalOpen] = useState(false);
  const [missReason, setMissReason] = useState('');

  const dayNumber = selectedDay;
  const day = dayNumber ? data.days[dayNumber] : null;
  const stats = dayNumber ? dayTaskStats(data, dayNumber) : { total: 0, completed: 0, pct: 0 };

  const counts = useMemo(() => {
    if (!dayNumber) return {};
    return {
      tasks: data.tasks.filter((t) => t.dayNumber === dayNumber).length,
      study: data.studyLogs.filter((l) => l.dayNumber === dayNumber).length,
      problems: data.problems.filter((p) => p.dayNumber === dayNumber).length,
      mistakes: data.mistakes.filter((m) => m.dayNumber === dayNumber).length,
    };
  }, [data, dayNumber]);

  if (!dayNumber || !day) return null;

  const date = dateForDay(data.settings.startDate, dayNumber);
  const duration = data.settings.duration;

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: ListChecks, count: counts.tasks },
    { id: 'study', label: 'Study', icon: BookOpen, count: counts.study },
    { id: 'problems', label: 'Problems', icon: Code2, count: counts.problems },
    { id: 'mistakes', label: 'Mistakes', icon: Brain, count: counts.mistakes },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  const handleCompleteClick = () => {
    if (stats.total > 0 && stats.completed < stats.total) setConfirmComplete(true);
    else completeDay(dayNumber);
  };

  const handleMissSubmit = () => {
    markDayMissed(dayNumber, missReason);
    setMissReason('');
    setMissModalOpen(false);
  };

  return (
    <>
      <Panel
        open={!!selectedDay}
        onClose={closeDay}
        title={`Day ${dayNumber} / ${duration}`}
        subtitle={formatLong(date)}
        headerExtra={
          <div className="flex items-center gap-1 mr-1">
            <button disabled={dayNumber <= 1} onClick={() => openDay(dayNumber - 1)} className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <button disabled={dayNumber >= duration} onClick={() => openDay(dayNumber + 1)} className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        }
        footer={
          <div className="flex items-center gap-2">
            {day.status === 'completed' || day.status === 'missed' ? (
              <Button variant="outline" className="flex-1" onClick={() => reopenDay(dayNumber)}>
                <RotateCcw size={14} /> Reopen Day
              </Button>
            ) : (
              <>
                <Button variant="secondary" className="flex-1" onClick={() => setMissModalOpen(true)}>
                  <XCircle size={14} /> Mark Missed
                </Button>
                <Button className="flex-1" onClick={handleCompleteClick}>
                  <CheckCircle2 size={14} /> Complete Day
                </Button>
              </>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-2 mb-4">
          <Badge tone={day.status}>{statusLabels[day.status]}</Badge>
          {day.status === 'missed' && day.missedReason && (
            <span className="text-xs text-[rgb(var(--text-dim))] truncate">"{day.missedReason}"</span>
          )}
        </div>

        <div className="mb-5 p-3.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Task Progress</span>
            <span className="text-xs font-mono font-semibold text-[rgb(var(--text))]">{stats.completed} / {stats.total} · {stats.pct}%</span>
          </div>
          <ProgressBar value={stats.pct} />
        </div>

        <div className="-mt-1">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <div className="pt-4">
          {tab === 'tasks' && <DayTasksTab dayNumber={dayNumber} />}
          {tab === 'study' && <DayStudyTab dayNumber={dayNumber} />}
          {tab === 'problems' && <DayProblemsTab dayNumber={dayNumber} />}
          {tab === 'mistakes' && <DayMistakesTab dayNumber={dayNumber} />}
          {tab === 'notes' && <DayNotesTab dayNumber={dayNumber} />}
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={() => completeDay(dayNumber)}
        title="Incomplete tasks remain"
        message={`You still have ${stats.total - stats.completed} incomplete task(s). Complete this day anyway?`}
        confirmLabel="Complete Anyway"
        danger={false}
      />

      <Modal
        open={missModalOpen}
        onClose={() => setMissModalOpen(false)}
        title="Mark Day as Missed"
        footer={<><Button variant="ghost" onClick={() => setMissModalOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleMissSubmit}>Mark Missed</Button></>}
      >
        <FieldGroup label="Reason (optional)">
          <Textarea rows={3} value={missReason} onChange={(e) => setMissReason(e.target.value)} placeholder="What happened? (optional)" />
        </FieldGroup>
      </Modal>
    </>
  );
}
