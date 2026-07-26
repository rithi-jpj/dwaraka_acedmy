'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

type Student = {
  id: string; name: string; email: string; phone: string | null;
  admission_no: string | null;
  current_class: string | null;
  guardian_name: string | null; guardian_phone: string | null;
  is_active: boolean;
  enrollment_count: number;
  created_at: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [classes, setClasses] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    guardian_name: '', guardian_phone: '', current_class: '', batch_id: '',
  });
  const [batches, setBatches] = useState<any[]>([]);

  // Temp password modal
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Detail modal
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20', search, sort_by: sortBy, sort_order: sortOrder,
      });
      if (filterActive) params.set('is_active', filterActive);
      if (filterClass) params.set('current_class', filterClass);

      const { data } = await api.get(`/students?${params}`);
      setStudents(data.students);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
      if (data.filters?.classes) setClasses(data.filters.classes);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load students', 'error');
    }
    setLoading(false);
  }, [page, search, filterActive, filterClass, sortBy, sortOrder, showToast]);

  useEffect(() => {
    load();
    api.get('/batches/my').then(r => setBatches(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

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
    setForm({ name: '', email: '', phone: '', address: '', guardian_name: '', guardian_phone: '', current_class: '', batch_id: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (s: any) => {
    setForm({
      name: s.name, email: s.email, phone: s.phone || '',
      address: '', guardian_name: s.guardian_name || '',
      guardian_phone: s.guardian_phone || '', current_class: s.current_class || '',
      batch_id: s.batch_id || '',
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/students/${editId}`, form);
        showToast('Student updated successfully', 'success');
      } else {
        const { data } = await api.post('/students', form);
        setTempPwd(data.tempPassword);
        showToast('Student created successfully', 'success');
      }
      resetForm();
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/students/${deleteId}`);
      showToast('Student deleted', 'success');
      setDeleteId(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteId(null);
    }
  };

  const resetPwd = async (id: string) => {
    try {
      const { data } = await api.post(`/students/${id}/reset-password`);
      setTempPwd(data.tempPassword);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Reset failed', 'error');
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/students/${id}`);
      setDetail(data);
    } catch {
      showToast('Failed to load details', 'error');
    }
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit, and manage all students</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition text-sm font-medium">
          {showForm ? '✕ Close' : '+ Add Student'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">{editId ? 'Edit Student' : 'Add New Student'}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editId} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Class</label>
              <input className="input" value={form.current_class} onChange={e => setForm({ ...form, current_class: e.target.value })} placeholder="e.g. 10, 11, 12" />
            </div>
            <div>
              <label className="label">Guardian Name</label>
              <input className="input" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Guardian Phone</label>
              <input className="input" value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Assign Batch</label>
              <select className="input" value={form.batch_id}
                onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                <option value="">No batch</option>
                {batches.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.shift}) — {b.Subject?.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button className="btn">{editId ? 'Update' : 'Create Student'}</button>
              <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input className="input pl-9 w-full" placeholder="Search by name, email, admission no..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select className="input max-w-[140px]" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select className="input max-w-[140px]" value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <span className="text-sm text-slate-500">{total} student{total !== 1 && 's'}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading students…</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-slate-500 font-medium">No students found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('name')}>Name{sortIcon('name')}</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('admission_no')}>Admission{sortIcon('admission_no')}</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('email')}>Email{sortIcon('email')}</th>
                  <th>Phone</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('current_class')}>Class{sortIcon('current_class')}</th>
                  <th>Guardian</th>
                  <th>Batch</th>
                  <th className="cursor-pointer hover:text-brand" onClick={() => sort('is_active')}>Status{sortIcon('is_active')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="font-medium">
                      <button className="text-brand hover:underline" onClick={() => openDetail(s.id)}>{s.name}</button>
                    </td>
                    <td className="text-sm text-slate-600">{s.admission_no || '—'}</td>
                    <td className="text-sm">{s.email}</td>
                    <td className="text-sm text-slate-600">{s.phone || '—'}</td>
                    <td>{s.current_class ? `Class ${s.current_class}` : '—'}</td>
                    <td className="text-sm">{s.guardian_name || '—'}</td>
                    <td className="text-sm text-center">
                      {(s as any).batch_name ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          (s as any).batch_shift === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>{(s as any).batch_name}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(s.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-brand transition" title="View details">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => resetPwd(s.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition" title="Reset password">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600 transition" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
              <button disabled={page <= 1} onClick={() => setPage(1)}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">««</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">« Prev</button>
              <span className="px-3 py-1 text-xs">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">Next »</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">»»</button>
            </div>
            <span className="text-xs text-slate-400">20 per page</span>
          </div>
        </div>
      )}

      {/* Temp Password Modal */}
      {tempPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTempPwd(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Temporary Password</h3>
            <p className="text-sm text-slate-600 mb-4">Share this temporary password with the student.</p>
            <div className="bg-slate-100 rounded-lg p-3 text-center mb-4">
              <code className="text-2xl font-mono font-bold text-brand">{tempPwd}</code>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(tempPwd); setTempPwd(null); }}
                className="btn flex-1">Copy & Close</button>
              <button onClick={() => setTempPwd(null)} className="btn-outline flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white flex-1">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetailId(null); setDetail(null); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <div className="p-10 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{detail.name}</h2>
                      <p className="text-sm text-slate-500">{detail.admission_no || 'No admission no'} · {detail.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      detail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{detail.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Phone</label>
                      <p className="text-sm font-medium">{detail.phone || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Class</label>
                      <p className="text-sm font-medium">{detail.current_class ? `Class ${detail.current_class}` : '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Guardian</label>
                      <p className="text-sm font-medium">{detail.guardian_name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Guardian Phone</label>
                      <p className="text-sm font-medium">{detail.guardian_phone || '—'}</p>
                    </div>

                  </div>
                  {detail.address && (
                    <div>
                      <label className="text-xs text-slate-500 uppercase">Address</label>
                      <p className="text-sm mt-1">{detail.address}</p>
                    </div>
                  )}

                  {/* Attendance Stats */}
                  {detail.attendance_stats && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Attendance Summary</h3>
                      <div className="flex gap-3">
                        {['present', 'absent', 'late'].map(s => (
                          <div key={s} className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            s === 'present' ? 'bg-green-50 text-green-700' :
                            s === 'absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {detail.attendance_stats[s] || 0} {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enrollments */}
                  {detail.enrollments?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Enrolled Batches ({detail.enrollments.length})</h3>
                      <div className="space-y-2">
                        {detail.enrollments.map((e: any) => (
                          <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                            <div>
                              <span className="font-medium text-sm">{e.Batch?.name}</span>
                              <span className="text-xs text-slate-500 ml-2">{e.Batch?.Subject?.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{e.Batch?.schedule || ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Parents */}
                  {detail.linked_parents?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Linked Parents</h3>
                      <div className="space-y-2">
                        {detail.linked_parents.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                            <div>
                              <span className="font-medium text-sm">{p.parent?.name}</span>
                              <span className="text-xs text-slate-500 ml-2">{p.parent?.email}</span>
                            </div>
                            <span className="text-xs text-slate-400">{p.parent?.phone || ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Marks */}
                  {detail.recent_marks?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Recent Marks</h3>
                      <table className="table text-sm">
                        <thead><tr><th>Exam</th><th>Score</th><th>Batch</th></tr></thead>
                        <tbody>
                          {detail.recent_marks.map((m: any) => (
                            <tr key={m.id}>
                              <td>{m.exam_name}</td>
                              <td>{m.score} / {m.max_score}</td>
                              <td className="text-slate-500">{m.Batch?.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t bg-slate-50 text-right rounded-b-xl">
                  <button onClick={() => { setDetailId(null); setDetail(null); }} className="btn-outline text-sm">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
