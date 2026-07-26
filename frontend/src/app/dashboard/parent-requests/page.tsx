'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { UserPlus, Eye, Check, X, Trash2, Search } from 'lucide-react';

type ParentRequest = {
  id: string;
  student_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  student?: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export default function ParentRequestsPage() {
  const [requests, setRequests] = useState<ParentRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [detailRequest, setDetailRequest] = useState<ParentRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort_by: sortBy, sort_order: sortOrder });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/parent-requests?${params}`);
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, sortBy, sortOrder, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field: string) => {
    if (sortBy === field) { setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC'); }
    else { setSortBy(field); setSortOrder('ASC'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-brand ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/parent-requests/${id}/approve`);
      setTempPassword(data.tempPassword);
      showToast('success', `Parent account created for ${data.parent.name}`);
      setDetailRequest(null);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to approve');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await api.post(`/parent-requests/${rejectModal.id}/reject`, { rejection_reason: rejectReason });
      showToast('success', 'Request rejected');
      setRejectModal(null);
      setRejectReason('');
      setDetailRequest(null);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to reject');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/parent-requests/${confirmDelete.id}`);
      showToast('success', 'Request deleted');
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to delete');
      setConfirmDelete(null);
    }
  };

  const viewDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/parent-requests/${id}`);
      setDetailRequest(data);
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to load details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Temp password modal */}
      {tempPassword && (
        <div className="modal-overlay" onClick={() => setTempPassword(null)}>
          <div className="modal-content p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Parent Account Created</h3>
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm space-y-2">
              <p className="text-green-800">Temporary Password:</p>
              <p className="text-green-800 font-mono text-lg text-center tracking-wider">{tempPassword}</p>
              <p className="text-green-600 text-xs text-center">Share this password with the parent. They will be required to change it on first login.</p>
            </div>
            <button className="btn w-full" onClick={() => { navigator.clipboard.writeText(tempPassword); showToast('success', 'Copied to clipboard'); }}>
              Copy Password & Close
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Confirm Delete</h3>
            <p className="text-sm text-slate-600">
              Delete request from <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Reject Request</h3>
            <p className="text-sm text-slate-600">Reject request from <strong>{rejectModal.name}</strong>?</p>
            <div>
              <label className="label">Reason (optional)</label>
              <textarea className="input" rows={3} placeholder="Enter rejection reason..." value={rejectReason}
                onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn bg-red-600 hover:bg-red-700" disabled={actionLoading} onClick={handleReject}>
                {actionLoading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailRequest && (
        <div className="modal-overlay" onClick={() => setDetailRequest(null)}>
          <div className="modal-content p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Request Details</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setDetailRequest(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Parent Name</span>
                <p className="font-medium">{detailRequest.parent_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Parent Email</span>
                <p className="font-medium">{detailRequest.parent_email}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone</span>
                <p className="font-medium">{detailRequest.parent_phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                <p>{statusBadge(detailRequest.status)}</p>
              </div>
              <div>
                <span className="text-slate-500">Student</span>
                <p className="font-medium">{detailRequest.student?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-slate-500">Student Email</span>
                <p className="font-medium">{detailRequest.student?.email || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Submitted</span>
                <p className="font-medium">{new Date(detailRequest.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Reviewed By</span>
                <p className="font-medium">{detailRequest.reviewer?.name || '—'}</p>
              </div>
            </div>
            {detailRequest.rejection_reason && (
              <div>
                <span className="text-sm text-slate-500">Rejection Reason</span>
                <p className="text-sm text-red-600 mt-1">{detailRequest.rejection_reason}</p>
              </div>
            )}
            {detailRequest.status === 'pending' && (
              <div className="flex gap-3 pt-2 border-t">
                <button className="btn bg-green-600 hover:bg-green-700 flex-1" disabled={actionLoading}
                  onClick={() => handleApprove(detailRequest.id)}>
                  {actionLoading ? 'Processing…' : '✓ Approve & Create Account'}
                </button>
                <button className="btn bg-red-600 hover:bg-red-700 flex-1" disabled={actionLoading}
                  onClick={() => { setRejectModal({ id: detailRequest.id, name: detailRequest.parent_name }); setDetailRequest(null); }}>
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parent Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Manage parent account requests from students</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-bold text-lg">{pagination.total}</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Requests</p>
            <p className="font-semibold text-lg">{filterStatus || 'All statuses'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-bold text-lg">✓</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">On this page</p>
            <p className="font-semibold text-lg">{requests.length} requests</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-lg">{pagination.total_pages}</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Pages</p>
            <p className="font-semibold text-lg">{pagination.limit} per page</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by parent name or email…" value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1); }} />
          </div>
          <select className="input max-w-[160px]" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-outline text-sm" onClick={() => load()}>↻ Refresh</button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-slate-500 font-medium">No requests found</p>
            <p className="text-sm text-slate-400 mt-1">
              {search || filterStatus ? 'Try different search terms or filters' : 'No parent account requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 cursor-pointer select-none" onClick={() => handleSort('parent_name')}>
                      Parent Name <SortIcon field="parent_name" />
                    </th>
                    <th className="px-4">Email</th>
                    <th className="px-4">Student</th>
                    <th className="px-4 cursor-pointer select-none" onClick={() => handleSort('status')}>
                      Status <SortIcon field="status" />
                    </th>
                    <th className="px-4 cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                      Submitted <SortIcon field="created_at" />
                    </th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 font-medium">{r.parent_name}</td>
                      <td className="px-4 text-slate-600">{r.parent_email}</td>
                      <td className="px-4 text-slate-600">{r.student?.name || '—'}</td>
                      <td className="px-4">{statusBadge(r.status)}</td>
                      <td className="px-4 text-slate-500 text-sm">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-brand transition-colors" title="View details"
                            onClick={() => viewDetail(r.id)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {r.status === 'pending' && (
                            <>
                              <button className={"p-1.5 rounded transition-colors " + (actionLoading ? 'text-green-300 cursor-not-allowed' : 'hover:bg-green-100 text-green-600')} title="Approve"
                                disabled={actionLoading}
                                onClick={() => { if (window.confirm('Approve this request and create a parent account?')) handleApprove(r.id); }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button className={"p-1.5 rounded transition-colors " + (actionLoading ? 'text-red-300 cursor-not-allowed' : 'hover:bg-red-100 text-red-600')} title="Reject"
                                disabled={actionLoading}
                                onClick={() => setRejectModal({ id: r.id, name: r.parent_name })}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors" title="Delete"
                            onClick={() => setConfirmDelete({ id: r.id, name: r.parent_name })}>
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40" disabled={pagination.page <= 1} onClick={() => setPage(1)}>««</button>
                <button className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40" disabled={pagination.page <= 1} onClick={() => setPage(p => p - 1)}>« Prev</button>
                <span className="text-sm text-slate-600 px-2">Page {pagination.page} of {pagination.total_pages || 1}</span>
                <button className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40" disabled={pagination.page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>Next »</button>
                <button className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40" disabled={pagination.page >= pagination.total_pages} onClick={() => setPage(pagination.total_pages)}>»»</button>
              </div>
              <span className="text-xs text-slate-400">{pagination.limit} per page</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
