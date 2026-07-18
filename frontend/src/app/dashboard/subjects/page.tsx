'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SubjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const load = () => api.get('/subjects').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/subjects', { name, description: desc });
    setName(''); setDesc(''); load();
  };
  const del = async (id: string) => { await api.delete(`/subjects/${id}`); load(); };
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-4">Add subject</h2>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="input md:col-span-1" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <button className="btn">Add</button>
        </form>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">Subjects</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id}><td>{s.name}</td><td>{s.description}</td>
                <td className="text-right"><button className="btn-outline" onClick={() => del(s.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
