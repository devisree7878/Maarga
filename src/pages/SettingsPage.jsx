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

function ScheduleSection() {
  const {
    profile,
    refreshProfile,
  } = useAuth();

  const [saving, setSaving] = useState(false);

  const changeDuration = async (e) => {
    const days = Number(e.target.value);

    setSaving(true);

    await supabase
      .from('profiles')
      .update({
        schedule_days: days,
      })
      .eq('id', profile.id);

    await refreshProfile();

    setSaving(false);
  };

  return (
    <SectionCard
      title="Schedule"
      description="How many days your plan runs for. Existing progress is kept."
    >
      <div className="flex items-center gap-3">

        <Select
          value={profile?.schedule_days}
          onChange={changeDuration}
          className="max-w-[160px]"
        >
          {DURATIONS.map((d) => (
            <option
              key={d}
              value={d}
            >
              {d} days
            </option>
          ))}
        </Select>

        {saving && (
          <Loader2
            size={14}
            className="animate-spin text-[rgb(var(--text-dim))]"
          />
        )}

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