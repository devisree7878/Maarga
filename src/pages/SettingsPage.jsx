import React, { useRef, useState } from 'react';
import {
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  Check,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Input,
  FieldGroup,
  Textarea,
  Select,
} from '../components/ui/Field';

import CategoryManager from '../components/categories/CategoryManager';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ACCENTS } from '../data/schema';
import {
  passwordIssues,
  PASSWORD_HELP,
} from '../utils/passwordUtils';

const DURATIONS = [10, 20, 30, 60, 90, 120, 180, 365];

/* =========================================================
   PERSONAL INFORMATION
========================================================= */

function PersonalInfoSection() {
  const { profile } = useAuth();

  return (
    <SectionCard title="Personal Information">
      <div className="space-y-4">

        {/* Name */}
        <div>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-1">
            Name
          </p>

          <p className="text-sm text-[rgb(var(--text))]">
            {profile?.full_name || '—'}
          </p>
        </div>

        {/* Email */}
        <div>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-1">
            Email
          </p>

          <p className="text-sm text-[rgb(var(--text))]">
            {profile?.email || '—'}
          </p>
        </div>

        {/* Password */}
        <div>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-1">
            Password
          </p>

          <p className="text-sm tracking-widest text-[rgb(var(--text))]">
            ••••••••••••
          </p>
        </div>

      </div>
    </SectionCard>
  );
}

/* =========================================================
   CHANGE PASSWORD
========================================================= */

function PasswordSection() {
  const { updatePassword } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const issues = passwordIssues(next);

  const submit = async (e) => {
    e.preventDefault();

    setStatus('');

    /* Current password required */
    if (!current) {
      setStatus('error:Please enter your current password.');
      return;
    }

    /* New password requirements */
    if (issues.length > 0) {
      setStatus('error:Please meet all password requirements.');
      return;
    }

    /* Confirm password */
    if (next !== confirm) {
      setStatus('error:Passwords do not match.');
      return;
    }

    /* Prevent same password */
    if (current === next) {
      setStatus(
        'error:New password must be different from your current password.'
      );
      return;
    }

    setSaving(true);

    try {
      await updatePassword(current, next);

      setStatus('success:Password updated successfully.');

      setCurrent('');
      setNext('');
      setConfirm('');

      setShowCurrent(false);
      setShowNext(false);
      setShowConfirm(false);
    } catch (err) {
      setStatus(
        `error:${err?.message || 'Failed to update password.'}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Change Password"
      description="Verify your current password before creating a new one."
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >

        {/* Current Password */}
        <FieldGroup label="Current Password">
          <div className="relative">

            <Input
              type={showCurrent ? 'text' : 'password'}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter your current password"
              className="pr-11"
              autoComplete="current-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowCurrent((value) => !value)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] transition-colors"
              aria-label={
                showCurrent
                  ? 'Hide current password'
                  : 'Show current password'
              }
            >
              {showCurrent ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>

          </div>
        </FieldGroup>

        {/* New Password */}
        <FieldGroup label="New Password">
          <div className="relative">

            <Input
              type={showNext ? 'text' : 'password'}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Enter your new password"
              className="pr-11"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowNext((value) => !value)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] transition-colors"
              aria-label={
                showNext
                  ? 'Hide new password'
                  : 'Show new password'
              }
            >
              {showNext ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>

          </div>
        </FieldGroup>

        {/* Confirm New Password */}
        <FieldGroup label="Confirm New Password">
          <div className="relative">

            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your new password"
              className="pr-11"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirm((value) => !value)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text))] transition-colors"
              aria-label={
                showConfirm
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirm ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>

          </div>
        </FieldGroup>

        {/* Button + Password Requirements */}
        <div className="flex items-center justify-between flex-wrap gap-3">

          <p className="text-[11px] text-[rgb(var(--text-dim))]">
            {PASSWORD_HELP}
          </p>

          <Button
            type="submit"
            size="sm"
            disabled={saving}
          >
            {saving && (
              <Loader2
                size={13}
                className="animate-spin"
              />
            )}

            {saving
              ? 'Updating...'
              : 'Change Password'}
          </Button>

        </div>

        {/* Status */}
        {status && (
          <p
            className={`text-xs ${
              status.startsWith('error')
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
          >
            {status.split(':').slice(1).join(':')}
          </p>
        )}

      </form>
    </SectionCard>
  );
}

/* =========================================================
   GOAL
========================================================= */

function GoalSection() {
  const {
    profile,
    refreshProfile,
  } = useAuth();

  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(
    profile?.goal || ''
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);

    await supabase
      .from('profiles')
      .update({
        goal: goal.trim(),
      })
      .eq('id', profile.id);

    await refreshProfile();

    setSaving(false);
    setEditing(false);
  };

  return (
    <SectionCard
      title="Goal"
      description="What you're working toward."
    >
      {editing ? (
        <div className="space-y-3">

          <Textarea
            rows={2}
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value)
            }
          />

          <div className="flex gap-2">

            <Button
              size="sm"
              onClick={save}
              disabled={
                saving || !goal.trim()
              }
            >
              {saving && (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              )}

              Save
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setGoal(profile?.goal || '');
              }}
            >
              Cancel
            </Button>

          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">

          <p className="text-sm text-[rgb(var(--text))]">
            {profile?.goal || 'No goal set.'}
          </p>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            Edit Goal
          </Button>

        </div>
      )}
    </SectionCard>
  );
}

