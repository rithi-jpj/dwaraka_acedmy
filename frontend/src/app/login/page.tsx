'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LogIn, Mail, Lock, Eye, EyeOff, Key, X, CheckCircle, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotDone(true);
    } catch {
      setForgotDone(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotDone(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden aurora-bg">
      {/* Aurora animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-accent-400/10 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-brand-300/5 blur-3xl"
        />
      </div>

      <form onSubmit={submit} className="relative w-full max-w-sm animate-fade-in-up">
        <div className="glass-card-strong rounded-3xl p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-800 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Dwaraka Academy</h1>
              <p className="text-xs mt-1 text-navy-500 font-medium">Excellence in Education Since 2020</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="h-px w-8 bg-navy-200" />
                <span className="w-1 h-1 rounded-full bg-navy-300" />
                <span className="h-px w-8 bg-navy-200" />
              </div>
              <p className="text-sm text-navy-600 mt-3 font-medium">Sign in to your account</p>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium animate-fade-in flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {err}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-navy-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                className="input pl-10"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email" required />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-navy-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                className="input pl-10 pr-11"
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-xs text-navy-500 hover:text-brand-800 transition-colors font-medium">
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign in
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/50 mt-6">
          Dwaraka Academy Management System
        </p>
      </form>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closeForgot}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass-card-strong rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            {!forgotDone ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy-900">Reset Password</h3>
                  <button onClick={closeForgot} className="text-navy-400 hover:text-navy-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-navy-500 mb-4">Enter your email address to receive a temporary password.</p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input className="input pl-10" type="email" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="Enter your email" required />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full">
                    {forgotLoading ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
                    ) : (
                      <><Key className="w-4 h-4" />Reset Password</>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">Request Received</h3>
                <p className="text-sm text-navy-500 mb-6">
                  If an account exists with that email, the password has been reset. Please check your email.
                </p>
                <button onClick={closeForgot} className="btn-primary w-full">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
