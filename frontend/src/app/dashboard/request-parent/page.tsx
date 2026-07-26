'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RequestParentPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ parent_name: '', parent_email: '', parent_phone: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadMyRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const { data } = await api.get('/parent-requests/my');
      setMyRequests(data);
    } catch { /* ignore */ }
    finally { setRequestsLoading(false); }
  }, []);

  useEffect(() => { loadMyRequests(); }, [loadMyRequests]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.parent_name.trim()) return setFormError('Parent name is required');
    if (!form.parent_email.trim()) return setFormError('Parent email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parent_email)) return setFormError('Valid email is required');

    setLoading(true);
    try {
      await api.post('/parent-requests', form);
      showToast('success', 'Parent account request submitted successfully');
      setForm({ parent_name: '', parent_email: '', parent_phone: '' });
      loadMyRequests();
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const hasPendingRequest = myRequests.some(r => r.status === 'pending');
  const hasApprovedRequest = myRequests.some(r => r.status === 'approved');

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <div className="card">
        <h1 className="text-2xl font-bold">Request Parent Account</h1>
        <p className="text-sm text-slate-500 mt-1">
          {hasApprovedRequest
            ? 'A parent account is already linked to your profile.'
            : 'Submit a request for your parent or guardian to get an account to monitor your academic progress.'}
        </p>
      </div>

      {!hasApprovedRequest && (
        <div className="card">
          <h2 className="font-semibold mb-4">
            {hasPendingRequest ? 'Update Request' : 'Parent / Guardian Details'}
          </h2>

          {hasPendingRequest && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm text-amber-800">
              You already have a pending request. The admin will review it shortly. You can submit a new request if needed.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Parent / Guardian Name *</label>
                <input className="input" placeholder="Enter parent name" value={form.parent_name}
                  onChange={e => setForm({ ...form, parent_name: e.target.value })} required disabled={loading} />
              </div>
              <div>
                <label className="label">Parent Email *</label>
                <input className="input" type="email" placeholder="parent@example.com" value={form.parent_email}
                  onChange={e => setForm({ ...form, parent_email: e.target.value })} required disabled={loading} />
              </div>
              <div>
                <label className="label">Parent Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.parent_phone}
                  onChange={e => setForm({ ...form, parent_phone: e.target.value })} disabled={loading} />
              </div>
            </div>
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</div>}
            <button className="btn" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">My Requests</h2>
        {requestsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-slate-500 font-medium">No requests submitted yet</p>
            <p className="text-sm text-slate-400 mt-1">Fill out the form above to submit your first request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4">Parent Name</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">Phone</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 font-medium">{r.parent_name}</td>
                    <td className="px-4 text-slate-600">{r.parent_email}</td>
                    <td className="px-4 text-slate-500">{r.parent_phone || '—'}</td>
                    <td className="px-4">{statusBadge(r.status)}</td>
                    <td className="px-4 text-slate-500 text-sm">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
