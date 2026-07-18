'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' });

  const load = () => api.get('/announcements').then(r => setItems(r.data));
  useEffect(() => {
    load();
    const s = getSocket();
    s?.on('announcement:new', load);
    return () => { s?.off('announcement:new', load); };
  }, []);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/announcements', form);
    setForm({ title: '', body: '', audience: 'all' });
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
            <select className="input max-w-xs" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
              <option value="all">All</option><option value="teachers">Teachers</option><option value="students">Students</option>
            </select>
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
