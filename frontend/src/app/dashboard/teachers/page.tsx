'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { GraduationCap, Eye, Edit3, Trash2, Search } from 'lucide-react';

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
    if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div className="card max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Confirm Delete</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete teacher <strong>{confirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailTeacher(null)}>
          <div className="card max-w-lg w-full mx-4 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Teacher Details</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setDetailTeacher(null)}>✕</button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Name</span>
                    <p className="font-medium">{detailTeacher.teacher.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email</span>
                    <p className="font-medium">{detailTeacher.teacher.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone</span>
                    <p className="font-medium">{detailTeacher.teacher.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status</span>
                    <p className={`font-medium ${detailTeacher.teacher.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {detailTeacher.teacher.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Joined</span>
                    <p className="font-medium">{new Date(detailTeacher.teacher.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Assigned Batches ({detailTeacher.batches.length})</h4>
                  {detailTeacher.batches.length === 0 ? (
                    <p className="text-sm text-slate-500">No batches assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailTeacher.batches.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded p-2 text-sm">
                          <div>
                            <span className="font-medium">{b.name}</span>
                            <span className="text-slate-500 ml-2">· {b.subject}</span>
                          </div>
                          <span className="text-xs text-slate-400">{b.schedule || 'No schedule'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all teachers in the academy</p>
        </div>
        <button className="btn" onClick={() => { resetForm(); setShowForm(true); }}>
          + Add Teacher
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <button className="text-slate-400 hover:text-slate-600" onClick={resetForm}>✕</button>
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
                {editingId && <p className="text-xs text-slate-400 mt-1">Email cannot be changed after creation</p>}
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
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
              className="input pl-9"
              placeholder="Search teachers by name, email, or phone…"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input max-w-[160px]" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="text-sm text-slate-500">
            {pagination.total} teacher{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <p className="mt-4 text-slate-500 font-medium">No teachers found</p>
            <p className="text-sm text-slate-400 mt-1">
              {search || filterActive ? 'Try different search terms or filters' : 'Click "Add Teacher" to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 cursor-pointer select-none" onClick={() => handleSort('name')}>
                      Name <SortIcon field="name" />
                    </th>
                    <th className="px-4 cursor-pointer select-none" onClick={() => handleSort('email')}>
                      Email <SortIcon field="email" />
                    </th>
                    <th className="px-4">Phone</th>
                    <th className="px-4 text-center">Batches</th>
                    <th className="px-4 text-center">Students</th>
                    <th className="px-4 text-center">Status</th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4">
                        <button className="font-medium text-brand hover:underline" onClick={() => viewDetail(t.id)}>
                          {t.name}
                        </button>
                      </td>
                      <td className="px-4 text-slate-600">{t.email}</td>
                      <td className="px-4 text-slate-500">{t.phone || '—'}</td>
                      <td className="px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          {t.batch_count}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          {t.student_count}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <span className={`badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-50 transition-all" title="View details"
                            onClick={() => viewDetail(t.id)}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Edit"
                            onClick={() => openEdit(t)}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(1)}
                  title="First page"
                >
                  ««
                </button>
                <button
                  className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  « Prev
                </button>
                <span className="text-sm text-slate-600 px-2">
                  Page {pagination.page} of {pagination.total_pages || 1}
                </span>
                <button
                  className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next »
                </button>
                <button
                  className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage(pagination.total_pages)}
                  title="Last page"
                >
                  »»
                </button>
              </div>
              <span className="text-xs text-slate-400">{pagination.limit} per page</span>
            </div>

            {/* Bulk actions bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50/50">
              <button className="btn-outline text-xs px-3 py-1" onClick={() => load()}>
                ↻ Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
