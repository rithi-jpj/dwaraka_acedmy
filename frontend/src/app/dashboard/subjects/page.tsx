'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function SubjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = () => api.get('/subjects').then(r => setItems(r.data)).catch(() => showToast('Failed to load subjects', 'error'));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/subjects', { name, description: desc });
      setName(''); setDesc('');
      showToast('Subject added successfully', 'success');
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to add subject', 'error');
    }
  };

  const del = async (id: string, subjectName: string) => {
    try {
      await api.delete(`/subjects/${id}`);
      showToast(`Subject "${subjectName}" deleted`, 'success');
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to delete subject', 'error');
    }
  };

  const total = items.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subject Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage academic subjects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <div className="stat-card-value text-brand">{total}</div>
          <div className="stat-card-label">Total Subjects</div>
        </div>
      </div>

      {/* Add Form */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand" />
          Add New Subject
        </h2>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Subject Name *</label>
            <input className="input" placeholder="e.g. Mathematics" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional description" value={desc}
              onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn w-full">
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>
        </form>
      </div>

      {/* Subjects List */}
      <div className="card p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No subjects yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first subject to get started</p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject Name</th>
                <th>Description</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="text-slate-400 text-xs w-10">{i + 1}</td>
                  <td className="font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-brand-600" />
                      </div>
                      {s.name}
                    </div>
                  </td>
                  <td className="text-slate-600">{s.description || '—'}</td>
                  <td className="text-right">
                    <button onClick={() => del(s.id, s.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete subject">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
