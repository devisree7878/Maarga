
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import AuthShell from '../../components/auth/AuthShell';
import { Input, FieldGroup } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const ADMIN_EMAIL = 'devisreeadmin@gmail.com';

export default function LoginPage() {
  const { signInWithPassword } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const justRegistered = location.state?.justRegistered;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Admin account goes directly to Admin Dashboard
      if (cleanEmail === ADMIN_EMAIL) {
        navigate('/admin', { replace: true });
      } else {
        // Normal users go to the normal application
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);

      const message = err?.message || '';

      if (message.toLowerCase().includes('email rate exceeded')) {
        setError(
          'Too many email requests were sent. Please wait a few minutes and try signing in again.'
        );
      } else if (
        message.toLowerCase().includes('invalid login credentials')
      ) {
        setError('Incorrect email or password.');
      } else if (
        message.toLowerCase().includes('confirm your email')
      ) {
        setError(
          'Your account needs email confirmation. Please check your email or disable email confirmation in Supabase.'
        );
      } else {
        setError(message || 'Could not sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your progress"
      footer={
        <>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="accent-text font-semibold"
          >
            Create Account
          </Link>
        </>
      }
    >
      {justRegistered && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-3.5 py-2.5">
          Account created successfully. Sign in to continue.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            disabled={loading}
          />
        </FieldGroup>

        <div className="flex justify-end -mt-1">
          <Link
            to="/forgot-password"
            className="text-xs accent-text font-medium"
          >
            Forgot Password?
          </Link>
        </div>

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

          {!loading && 'Sign In'}
          {loading && 'Signing In...'}
        </Button>
      </form>
    </AuthShell>
  );
}

