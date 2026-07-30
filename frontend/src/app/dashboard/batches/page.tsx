'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Layers, Plus, Search, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, Users, X, RefreshCw, GraduationCap } from 'lucide-react';

export default function BatchesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // List state
  const [batches, setBatches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', subject_id: '', teacher_id: '', shift: 'morning',
    start_time: '', end_time: '', max_capacity: 30,
    description: '', schedule: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Detail modal
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Enroll student
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollBatchId, setEnrollBatchId] = useState('');
  const [enrollStudents, setEnrollStudents] = useState<any[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterShift) params.set('shift', filterShift);
      if (filterActive) params.set('is_active', filterActive);

      const { data } = await api.get(`/batches?${params}`);
      setBatches(data.batches);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load batches', 'error');
    }
    setLoading(false);
  }, [page, search, filterShift, filterActive, showToast]);

  useEffect(() => {
    loadBatches();
    if (user?.role === 'admin') {
      api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
      api.get('/users?role=teacher').then(r => setTeachers(r.data)).catch(() => {});
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [search, filterShift, filterActive]);

  const openCreate = () => {
    setEditId(null);
    setForm({
      name: '', subject_id: subjects[0]?.id || '', teacher_id: teachers[0]?.id || '',
      shift: 'morning', start_time: '06:00', end_time: '08:00',
      max_capacity: 30, description: '', schedule: '', is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      name: b.name, subject_id: b.subject_id, teacher_id: b.teacher_id,
      shift: b.shift || 'morning',
      start_time: b.start_time || '', end_time: b.end_time || '',
      max_capacity: b.max_capacity || 30,
      description: b.description || '', schedule: b.schedule || '',
      is_active: b.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject_id || !form.teacher_id) {
      showToast('Name, subject and teacher are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/batches/${editId}`, form);
        showToast('Batch updated', 'success');
      } else {
        await api.post('/batches', form);
        showToast('Batch created', 'success');
      }
      setShowForm(false);
      loadBatches();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Save failed', 'error');
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/batches/${deleteId}`);
      showToast('Batch deleted', 'success');
      setDeleteId(null);
      loadBatches();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteId(null);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/batches/${id}`);
      setDetail(data);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load details', 'error');
    }
    setDetailLoading(false);
  };

  const openEnroll = async (batchId: string) => {
    setEnrollBatchId(batchId);
    setEnrollSearch('');
    setShowEnroll(true);
    try {
      const { data } = await api.get('/students?limit=100');
      setEnrollStudents(data.students || []);
    } catch {}
  };

  const handleEnroll = async (studentId: string) => {
    setEnrolling(true);
    try {
      await api.post(`/batches/${enrollBatchId}/enroll`, { student_id: studentId });
      showToast('Student enrolled', 'success');
      openDetail(enrollBatchId);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Enroll failed', 'error');
    }
    setEnrolling(false);
  };

  const handleUnenroll = async (batchId: string, studentId: string) => {
    try {
      await api.delete(`/batches/${batchId}/students/${studentId}`);
      showToast('Student unenrolled', 'success');
      openDetail(batchId);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Unenroll failed', 'error');
    }
  };

  const shiftBadge = (shift: string) => {
    const isMorning = shift === 'morning';
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        isMorning ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-violet-50 text-violet-700 border border-violet-200/50'
      }`}>
        {isMorning ? '☀ Morning' : '🌙 Evening'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand" />
            Batch Management
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            {user?.role === 'teacher'
              ? 'View your assigned batches'
              : 'Create and manage morning and evening batches'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openCreate} className="btn">
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input className="input pl-10 w-full" placeholder="Search batches…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <select className="input max-w-[150px]" value={filterShift}
          onChange={e => { setFilterShift(e.target.value); setPage(1); }}>
          <option value="">All Shifts</option>
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
        </select>
        <select className="input max-w-[140px]" value={filterActive}
          onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <span className="text-sm text-navy-500 font-medium">{total} batch{total !== 1 && 'es'}</span>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card border-2 border-brand/20">
          <h3 className="font-semibold mb-4">{editId ? 'Edit Batch' : 'New Batch'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Batch Name *</label>
                <input className="input" placeholder="e.g. Morning Batch A"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Shift</label>
                <select className="input" value={form.shift}
                  onChange={e => setForm({ ...form, shift: e.target.value })}>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label className="label">Max Capacity</label>
                <input className="input" type="number" min={1} value={form.max_capacity}
                  onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) || 30 })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Subject *</label>
                <select className="input" value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })} required>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teacher *</label>
                <select className="input" value={form.teacher_id}
                  onChange={e => setForm({ ...form, teacher_id: e.target.value })} required>
                  <option value="">Select teacher…</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Active</label>
                <select className="input" value={String(form.is_active)}
                  onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Time</label>
                <input className="input" type="time" value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input className="input" type="time" value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Schedule</label>
                <input className="input" placeholder="e.g. Mon-Fri" value={form.schedule}
                  onChange={e => setForm({ ...form, schedule: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Optional notes" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{detail.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {shiftBadge(detail.shift)}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      detail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{detail.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center py-3">
                  <div className="text-xl font-bold text-brand">{detail.student_count ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">Students</div>
                </div>
                <div className="card text-center py-3">
                  <div className="text-xl font-bold text-slate-800">{detail.max_capacity || 30}</div>
                  <div className="text-xs text-slate-500 mt-1">Capacity</div>
                </div>
                <div className="card text-center py-3">
                  <div className="text-xl font-bold text-amber-600">{detail.start_time || '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">Start Time</div>
                </div>
                <div className="card text-center py-3">
                  <div className="text-xl font-bold text-indigo-600">{detail.end_time || '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">End Time</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span><strong>Subject:</strong> {detail.Subject?.name}</span>
                <span><strong>Teacher:</strong> {detail.teacher?.name}</span>
                <span><strong>Schedule:</strong> {detail.schedule || '—'}</span>
              </div>
              {detail.description && (
                <p className="text-sm text-slate-600">{detail.description}</p>
              )}

              {/* Enrolled Students */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Enrolled Students</h3>
                  {user?.role === 'admin' && (
                    <button onClick={() => openEnroll(detail.id)}
                      className="btn-outline text-xs px-3 py-1.5">+ Enroll Student</button>
                  )}
                </div>
                {(!detail.students || detail.students.length === 0) ? (
                  <p className="text-sm text-slate-400 text-center py-4">No students enrolled yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full text-sm">
                      <thead><tr><th>Name</th><th>Admission No</th><th>Email</th><th></th></tr></thead>
                      <tbody>
                        {detail.students.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="font-medium">{s.name}</td>
                            <td>{s.admission_no || '—'}</td>
                            <td className="text-slate-500">{s.email}</td>
                            <td className="text-right">
                              {user?.role === 'admin' && (
                                <button onClick={() => handleUnenroll(detail.id, s.id)}
                                  className="text-xs text-red-500 hover:text-red-700">Remove</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Enroll Student Search */}
              {showEnroll && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input className="input flex-1" placeholder="Search students…"
                      value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)} />
                    <button onClick={() => setShowEnroll(false)} className="text-sm text-slate-500">Cancel</button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {enrollStudents
                      .filter(s =>
                        !detail.students?.find((ds: any) => ds.id === s.id) &&
                        (!enrollSearch || s.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
                         s.admission_no?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
                         s.email?.toLowerCase().includes(enrollSearch.toLowerCase()))
                      )
                      .slice(0, 20)
                      .map(s => (
                        <div key={s.id}
                          className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-50">
                          <div className="text-sm">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-slate-400 ml-2">{s.admission_no || s.email}</span>
                          </div>
                          <button onClick={() => handleEnroll(s.id)}
                            className="text-xs px-3 py-1 rounded bg-brand text-white hover:bg-brand/90 transition"
                            disabled={enrolling}>
                            {enrolling ? '…' : 'Enroll'}
                          </button>
                        </div>
                      ))}
                    {enrollStudents.filter(s => !detail.students?.find((ds: any) => ds.id === s.id)).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">All students are already enrolled.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-1 text-center">Delete Batch</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Are you sure you want to delete <strong>{deleteName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex-1 transition">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Batches Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading batches…</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-slate-500 font-medium">No batches found</p>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'admin' ? 'Click "New Batch" to create your first batch.' : 'You have no assigned batches.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Shift</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Status</th>
                  {user?.role === 'admin' && <th className="w-20"></th>}
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-brand-50/30 transition cursor-pointer" onClick={() => openDetail(b.id)}>
                    <td className="font-semibold text-sm text-navy-900">
                      {b.name}
                    </td>
                    <td>{shiftBadge(b.shift)}</td>
                    <td className="text-sm text-navy-600">
                      {b.start_time && b.end_time
                        ? `${b.start_time} – ${b.end_time}`
                        : b.start_time || b.end_time || '—'}
                    </td>
                    <td className="text-sm text-navy-600">{b.Subject?.name || '—'}</td>
                    <td className="text-sm text-navy-900">{b.teacher?.name || '—'}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200/50">
                        {b.student_count ?? 0}/{b.max_capacity || 30}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.is_active ? 'badge-green' : 'badge-red'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(b)}
                            className="p-2 rounded-xl text-navy-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeleteId(b.id); setDeleteName(b.name); }}
                            className="p-2 rounded-xl text-navy-400 hover:text-red-600 hover:bg-red-50 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-navy-100 bg-navy-50/30">
              <span className="text-xs text-navy-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(1)}
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors">««</button>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1">
                  Next <ChevronRight className="w-3 h-3" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors">»»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
