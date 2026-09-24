import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Clock,
} from 'lucide-react';

import { Textarea } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const EXAMPLES = [
  'I want to become a Software Engineer',
  'I want to become a Data Scientist',
  'I want to become an AI Engineer',
  'I want to prepare for government exams',
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);

  // -----------------------------
  // GOAL
  // -----------------------------
  const [goal, setGoal] = useState('');

  // -----------------------------
  // PLAN DURATION
  // -----------------------------
  const [duration, setDuration] = useState(90);

  // -----------------------------
  // DAILY STUDY TIME
  // -----------------------------
  const [dailyStartHour, setDailyStartHour] = useState('07');
  const [dailyStartMinute, setDailyStartMinute] = useState('30');
  const [dailyStartPeriod, setDailyStartPeriod] = useState('AM');

  const [dailyEndHour, setDailyEndHour] = useState('08');
  const [dailyEndMinute, setDailyEndMinute] = useState('30');
  const [dailyEndPeriod, setDailyEndPeriod] = useState('AM');

  // -----------------------------
  // REMINDERS
  // -----------------------------
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // -----------------------------
  // UI STATE
  // -----------------------------
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // TIME HELPERS
  // -----------------------------
  const convertTo24Hour = (hour, minute, period) => {
    let h = Number(hour);
    const m = Number(minute);

    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    return h * 60 + m;
  };

  const formatTime = (hour, minute, period) => {
    return `${hour}:${minute} ${period}`;
  };

  const get24HourTime = (hour, minute, period) => {
    let h = Number(hour);

    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  // -----------------------------
  // STEP 1
  // -----------------------------
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

  // -----------------------------
  // FINISH
  // -----------------------------
  const finish = async () => {
    setSaving(true);
    setError('');

    // Validate duration
    if (!duration || duration < 1 || duration > 365) {
      setError('Plan duration must be between 1 and 365 days.');
      setSaving(false);
      return;
    }

    // Convert selected times to minutes
    const startMinutes = convertTo24Hour(
      dailyStartHour,
      dailyStartMinute,
      dailyStartPeriod
    );

    const endMinutes = convertTo24Hour(
      dailyEndHour,
      dailyEndMinute,
      dailyEndPeriod
    );

    // Prevent same or reversed time
    if (startMinutes >= endMinutes) {
      setError('End time must be later than start time.');
      setSaving(false);
      return;
    }

    // Convert to database format HH:MM
    const dailyStartTime = get24HourTime(
      dailyStartHour,
      dailyStartMinute,
      dailyStartPeriod
    );

    const dailyEndTime = get24HourTime(
      dailyEndHour,
      dailyEndMinute,
      dailyEndPeriod
    );

    // -----------------------------
    // SAVE TO SUPABASE
    // -----------------------------
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        goal: goal.trim(),
        schedule_days: Number(duration),
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

  // -----------------------------
  // HOUR OPTIONS
  // -----------------------------
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  // -----------------------------
  // MINUTE OPTIONS
  // -----------------------------
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-lg">

        {/* LOGO */}
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

        {/* CARD */}
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 sm:p-8 shadow-xl">

          {/* PROGRESS */}
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

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* ========================================= */}
          {/* STEP 1 — GOAL */}
          {/* ========================================= */}

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

              {/* EXAMPLES */}
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

          {/* ========================================= */}
          {/* STEP 2 — SCHEDULE */}
          {/* ========================================= */}

          {step === 2 && (
            <div>

              <h1 className="text-lg font-bold text-[rgb(var(--text))] mb-1">
                Build your daily learning schedule
              </h1>

              <p className="text-sm text-[rgb(var(--text-muted))] mb-5">
                Tell ELEVORA when you usually want to study.
              </p>

              {/* ========================================= */}
              {/* PLAN DURATION */}
              {/* ========================================= */}

              <div className="mb-6">

                <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-2">
                  How many days do you want to work toward your goal?
                </h2>

                <p className="text-xs text-[rgb(var(--text-muted))] mb-3">
                  Choose any duration from 1 to 365 days. You can change this later in Settings.
                </p>

                <div className="flex gap-2">

                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={duration}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === '') {
                        setDuration('');
                        return;
                      }

                      const number = Number(value);

                      if (number >= 1 && number <= 365) {
                        setDuration(number);
                      }
                    }}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                    placeholder="Example: 78"
                  />

                  <div className="flex items-center px-4 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-sm text-[rgb(var(--text-muted))]">
                    days
                  </div>

                </div>

                {/* QUICK DURATION BUTTONS */}
                <div className="grid grid-cols-4 gap-2 mt-3">

                  {[10, 20, 30, 60, 90, 120, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
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

              {/* ========================================= */}
              {/* DAILY STUDY TIME */}
              {/* ========================================= */}

              <div className="space-y-4 mb-6">

                <div>

                  <div className="flex items-center gap-2 mb-2">

                    <Clock
                      size={17}
                      className="text-[rgb(var(--accent))]"
                    />

                    <h2 className="text-sm font-semibold text-[rgb(var(--text))]">
                      Daily study time
                    </h2>

                  </div>

                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Choose when your daily study session starts and ends.
                  </p>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* ========================================= */}
                  {/* START TIME */}
                  {/* ========================================= */}

                  <div>

                    <label className="block text-xs font-semibold text-[rgb(var(--text-muted))] mb-2">
                      Start time
                    </label>

                    <div className="flex gap-2">

                      {/* HOUR */}
                      <select
                        value={dailyStartHour}
                        onChange={(e) =>
                          setDailyStartHour(e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>

                      {/* MINUTE */}
                      <select
                        value={dailyStartMinute}
                        onChange={(e) =>
                          setDailyStartMinute(e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {minutes.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>

                      {/* AM / PM */}
                      <select
                        value={dailyStartPeriod}
                        onChange={(e) =>
                          setDailyStartPeriod(e.target.value)
                        }
                        className="w-20 px-2 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>

                    </div>

                  </div>

                  {/* ========================================= */}
                  {/* END TIME */}
                  {/* ========================================= */}

                  <div>

                    <label className="block text-xs font-semibold text-[rgb(var(--text-muted))] mb-2">
                      End time
                    </label>

                    <div className="flex gap-2">

                      {/* HOUR */}
                      <select
                        value={dailyEndHour}
                        onChange={(e) =>
                          setDailyEndHour(e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>

                      {/* MINUTE */}
                      <select
                        value={dailyEndMinute}
                        onChange={(e) =>
                          setDailyEndMinute(e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {minutes.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>

                      {/* AM / PM */}
                      <select
                        value={dailyEndPeriod}
                        onChange={(e) =>
                          setDailyEndPeriod(e.target.value)
                        }
                        className="w-20 px-2 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>

                    </div>

                  </div>

                </div>

                {/* ========================================= */}
                {/* REMINDER MESSAGE */}
                {/* ========================================= */}

                <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">

                  <span className="text-xl">
                    🔔
                  </span>

                  <div>

                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      Daily study reminder
                    </p>

                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">

                      Your study session is scheduled from{' '}

                      <span className="font-semibold">
                        {formatTime(
                          dailyStartHour,
                          dailyStartMinute,
                          dailyStartPeriod
                        )}
                      </span>

                      {' '}to{' '}

                      <span className="font-semibold">
                        {formatTime(
                          dailyEndHour,
                          dailyEndMinute,
                          dailyEndPeriod
                        )}
                      </span>

                    </p>

                  </div>

                </div>

              </div>

              {/* ========================================= */}
              {/* REMINDER TOGGLE */}
              {/* ========================================= */}

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

              {/* ========================================= */}
              {/* BUTTONS */}
              {/* ========================================= */}

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