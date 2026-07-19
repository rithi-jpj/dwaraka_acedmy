'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type U = { id: string; name: string; email: string; role: string; is_active: boolean };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'teacher' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const { data } = await api.post('/users', form);
      setMsg(`Created ${data.user.email}. Temp password: ${data.tempPassword}`);
      setForm({ name: '', email: '', phone: '', role: 'teacher' });
      load();
    } catch (e: any) { setMsg(e?.response?.data?.error || 'Failed'); }
  };

  const reset = async (id: string) => {
    const { data } = await api.post(`/users/${id}/reset-password`);
    alert(`New temp password: ${data.tempPassword}`);
  };

  const toggleActive = async (u: U) => {
    await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-4">Add user</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn">Create</button>
        </form>
        {msg && <div className="text-sm mt-3 text-slate-700">{msg}</div>}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">All users</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td className="space-x-2 text-right">
                  <button className="btn-outline" onClick={() => reset(u.id)}>Reset password</button>
                  <button className="btn-outline" onClick={() => toggleActive(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
