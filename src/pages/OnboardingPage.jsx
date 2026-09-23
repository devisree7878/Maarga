import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { Textarea } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const DURATIONS = [10, 20, 30, 60, 90, 120, 180, 365];

const EXAMPLES = [
  'I want to become a Software Engineer',
  'I want to become a Data Scientist',
  'I want to become an AI Engineer',
  'I want to prepare for government exams',
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);

  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(90);

  // Daily study time
  const [dailyStartTime, setDailyStartTime] = useState('19:00');
  const [dailyEndTime, setDailyEndTime] = useState('22:00');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const goToSchedule = (e) => {
    e.preventDefault();

    if (!goal.trim()) {
      setError(
        'Tell us what you want to become — this drives your whole plan.'
      );
      return;
    }

    setError('');
    setStep(2);
  };

  const finish = async () => {
    setSaving(true);
    setError('');

    // Validate time
    if (dailyStartTime >= dailyEndTime) {
      setError('End time must be later than start time.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        goal: goal.trim(),
        schedule_days: duration,
        daily_start_time: dailyStartTime,
        daily_end_time: dailyEndTime,
        reminders_enabled: remindersEnabled,
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();

    // AppRoutes will redirect once onboarding_completed becomes true.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-glow">
            <Sparkles
              size={17}
              className="text-white"
              strokeWidth={2.5}
            />
          </div>

          <span className="font-extrabold text-xl tracking-tight text-[rgb(var(--text))]">
            ELEVORA
          </span>
        </div>

        {/* Card */}
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 sm:p-8 shadow-xl">

          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step >= 1
                  ? 'accent-bg'
                  : 'bg-[rgb(var(--surface-3))]'
              }`}
            />

            <div
              className={`h-1.5 flex-1 rounded-full ${
                step >= 2
                  ? 'accent-bg'
                  : 'bg-[rgb(var(--surface-3))]'
              }`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* STEP 1 — GOAL */}
          {step === 1 && (
            <form onSubmit={goToSchedule}>

              <h1 className="text-lg font-bold text-[rgb(var(--text))] mb-1">
                What do you want to become?
              </h1>

              <p className="text-sm text-[rgb(var(--text-muted))] mb-4">
                Write it in your own words — there's no fixed list.
              </p>

              <Textarea
                rows={3}
                autoFocus
                placeholder="I want to become a Software Engineer"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    type="button"
                    key={ex}
                    onClick={() => setGoal(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full mt-6">
                Continue
                <ArrowRight size={15} />
              </Button>
            </form>
          )}

          {/* STEP 2 — SCHEDULE */}
          {step === 2 && (
            <div>

              <h1 className="text-lg font-bold text-[rgb(var(--text))] mb-1">
                Build your daily learning schedule
              </h1>

              <p className="text-sm text-[rgb(var(--text-muted))] mb-5">
                Tell ELEVORA when you usually want to study.
              </p>

              {/* Duration */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-2">
                  How many days do you want to work toward your goal?
                </h2>

                <p className="text-xs text-[rgb(var(--text-muted))] mb-3">
                  You can change this later in Settings.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                        duration === d
                          ? 'accent-border bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                          : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Time */}
              <div className="mb-6">

                <div className="flex items-center gap-2 mb-2">
                  <Clock
                    size={17}
                    className="text-[rgb(var(--accent))]"
                  />

                  <h2 className="text-sm font-semibold text-[rgb(var(--text))]">
                    How much time will you give each day?
                  </h2>
                </div>

                <p className="text-xs text-[rgb(var(--text-muted))] mb-4">
                  Choose the time window when you want to focus on your goal.
                </p>

                <div className="grid grid-cols-2 gap-3">

                  {/* Start Time */}
                  <div>
                    <label className="block text-xs font-medium text-[rgb(var(--text-muted))] mb-1.5">
                      Start time
                    </label>

                    <input
                      type="time"
                      value={dailyStartTime}
                      onChange={(e) => setDailyStartTime(e.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-xs font-medium text-[rgb(var(--text-muted))] mb-1.5">
                      End time
                    </label>

                    <input
                      type="time"
                      value={dailyEndTime}
                      onChange={(e) => setDailyEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                    />
                  </div>

                </div>

                {/* Schedule preview */}
                <div className="mt-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] px-3.5 py-3">

                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Your daily focus window
                  </p>

                  <p className="text-sm font-semibold text-[rgb(var(--text))] mt-0.5">
                    {dailyStartTime} → {dailyEndTime}
                  </p>

                </div>
              </div>

              {/* Reminder */}
              <div className="rounded-xl border border-[rgb(var(--border-soft))] bg-[rgb(var(--surface-2))] p-4 mb-6">

                <label className="flex items-start gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) =>
                      setRemindersEnabled(e.target.checked)
                    }
                    className="mt-1 accent-[rgb(var(--accent))]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      Remind me when my study time starts
                    </p>

                    <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
                      ELEVORA will notify you when your daily focus window begins.
                    </p>
                  </div>

                </label>

              </div>

              {/* Buttons */}
              <div className="flex gap-2">

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={15} />
                  Back
                </Button>

                <Button
                  type="button"
                  className="flex-1"
                  onClick={finish}
                  disabled={saving}
                >
                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  Start My Plan
                </Button>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}