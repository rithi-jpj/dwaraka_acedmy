'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CalendarCheck, Download, Users, Search, Check, X, Clock, BarChart3, RefreshCw, Filter } from 'lucide-react';

type Batch = { id: string; name: string; Subject?: { name: string }; teacher?: { name: string } };
type Student = { id: string; name: string; email: string; admission_no: string | null };
type StatEntry = { student_id: string; student_name: string; admission_no: string | null; total: number; present: number; absent: number; late: number; percentage: number };

export default function AttendancePage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState<'mark' | 'stats' | 'chart'>('mark');
  const [summary, setSummary] = useState<{ students: StatEntry[]; overall: any } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load batches
  useEffect(() => {
    api.get('/attendance/batches').then(r => {
      setBatches(r.data);
      if (!selectedBatchId && r.data.length > 0) setSelectedBatchId(r.data[0].id);
    }).catch(() => showToast('Failed to load batches', 'error'));
  }, []);

  // Load students when batch changes
  useEffect(() => {
    if (!selectedBatchId) return;
    setStudents([]);
    setStatuses({});
    api.get(`/attendance/batches/${selectedBatchId}/students`).then(r => {
      setStudents(r.data);
      const defaults: Record<string, string> = {};
      r.data.forEach((s: Student) => { defaults[s.id] = 'present'; });
      setStatuses(defaults);
    }).catch(() => {});
  }, [selectedBatchId]);

  // Load existing attendance for the selected date
  useEffect(() => {
    if (!selectedBatchId || !date) return;
    api.get(`/attendance/${selectedBatchId}/date?date=${date}`).then(r => {
      const records: Record<string, string> = {};
      r.data.forEach((a: any) => { records[a.student_id] = a.status; });
      setExistingRecords(records);
      // Pre-fill statuses from existing records, but keep defaults for others
      setStatuses(prev => {
        const merged = { ...prev };
        Object.entries(records).forEach(([sid, status]) => { merged[sid] = status; });
        return merged;
      });
    }).catch(() => {});
  }, [selectedBatchId, date]);

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    students.forEach(s => { updated[s.id] = status; });
    setStatuses(updated);
  };

  const saveAttendance = async () => {
    if (!selectedBatchId || !date || students.length === 0) return;
    setSaving(true);
    try {
      const entries = students.map(s => ({
        student_id: s.id,
        status: (statuses[s.id] || 'present') as 'present' | 'absent' | 'late',
      }));
      await api.post('/attendance/bulk', { batch_id: selectedBatchId, date, entries });
      showToast(`Attendance saved for ${entries.length} student(s)`, 'success');
      setExistingRecords({ ...statuses } as any);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const loadSummary = async () => {
    if (!selectedBatchId) return;
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const { data } = await api.get(`/attendance/${selectedBatchId}/summary?${params}`);
      setSummary(data);
    } catch { showToast('Failed to load stats', 'error'); }
    setSummaryLoading(false);
  };

  const loadChart = async () => {
    if (!selectedBatchId) return;
    setChartLoading(true);
    try {
      const { data } = await api.get(`/attendance/${selectedBatchId}/weekly?weeks=8`);
      setChartData(data);
    } catch { showToast('Failed to load chart data', 'error'); }
    setChartLoading(false);
  };

  useEffect(() => {
    if (tab === 'stats') loadSummary();
    if (tab === 'chart') loadChart();
  }, [tab, selectedBatchId]);

  const exportCSV = async () => {
    if (!selectedBatchId) return;
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const token = localStorage.getItem('token');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/attendance/${selectedBatchId}/export?${params}`;
      const res = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = objUrl; a.download = 'attendance.csv'; a.click();
      URL.revokeObjectURL(objUrl);
    } catch { showToast('Failed to export', 'error'); }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // SVG Bar Chart
  const BarChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return <p className="text-sm text-slate-500 text-center py-8">No attendance data for this period.</p>;
    const maxRate = 100;
    const barWidth = Math.max(20, Math.min(60, 600 / data.length));
    const height = 200;
    return (
      <div className="overflow-x-auto">
        <svg width={Math.max(400, data.length * (barWidth + 12))} height={height + 40} className="mx-auto">
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(pct => (
            <g key={pct}>
              <text x={-5} y={height - (pct / 100) * height + 4} textAnchor="end" className="text-[10px] fill-slate-400">{pct}%</text>
              <line x1={0} y1={height - (pct / 100) * height} x2={data.length * (barWidth + 12)} y2={height - (pct / 100) * height} stroke="#e2e8f0" strokeWidth={1} />
            </g>
          ))}
          {/* Bars */}
          {data.map((d, i) => {
            const x = i * (barWidth + 12) + 10;
            const barH = (d.rate / 100) * height;
            const color = d.rate >= 75 ? '#22c55e' : d.rate >= 50 ? '#eab308' : '#ef4444';
            return (
              <g key={d.date}>
                <rect x={x} y={height - barH} width={barWidth} height={barH} fill={color} rx={3} />
                <text x={x + barWidth / 2} y={height - barH - 5} textAnchor="middle" className="text-[9px] fill-slate-600 font-medium">{d.rate}%</text>
                <text x={x + barWidth / 2} y={height + 15} textAnchor="middle" className="text-[8px] fill-slate-400" transform={`rotate(-45,${x + barWidth / 2},${height + 15})`}>
                  {d.date?.slice(5) || ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {toast && <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Attendance Management</h1>
          <p className="text-sm text-navy-500 mt-1">
            {user?.role === 'teacher' ? 'Mark attendance for your batches' : 'Manage attendance across all batches'}
          </p>
        </div>
        <button onClick={exportCSV} className="btn-outline">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Batch Selector + Date */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Batch</label>
            <select className="input" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
              <option value="">— Select batch —</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.Subject?.name}) — {b.teacher?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            {selectedBatch && (
              <div className="flex items-center gap-2 text-xs text-navy-500 p-3 bg-navy-50 rounded-2xl flex-1 border border-navy-100">
                <CalendarCheck className="w-4 h-4 text-brand-400" />
                <span>{selectedBatch.Subject?.name} · {selectedBatch.teacher?.name}</span>
                <span className="text-navy-300">|</span>
                <span className="font-medium">{students.length} student{students.length !== 1 && 's'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-50 rounded-2xl p-1 w-fit">
        {([
          { key: 'mark' as const, label: 'Mark Attendance', icon: CalendarCheck },
          { key: 'stats' as const, label: 'Statistics', icon: BarChart3 },
          { key: 'chart' as const, label: 'Weekly Chart', icon: BarChart3 },
        ]).map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Mark Attendance */}
      {tab === 'mark' && (
        <div className="card p-0 overflow-hidden">
          {!selectedBatchId ? (
            <div className="text-center py-12 text-sm text-navy-400">
              <CalendarCheck className="w-12 h-12 mx-auto text-navy-200 mb-3" />
              <p className="font-medium">Select a batch to start marking attendance</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-navy-300" />
              </div>
              <p className="text-sm text-navy-500 font-medium">No students enrolled</p>
              <p className="text-xs text-navy-400 mt-1">Enroll students in this batch first</p>
            </div>
          ) : (
            <div>
              {/* Bulk Actions */}
              <div className="px-5 py-3.5 bg-navy-50/80 border-b flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-navy-500 mr-1">Mark all as:</span>
                <button onClick={() => markAll('present')} className="badge-green cursor-pointer px-3 py-1.5">
                  <Check className="w-3 h-3" /> Present
                </button>
                <button onClick={() => markAll('absent')} className="badge-red cursor-pointer px-3 py-1.5">
                  <X className="w-3 h-3" /> Absent
                </button>
                <button onClick={() => markAll('late')} className="badge-amber cursor-pointer px-3 py-1.5">
                  <Clock className="w-3 h-3" /> Late
                </button>
                <div className="flex-1" />
                <span className="text-xs text-navy-400 bg-white px-3 py-1.5 rounded-xl border">
                  <span className="text-emerald-600 font-medium">{Object.values(statuses).filter(s => s === 'present').length}</span> present ·
                  <span className="text-red-600 font-medium ml-1">{Object.values(statuses).filter(s => s === 'absent').length}</span> absent ·
                  <span className="text-amber-600 font-medium ml-1">{Object.values(statuses).filter(s => s === 'late').length}</span> late
                </span>
                <button onClick={saveAttendance} disabled={saving} className="btn text-sm">
                  {saving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    'Save Attendance'
                  )}
                </button>
              </div>

              {/* Student Grid */}
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">#</th>
                      <th className="text-left">Student</th>
                      <th className="text-left">Admission No</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={s.id} className={`hover:bg-navy-50/50 transition ${existingRecords[s.id] ? 'bg-emerald-50/30' : ''}`}>
                        <td className="text-sm text-navy-400 w-10">{idx + 1}</td>
                        <td className="font-medium text-navy-900">{s.name}</td>
                        <td className="text-sm text-navy-500">{s.admission_no || '—'}</td>
                        <td className="w-52">
                          <div className="flex gap-1.5 justify-center">
                            {(['present', 'absent', 'late'] as const).map(st => (
                              <button key={st} onClick={() => setStatuses(prev => ({ ...prev, [s.id]: st }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                                  (statuses[s.id] || 'present') === st
                                    ? st === 'present' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                      : st === 'absent' ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                                      : 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                                    : 'bg-navy-100 text-navy-400 hover:bg-navy-200'
                                }`}>
                                {st === 'present' ? <Check className="w-3 h-3" /> : st === 'absent' ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {st === 'present' ? 'Present' : st === 'absent' ? 'Absent' : 'Late'}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Summary Statistics */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex-1 min-w-[150px]">
                <label className="label">From Date</label>
                <input className="input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="label">To Date</label>
                <input className="input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={loadSummary} className="btn">
                  <Filter className="w-4 h-4" /> Apply Filter
                </button>
                <button onClick={exportCSV} className="btn-outline">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            {summaryLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand" />
              </div>
            ) : !summary ? (
              <p className="text-sm text-navy-400 text-center py-6">Select a batch and apply filters to view statistics</p>
            ) : summary.students.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-6">No attendance records found for this period.</p>
            ) : (
              <div>
                {/* Overall stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="stat-card text-center">
                    <div className="stat-card-value text-brand">{summary.overall.total}</div>
                    <div className="stat-card-label">Total Records</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className="stat-card-value text-emerald-600">{summary.overall.present}</div>
                    <div className="stat-card-label">Present</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className="stat-card-value text-red-600">{summary.overall.absent}</div>
                    <div className="stat-card-label">Absent</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className={`stat-card-value ${
                      summary.overall.percentage >= 75 ? 'text-emerald-600' :
                      summary.overall.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {summary.overall.percentage}%
                    </div>
                    <div className="stat-card-label">Attendance Rate</div>
                  </div>
                </div>

                {/* Per-student table */}
                <div className="overflow-x-auto">
                  <table className="table text-sm w-full">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Admission</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">P</th>
                        <th className="text-center">A</th>
                        <th className="text-center">L</th>
                        <th className="text-center">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.students.map(s => (
                        <tr key={s.student_id} className="hover:bg-navy-50/50 transition">
                          <td className="font-medium text-navy-900">{s.student_name}</td>
                          <td className="text-navy-500">{s.admission_no || '—'}</td>
                          <td className="text-center">{s.total}</td>
                          <td className="text-center text-emerald-600 font-medium">{s.present}</td>
                          <td className="text-center text-red-600 font-medium">{s.absent}</td>
                          <td className="text-center text-amber-600 font-medium">{s.late}</td>
                          <td className="text-center">
                            <span className={`badge ${
                              s.percentage >= 75 ? 'badge-green' :
                              s.percentage >= 50 ? 'badge-amber' : 'badge-red'
                            }`}>{s.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Weekly Chart */}
      {tab === 'chart' && (
        <div className="card">
          {!selectedBatchId ? (
            <p className="text-sm text-navy-400 text-center py-8">Select a batch to view the attendance chart</p>
          ) : chartLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-navy-900">Weekly Attendance Rate</h2>
                <button onClick={loadChart} className="btn-outline text-xs"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
              </div>
              <BarChart data={chartData} />
              {chartData.length > 0 && (
                <div className="mt-4 flex items-center gap-4 text-xs text-navy-400 justify-center">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> ≥75%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 50-74%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {'<'}50%</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
