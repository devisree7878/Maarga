import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { Input, FieldGroup } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the recovery email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it"
      footer={
        <Link to="/login" className="accent-text font-semibold">Back to Sign In</Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <MailCheck size={22} className="text-emerald-400" />
          </div>
          <p className="text-sm text-[rgb(var(--text))] font-medium">Check your inbox</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">
            If an account exists for <span className="text-[rgb(var(--text))]">{email}</span>, a password reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">
              {error}
            </div>
          )}
          <FieldGroup label="Email">
            <Input type="email" required placeholder="email@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Send Recovery Email
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
