'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LogIn, Mail, Lock, Eye, EyeOff, Key, X, CheckCircle } from 'lucide-react';

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
      setForgotDone(true); // Still show success to not reveal account existence
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-indigo-500/15 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-purple-400/5 blur-3xl" />
      </div>

      <form onSubmit={submit} className="relative w-full max-w-sm animate-fade-in-up">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center p-3 border border-white/10 shadow-lg">
              <Image src="/images/logo/logo.png" alt="Dwaraka Academy" width={80} height={80} className="object-contain" unoptimized />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Dwaraka Academy</h1>
              <p className="text-xs mt-1 font-medium italic bg-gradient-to-r from-purple-300/60 via-white/80 to-purple-300/60 bg-clip-text text-transparent animate-shimmer">Excellence in Education Since 2020</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                <span className="w-1 h-1 rounded-full bg-purple-400/30" />
                <span className="h-px w-8 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
              </div>
              <p className="text-sm text-purple-200/80 mt-3 font-medium">Sign in to your account</p>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="bg-red-500/15 backdrop-blur-sm border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-200 font-medium animate-fade-in flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {err}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/70" />
              <input
                className="w-full rounded-xl bg-white/10 border border-white/10 pl-10 pr-4 py-3 text-sm text-white
                         placeholder-purple-300/50 transition-all duration-200
                         focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/15 focus:bg-white/15 focus:outline-none"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email" required />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-200">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/70" />
              <input
                className="w-full rounded-xl bg-white/10 border border-white/10 pl-10 pr-11 py-3 text-sm text-white
                         placeholder-purple-300/50 transition-all duration-200
                         focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/15 focus:bg-white/15 focus:outline-none"
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-xs text-purple-300/60 hover:text-purple-200 transition-colors font-medium">
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <button className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 text-sm font-bold
                           transition-all duration-200 ease-out shadow-lg shadow-purple-500/25
                           hover:from-purple-400 hover:to-purple-500 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5
                           active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2" disabled={loading}>
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
        <p className="text-center text-xs text-purple-300/50 mt-6">
          Dwaraka Academy Management System
        </p>
      </form>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closeForgot}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            {!forgotDone ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <button onClick={closeForgot} className="text-purple-300/60 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-purple-200/70 mb-4">Enter your email address and we'll reset your password. You'll receive a temporary password.</p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/70" />
                    <input
                      className="w-full rounded-xl bg-white/10 border border-white/10 pl-10 pr-4 py-3 text-sm text-white
                               placeholder-purple-300/50 transition-all duration-200
                               focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/15 focus:bg-white/15 focus:outline-none"
                      type="email" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="Enter your email" required />
                  </div>
                  <button type="submit" disabled={forgotLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 text-sm font-bold
                             transition-all duration-200 ease-out shadow-lg shadow-purple-500/25
                             hover:from-purple-400 hover:to-purple-500 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5
                             active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2">
                    {forgotLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-400/20">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Request Received</h3>
                <p className="text-sm text-purple-200/70 mb-6">
                  If an account with that email exists, the password has been reset. Please check your email or contact the administrator for your temporary password.
                </p>
                <button onClick={closeForgot}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 text-sm font-bold
                           transition-all duration-200 ease-out shadow-lg shadow-purple-500/25
                           hover:from-purple-400 hover:to-purple-500
                           flex items-center justify-center gap-2">
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