/* =========================================================
   SCHEDULE
========================================================= */
/* =========================================================
   SCHEDULE
========================================================= */

function ScheduleSection() {
  const {
    profile,
    refreshProfile,
  } = useAuth();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // -----------------------------------------
  // Convert database HH:MM → 12-hour format
  // -----------------------------------------
  const parseTime = (time) => {
    if (!time) {
      return {
        hour: '07',
        minute: '30',
        period: 'AM',
      };
    }

    const [hours, minutes] = time.split(':');
    let hour = Number(hours);
    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return {
      hour: String(hour).padStart(2, '0'),
      minute: minutes || '00',
      period,
    };
  };

  const start = parseTime(profile?.daily_start_time);
  const end = parseTime(profile?.daily_end_time);

  const [duration, setDuration] = useState(
    profile?.schedule_days || 90
  );

  const [startHour, setStartHour] = useState(start.hour);
  const [startMinute, setStartMinute] = useState(start.minute);
  const [startPeriod, setStartPeriod] = useState(start.period);

  const [endHour, setEndHour] = useState(end.hour);
  const [endMinute, setEndMinute] = useState(end.minute);
  const [endPeriod, setEndPeriod] = useState(end.period);

  const [remindersEnabled, setRemindersEnabled] = useState(
    profile?.reminders_enabled !== false
  );

  const hours = Array.from(
    { length: 12 },
    (_, i) => String(i + 1).padStart(2, '0')
  );

  const minutes = [
    '00',
    '05',
    '10',
    '15',
    '20',
    '25',
    '30',
    '35',
    '40',
    '45',
    '50',
    '55',
  ];

  // -----------------------------------------
  // Convert 12-hour time → minutes
  // -----------------------------------------
  const toMinutes = (hour, minute, period) => {
    let h = Number(hour);

    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    return h * 60 + Number(minute);
  };

  // -----------------------------------------
  // Convert 12-hour time → database HH:MM
  // -----------------------------------------
  const toDatabaseTime = (hour, minute, period) => {
    let h = Number(hour);

    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  // -----------------------------------------
  // SAVE EVERYTHING
  // -----------------------------------------
  const saveSchedule = async () => {
    setMessage('');

    const days = Number(duration);

    if (!days || days < 1 || days > 365) {
      setMessage('error:Plan duration must be between 1 and 365 days.');
      return;
    }

    const startTotal = toMinutes(
      startHour,
      startMinute,
      startPeriod
    );

    const endTotal = toMinutes(
      endHour,
      endMinute,
      endPeriod
    );

    if (startTotal >= endTotal) {
      setMessage(
        'error:End time must be later than start time.'
      );
      return;
    }

    setSaving(true);

    const dailyStartTime = toDatabaseTime(
      startHour,
      startMinute,
      startPeriod
    );

    const dailyEndTime = toDatabaseTime(
      endHour,
      endMinute,
      endPeriod
    );

    const { error } = await supabase
      .from('profiles')
      .update({
        schedule_days: days,
        daily_start_time: dailyStartTime,
        daily_end_time: dailyEndTime,
        reminders_enabled: remindersEnabled,
      })
      .eq('id', profile.id);

    if (error) {
      setMessage(`error:${error.message}`);
      setSaving(false);
      return;
    }

    await refreshProfile();

    setMessage('success:Schedule updated successfully.');
    setSaving(false);
  };

  return (
    <SectionCard
      title="Schedule & Daily Study Time"
      description="Change your plan duration and daily study timing anytime."
    >

      <div className="space-y-6">

        {/* =========================================
            PLAN DURATION
        ========================================= */}

        <div>

          <p className="text-sm font-semibold text-[rgb(var(--text))]">
            Plan duration
          </p>

          <p className="text-xs text-[rgb(var(--text-muted))] mt-1 mb-3">
            Choose any number of days from 1 to 365.
          </p>

          <div className="flex gap-2">

            <Input
              type="number"
              min="1"
              max="365"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="max-w-[180px]"
            />

            <div className="flex items-center px-4 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-sm text-[rgb(var(--text-muted))]">
              days
            </div>

          </div>

          {/* QUICK OPTIONS */}

          <div className="flex flex-wrap gap-2 mt-3">

            {[10, 20, 30, 60, 90, 120, 180, 365].map(
              (days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    Number(duration) === days
                      ? 'accent-border bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                      : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                  }`}
                >
                  {days}
                </button>
              )
            )}

          </div>

        </div>

        {/* =========================================
            DAILY STUDY TIME
        ========================================= */}

        <div>

          <p className="text-sm font-semibold text-[rgb(var(--text))]">
            Daily study time
          </p>

          <p className="text-xs text-[rgb(var(--text-muted))] mt-1 mb-4">
            Change when your daily study session starts and ends.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* START TIME */}

            <div>

              <label className="block text-xs font-semibold text-[rgb(var(--text-muted))] mb-2">
                Start time
              </label>

              <div className="flex gap-2">

                <select
                  value={startHour}
                  onChange={(e) =>
                    setStartHour(e.target.value)
                  }
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>

                <select
                  value={startMinute}
                  onChange={(e) =>
                    setStartMinute(e.target.value)
                  }
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>

                <select
                  value={startPeriod}
                  onChange={(e) =>
                    setStartPeriod(e.target.value)
                  }
                  className="w-20 px-2 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>

              </div>

            </div>

            {/* END TIME */}

            <div>

              <label className="block text-xs font-semibold text-[rgb(var(--text-muted))] mb-2">
                End time
              </label>

              <div className="flex gap-2">

                <select
                  value={endHour}
                  onChange={(e) =>
                    setEndHour(e.target.value)
                  }
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>

                <select
                  value={endMinute}
                  onChange={(e) =>
                    setEndMinute(e.target.value)
                  }
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>

                <select
                  value={endPeriod}
                  onChange={(e) =>
                    setEndPeriod(e.target.value)
                  }
                  className="w-20 px-2 py-3 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] text-[rgb(var(--text))] outline-none"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>

              </div>

            </div>

          </div>

          {/* =========================================
              CURRENT SCHEDULE PREVIEW
          ========================================= */}

          <div className="flex items-center gap-3 p-4 mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">

            <span className="text-xl">
              🔔
            </span>

            <div>

              <p className="text-sm font-semibold text-[rgb(var(--text))]">
                Daily study reminder
              </p>

              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
                Your study session runs from{' '}

                <span className="font-semibold text-[rgb(var(--text))]">
                  {startHour}:{startMinute} {startPeriod}
                </span>

                {' '}to{' '}

                <span className="font-semibold text-[rgb(var(--text))]">
                  {endHour}:{endMinute} {endPeriod}
                </span>

              </p>

            </div>

          </div>

        </div>

        {/* =========================================
            REMINDERS
        ========================================= */}

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-sm font-semibold text-[rgb(var(--text))]">
              Daily reminders
            </p>

            <p className="text-xs text-[rgb(var(--text-dim))] mt-1">
              Remind me when my study session starts.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setRemindersEnabled(
                !remindersEnabled
              )
            }
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              remindersEnabled
                ? 'accent-bg'
                : 'bg-[rgb(var(--surface-3))]'
            }`}
          >

            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                remindersEnabled
                  ? 'translate-x-5'
                  : 'translate-x-0.5'
              }`}
            />

          </button>

        </div>

        {/* =========================================
            SAVE BUTTON
        ========================================= */}

        <div className="flex items-center gap-3">

          <Button
            type="button"
            onClick={saveSchedule}
            disabled={saving}
          >

            {saving && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            {saving
              ? 'Saving...'
              : 'Save Schedule'}

          </Button>

          {message && (
            <p
              className={`text-xs ${
                message.startsWith('error')
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {message.split(':').slice(1).join(':')}
            </p>
          )}

        </div>

      </div>

    </SectionCard>
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function AccountSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <SectionCard title="Account">
      <Button
        variant="danger"
        onClick={handleLogout}
      >
        <LogOut size={14} />
        Log Out
      </Button>
    </SectionCard>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  description,
  children,
}) {
  return (
    <Card className="p-4 md:p-5">

      <p className="text-sm font-semibold text-[rgb(var(--text))]">
        {title}
      </p>

      {description ? (
        <p className="text-xs text-[rgb(var(--text-muted))] mt-1 mb-4">
          {description}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      {children}

    </Card>
  );
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

export default function SettingsPage() {
  const {
    data,
    updateSettings,
    setStartDate,
    exportData,
    importData,
    resetAllData,
  } = useApp();

  const fileRef = useRef(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [startDateConfirm, setStartDateConfirm] = useState(null);
  const [importMsg, setImportMsg] = useState('');

  /* File import */
  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      !window.confirm(
        'Importing will replace your current data with this backup. Continue?'
      )
    ) {
      e.target.value = '';
      return;
    }

    try {
      await importData(file);

      setImportMsg(
        'Backup imported successfully.'
      );
    } catch (err) {
      setImportMsg(
        'Import failed: the file is not a valid ELEVORA backup.'
      );
    } finally {
      e.target.value = '';

      setTimeout(() => {
        setImportMsg('');
      }, 4000);
    }
  };

  /* Start date */
  const applyStartDate = (val) => {
    if (val === data.settings.startDate) {
      return;
    }

    setStartDateConfirm(val);
  };

  return (
    <div>

      <Header
        title="Settings"
        subtitle="Make ELEVORA yours"
      />

      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-5 max-w-3xl">

        {/* Personal Information */}
        <PersonalInfoSection />

        {/* Change Password */}
        <PasswordSection />

        {/* Goal */}
        <GoalSection />

        {/* Schedule */}
        <ScheduleSection />

        {/* Appearance */}
        <SectionCard title="Appearance">

          <div className="flex items-center gap-2 mb-5">

            <button
              onClick={() =>
                updateSettings({
                  theme: 'dark',
                })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                data.settings.theme === 'dark'
                  ? 'accent-border bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
              }`}
            >
              <Moon size={15} />
              Dark
            </button>

            <button
              onClick={() =>
                updateSettings({
                  theme: 'light',
                })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                data.settings.theme === 'light'
                  ? 'accent-border bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
              }`}
            >
              <Sun size={15} />
              Light
            </button>

          </div>

          <p className="text-xs font-medium text-[rgb(var(--text-muted))] mb-2">
            Accent color
          </p>

          <div className="flex flex-wrap gap-2.5">

            {Object.entries(ACCENTS).map(
              ([key, a]) => (
                <button
                  key={key}
                  onClick={() =>
                    updateSettings({
                      accent: key,
                    })
                  }
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: `rgb(${a.accent})`,
                    borderColor:
                      data.settings.accent === key
                        ? 'rgb(var(--text))'
                        : 'transparent',
                  }}
                  title={a.name}
                >
                  {data.settings.accent === key && (
                    <Check
                      size={15}
                      className="text-white"
                      strokeWidth={3}
                    />
                  )}
                </button>
              )
            )}

          </div>
        </SectionCard>

        {/* Plan Dates */}
        <SectionCard
          title="Plan Dates"
          description="How dates are calculated for your plan."
        >
          <div className="grid sm:grid-cols-2 gap-4">

            <FieldGroup label="Start date">
              <Input
                type="date"
                value={data.settings.startDate}
                onChange={(e) =>
                  applyStartDate(e.target.value)
                }
              />
            </FieldGroup>

            <FieldGroup label="Duration">
              <Input
                value={`${data.settings.duration} days`}
                disabled
                className="opacity-60"
              />
            </FieldGroup>

          </div>
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="Preferences">

          {/* Time Format */}
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-[rgb(var(--text))]">
                Time format
              </p>

              <p className="text-xs text-[rgb(var(--text-dim))]">
                Used when displaying timestamps
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[rgb(var(--surface-2))] rounded-lg p-1">

              <button
                onClick={() =>
                  updateSettings({
                    timeFormat: 12,
                  })
                }
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  data.settings.timeFormat === 12
                    ? 'accent-bg text-white'
                    : 'text-[rgb(var(--text-muted))]'
                }`}
              >
                12h
              </button>

              <button
                onClick={() =>
                  updateSettings({
                    timeFormat: 24,
                  })
                }
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  data.settings.timeFormat === 24
                    ? 'accent-bg text-white'
                    : 'text-[rgb(var(--text-muted))]'
                }`}
              >
                24h
              </button>

            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between mt-4">

            <div>
              <p className="text-sm text-[rgb(var(--text))]">
                Notifications
              </p>

              <p className="text-xs text-[rgb(var(--text-dim))]">
                Local reminders (if supported by your browser)
              </p>
            </div>

            <button
              onClick={() =>
                updateSettings({
                  notifications:
                    !data.settings.notifications,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                data.settings.notifications
                  ? 'accent-bg'
                  : 'bg-[rgb(var(--surface-3))]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  data.settings.notifications
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>

          </div>

        </SectionCard>

        {/* Categories */}
        <SectionCard
          title="Categories"
          description="Add, rename, recolor, reorder, or delete your categories."
        >
          <CategoryManager />
        </SectionCard>

        {/* Data */}
        <SectionCard
          title="Data"
          description="Your data syncs to your ELEVORA account. You can still export a local backup."
        >
          <div className="flex flex-col sm:flex-row gap-2.5">

            <Button
              variant="secondary"
              onClick={exportData}
            >
              <Download size={14} />
              Export Data
            </Button>

            <Button
              variant="secondary"
              onClick={handleImportClick}
            >
              <Upload size={14} />
              Import Data
            </Button>

            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="danger"
              onClick={() => setResetOpen(true)}
              className="sm:ml-auto"
            >
              <Trash2 size={14} />
              Reset All Data
            </Button>

          </div>

          {importMsg && (
            <p className="text-xs text-[rgb(var(--text-muted))] mt-3">
              {importMsg}
            </p>
          )}
        </SectionCard>

        {/* Account */}
        <AccountSection />

      </div>

      {/* Reset Dialog */}
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetAllData}
        title="Reset all data?"
        message="This permanently deletes every day, task, problem, mistake, and goal. Export a backup first if you're not sure. This cannot be undone."
        confirmLabel="Reset Everything"
        danger
      />

      {/* Start Date Dialog */}
      <ConfirmDialog
        open={!!startDateConfirm}
        onClose={() =>
          setStartDateConfirm(null)
        }
        onConfirm={() =>
          setStartDate(startDateConfirm)
        }
        title="Change start date?"
        message="This recalculates the dates shown for every day. Your tasks, notes, and progress are all kept exactly as they are."
        confirmLabel="Change Date"
      />

    </div>
  );
}