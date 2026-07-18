'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
    const s = getSocket();
    if (s) {
      s.on('announcement:new', () => {
        api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
      });
    }
    return () => { s?.off('announcement:new'); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-slate-500 text-sm mt-1">Role: {user?.role}</p>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-3">Latest announcements</h2>
        {announcements.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
        <ul className="space-y-3">
          {announcements.slice(0, 5).map(a => (
            <li key={a.id} className="border-b pb-2 last:border-0">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{a.body}</div>
              <div className="text-xs text-slate-400 mt-1">
                by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
