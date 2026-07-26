'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

type Parent = {
  id: string; name: string; email: string; phone: string | null;
  is_active: boolean; created_at: string;
  linked_students: Array<{
    id: string; relationship: string;
    student: { id: string; name: string; email: string; admission_no: string | null; current_class: string | null } | null;
  }>;
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', student_id: '', relationship: 'guardian' });
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search, sort_by: 'name', sort_order: 'ASC' });
      if (filterActive) params.set('is_active', filterActive);
      const { data } = await api.get(`/parents?${params}`);
      setParents(data.parents);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load parents', 'error');
    }
    setLoading(false);
  }, [page, search, filterActive, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load all students for link dropdown
  useEffect(() => {
    if (showForm) {
      api.get('/users?role=student').then(r => setAllStudents(r.data)).catch(() => {});
    }
  }, [showForm]);

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', student_id: '', relationship: 'guardian' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (p: Parent) => {
    setForm({ name: p.name, email: p.email, phone: p.phone || '', student_id: '', relationship: 'guardian' });
    setEditId(p.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/parents/${editId}`, form);
        showToast('Parent updated successfully', 'success');
      } else {
        const { data } = await api.post('/parents', form);
        setTempPwd(data.tempPassword);
        showToast('Parent created successfully', 'success');
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
      await api.delete(`/parents/${deleteId}`);
      showToast('Parent deleted', 'success');
      setDeleteId(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteId(null);
    }
  };

  const resetPwd = async (id: string) => {
    try {
      const { data } = await api.post(`/parents/${id}/reset-password`);
      setTempPwd(data.tempPassword);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Reset failed', 'error');
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/parents/${id}`);
      setDetail(data);
    } catch { showToast('Failed to load details', 'error'); }
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parent Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage parent accounts and student links</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition text-sm font-medium">
          {showForm ? '✕ Close' : '+ Add Parent'}
        </button>
      </div>

      {showForm && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">{editId ? 'Edit Parent' : 'Add New Parent'}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {!editId && (
              <>
                <div>
                  <label className="label">Link to Student (optional)</label>
                  <select className="input" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                    <option value="">— No link —</option>
                    {allStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <select className="input" value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>
                    <option value="guardian">Guardian</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}
            <div className="md:col-span-2 flex gap-3">
              <button className="btn">{editId ? 'Update' : 'Create Parent'}</button>
              <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input className="input pl-9 w-full" placeholder="Search by name, email, or phone..."
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
        <span className="text-sm text-slate-500">{total} parent{total !== 1 && 's'}</span>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading parents…</p>
        </div>
      ) : parents.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-slate-500 font-medium">No parents found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Linked Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="font-medium">
                      <button className="text-brand hover:underline" onClick={() => openDetail(p.id)}>{p.name}</button>
                    </td>
                    <td className="text-sm">{p.email}</td>
                    <td className="text-sm text-slate-600">{p.phone || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(p.linked_students || []).length === 0 ? (
                          <span className="text-xs text-slate-400">None</span>
                        ) : (
                          p.linked_students.map(l => (
                            <span key={l.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                              {l.student?.name || 'Unknown'} ({l.relationship})
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(p.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-brand transition" title="View details">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => resetPwd(p.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition" title="Reset password">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
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

      {/* Temp Password Modal */}
      {tempPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTempPwd(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Temporary Password</h3>
            <p className="text-sm text-slate-600 mb-4">Share this temporary password with the parent.</p>
            <div className="bg-slate-100 rounded-lg p-3 text-center mb-4">
              <code className="text-2xl font-mono font-bold text-brand">{tempPwd}</code>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(tempPwd); setTempPwd(null); }} className="btn w-full">Copy & Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this parent account?</p>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <div className="p-10 text-center"><div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" /></div>
            ) : (
              <div>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{detail.name}</h2>
                      <p className="text-sm text-slate-500">{detail.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${detail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {detail.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-500 uppercase">Phone</label><p className="text-sm font-medium">{detail.phone || '—'}</p></div>
                    <div><label className="text-xs text-slate-500 uppercase">Created</label><p className="text-sm font-medium">{new Date(detail.created_at).toLocaleDateString()}</p></div>
                  </div>

                  {/* Linked Students */}
                  <div>
                    <h3 className="font-semibold mb-3">Linked Students ({detail.linked_students?.length || 0})</h3>
                    {(!detail.linked_students || detail.linked_students.length === 0) ? (
                      <p className="text-sm text-slate-500 text-center py-4">No students linked to this parent.</p>
                    ) : (
                      <div className="space-y-4">
                        {detail.linked_students.map((ls: any) => (
                          <div key={ls.student?.id || ls.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-sm">{ls.student?.name}</span>
                                <span className="text-xs text-slate-500 ml-2">
                                  {ls.student?.admission_no || 'No admission'} · Class {ls.student?.current_class || '—'}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{ls.relationship}</span>
                            </div>

                            {/* Attendance Stats */}
                            {ls.attendance_stats && (
                              <div className="flex gap-2">
                                {['present', 'absent', 'late'].map(s => (
                                  <span key={s} className={`px-2 py-1 rounded text-xs font-medium ${
                                    s === 'present' ? 'bg-green-50 text-green-700' :
                                    s === 'absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                  }`}>{ls.attendance_stats[s] || 0} {s}</span>
                                ))}
                              </div>
                            )}

                            {/* Enrolled Batches */}
                            {ls.enrollments?.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase">Enrolled Batches:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ls.enrollments.map((e: any) => (
                                    <span key={e.id} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{e.Batch?.name} ({e.Batch?.Subject?.name})</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recent Marks */}
                            {ls.recent_marks?.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase">Recent Marks:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ls.recent_marks.map((m: any) => (
                                    <span key={m.id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{m.exam_name}: {m.score}/{m.max_score}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
