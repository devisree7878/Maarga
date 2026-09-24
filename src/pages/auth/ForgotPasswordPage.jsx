
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

import AuthShell from '../../components/auth/AuthShell';
import { Input, FieldGroup } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSent(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(cleanEmail);
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);

      const message = err?.message || '';

      if (message.toLowerCase().includes('rate limit')) {
        setError(
          'Too many reset requests. Please wait a few minutes and try again.'
        );
      } else {
        setError(
          message || 'Could not send the reset email. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a password reset link."
      footer={
        <Link
          to="/login"
          className="accent-text font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      }
    >
      {sent && (
        <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-medium">
                Reset link sent
              </p>

              <p className="mt-1 text-xs text-emerald-300/80">
                Check your email and click the password reset
                link to create a new password.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}

      {!sent && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <FieldGroup label="Email">
            <Input
              type="email"
              required
              placeholder="email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </FieldGroup>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {loading
              ? 'Sending Reset Link...'
              : 'Send Reset Link'}
          </Button>
        </form>
      )}

      {sent && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            setSent(false);
            setError('');
          }}
        >
          Send Again
        </Button>
      )}
    </AuthShell>
  );
}

