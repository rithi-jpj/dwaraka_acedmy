'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', batch_id: '', batch_name: '' });
  const [batches, setBatches] = useState<any[]>([]);

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
    const payload: any = { title: form.title, body: form.body, audience: form.audience };
    if (form.audience === 'morning_batch' || form.audience === 'evening_batch') {
      const batch = batches.find(b => b.id === form.batch_id);
      payload.batch_id = form.batch_id;
      payload.batch_name = batch?.name || '';
    }
    await api.post('/announcements', payload);
    setForm({ title: '', body: '', audience: 'all', batch_id: '', batch_name: '' });
  };

  const canPost = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="space-y-6">
      {canPost && (
        <div className="card">
          <h2 className="font-semibold mb-4">New announcement</h2>
          <form onSubmit={post} className="space-y-3">
            <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input" rows={4} placeholder="Body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
            <select className="input max-w-xs" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value, batch_id: '' })}>
              <option value="all">All</option>
              <option value="students">All Students</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
              <option value="morning_batch">Morning Batch</option>
              <option value="evening_batch">Evening Batch</option>
            </select>
            {(form.audience === 'morning_batch' || form.audience === 'evening_batch') && (
              <select className="input max-w-xs" value={form.batch_id}
                onChange={e => setForm({ ...form, batch_id: e.target.value })} required>
                <option value="">Select {form.audience === 'morning_batch' ? 'Morning' : 'Evening'} batch…</option>
                {batches.filter(b => b.shift === form.audience.replace('_batch', '')).map(b => (
                  <option key={b.id} value={b.id}>{b.name} — {b.Subject?.name}</option>
                ))}
              </select>
            )}
            <button className="btn">Publish</button>
          </form>
        </div>
      )}
      <div className="card">
        <h2 className="font-semibold mb-4">Feed</h2>
        <ul className="space-y-3">
          {items.map(a => (
            <li key={a.id} className="border-b pb-3 last:border-0">
              <div className="font-medium">{a.title} <span className="text-xs text-slate-400">· {a.audience}</span></div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{a.body}</div>
              <div className="text-xs text-slate-400 mt-1">by {a.author?.name} · {new Date(a.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
