'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { BookMarked, Edit3, Trash2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

type ClassItem = {
  id: string; name: string; section: string | null; room: string | null;
  schedule: string | null; academic_year: string | null; is_active: boolean;
  student_count: number; created_at: string;
  teacher: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
};

type Teacher = { id: string; name: string; email: string };
type Subject = { id: string; name: string };

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [filterYear, setFilterYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', section: '', room: '', schedule: '',
    teacher_id: '', subject_id: '', academic_year: '',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search, sort_by: sortBy, sort_order: sortOrder });
      if (filterActive) params.set('is_active', filterActive);
      if (filterYear) params.set('academic_year', filterYear);
      const { data } = await api.get(`/classes?${params}`);
      setClasses(data.classes);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
      if (data.filters?.academic_years) setAcademicYears(data.filters.academic_years);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load classes', 'error');
    }
    setLoading(false);
  }, [page, search, filterActive, filterYear, sortBy, sortOrder, showToast]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load teachers and subjects for form
  useEffect(() => {
    if (showForm) {
      Promise.all([
        api.get('/users?role=teacher'),
        api.get('/subjects'),
      ]).then(([t, s]) => {
        setTeachers(t.data);
        setSubjects(s.data);
      }).catch(() => {});
    }
  }, [showForm]);

  const sort = (field: string) => {
    if (sortBy === field) setSortOrder(o => o === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortOrder('ASC'); }
    setPage(1);
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'ASC' ? ' ↑' : ' ↓';
  };

  const resetForm = () => {
    setForm({ name: '', section: '', room: '', schedule: '', teacher_id: '', subject_id: '', academic_year: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (c: ClassItem) => {
    setForm({
      name: c.name, section: c.section || '', room: c.room || '', schedule: c.schedule || '',
      teacher_id: c.teacher?.id || '', subject_id: c.subject?.id || '', academic_year: c.academic_year || '',
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/classes/${editId}`, form);
        showToast('Class updated successfully', 'success');
      } else {
        await api.post('/classes', form);
        showToast('Class created successfully', 'success');
      }
      resetForm();
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteError(null);
    try {
      await api.delete(`/classes/${deleteId}`);
      showToast('Class deleted', 'success');
      setDeleteId(null);
      load();
    } catch (e: any) {
      const err = e?.response?.data?.error || 'Delete failed';
      setDeleteError(err);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-brand" />
            Class Management
          </h1>
          <p className="text-sm text-navy-500 mt-1">Create and manage classes with teachers and subjects</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="btn">
          {showForm ? '✕ Close' : <><Plus className="w-4 h-4" /> Add Class</>}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">{editId ? 'Edit Class' : 'Add New Class'}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Class Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Class 10" required />
            </div>
            <div>
              <label className="label">Section</label>
              <input className="input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. A, B" />
            </div>
            <div>
              <label className="label">Teacher *</label>
              <select className="input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} required>
                <option value="">— Select teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} required>
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Room</label>
              <input className="input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className="label">Academic Year</label>
              <input className="input" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2025-2026" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Schedule</label>
              <input className="input" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. Mon-Wed 9:00-10:30" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button className="btn">{editId ? 'Update Class' : 'Create Class'}</button>
              <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search by name, section, room, or year..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <select className="input max-w-[140px]" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select className="input max-w-[180px]" value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }}>
          <option value="">All Years</option>
          {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-slate-500">{total} class{total !== 1 && 'es'}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading classes…</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No classes found</p>
          <p className="text-sm text-slate-400 mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('name')}>Class{sortIcon('name')}</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('section')}>Section{sortIcon('section')}</th>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('room')}>Room{sortIcon('room')}</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('academic_year')}>Academic Year{sortIcon('academic_year')}</th>
                  <th>Students</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('is_active')}>Status{sortIcon('is_active')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="font-medium">{c.name}</td>
                    <td className="text-sm text-slate-600">{c.section || '—'}</td>
                    <td className="text-sm">{c.teacher?.name || '—'}</td>
                    <td className="text-sm text-slate-600">{c.subject?.name || '—'}</td>
                    <td className="text-sm">{c.room || '—'}</td>
                    <td className="text-sm text-slate-600">{c.academic_year || '—'}</td>
                    <td className="text-center text-sm font-medium">{c.student_count}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteId(c.id); setDeleteError(null); }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30" 
                          title={c.student_count > 0 ? 'Cannot delete: students are enrolled in this class' : 'Delete class'}
                          disabled={c.student_count > 0}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
            <span className="text-xs text-slate-500">
              Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)} className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">««</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">« Prev</button>
              <span className="px-3 py-1 text-xs">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">Next »</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">»»</button>
            </div>
            <span className="text-xs text-slate-400">20 per page</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
            {deleteError ? (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
                <button onClick={() => setDeleteId(null)} className="btn-outline w-full">Close</button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete this class? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={confirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white flex-1">Delete</button>
                  <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
