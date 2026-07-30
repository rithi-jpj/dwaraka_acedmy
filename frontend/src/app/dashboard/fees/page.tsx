'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { IndianRupee, Search, Download, Plus, Filter, ChevronDown, Trash2, Edit3, Eye, Printer, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import FeeReceipt from '@/components/fees/FeeReceipt';

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'bulk' | 'stats'>('list');

  // Form state for single fee creation
  const [form, setForm] = useState({
    student_id: '', fee_head: 'Tuition Fee', amount: '', due_date: '',
    batch_id: '', term: '',
  });
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Bulk create
  const [bulkFeeHead, setBulkFeeHead] = useState('Tuition Fee');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkBatchId, setBulkBatchId] = useState('');
  const [bulkTerm, setBulkTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Payment modal
  const [payModal, setPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [payTxId, setPayTxId] = useState('');

  // Receipt modal
  const [receiptFee, setReceiptFee] = useState<any>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
      });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterBatch) params.set('batch_id', filterBatch);

      const { data } = await api.get(`/fees?${params}`);
      setFees(data.fees);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load fees', 'error');
    }
    setLoading(false);
  }, [page, search, filterStatus, filterBatch, showToast]);

  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterBatch) params.set('batch_id', filterBatch);
      const { data } = await api.get(`/fees/stats?${params}`);
      setStats(data);
    } catch {}
  }, [filterBatch]);

  useEffect(() => { loadFees(); }, [loadFees]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data)).catch(() => {});
    api.get('/students?limit=500').then(r => setStudents(r.data.students || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Create single fee
  const createFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.due_date) {
      return showToast('Fill all required fields', 'error');
    }
    setFormLoading(true);
    try {
      await api.post('/fees', {
        ...form,
        amount: parseFloat(form.amount),
      });
      showToast('Fee created successfully', 'success');
      setForm({ student_id: '', fee_head: 'Tuition Fee', amount: '', due_date: '', batch_id: '', term: '' });
      loadFees();
      loadStats();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to create fee', 'error');
    }
    setFormLoading(false);
  };

  // Bulk create fees
  const createBulkFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0) return showToast('Select at least one student', 'error');
    if (!bulkAmount || !bulkDueDate) return showToast('Amount and due date required', 'error');

    setFormLoading(true);
    try {
      const { data } = await api.post('/fees/bulk', {
        student_ids: selectedStudents,
        batch_id: bulkBatchId || undefined,
        fee_head: bulkFeeHead,
        amount: parseFloat(bulkAmount),
        due_date: bulkDueDate,
        term: bulkTerm || undefined,
      });
      showToast(`Created ${data.count} fee records`, 'success');
      setSelectedStudents([]);
      setActiveTab('list');
      loadFees();
      loadStats();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to create fees', 'error');
    }
    setFormLoading(false);
  };

  // Record payment
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return showToast('Enter a valid amount', 'error');
    setFormLoading(true);
    try {
      await api.post(`/fees/${payModal.id}/pay`, {
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        transaction_id: payTxId || undefined,
      });
      showToast('Payment recorded successfully', 'success');
      setPayModal(null);
      setPayAmount('');
      setPayTxId('');
      loadFees();
      loadStats();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Payment failed', 'error');
    }
    setFormLoading(false);
  };

  // Delete fee
  const deleteFee = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/fees/${deleteId}`);
      showToast('Fee record deleted', 'success');
      setDeleteId(null);
      loadFees();
      loadStats();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
    }
  };

  // Export CSV
  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterBatch) params.set('batch_id', filterBatch);
      // Fetch CSV as text using raw fetch to handle the download properly
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/fees/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fees_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Export downloaded', 'success');
    } catch (e) {
      showToast('Export failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-amber-100 text-amber-700',
      pending: 'bg-red-100 text-red-700',
      waived: 'bg-slate-100 text-slate-600',
    };
    return colors[status] || 'bg-slate-100 text-slate-600';
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter((s: any) =>
    !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.admission_no?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Fee Management</h1>
          <p className="text-sm text-navy-500 mt-1">Manage student fees, payments, and invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-outline">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setActiveTab('bulk')} className="btn">
            <Plus className="w-4 h-4" /> Bulk Create
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-card-value text-brand">₹{stats.summary.total_collected?.toLocaleString()}</div>
            <div className="stat-card-label">Total Collected</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value text-red-600">₹{stats.summary.total_pending?.toLocaleString()}</div>
            <div className="stat-card-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value text-emerald-600">{stats.summary.collection_rate}%</div>
            <div className="stat-card-label">Collection Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value text-amber-600">₹{stats.today_collection.total?.toLocaleString()}</div>
            <div className="stat-card-label">Today's Collection</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-50 rounded-2xl p-1 w-fit">
        {[
          { key: 'list', label: 'All Fees', icon: IndianRupee },
          { key: 'create', label: 'Add Fee', icon: Plus },
          { key: 'bulk', label: 'Bulk Create', icon: Filter },
          { key: 'stats', label: 'Statistics', icon: Download },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bulk Create Form */}
      {activeTab === 'bulk' && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">Bulk Create Fee Records</h2>
          <form onSubmit={createBulkFees} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Fee Head</label>
                <select className="input" value={bulkFeeHead} onChange={e => setBulkFeeHead(e.target.value)}>
                  <option>Tuition Fee</option>
                  <option>Admission Fee</option>
                  <option>Exam Fee</option>
                  <option>Lab Fee</option>
                  <option>Sports Fee</option>
                  <option>Library Fee</option>
                  <option>Development Fee</option>
                </select>
              </div>
              <div>
                <label className="label">Amount *</label>
                <input className="input" type="number" min="1" value={bulkAmount}
                  onChange={e => setBulkAmount(e.target.value)} required />
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input className="input" type="date" value={bulkDueDate}
                  onChange={e => setBulkDueDate(e.target.value)} required />
              </div>
              <div>
                <label className="label">Batch (optional)</label>
                <select className="input" value={bulkBatchId} onChange={e => setBulkBatchId(e.target.value)}>
                  <option value="">All Batches</option>
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Term</label>
              <select className="input max-w-[200px]" value={bulkTerm} onChange={e => setBulkTerm(e.target.value)}>
                <option value="">—</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Annual">Annual</option>
                <option value="Quarter 1">Quarter 1</option>
                <option value="Quarter 2">Quarter 2</option>
              </select>
            </div>
            <div>
              <label className="label">Select Students ({selectedStudents.length} selected)</label>
              <input className="input mb-2" placeholder="Search students..." value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredStudents.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)} className="rounded border-slate-300" />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-400">{s.admission_no || ''}</span>
                    <span className="text-slate-400 ml-auto">{s.current_class ? `Class ${s.current_class}` : ''}</span>
                  </label>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-400 text-center">No students found</div>
                )}
              </div>
            </div>
            <button className="btn" disabled={formLoading || selectedStudents.length === 0}>
              {formLoading ? 'Creating...' : `Create Fees for ${selectedStudents.length} Students`}
            </button>
          </form>
        </div>
      )}

      {/* Create Single Fee */}
      {activeTab === 'create' && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">Create Fee Record</h2>
          <form onSubmit={createFee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="label">Student *</label>
              <select className="input" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required>
                <option value="">Select student</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.admission_no || s.email} {s.current_class ? `(Class ${s.current_class})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fee Head</label>
              <select className="input" value={form.fee_head} onChange={e => setForm({...form, fee_head: e.target.value})}>
                <option>Tuition Fee</option><option>Admission Fee</option><option>Exam Fee</option>
                <option>Lab Fee</option><option>Sports Fee</option><option>Library Fee</option><option>Development Fee</option>
              </select>
            </div>
            <div>
              <label className="label">Amount *</label>
              <input className="input" type="number" min="1" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})} required />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm({...form, due_date: e.target.value})} required />
            </div>
            <div>
              <label className="label">Batch</label>
              <select className="input" value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})}>
                <option value="">—</option>
                {batches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Term</label>
              <select className="input" value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
                <option value="">—</option>
                <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <button className="btn" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Fee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics Panel */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-card-value text-navy-900">{stats.summary.total_records}</div>
              <div className="stat-card-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-brand">₹{stats.summary.total_amount?.toLocaleString()}</div>
              <div className="stat-card-label">Total Amount</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-emerald-600">₹{stats.summary.total_collected?.toLocaleString()}</div>
              <div className="stat-card-label">Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-red-600">₹{stats.summary.total_pending?.toLocaleString()}</div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <div className="card">
              <h3 className="font-semibold text-navy-900 mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Paid', count: stats.status_breakdown.paid, color: 'bg-emerald-500' },
                  { label: 'Partial', count: stats.status_breakdown.partial, color: 'bg-amber-500' },
                  { label: 'Pending', count: stats.status_breakdown.pending, color: 'bg-red-500' },
                  { label: 'Waived', count: stats.status_breakdown.waived, color: 'bg-navy-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-navy-900">{s.label}</span>
                        <span className="text-navy-500">{s.count}</span>
                      </div>
                      <div className="w-full bg-navy-100 rounded-full h-2">
                        <div className={`${s.color} h-2 rounded-full`}
                          style={{ width: `${stats.summary.total_records > 0 ? (s.count / stats.summary.total_records) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly collection */}
            <div className="card">
              <h3 className="font-semibold text-navy-900 mb-4">Monthly Collection</h3>
              {stats.monthly_collection?.length > 0 ? (
                <div className="space-y-2">
                  {stats.monthly_collection.map((m: any) => (
                    <div key={m.month} className="flex items-center justify-between bg-navy-50/80 rounded-xl p-3 border border-navy-100/50">
                      <span className="font-medium text-sm text-navy-900">{m.month}</span>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">₹{m.total?.toLocaleString()}</div>
                        <div className="text-xs text-navy-400">{m.count} payment(s)</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 text-center py-6">No monthly data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-navy-400" />
          <input className="input pl-9 w-full" placeholder="Search by student, invoice, fee head..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <select className="input max-w-[140px]" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
        <select className="input max-w-[160px]" value={filterBatch}
          onChange={e => { setFilterBatch(e.target.value); setPage(1); }}>
          <option value="">All Batches</option>
          {batches.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <span className="text-sm text-navy-500">{total} record{total !== 1 && 's'}</span>
      </div>

      {/* Fee Table */}
      {loading ? (
        <div className="card text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
          <p className="text-sm text-navy-500">Loading fees...</p>
        </div>
      ) : fees.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
            <IndianRupee className="w-8 h-8 text-navy-300" />
          </div>
          <p className="text-navy-500 font-medium">No fee records found</p>
          <p className="text-sm text-navy-400 mt-1">Create fee records to get started</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Student</th>
                  <th>Fee Head</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-navy-50/50 transition">
                    <td className="text-xs font-mono text-navy-500">{f.invoice_no}</td>
                    <td className="font-medium text-navy-900">
                      <div>{f.student?.name}</div>
                      <div className="text-xs text-navy-400">{f.student?.admission_no || ''}</div>
                    </td>
                    <td>{f.fee_head}</td>
                    <td className="font-medium">₹{f.amount?.toLocaleString()}</td>
                    <td className="text-emerald-600 font-medium">₹{f.paid_amount?.toLocaleString()}</td>
                    <td className={f.balance > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
                      ₹{f.balance?.toLocaleString()}
                    </td>
                    <td className="text-sm">{f.due_date ? new Date(f.due_date + 'T00:00:00').toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {f.status !== 'paid' && (
                          <button onClick={() => { setPayModal(f); setPayAmount(String(f.amount - f.paid_amount)); }}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition" title="Record Payment">
                            ₹ Pay
                          </button>
                        )}
                        <button onClick={() => setReceiptFee(f)}
                          className="p-1.5 rounded hover:bg-brand-50 text-brand-600 transition" title="View/Print Receipt">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(f.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition" title="Delete">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/80">
            <span className="text-xs text-navy-500">
              Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">««</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <span className="px-3 py-1 text-xs text-navy-600 font-medium">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">»»</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { setPayModal(null); setPayAmount(''); }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Record Payment</h3>
            <p className="text-sm text-slate-500 mb-4">
              {payModal.student?.name} — {payModal.fee_head}<br />
              Total: ₹{payModal.amount?.toLocaleString()} · Paid: ₹{payModal.paid_amount?.toLocaleString()} · Balance: ₹{payModal.amount - payModal.paid_amount}
            </p>
            <form onSubmit={recordPayment} className="space-y-4">
              <div>
                <label className="label">Payment Amount *</label>
                <input className="input" type="number" min="1"
                  max={payModal.amount - payModal.paid_amount}
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
              </div>
              <div>
                <label className="label">Payment Mode *</label>
                <select className="input" value={payMode} onChange={e => setPayMode(e.target.value)} required>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="label">Transaction ID (optional)</label>
                <input className="input" value={payTxId} onChange={e => setPayTxId(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button className="btn flex-1" disabled={formLoading}>
                  {formLoading ? 'Processing...' : 'Record Payment'}
                </button>
                <button type="button" className="btn-outline flex-1"
                  onClick={() => { setPayModal(null); setPayAmount(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptFee && (
        <FeeReceipt fee={receiptFee} onClose={() => setReceiptFee(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-600 mb-4">Delete this fee record? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={deleteFee} className="btn bg-red-600 hover:bg-red-700 text-white flex-1">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
