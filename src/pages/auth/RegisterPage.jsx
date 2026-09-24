
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';

import AuthShell from '../../components/auth/AuthShell';
import { Input, FieldGroup } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { passwordIssues, PASSWORD_HELP } from '../../utils/passwordUtils';

export default function RegisterPage() {
  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const issues = useMemo(() => passwordIssues(password), [password]);
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (issues.length > 0) {
      setError('Please meet all password requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signUpWithPassword({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      navigate('/login', {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your ELEVORA account"
      subtitle="Start turning your goals into daily progress"
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="accent-text font-semibold"
          >
            Sign In
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup label="Full Name">
          <Input
            required
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            disabled={loading}
          />
        </FieldGroup>

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

        <FieldGroup label="Password">
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouchedPassword(true)}
            autoComplete="new-password"
            disabled={loading}
          />

          {touchedPassword && (
            <ul className="mt-2 space-y-1">
              {[
                'At least 8 characters',
                'One uppercase letter',
                'One lowercase letter',
                'One digit',
                'One special character',
              ].map((rule) => {
                const met = !issues.includes(rule);

                return (
                  <li
                    key={rule}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      met
                        ? 'text-emerald-400'
                        : 'text-[rgb(var(--text-dim))]'
                    }`}
                  >
                    {met ? <Check size={11} /> : <X size={11} />}
                    {rule}
                  </li>
                );
              })}
            </ul>
          )}

          {!touchedPassword && (
            <p className="mt-1.5 text-[11px] text-[rgb(var(--text-dim))]">
              {PASSWORD_HELP}
            </p>
          )}
        </FieldGroup>

        <FieldGroup label="Confirm Password">
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-[11px] text-red-400">
              Passwords do not match
            </p>
          )}
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

          {loading ? 'Creating Account...' : 'Register'}
        </Button>
      </form>
    </AuthShell>
  );
}

