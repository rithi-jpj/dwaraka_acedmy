'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api, API_URL } from '@/lib/api';
import { Download, X, Search, ClipboardCheck, FileText, BarChart3, Award, Printer, Trash2, RefreshCw, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';

export default function MarksPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState<'enter' | 'records' | 'stats' | 'report'>('enter');

  // Batch & exam selectors
  const [batches, setBatches] = useState<any[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // Students in batch (for entry grid)
  const [students, setStudents] = useState<any[]>([]);
  const [entryForm, setEntryForm] = useState({ exam_name: '', max_score: 100, exam_date: '' });
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Marks records
  const [marks, setMarks] = useState<any[]>([]);
  const [marksPage, setMarksPage] = useState(1);
  const [marksTotalPages, setMarksTotalPages] = useState(1);
  const [marksTotal, setMarksTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Report card
  const [reportStudentId, setReportStudentId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load batches
  const loadBatches = useCallback(async () => {
    try {
      const { data } = await api.get('/marks/batches');
      setBatches(data);
      if (data.length > 0 && !selectedBatchId) setSelectedBatchId(data[0].id);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load batches', 'error');
    }
  }, [selectedBatchId, showToast]);

  const loadExams = useCallback(async () => {
    try {
      const params = selectedBatchId ? `?batch_id=${selectedBatchId}` : '';
      const { data } = await api.get(`/marks/exams${params}`);
      setExams(data);
    } catch {}
  }, [selectedBatchId]);

  const loadStudents = useCallback(async () => {
    if (!selectedBatchId) { setStudents([]); return; }
    try {
      const { data } = await api.get(`/batches/${selectedBatchId}/students`);
      setStudents(data);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load students', 'error');
    }
  }, [selectedBatchId, showToast]);

  const loadMarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(marksPage), limit: '20' });
      if (selectedBatchId) params.set('batch_id', selectedBatchId);
      if (selectedExam) params.set('exam_name', selectedExam);
      if (search) params.set('search', search);
      const { data } = await api.get(`/marks?${params}`);
      setMarks(data.marks);
      setMarksTotalPages(data.pagination.pages);
      setMarksTotal(data.pagination.total);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load marks', 'error');
    }
    setLoading(false);
  }, [marksPage, selectedBatchId, selectedExam, search, showToast]);

  const loadStats = useCallback(async () => {
    if (!selectedBatchId) return;
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.set('batch_id', selectedBatchId);
      if (selectedExam) params.set('exam_name', selectedExam);
      const { data } = await api.get(`/marks/stats?${params}`);
      setStats(data);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load stats', 'error');
    }
    setStatsLoading(false);
  }, [selectedBatchId, selectedExam, showToast]);

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { loadExams(); }, [selectedBatchId]);
  // Load students when entering enter/report tab or changing batch
  useEffect(() => {
    if (tab === 'enter' || tab === 'report') { loadStudents(); }
  }, [tab, selectedBatchId, loadStudents]);
  useEffect(() => { if (tab === 'records') loadMarks(); }, [tab, marksPage, loadMarks]);
  useEffect(() => { if (tab === 'stats') loadStats(); }, [tab, selectedBatchId, selectedExam, loadStats]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Debounced page reset on search
  useEffect(() => { setMarksPage(1); }, [search]);

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !entryForm.exam_name) {
      showToast('Select a batch and enter an exam name', 'error');
      return;
    }
    setSaving(true);
    try {
      const entries = students.map(s => ({
        student_id: s.id,
        score: parseFloat(scores[s.id]) || 0,
      }));
      await api.post('/marks/bulk', {
        batch_id: selectedBatchId,
        exam_name: entryForm.exam_name,
        max_score: entryForm.max_score,
        exam_date: entryForm.exam_date || undefined,
        entries,
      });
      showToast(`Marks saved for ${entries.length} student(s)`, 'success');
      setScores({});
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save marks', 'error');
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/marks/${deleteId}`);
      showToast('Mark deleted', 'success');
      setDeleteId(null);
      loadMarks();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteId(null);
    }
  };

  const loadReport = async () => {
    if (!reportStudentId) return;
    setReportLoading(true);
    try {
      const { data } = await api.get(`/marks/report-card?student_id=${reportStudentId}`);
      setReport(data);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load report', 'error');
    }
    setReportLoading(false);
  };

  const printReport = () => {
    if (!reportRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Report Card</title><style>
      body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: auto; }
      h1 { font-size: 24px; color: #1e40af; margin-bottom: 4px; }
      h2 { font-size: 16px; color: #555; font-weight: normal; margin-bottom: 24px; }
      .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
      .info { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .info div { font-size: 14px; }
      .label { color: #888; font-size: 12px; text-transform: uppercase; }
      .value { font-weight: bold; font-size: 16px; }
      .summary { display: flex; gap: 16px; margin-bottom: 24px; }
      .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 20px; text-align: center; flex: 1; }
      .summary-card .num { font-size: 28px; font-weight: bold; color: #1e40af; }
      .summary-card .lbl { font-size: 12px; color: #888; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 13px; text-transform: uppercase; color: #555; }
      td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
      .grade-A\\+ { color: #16a34a; } .grade-A { color: #16a34a; } .grade-B\\+ { color: #2563eb; } .grade-B { color: #2563eb; }
      .grade-C { color: #d97706; } .grade-D { color: #ea580c; } .grade-F { color: #dc2626; }
    </style></head><body>
      <div class="header"><h1>Dwaraka Academy</h1><h2>Report Card</h2></div>
      <div class="info">
        <div><div class="label">Student Name</div><div class="value">${report.student.name}</div></div>
        <div><div class="label">Admission No</div><div class="value">${report.student.admission_no || '—'}</div></div>
        <div><div class="label">Class</div><div class="value">${report.student.current_class || '—'}${report.student.section ? '-' + report.student.section : ''}</div></div>
      </div>
      <div class="summary">
        <div class="summary-card"><div class="num">${report.summary.total_exams}</div><div class="lbl">Total Exams</div></div>
        <div class="summary-card"><div class="num">${report.summary.overall_percentage}%</div><div class="lbl">Overall Percentage</div></div>
        <div class="summary-card"><div class="num">${report.summary.overall_grade}</div><div class="lbl">Grade</div></div>
        <div class="summary-card"><div class="num">${report.summary.overall_gpa.toFixed(1)}</div><div class="lbl">GPA</div></div>
      </div>
      <table><thead><tr><th>Batch</th><th>Subject</th><th>Exams</th><th>Total Score</th><th>Total Max</th><th>Percentage</th><th>Grade</th></tr></thead>
        <tbody>${report.by_batch.map((b: any) => `<tr>
          <td>${b.batch_name}</td><td>${b.subject}</td><td>${b.total_exams}</td>
          <td>${b.total_score}</td><td>${b.total_max}</td>
          <td>${b.percentage}%</td>
          <td class="grade-${b.grade.replace('+', '\\+')}"><strong>${b.grade}</strong></td>
        </tr>`).join('')}</tbody>
      </table>
      <p style="text-align:center;font-size:13px;color:#999;margin-top:32px;">Generated on ${new Date().toLocaleDateString()}</p>
      <script>window.print();</script>
    </body></html>`);
    win.document.close();
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.set('batch_id', selectedBatchId);
      if (selectedExam) params.set('exam_name', selectedExam);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/marks/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marks_${selectedBatchId || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV exported', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const tabs = [
    { id: 'enter' as const, label: 'Enter Marks', icon: ClipboardCheck },
    { id: 'records' as const, label: 'Records', icon: FileText },
    { id: 'stats' as const, label: 'Statistics', icon: BarChart3 },
    { id: 'report' as const, label: 'Report Card', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {toast && <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Marks Management</h1>
          <p className="text-sm text-navy-500 mt-1">Enter exam scores, view records, and generate reports</p>
        </div>
        <button onClick={exportCSV} className="btn-outline">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Batch & Exam Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="input max-w-[250px]" value={selectedBatchId}
          onChange={e => { setSelectedBatchId(e.target.value); setMarksPage(1); }}>
          <option value="">Select a batch…</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name} {b.Subject ? `(${b.Subject.name})` : ''}</option>
          ))}
        </select>
        <select className="input max-w-[200px]" value={selectedExam}
          onChange={e => { setSelectedExam(e.target.value); setMarksPage(1); }}>
          <option value="">All Exams</option>
          {exams.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {selectedExam && (
          <button onClick={() => setSelectedExam('')} className="btn-ghost text-xs">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-50 rounded-2xl p-1 w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Enter Marks */}
      {tab === 'enter' && (
        <div>
          {!selectedBatchId ? (
            <div className="card text-center py-12">
              <ClipboardCheck className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-navy-500 font-medium">Select a batch to enter marks</p>
            </div>
          ) : students.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-navy-500 font-medium">No students enrolled in this batch</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-semibold mb-4">Enter Marks — {batches.find(b => b.id === selectedBatchId)?.name}</h2>
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Exam Name *</label>
                    <input className="input" placeholder="e.g. Mid Term, Final Exam"
                      value={entryForm.exam_name}
                      onChange={e => setEntryForm({ ...entryForm, exam_name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Max Score</label>
                    <input className="input" type="number" min={1}
                      value={entryForm.max_score}
                      onChange={e => setEntryForm({ ...entryForm, max_score: parseInt(e.target.value) || 100 })} />
                  </div>
                  <div>
                    <label className="label">Exam Date</label>
                    <input className="input" type="date"
                      value={entryForm.exam_date}
                      onChange={e => setEntryForm({ ...entryForm, exam_date: e.target.value })} />
                  </div>
                </div>

                {/* Student Score Grid */}
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="w-8">#</th>
                        <th>Student Name</th>
                        <th>Admission No</th>
                        <th className="w-32">Score (max: {entryForm.max_score})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s.id} className="hover:bg-navy-50/50">
                          <td className="text-navy-400 text-xs">{i + 1}</td>
                          <td className="font-medium text-sm text-navy-900">{s.name}</td>
                          <td className="text-sm text-navy-500">{s.admission_no || s.email}</td>
                          <td>
                            <input className="input w-full text-center" type="number" min={0} max={entryForm.max_score}
                              placeholder="0"
                              value={scores[s.id] ?? ''}
                              onChange={e => setScores({ ...scores, [s.id]: e.target.value })} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="btn" disabled={saving}>
                    {saving ? 'Saving…' : `Save All (${students.length} students)`}
                  </button>
                  <button type="button" className="btn-outline"
                    onClick={() => setScores({})}>Clear Scores</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab: Records */}
      {tab === 'records' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input className="input pl-9 w-full" placeholder="Search exams…"
                value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            </div>
            <span className="text-sm text-slate-500">{marksTotal} mark{marksTotal !== 1 && 's'}</span>
          </div>

          {loading ? (
            <div className="card text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
              <p className="text-sm text-navy-500">Loading marks…</p>
            </div>
          ) : marks.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-navy-300" />
              </div>
              <p className="text-navy-500 font-medium">No marks found</p>
              <p className="text-sm text-navy-400 mt-1">Enter marks using the marks entry tab</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Batch</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>%</th>
                      <th>Grade</th>
                      <th>Date</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map(m => (
                      <tr key={m.id} className="hover:bg-navy-50/50 transition">
                        <td className="font-medium text-sm">
                          <div className="text-navy-900">{m.student?.name}</div>
                          <div className="text-xs text-navy-400">{m.student?.admission_no || ''}</div>
                        </td>
                        <td className="text-sm text-navy-600">{m.Batch?.name}</td>
                        <td className="text-sm text-navy-900">{m.exam_name}</td>
                        <td className="text-sm">{m.score} / {m.max_score}</td>
                        <td className="text-sm font-semibold">{m.percentage}%</td>
                        <td>
                          <span className={`badge ${m.grade_color?.includes('green') ? 'badge-green' : m.grade_color?.includes('amber') ? 'badge-amber' : m.grade_color?.includes('red') ? 'badge-red' : 'badge-blue'}`}>
                            {m.grade}
                          </span>
                        </td>
                        <td className="text-sm text-navy-500">{m.exam_date || '—'}</td>
                        <td>
                          <button onClick={() => setDeleteId(m.id)}
                            className="p-2 rounded-xl text-navy-400 hover:text-red-600 hover:bg-red-50 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/80">
                <span className="text-xs text-navy-500">
                  Showing {marksTotal === 0 ? 0 : (marksPage - 1) * 20 + 1}–{Math.min(marksPage * 20, marksTotal)} of {marksTotal}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={marksPage <= 1} onClick={() => setMarksPage(1)}
                    className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">««</button>
                  <button disabled={marksPage <= 1} onClick={() => setMarksPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                  <span className="px-3 py-1 text-xs text-navy-600 font-medium">Page {marksPage} of {marksTotalPages}</span>
                  <button disabled={marksPage >= marksTotalPages} onClick={() => setMarksPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition flex items-center gap-1">
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                  <button disabled={marksPage >= marksTotalPages} onClick={() => setMarksPage(marksTotalPages)}
                    className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">»»</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Statistics */}
      {tab === 'stats' && (
        <div>
          {!selectedBatchId ? (
            <div className="card text-center py-12">
              <BarChart3 className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-navy-500 font-medium">Select a batch to view statistics</p>
            </div>
          ) : statsLoading ? (
            <div className="card text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
              <p className="text-sm text-navy-500">Loading statistics…</p>
            </div>
          ) : !stats ? (
            <div className="card text-center py-12">
              <BarChart3 className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-navy-500 font-medium">No statistics available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card text-center py-4">
                  <div className="text-2xl font-bold text-navy-900">{stats.overall.total_exams}</div>
                  <div className="text-xs text-navy-500 mt-1">Total Exams</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-2xl font-bold text-brand">{stats.overall.percentage}%</div>
                  <div className="text-xs text-navy-500 mt-1">Avg Percentage</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-2xl font-bold text-navy-900">{stats.overall.grade}</div>
                  <div className="text-xs text-navy-500 mt-1">Avg Grade</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-2xl font-bold text-emerald-600">{stats.overall.max_score}</div>
                  <div className="text-xs text-navy-500 mt-1">Highest Score</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-2xl font-bold text-red-600">{stats.overall.min_score}</div>
                  <div className="text-xs text-navy-500 mt-1">Lowest Score</div>
                </div>
              </div>

              {/* Per-student Stats */}
              {stats.per_student?.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-navy-100 bg-navy-50/80">
                    <h3 className="font-semibold text-sm text-navy-900">Per-Student Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead><tr><th>Student</th><th>Exams</th><th>Avg Score</th><th>Percentage</th><th>Grade</th><th>Highest</th><th>Lowest</th></tr></thead>
                      <tbody>
                        {stats.per_student.map((s: any) => (
                          <tr key={s.student_id} className="hover:bg-navy-50/50">
                            <td className="font-medium text-sm">
                              <div className="text-navy-900">{s.student?.name}</div>
                              <div className="text-xs text-navy-400">{s.student?.admission_no || ''}</div>
                            </td>
                            <td className="text-sm text-navy-900">{s.total_exams}</td>
                            <td className="text-sm">{s.avg_score} / {s.avg_max}</td>
                            <td className="text-sm font-semibold">{s.percentage}%</td>
                            <td>
                              <span className={`badge ${
                                s.grade === 'A+' || s.grade === 'A' ? 'badge-green' :
                                s.grade === 'B+' || s.grade === 'B' ? 'badge-blue' :
                                s.grade === 'C' ? 'badge-amber' : 'badge-red'
                              }`}>{s.grade}</span>
                            </td>
                            <td className="text-sm text-emerald-600 font-semibold">{s.max_score}</td>
                            <td className="text-sm text-red-600 font-semibold">{s.min_score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Report Card */}
      {tab === 'report' && (
        <div>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Select Student</label>
              <select className="input" value={reportStudentId}
                onChange={e => setReportStudentId(e.target.value)}>
                <option value="">Choose a student…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.admission_no || s.email}</option>
                ))}
              </select>
            </div>
            <button onClick={loadReport} disabled={!reportStudentId || reportLoading}
              className="btn">{reportLoading ? 'Loading…' : 'Generate Report'}</button>
            {report && (
              <button onClick={printReport} className="btn-outline">
                <Printer className="w-4 h-4" /> Print Report
              </button>
            )}
          </div>

          {reportLoading ? (
            <div className="card text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
              <p className="text-sm text-navy-500">Generating report card…</p>
            </div>
          ) : report && !reportLoading ? (
            <div ref={reportRef} className="card max-w-3xl mx-auto">
              {/* Report Header */}
              <div className="text-center border-b border-brand/20 pb-6 mb-6">
                <h2 className="text-2xl font-bold text-brand">Dwaraka Academy</h2>
                <p className="text-sm text-navy-500">Report Card</p>
              </div>

              {/* Student Info */}
              <div className="flex justify-between mb-6 text-sm">
                <div>
                  <div className="text-xs text-navy-500 uppercase font-semibold">Student Name</div>
                  <div className="font-bold text-lg text-navy-900">{report.student.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-navy-500 uppercase font-semibold">Admission No</div>
                  <div className="font-bold text-navy-900">{report.student.admission_no || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-navy-500 uppercase font-semibold">Class</div>
                  <div className="font-bold text-navy-900">{report.student.current_class || '—'}{report.student.section ? '-' + report.student.section : ''}</div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-navy-50 rounded-xl p-4 text-center border border-navy-100/50">
                  <div className="text-2xl font-bold text-navy-900">{report.summary.total_exams}</div>
                  <div className="text-xs text-navy-500 mt-0.5">Exams</div>
                </div>
                <div className="bg-navy-50 rounded-xl p-4 text-center border border-navy-100/50">
                  <div className="text-2xl font-bold text-brand">{report.summary.overall_percentage}%</div>
                  <div className="text-xs text-navy-500 mt-0.5">Percentage</div>
                </div>
                <div className="bg-navy-50 rounded-xl p-4 text-center border border-navy-100/50">
                  <div className="text-2xl font-bold text-navy-900">{report.summary.overall_grade}</div>
                  <div className="text-xs text-navy-500 mt-0.5">Grade</div>
                </div>
                <div className="bg-navy-50 rounded-xl p-4 text-center border border-navy-100/50">
                  <div className="text-2xl font-bold text-navy-900">{report.summary.overall_gpa.toFixed(1)}</div>
                  <div className="text-xs text-navy-500 mt-0.5">GPA</div>
                </div>
              </div>

              {/* Per-Batch Breakdown */}
              {report.by_batch?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-navy-900 mb-3">Subject-wise Performance</h3>
                  <table className="table w-full">
                    <thead><tr><th>Subject</th><th>Exams</th><th>Score</th><th>%</th><th>Grade</th></tr></thead>
                    <tbody>
                      {report.by_batch.map((b: any, i: number) => (
                        <tr key={i}>
                          <td className="font-medium text-navy-900">{b.batch_name} {b.subject ? `(${b.subject})` : ''}</td>
                          <td className="text-navy-700">{b.total_exams}</td>
                          <td className="text-navy-700">{b.total_score} / {b.total_max}</td>
                          <td className="font-semibold">{b.percentage}%</td>
                          <td>
                            <span className={`badge ${
                              b.grade === 'A+' || b.grade === 'A' ? 'badge-green' :
                              b.grade === 'B+' || b.grade === 'B' ? 'badge-blue' :
                              b.grade === 'C' ? 'badge-amber' : 'badge-red'
                            }`}>{b.grade}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Award className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-navy-500 font-medium">Select a student and click &quot;Generate Report&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-center text-navy-900">Delete Mark</h3>
            <p className="text-sm text-navy-500 text-center mb-5">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete}
                className="btn-danger flex-1">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
