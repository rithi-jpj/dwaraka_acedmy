'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function ChangePasswordPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) { if (typeof window !== 'undefined') router.replace('/login'); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    if (pw.length < 8) return setErr('Password must be at least 8 characters');
    if (pw !== pw2) return setErr('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: pw });
      await refresh();
      setOk(true);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (e: any) {
      if (e?.response?.data?.error) {
        setErr(e.response.data.error);
      } else if (e?.response?.data?.details?.length) {
        setErr(e.response.data.details.join(', '));
      } else if (e?.request) {
        setErr('No response from server. Please check your connection.');
      } else {
        setErr('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">Change password</h1>
        <p className="text-sm text-slate-500">You must set a new password before continuing.</p>
        <div><label className="label">Current password</label>
          <input className="input" type="password" value={cur} onChange={e => setCur(e.target.value)} required /></div>
        <div><label className="label">New password</label>
          <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} required /></div>
        <div><label className="label">Confirm new password</label>
          <input className="input" type="password" value={pw2} onChange={e => setPw2(e.target.value)} required /></div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-green-600">Password updated. Redirecting to dashboard...</div>}
        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating password...
            </>
          ) : 'Update password'}
        </button>
      </form>
    </div>
  );
}
