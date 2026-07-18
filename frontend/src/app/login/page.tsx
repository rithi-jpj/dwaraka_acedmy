'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const u = await login(email, password);
      router.push(u.must_change_password ? '/change-password' : '/dashboard');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Dwaraka Academy</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
