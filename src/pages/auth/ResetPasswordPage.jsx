import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { Input, FieldGroup } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { passwordIssues, PASSWORD_HELP } from '../../utils/passwordUtils';

// Landed on via the link in the Supabase recovery email
// (redirectTo: .../#/reset-password). Supabase exchanges the token in the
// URL for a temporary recovery session automatically; we just call
// updateUser({ password }) once the user submits a new password.
export default function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const issues = useMemo(() => passwordIssues(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (issues.length > 0) {
      setError('Please meet all password requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      await signOut();
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Could not update your password. The reset link may have expired — request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for ELEVORA">
      {done ? (
        <div className="text-center text-sm text-emerald-400 py-4">Password updated. Redirecting to sign in…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
              {error}
            </div>
          )}
          <FieldGroup label="New Password">
            <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <p className="mt-1.5 text-[11px] text-[rgb(var(--text-dim))]">{PASSWORD_HELP}</p>
          </FieldGroup>
          <FieldGroup label="Confirm New Password">
            <Input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Update Password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
