'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // List state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<any[]>([]);

  // Create / Edit
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ batch_id: '', title: '', description: '', due_date: '' });
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Submissions / Grading
  const [viewSubmissionId, setViewSubmissionId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeForm, setGradeForm] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});

  // Student submission
  const [submitForm, setSubmitForm] = useState<Record<string, { notes: string }>>({});
  const [submitFile, setSubmitFile] = useState<Record<string, File | null>>({});
  const [submitSaving, setSubmitSaving] = useState<Record<string, boolean>>({});

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const { data } = await api.get('/assignments/batches');
      setBatches(data);
    } catch {}
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (batchFilter) params.set('batch_id', batchFilter);
      const { data } = await api.get(`/assignments?${params}`);
      setAssignments(data.assignments);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load assignments', 'error');
    }
    setLoading(false);
  }, [page, search, batchFilter, showToast]);

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { loadAssignments(); }, [loadAssignments]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [search]);

  // Reset form
  const openCreate = () => {
    setEditId(null);
    setForm({ batch_id: batches[0]?.id || '', title: '', description: '', due_date: '' });
    setFormFile(null);
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ batch_id: a.batch_id, title: a.title, description: a.description || '', due_date: a.due_date || '' });
    setFormFile(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.batch_id) { showToast('Title and batch are required', 'error'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('batch_id', form.batch_id);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('due_date', form.due_date);
      if (formFile) fd.append('file', formFile);

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editId) {
        const res = await fetch(`${API_URL}/api/assignments/${editId}`, {
          method: 'PATCH', headers, body: fd,
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Update failed'); }
        showToast('Assignment updated', 'success');
      } else {
        const res = await fetch(`${API_URL}/api/assignments`, {
          method: 'POST', headers, body: fd,
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Create failed'); }
        showToast('Assignment created', 'success');
      }
      setShowForm(false);
      loadAssignments();
    } catch (e: any) {
      showToast(e?.message || 'Save failed', 'error');
    }
    setSaving(false);
  };

  // Delete
  const confirmDelete = async (id: string) => {
    if (!confirm('Delete this assignment? Submissions will also be removed.')) return;
    try {
      await api.delete(`/assignments/${id}`);
      showToast('Assignment deleted', 'success');
      loadAssignments();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
    }
  };

  // View submissions
  const openSubmissions = async (assignmentId: string) => {
    setViewSubmissionId(assignmentId);
    setSubmissionsLoading(true);
    try {
      const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(data);
      const grades: Record<string, string> = {};
      const feedback: Record<string, string> = {};
      data.forEach((s: any) => {
        if (s.grade != null) grades[s.id] = String(s.grade);
        if (s.feedback) feedback[s.id] = s.feedback;
      });
      setGradeForm(grades);
      setGradeFeedback(feedback);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load submissions', 'error');
    }
    setSubmissionsLoading(false);
  };

  // Grade a submission
  const handleGrade = async (submissionId: string) => {
    try {
      const payload: any = {};
      if (gradeForm[submissionId]) payload.grade = parseFloat(gradeForm[submissionId]);
      if (gradeFeedback[submissionId]) payload.feedback = gradeFeedback[submissionId];
      await api.patch(`/submissions/${submissionId}/grade`, payload);
      showToast('Grade saved', 'success');
      openSubmissions(viewSubmissionId!);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Grade failed', 'error');
    }
  };

  // Student submit
  const handleSubmit = async (assignmentId: string) => {
    setSubmitSaving(s => ({ ...s, [assignmentId]: true }));
    try {
      const fd = new FormData();
      fd.append('notes', submitForm[assignmentId]?.notes || '');
      if (submitFile[assignmentId]) fd.append('file', submitFile[assignmentId]!);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submit failed');
      }
      showToast('Submitted successfully', 'success');
      setSubmitFile(s => ({ ...s, [assignmentId]: null }));
      loadAssignments();
    } catch (e: any) {
      showToast(e?.message || 'Submit failed', 'error');
    }
    setSubmitSaving(s => ({ ...s, [assignmentId]: false }));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'student' ? 'View and submit your assignments' : 'Create and manage assignments'}
          </p>
        </div>
        {user?.role !== 'student' && (
          <button onClick={openCreate} className="btn flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assignment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {user?.role !== 'student' && (
          <select className="input max-w-[220px]" value={batchFilter}
            onChange={e => { setBatchFilter(e.target.value); setPage(1); }}>
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} {b.Subject ? `(${b.Subject.name})` : ''}</option>
            ))}
          </select>
        )}
        <div className="relative flex-1 max-w-xs">
          <input className="input pl-8 w-full" placeholder="Search assignments…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="text-sm text-slate-500">{total} assignment{total !== 1 && 's'}</span>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card border-2 border-brand/20">
          <h3 className="font-semibold mb-4">{editId ? 'Edit Assignment' : 'New Assignment'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Batch *</label>
                <select className="input" value={form.batch_id}
                  onChange={e => setForm({ ...form, batch_id: e.target.value })} required>
                  <option value="">Select a batch…</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="Assignment title"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" placeholder="Instructions, notes…"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Attachment (optional)</label>
              <input className="input" type="file"
                onChange={e => setFormFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-slate-400 mt-1">Upload assignment handout or reference material</p>
            </div>
            <div className="flex gap-3">
              <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Submissions Panel */}
      {viewSubmissionId && (
        <div className="card border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Submissions</h3>
            <button onClick={() => setViewSubmissionId(null)} className="text-sm text-slate-500 hover:text-slate-700">✕ Close</button>
          </div>
          {submissionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th>Student</th>
                    <th>File</th>
                    <th>Submitted</th>
                    <th>Notes</th>
                    <th className="w-24">Grade</th>
                    <th>Feedback</th>
                    <th className="w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="font-medium">{s.student?.name}</td>
                      <td>
                        {s.file_url ? (
                          <a href={`${API_URL}/api/submissions/${s.id}/download`} target="_blank"
                            className="text-brand hover:underline text-xs inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {s.original_filename || 'File'}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-500">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                      </td>
                      <td className="text-xs text-slate-600 max-w-[200px] truncate">{s.notes || '—'}</td>
                      <td>
                        <input className="input w-20 text-center" type="number" min={0} placeholder="—"
                          value={gradeForm[s.id] ?? (s.grade != null ? String(s.grade) : '')}
                          onChange={e => setGradeForm({ ...gradeForm, [s.id]: e.target.value })} />
                      </td>
                      <td>
                        <input className="input w-full min-w-[120px]" placeholder="Feedback…"
                          value={gradeFeedback[s.id] ?? s.feedback ?? ''}
                          onChange={e => setGradeFeedback({ ...gradeFeedback, [s.id]: e.target.value })} />
                      </td>
                      <td>
                        <button onClick={() => handleGrade(s.id)}
                          className="px-3 py-1 text-xs rounded bg-brand text-white hover:bg-brand/90 transition disabled:opacity-50"
                          disabled={!gradeForm[s.id] && !gradeFeedback[s.id]}>
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading assignments…</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 font-medium">No assignments</p>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'student' ? 'Your teachers have not posted any assignments yet.' : 'Create your first assignment above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className={`card hover:shadow-md transition ${a.is_overdue ? 'border-red-200' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    {a.is_overdue && !a.my_submission?.id && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                    )}
                    {a.my_submission?.grade != null && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Grade: {a.my_submission.grade}
                      </span>
                    )}
                    {a.my_submission?.id && a.my_submission.grade == null && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Submitted</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-2">{a.description || 'No description'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>Batch: {a.Batch?.name}</span>
                    {a.Batch?.Subject && <span>Subject: {a.Batch.Subject.name}</span>}
                    {a.due_date && <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                    <span>Posted by {a.creator?.name}</span>
                    {user?.role !== 'student' && (
                      <span className="text-xs">
                        {a.submitted_count ?? 0}/{a.total_students ?? 0} submitted
                      </span>
                    )}
                    {a.file_url && (
                      <a href={`${API_URL}/api/assignments/${a.id}/download`} target="_blank"
                        className="inline-flex items-center gap-1 text-brand hover:underline">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {a.original_filename || 'Download'}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Student: submit / view */}
                  {user?.role === 'student' && (
                    <div className="flex flex-col gap-1 items-end">
                      <input className="text-xs w-36" type="file"
                        onChange={e => setSubmitFile({ ...submitFile, [a.id]: e.target.files?.[0] || null })} />
                      {a.my_submission?.id ? (
                        <button onClick={() => {
                          setSubmitForm({ ...submitForm, [a.id]: { notes: a.my_submission.notes || '' } });
                          handleSubmit(a.id);
                        }} className="btn-outline text-xs px-3 py-1.5">Resubmit</button>
                      ) : (
                        <button onClick={() => handleSubmit(a.id)}
                          className="btn text-xs px-3 py-1.5"
                          disabled={submitSaving[a.id]}>
                          {submitSaving[a.id] ? '…' : 'Submit'}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Teacher/admin: actions */}
                  {user?.role !== 'student' && (
                    <>
                      <button onClick={() => openSubmissions(a.id)}
                        className="btn-outline text-xs px-3 py-1.5">Submissions</button>
                      <button onClick={() => openEdit(a)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => confirmDelete(a.id)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(1)}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">««</button>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">« Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">Next »</button>
                <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 disabled:opacity-30">»»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
