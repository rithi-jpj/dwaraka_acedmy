'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import {
  Users, GraduationCap, BookOpen, Layers, CalendarCheck, ClipboardCheck,
  UserCheck, TrendingUp, Sparkles, Bell, Sun, Moon, User, FileText,
  IndianRupee,
} from 'lucide-react';

type AnalyticsData = {
  totals?: {
    students: number; teachers: number; admins: number; parents: number;
    subjects: number; batches: number; active_batches: number;
    enrollments: number; total_marks: number;
    student_teacher_ratio: number;
  };
  weekly_attendance?: {
    date: string; day: string; present: number; absent: number;
    late: number; total: number; rate: number;
  }[];
  recent_activity?: {
    announcements: any[]; marks: any[]; attendance: any[];
  };
  fees?: {
    total_collected: number; total_pending: number;
    pending_count: number; collection_rate: number;
    today_collection: number;
  };
  active_batches?: {
    id: string; name: string; subject: string;
    teacher: string; student_count: number;
  }[];
  shift_stats?: {
    morning: { id: string; name: string; total_students: number; present_today: number }[];
    evening: { id: string; name: string; total_students: number; present_today: number }[];
  };
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/analytics/dashboard');
      setData(d.data);
    } catch {}
    try {
      const { data: a } = await api.get('/announcements');
      setAnnouncements(a);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Socket.IO auto-refresh
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on('analytics:refresh', load);
    s.on('announcement:new', () => {
      api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
    });
    return () => {
      s.off('analytics:refresh', load);
      s.off('announcement:new');
    };
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-brand-dark mx-auto animate-pulse shadow-lg shadow-brand/20" />
            <p className="text-sm text-slate-500 font-medium animate-pulse-soft">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Student dashboard ──
  if (user?.role === 'student') {
    const s = data as any;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 text-white shadow-xl shadow-brand/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
              <p className="text-purple-200 text-sm mt-0.5">Student Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Layers className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <div className="stat-card-value text-brand">{s?.total_enrollments ?? 0}</div>
            <div className="stat-card-label">Enrolled Batches</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="stat-card-value text-emerald-600">{s?.attendance?.present ?? 0}</div>
            <div className="stat-card-label">Present</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <User className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="stat-card-value text-red-600">{s?.attendance?.absent ?? 0}</div>
            <div className="stat-card-label">Absent</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="stat-card-value text-amber-600">{s?.attendance?.late ?? 0}</div>
            <div className="stat-card-label">Late</div>
          </div>
        </div>

        {/* Recent marks */}
        {s?.recent_marks?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-brand" />
              Recent Marks
            </h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th><th>Date</th></tr></thead>
                <tbody>
                  {s.recent_marks.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="font-medium text-slate-800">{m.exam_name}</td>
                      <td>{m.score}/{m.max_score}</td>
                      <td>
                        <span className={`badge ${
                          m.percentage >= 80 ? 'badge-green' :
                          m.percentage >= 60 ? 'badge-blue' :
                          m.percentage >= 40 ? 'badge-amber' : 'badge-red'
                        }`}>{m.percentage}%</span>
                      </td>
                      <td className="text-slate-500">{m.batch}</td>
                      <td className="text-slate-500">{m.date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Parent dashboard ──
  if (user?.role === 'parent') {
    const p = data as any;
    const student = p?.linked_student;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
              <p className="text-amber-200 text-sm mt-0.5">Parent Dashboard</p>
            </div>
          </div>
        </div>

        {!student ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No linked student found</p>
            <p className="text-sm text-slate-400 mt-1">Contact the academy to link your account.</p>
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-brand" />
                Linked Student
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-xl border border-brand-200/50">
                  {student.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-semibold text-lg text-slate-800">{student.name}</div>
                  <div className="text-sm text-slate-500">{student.email} · {student.admission_no || 'No admission no.'}</div>
                  <div className="text-sm text-slate-500 mt-0.5">Class: {student.current_class || '—'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="stat-card-value text-emerald-600">{p?.attendance?.present ?? 0}</div>
                <div className="stat-card-label">Present</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="stat-card-value text-red-600">{p?.attendance?.absent ?? 0}</div>
                <div className="stat-card-label">Absent</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="stat-card-value text-amber-600">{p?.attendance?.late ?? 0}</div>
                <div className="stat-card-label">Late</div>
              </div>
            </div>

            {p?.recent_marks?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-brand" />
                  Recent Marks
                </h2>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th><th>Date</th></tr></thead>
                    <tbody>
                      {p.recent_marks.map((m: any, i: number) => (
                        <tr key={i}>
                          <td className="font-medium text-slate-800">{m.exam_name}</td>
                          <td>{m.score}/{m.max_score}</td>
                          <td><span className={`badge ${
                            m.percentage >= 80 ? 'badge-green' :
                            m.percentage >= 60 ? 'badge-blue' :
                            m.percentage >= 40 ? 'badge-amber' : 'badge-red'
                          }`}>{m.percentage}%</span></td>
                          <td className="text-slate-500">{m.batch}</td>
                          <td className="text-slate-500">{m.date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Teacher dashboard ──
  if (user?.role === 'teacher') {
    const t = data as any;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">Teacher Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Layers className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <div className="stat-card-value text-brand">{t?.total_batches ?? 0}</div>
            <div className="stat-card-label">Assigned Batches</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="stat-card-value text-emerald-600">{t?.total_students ?? 0}</div>
            <div className="stat-card-label">Total Students</div>
          </div>
        </div>

        {t?.my_batches?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand" />
              My Batches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.my_batches.map((b: any) => (
                <div key={b.id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${b.shift === 'morning' ? 'badge-amber' : 'badge-blue'}`}>
                      {b.shift === 'morning' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {b.shift === 'morning' ? 'Morning' : 'Evening'}
                    </span>
                    <span className="font-semibold text-slate-800">{b.name}</span>
                  </div>
                  {b.start_time && b.end_time && (
                    <div className="text-xs text-slate-500 mb-3">{b.start_time} – {b.end_time}</div>
                  )}
                  <div className="flex gap-6 text-sm">
                    <div><span className="font-bold text-slate-800">{b.total_students}</span> <span className="text-slate-500">students</span></div>
                    <div><span className="font-bold text-emerald-600">{b.present_today}</span> <span className="text-slate-500">present today</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" />
            Latest announcements
          </h2>
          {announcements.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No announcements yet.</p>}
          <ul className="space-y-3">
            {announcements.slice(0, 5).map(a => (
              <li key={a.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="font-medium text-slate-800">{a.title}</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{a.body}</div>
                <div className="text-xs text-slate-400 mt-1">
                  by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Admin dashboard with full analytics ──
  const a = data;

  const CHART_H = 200;
  const CHART_W = 500;
  const BAR_W = 48;
  const GAP = 20;
  const fees = a?.fees;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-purple-600 via-brand to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-brand/25">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-purple-200 text-sm mt-0.5">Dashboard Analytics</p>
          </div>
        </div>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="stat-card-value text-brand">{a?.totals?.students ?? 0}</div>
          <div className="stat-card-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="stat-card-value text-blue-600">{a?.totals?.teachers ?? 0}</div>
          <div className="stat-card-label">Teachers</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="stat-card-value text-purple-600">{a?.totals?.batches ?? 0}</div>
          <div className="stat-card-label">Total Batches</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="stat-card-value text-amber-600">{a?.totals?.subjects ?? 0}</div>
          <div className="stat-card-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="stat-card-value text-emerald-600">{a?.totals?.active_batches ?? 0}</div>
          <div className="stat-card-label">Active Batches</div>
        </div>
      </div>

      {/* Shift-specific batch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Morning Batches
          </h3>
          {(!a?.shift_stats?.morning || a.shift_stats.morning.length === 0) ? (
            <p className="text-sm text-slate-400 text-center py-6">No morning batches</p>
          ) : (
            <div className="space-y-3">
              {a.shift_stats.morning.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between bg-amber-50/80 rounded-xl p-4 border border-amber-100/50">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{b.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.total_students} students</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-emerald-600">{b.present_today}</div>
                    <div className="text-xs text-slate-500">present today</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            Evening Batches
          </h3>
          {(!a?.shift_stats?.evening || a.shift_stats.evening.length === 0) ? (
            <p className="text-sm text-slate-400 text-center py-6">No evening batches</p>
          ) : (
            <div className="space-y-3">
              {a.shift_stats.evening.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between bg-indigo-50/80 rounded-xl p-4 border border-indigo-100/50">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{b.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.total_students} students</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-emerald-600">{b.present_today}</div>
                    <div className="text-xs text-slate-500">present today</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fee Stats */}
      {fees && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="stat-card-value text-emerald-600">₹{(fees.total_collected || 0).toLocaleString()}</div>
            <div className="stat-card-label">Total Collected</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="stat-card-value text-red-600">₹{(fees.total_pending || 0).toLocaleString()}</div>
            <div className="stat-card-label">Pending Fees</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <div className="stat-card-value text-brand">{fees.collection_rate || 0}%</div>
            <div className="stat-card-label">Collection Rate</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="stat-card-value text-amber-600">{fees.pending_count || 0}</div>
            <div className="stat-card-label">Pending Invoices</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="stat-card-value text-blue-600">₹{(fees.today_collection || 0).toLocaleString()}</div>
            <div className="stat-card-label">Today's Collection</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Student–Teacher Ratio</h3>
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-brand">{a?.totals?.students ?? 0}</div>
                  <div className="text-xs text-slate-500">Students</div>
                </div>
                <div className="text-3xl text-slate-300 font-extrabold">:</div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-blue-600">{a?.totals?.teachers ?? 0}</div>
                  <div className="text-xs text-slate-500">Teachers</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-4 border border-brand-100/30">
                <span className="text-xl font-extrabold text-slate-800">{a?.totals?.student_teacher_ratio ?? 0}</span>
                <span className="text-sm text-slate-500 ml-1">students per teacher</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card text-center">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-800">{a?.totals?.enrollments ?? 0}</div>
              <div className="stat-card-label">Enrollments</div>
            </div>
            <div className="stat-card text-center">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-800">{a?.totals?.total_marks ?? 0}</div>
              <div className="stat-card-label">Total Marks</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card text-center">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-600">{a?.totals?.parents ?? 0}</div>
              <div className="stat-card-label">Parents</div>
            </div>
            <div className="stat-card text-center">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-extrabold text-purple-600">{a?.totals?.admins ?? 0}</div>
              <div className="stat-card-label">Admins</div>
            </div>
          </div>
        </div>

        {/* Middle: Attendance Chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-brand" />
            Weekly Attendance Rate
          </h3>
          {(!a?.weekly_attendance || a.weekly_attendance.every(d => d.total === 0)) ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">No attendance data this week</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 40}`} className="w-full max-w-full" style={{ minWidth: 350 }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(pct => {
                  const y = CHART_H - (pct / 100) * (CHART_H - 20) - 10;
                  return (
                    <g key={pct}>
                      <text x={0} y={y + 4} fontSize={11} fill="#94a3b8">{pct}%</text>
                      <line x1={30} y1={y} x2={CHART_W} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                    </g>
                  );
                })}
                {/* Bars */}
                {a?.weekly_attendance?.map((d, i) => {
                  const x = 35 + i * (BAR_W + GAP);
                  const barH = (d.rate / 100) * (CHART_H - 20);
                  const barColor = d.rate >= 75 ? '#059669' : d.rate >= 50 ? '#d97706' : '#dc2626';
                  return (
                    <g key={d.date}>
                      <rect x={x} y={CHART_H - barH - 10} width={BAR_W} height={barH}
                        rx={6} fill={barColor} opacity={0.85} className="transition-all duration-300 hover:opacity-100">
                        <title>{d.rate}% — {d.present} present, {d.absent} absent, {d.late} late</title>
                      </rect>
                      <text x={x + BAR_W / 2} y={CHART_H + 15} fontSize={11} fill="#64748b"
                        textAnchor="middle">{d.day}</text>
                      <text x={x + BAR_W / 2} y={CHART_H - barH - 15} fontSize={11}
                        fill={barColor} textAnchor="middle" fontWeight="bold">
                        {d.rate}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-600" /> ≥75%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-600" /> 50–74%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600" /> {'<'}50%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent Activity */}
        <div className="card max-h-[420px] overflow-y-auto">
          <h3 className="font-semibold text-slate-800 mb-4 sticky top-0 bg-white pb-2 z-10 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand" />
            Recent Activity
          </h3>
          {(!a?.recent_activity?.announcements?.length &&
            !a?.recent_activity?.marks?.length &&
            !a?.recent_activity?.attendance?.length) ? (
            <p className="text-sm text-slate-400 text-center py-10">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {a?.recent_activity?.announcements?.map((item: any) => (
                <div key={`ann-${item.id}`} className="flex items-start gap-3 text-sm">
                  <span className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100/50">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.author} · {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {a?.recent_activity?.marks?.map((item: any) => (
                <div key={`mark-${item.id}`} className="flex items-start gap-3 text-sm">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100/50">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{item.student} — {item.exam}</div>
                    <div className="text-xs text-slate-400">Score: {item.score} · {item.batch} · {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {a?.recent_activity?.attendance?.map((item: any) => (
                <div key={`att-${item.id}`} className="flex items-start gap-3 text-sm">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    item.status === 'present' ? 'bg-emerald-50 border-emerald-100/50' :
                    item.status === 'absent' ? 'bg-red-50 border-red-100/50' : 'bg-amber-50 border-amber-100/50'
                  }`}>
                    <CalendarCheck className={`w-4 h-4 ${
                      item.status === 'present' ? 'text-emerald-600' :
                      item.status === 'absent' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${
                      item.status === 'present' ? 'text-emerald-700' :
                      item.status === 'absent' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {item.student} — {item.status}
                    </div>
                    <div className="text-xs text-slate-400">{item.batch} · {item.date ? new Date(item.date).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Batches */}
      {(a?.active_batches?.length ?? 0) > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand" />
            Active Batches
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead><tr><th>Batch</th><th>Subject</th><th>Teacher</th><th>Students</th></tr></thead>
              <tbody>
                {a?.active_batches?.map(b => (
                  <tr key={b.id}>
                    <td className="font-semibold text-slate-800">{b.name}</td>
                    <td className="text-slate-600">{b.subject}</td>
                    <td className="text-slate-600">{b.teacher}</td>
                    <td><span className="badge-purple">{b.student_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest announcements */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand" />
          Latest announcements
        </h2>
        {announcements.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No announcements yet.</p>}
        <ul className="space-y-3">
          {announcements.slice(0, 5).map(a => (
            <li key={a.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
              <div className="font-semibold text-slate-800">{a.title}</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{a.body}</div>
              <div className="text-xs text-slate-400 mt-1">
                by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
        Live dashboard — updates automatically via Socket.IO
      </div>
    </div>
  );
}
