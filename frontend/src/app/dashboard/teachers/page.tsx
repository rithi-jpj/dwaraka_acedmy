'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { GraduationCap, Eye, Edit3, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  batch_count: number;
  student_count: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const INITIAL_FORM = { name: '', email: '', phone: '' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Confirm
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  // Detail view
  const [detailTeacher, setDetailTeacher] = useState<{ teacher: Teacher; batches: any[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Temp password display
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) params.set('search', search);
      if (filterActive) params.set('is_active', filterActive);

      const { data } = await api.get(`/teachers?${params}`);
      setTeachers(data.teachers);
      setPagination(data.pagination);
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive, sortBy, sortOrder, showToast]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  };

  const openEdit = (teacher: Teacher) => {
    setForm({ name: teacher.name, email: teacher.email, phone: teacher.phone || '' });
    setEditingId(teacher.id);
    setFormError(null);
    setShowForm(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) return setFormError('Name is required');
    if (!form.email.trim()) return setFormError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError('Valid email is required');

    setFormLoading(true);
    try {
      if (editingId) {
        await api.patch(`/teachers/${editingId}`, {
          name: form.name,
          phone: form.phone || undefined,
        });
        showToast('success', 'Teacher updated successfully');
      } else {
        const { data } = await api.post('/teachers', form);
        setTempPassword(data.tempPassword);
        showToast('success', 'Teacher created successfully');
      }
      resetForm();
      setPage(1);
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    try {
      await api.delete(`/teachers/${confirm.id}`);
      showToast('success', `Teacher "${confirm.name}" deleted`);
      setConfirm(null);
      if (detailTeacher?.teacher.id === confirm.id) setDetailTeacher(null);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to delete teacher');
      setConfirm(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const { data } = await api.post(`/teachers/${id}/reset-password`);
      setTempPassword(data.tempPassword);
      showToast('success', 'Password reset successfully');
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleToggleActive = async (teacher: Teacher) => {
    try {
      await api.patch(`/teachers/${teacher.id}`, { is_active: !teacher.is_active });
      showToast('success', `Teacher ${teacher.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to update teacher');
    }
  };

  const viewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/teachers/${id}`);
      setDetailTeacher(data);
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to load teacher details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-navy-300 ml-1">↕</span>;
    return <span className="text-brand ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Temp password modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTempPassword(null)}>
          <div className="card max-w-md w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Temporary Password</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <p className="text-amber-800 font-mono text-lg text-center tracking-wider">{tempPassword}</p>
              <p className="text-amber-600 text-xs mt-2 text-center">Share this password with the teacher. They will be required to change it on first login.</p>
            </div>
            <button className="btn w-full" onClick={() => { navigator.clipboard.writeText(tempPassword); showToast('success', 'Copied to clipboard'); }}>
              Copy & Close
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg mb-2">Confirm Delete</h3>
            <p className="text-sm text-navy-600 mb-5">
              Are you sure you want to delete teacher <strong>{confirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={confirmDelete}>Delete Teacher</button>
              <button className="btn-outline flex-1" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailTeacher && (
        <div className="modal-overlay" onClick={() => setDetailTeacher(null)}>
          <div className="modal-content p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-lg">Teacher Details</h3>
              <button className="p-2 rounded-xl hover:bg-navy-100 transition-colors text-navy-400 hover:text-navy-600" onClick={() => setDetailTeacher(null)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Name</p>
                    <p className="text-sm font-semibold text-navy-900 mt-0.5">{detailTeacher.teacher.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-navy-900 mt-0.5">{detailTeacher.teacher.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-navy-900 mt-0.5">{detailTeacher.teacher.phone || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Status</p>
                    <span className={`badge mt-1 ${detailTeacher.teacher.is_active ? 'badge-green' : 'badge-red'}`}>
                      {detailTeacher.teacher.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Joined</p>
                    <p className="text-sm font-medium text-navy-900 mt-0.5">{new Date(detailTeacher.teacher.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-navy-800 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand" />
                    Assigned Batches ({detailTeacher.batches.length})
                  </h4>
                  {detailTeacher.batches.length === 0 ? (
                    <p className="text-sm text-navy-400 text-center py-4">No batches assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailTeacher.batches.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between bg-navy-50/80 rounded-xl p-3 border border-navy-100/50 text-sm">
                          <div>
                            <span className="font-semibold text-navy-900">{b.name}</span>
                            <span className="text-navy-400 ml-2">· {b.subject}</span>
                          </div>
                          <span className="text-xs text-navy-400 bg-white px-2 py-1 rounded-lg border border-navy-100">{b.schedule || 'No schedule'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Teacher Management</h1>
          <p className="text-sm text-navy-500 mt-1">Manage all teachers, their batches, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Teacher
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card border border-brand-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-900">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <button className="p-2 rounded-xl hover:bg-navy-100 transition-colors text-navy-400" onClick={resetForm}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Enter teacher name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required disabled={formLoading} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="teacher@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required disabled={formLoading || !!editingId} />
                {editingId && <p className="text-xs text-navy-400 mt-1">Email cannot be changed after creation</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} disabled={formLoading} />
              </div>
            </div>
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</div>}
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-outline" onClick={resetForm} disabled={formLoading}>Cancel</button>
              <button className="btn" disabled={formLoading}>
                {formLoading ? 'Saving…' : editingId ? 'Update Teacher' : 'Create Teacher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input className="input pl-10 w-full" placeholder="Search teachers by name, email, or phone…"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input max-w-[160px]" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <span className="text-sm text-navy-500 font-medium">
          {pagination.total} teacher{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Teachers Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4 border border-navy-100/50">
              <GraduationCap className="w-8 h-8 text-navy-300" />
            </div>
            <p className="text-navy-500 font-medium">No teachers found</p>
            <p className="text-sm text-navy-400 mt-1">
              {search || filterActive ? 'Try different search terms or filters' : 'Click "Add Teacher" to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      Name <SortIcon field="name" />
                    </th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('email')}>
                      Email <SortIcon field="email" />
                    </th>
                    <th>Phone</th>
                    <th className="text-center">Batches</th>
                    <th className="text-center">Students</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-brand-50/30 transition-colors cursor-pointer" onClick={() => viewDetail(t.id)}>
                      <td className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-navy-900 text-sm">{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-navy-600">{t.email}</td>
                      <td className="text-sm text-navy-500">{t.phone || '—'}</td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
                          {t.batch_count}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          {t.student_count}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 rounded-xl text-navy-400 hover:text-brand hover:bg-brand-50 transition-all" title="View details"
                            onClick={() => viewDetail(t.id)}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-xl text-navy-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Edit"
                            onClick={() => openEdit(t)}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-xl text-navy-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete"
                            onClick={() => setConfirm({ id: t.id, name: t.name })}>
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
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-navy-100 bg-navy-50/30">
              <span className="text-xs text-navy-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(1)}
                  title="First page"
                >
                  ««
                </button>
                <button
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-navy-700">
                  Page {pagination.page} of {pagination.total_pages || 1}
                </span>
                <button
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage(pagination.total_pages)}
                  title="Last page"
                >
                  »»
                </button>
              </div>
            </div>

            {/* Refresh bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-t border-navy-100 bg-navy-50/30">
              <button className="btn-ghost text-xs" onClick={() => load()}>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
