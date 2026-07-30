'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { Bell, Megaphone, Users, GraduationCap, UserCheck, Clock, Send } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', batch_id: '', batch_name: '' });
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => api.get('/announcements').then(r => setItems(r.data));
  useEffect(() => {
    load();
    api.get('/batches/my').then(r => setBatches(r.data)).catch(() => {});
    const s = getSocket();
    s?.on('announcement:new', load);
    return () => { s?.off('announcement:new', load); };
  }, []);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const payload: any = { title: form.title, body: form.body, audience: form.audience };
      if (form.audience === 'morning_batch' || form.audience === 'evening_batch') {
        const batch = batches.find(b => b.id === form.batch_id);
        payload.batch_id = form.batch_id;
        payload.batch_name = batch?.name || '';
      }
      await api.post('/announcements', payload);
      setForm({ title: '', body: '', audience: 'all', batch_id: '', batch_name: '' });
      showToast('Announcement published successfully', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to publish', 'error');
    }
    setLoading(false);
  };

  const canPost = user?.role === 'admin' || user?.role === 'teacher';

  const audienceLabels: Record<string, { label: string; icon: any }> = {
    all: { label: 'Everyone', icon: Users },
    students: { label: 'Students', icon: GraduationCap },
    teachers: { label: 'Teachers', icon: GraduationCap },
    parents: { label: 'Parents', icon: UserCheck },
    morning_batch: { label: 'Morning Batch', icon: Users },
    evening_batch: { label: 'Evening Batch', icon: Users },
  };

  return (
    <div className="space-y-6">
      {toast && <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Announcements</h1>
          <p className="text-sm text-navy-500 mt-1">
            {canPost ? 'Create and manage announcements for students, teachers, and parents' : 'View announcements from your teachers and administrators'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-navy-400 bg-navy-50 px-3 py-1.5 rounded-xl">
            <Bell className="w-3.5 h-3.5" />
            {items.length} announcement{items.length !== 1 && 's'}
          </span>
        </div>
      </div>

      {/* Create Form */}
      {canPost && (
        <div className="card border border-brand/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900">New Announcement</h2>
              <p className="text-xs text-navy-400">Share updates with the academy community</p>
            </div>
          </div>
          <form onSubmit={post} className="space-y-4">
            <input className="input" placeholder="Announcement title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input min-h-[100px]" placeholder="Write your announcement..."
              value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
            <div className="flex flex-wrap items-center gap-3">
              <select className="input max-w-[200px]" value={form.audience}
                onChange={e => setForm({ ...form, audience: e.target.value, batch_id: '' })}>
                <option value="all">All</option>
                <option value="students">All Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
                <option value="morning_batch">Morning Batch</option>
                <option value="evening_batch">Evening Batch</option>
              </select>
              {(form.audience === 'morning_batch' || form.audience === 'evening_batch') && (
                <select className="input max-w-[250px]" value={form.batch_id}
                  onChange={e => setForm({ ...form, batch_id: e.target.value })} required>
                  <option value="">Select {form.audience === 'morning_batch' ? 'Morning' : 'Evening'} batch…</option>
                  {batches.filter(b => b.shift === form.audience.replace('_batch', '')).map(b => (
                    <option key={b.id} value={b.id}>{b.name} — {b.Subject?.name}</option>
                  ))}
                </select>
              )}
              <button type="submit" className="btn" disabled={loading}>
                <Send className="w-4 h-4" />
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <div className="card">
        <h2 className="section-title mb-6">Announcement Feed</h2>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-navy-300" />
            </div>
            <p className="text-navy-500 font-medium">No announcements yet</p>
            <p className="text-sm text-navy-400 mt-1">When announcements are posted, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(a => {
              const audienceMeta = audienceLabels[a.audience] || { label: a.audience, icon: Users };
              const AudIcon = audienceMeta.icon;
              return (
                <div key={a.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-navy-50/50 transition-colors -mx-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0 border border-brand-200/50">
                    <Megaphone className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-navy-900">{a.title}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-navy-50 text-navy-500 text-[10px] font-medium border border-navy-100">
                        <AudIcon className="w-3 h-3" />
                        {audienceMeta.label}
                      </span>
                    </div>
                    <p className="text-sm text-navy-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-navy-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                      <span>by {a.author?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
