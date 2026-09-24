
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import AuthShell from '../../components/auth/AuthShell';
import {
  Input,
  FieldGroup,
} from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { passwordIssues } from '../../utils/passwordUtils';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const issues = passwordIssues(password);

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  const passwordValid =
    password.length > 0 &&
    issues.length === 0 &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    /* ---------------------------------------------
       VALIDATE PASSWORD
    --------------------------------------------- */

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (issues.length > 0) {
      setError(
        'Please meet all password requirements.'
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        'Please confirm your new password.'
      );
      return;
    }

    if (!passwordsMatch) {
      setError(
        'Passwords do not match.'
      );
      return;
    }

    /* ---------------------------------------------
       UPDATE PASSWORD
    --------------------------------------------- */

    setLoading(true);

    try {
      await updatePassword(password);

      setSuccess(true);

      /* Give the user time to see success message */
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            passwordReset: true,
          },
        });
      }, 1800);

    } catch (err) {
      console.error(
        'MAARGA password update error:',
        err
      );

      const message =
        err?.message || '';

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes('session') ||
        lowerMessage.includes('expired') ||
        lowerMessage.includes('invalid')
      ) {
        setError(
          'This password reset link has expired or is invalid. Please request a new reset link.'
        );
      } else if (
        lowerMessage.includes('same password')
      ) {
        setError(
          'Please choose a different password.'
        );
      } else {
        setError(
          message ||
            'Could not update your password. Please try again.'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     SUCCESS SCREEN
  ================================================= */

  if (success) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="Your MAARGA password has been changed successfully."
        footer={
          <Link
            to="/login"
            className="accent-text font-semibold"
          >
            Back to Sign In
          </Link>
        }
      >
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-4">

          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />

            <span className="text-sm font-medium">
              Password updated successfully.
            </span>
          </div>

          <p className="mt-2 text-xs text-emerald-300/80">
            Redirecting you to sign in...
          </p>

        </div>
      </AuthShell>
    );
  }

  /* =================================================
     RESET PASSWORD FORM
  ================================================= */

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Choose a strong password for your MAARGA account."
      footer={
        <Link
          to="/login"
          className="accent-text font-semibold"
        >
          Back to Sign In
        </Link>
      }
    >

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">

          <div className="flex items-start gap-2">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>
          </div>

        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* NEW PASSWORD */}
        <FieldGroup label="New Password">
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            autoComplete="new-password"
            disabled={loading}
          />
        </FieldGroup>

        {/* CONFIRM PASSWORD */}
        <FieldGroup label="Confirm Password">
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(
                e.target.value
              );
              setError('');
            }}
            autoComplete="new-password"
            disabled={loading}
          />

          {confirmPassword.length > 0 &&
            !passwordsMatch && (
              <p className="mt-1.5 text-[11px] text-red-400">
                Passwords do not match.
              </p>
            )}
        </FieldGroup>

        {/* PASSWORD REQUIREMENTS */}
        {password.length > 0 &&
          issues.length > 0 && (
            <div className="rounded-xl bg-[rgb(var(--surface-2))] px-3.5 py-3">

              <p className="text-xs font-medium text-[rgb(var(--text))] mb-2">
                Password requirements
              </p>

              <ul className="space-y-1">
                {issues.map(
                  (issue, index) => (
                    <li
                      key={`${issue}-${index}`}
                      className="text-[11px] text-[rgb(var(--text-muted))]"
                    >
                      • {issue}
                    </li>
                  )
                )}
              </ul>

            </div>
          )}

        {/* SUBMIT */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            loading ||
            !passwordValid
          }
        >

          {loading && (
            <Loader2
              size={15}
              className="animate-spin"
            />
          )}

          {loading
            ? 'Updating Password...'
            : 'Update Password'}

        </Button>

      </form>
    </AuthShell>
  );
}
