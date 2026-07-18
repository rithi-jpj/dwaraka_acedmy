'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function BatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', subject_id: '', teacher_id: '', schedule: '' });

  const load = () => api.get('/batches').then(r => setBatches(r.data));
  useEffect(() => {
    load();
    if (user?.role === 'admin') {
      api.get('/subjects').then(r => setSubjects(r.data));
      api.get('/users?role=teacher').then(r => setTeachers(r.data));
    }
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/batches', form);
    setForm({ name: '', subject_id: '', teacher_id: '', schedule: '' });
    load();
  };

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Create batch</h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} required>
              <option value="">Subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} required>
              <option value="">Teacher…</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input className="input" placeholder="Schedule" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
            <button className="btn">Create</button>
          </form>
        </div>
      )}
      <div className="card">
        <h2 className="font-semibold mb-4">Batches</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Subject</th><th>Teacher</th><th>Schedule</th><th></th></tr></thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.Subject?.name}</td>
                <td>{b.teacher?.name}</td>
                <td>{b.schedule}</td>
                <td className="text-right"><Link className="btn-outline" href={`/dashboard/batches/${b.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
