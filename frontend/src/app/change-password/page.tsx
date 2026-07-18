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

  if (!user) { if (typeof window !== 'undefined') router.replace('/login'); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr('Password must be at least 8 characters');
    if (pw !== pw2) return setErr('Passwords do not match');
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: pw });
      await refresh();
      setOk(true);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed');
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
        {ok && <div className="text-sm text-green-600">Password updated.</div>}
        <button className="btn w-full">Update password</button>
      </form>
    </div>
  );
}
