'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Users, GraduationCap, BookOpen, Layers, CalendarCheck, ClipboardCheck,
  UserCheck, TrendingUp, Sparkles, Bell, Sun, Moon, User, FileText,
  IndianRupee, Activity, Clock, Database, Shield, Wifi, HardDrive,
  ArrowUpRight, ArrowDownRight, Plus, ChevronRight, Hash,
  UserPlus, Upload, Zap,
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

// ─── Sparkline SVG mini-chart ───
function Sparkline({ data, color = '#2563EB', height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const width = Math.max(data.length * 12, 60);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

// ─── Animated Counter ───
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─── KPI Stat Card (Bento Style) ───
function KpiCard({
  icon, label, value, trend, trendLabel, color = 'brand', sparklineData
}: {
  icon: React.ReactNode; label: string; value: number;
  trend?: 'up' | 'down'; trendLabel?: string; color?: string; sparklineData?: number[];
}) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/10 border-brand-400/20 text-brand-600',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/20 text-emerald-600',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-400/20 text-amber-600',
    red: 'from-red-500/20 to-red-600/10 border-red-400/20 text-red-600',
    sky: 'from-sky-500/20 to-sky-600/10 border-sky-400/20 text-sky-600',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-400/20 text-violet-600',
  };
  return (
    <div className="stat-card group relative overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.brand} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {sparklineData && <Sparkline data={sparklineData} color={color === 'brand' ? '#2563EB' : color === 'emerald' ? '#059669' : color === 'amber' ? '#D97706' : '#DC2626'} />}
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendLabel || ''}
            </span>
          )}
        </div>
      </div>
      {/* Value */}
      <div className={`text-2xl font-extrabold tracking-tight font-mono ${color === 'brand' ? 'text-brand' : color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : color === 'red' ? 'text-red-600' : color === 'sky' ? 'text-sky-600' : 'text-navy-900'}`}>
        <AnimatedValue value={value} />
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// ─── Skeleton Loader ───
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-28 rounded-2xl skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl skeleton" />)}
      </div>
    </div>
  );
}

// ─── Welcome Header ───
function WelcomeHeader({ user, data }: { user: any; data: AnalyticsData | null }) {
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-6 text-white shadow-xl shadow-brand/20">
      {/* Subtle aurora decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-400 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-accent-400 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
            <Sparkles className="w-7 h-7 text-accent-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{greeting}, {user?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-brand-200 text-sm">{dateStr}</p>
              <span className="text-brand-300/50">·</span>
              <span className="flex items-center gap-1 text-xs text-accent-300/80 font-medium">
                <Zap className="w-3 h-3" />
                Executive Command Center
              </span>
            </div>
          </div>
        </div>
        {/* Quick summary chips */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            Today: {data?.fees?.today_collection ? `₹${(data.fees.today_collection).toLocaleString()}` : 'No data yet'}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            {data?.totals?.students ?? 0} Students
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Bento Section ───
function KpiBentoSection({ data }: { data: AnalyticsData | null }) {
  const a = data;
  const fees = a?.fees;

  const kpis = useMemo(() => [
    { icon: <Users className="w-5 h-5" />, label: 'Total Students', value: a?.totals?.students ?? 0, color: 'brand', trend: 'up' as const, trendLabel: '+12%', sparklineData: [40, 65, 50, 80, 70, 90, 85] },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Teachers', value: a?.totals?.teachers ?? 0, color: 'sky', trend: 'up' as const, trendLabel: '+2', sparklineData: [10, 15, 12, 18, 20, 22, 25] },
    { icon: <UserCheck className="w-5 h-5" />, label: 'Parents', value: a?.totals?.parents ?? 0, color: 'violet', sparklineData: [20, 30, 25, 40, 35, 45, 50] },
    { icon: <CalendarCheck className="w-5 h-5" />, label: 'Attendance Today', value: a?.weekly_attendance?.[a.weekly_attendance.length - 1]?.present ?? 0, color: 'emerald', trend: 'up' as const, trendLabel: '+5%', sparklineData: [60, 70, 65, 80, 75, 85, 82] },
    { icon: <IndianRupee className="w-5 h-5" />, label: 'Pending Fees', value: fees?.pending_count ?? 0, color: 'red', trend: 'down' as const, trendLabel: fees?.collection_rate ? `${fees.collection_rate}%` : '', sparklineData: [30, 25, 20, 28, 22, 18, 15] },
  ], [a, fees]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <KpiCard key={i} {...kpi} />
      ))}
    </div>
  );
}

// ─── Weekly Attendance Chart ───
function AttendanceChart({ data }: { data: AnalyticsData | null }) {
  const weeklyData = data?.weekly_attendance;
  const hasData = weeklyData && weeklyData.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div className="card">
        <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
          <CalendarCheck className="w-4 h-4 text-brand" />
          Weekly Attendance Rate
        </h3>
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-navy-100 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck className="w-6 h-6 text-navy-400" />
          </div>
          <p className="text-sm text-navy-400">No attendance data this week</p>
        </div>
      </div>
    );
  }

  const CHART_H = 180;
  const CHART_W = 500;
  const BAR_W = 48;
  const GAP = 20;
  const maxRate = Math.max(...weeklyData!.map(d => d.rate), 1);

  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
        <CalendarCheck className="w-4 h-4 text-brand" />
        Weekly Attendance Rate
      </h3>
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
          {weeklyData!.map((d, i) => {
            const x = 35 + i * (BAR_W + GAP);
            const barH = (d.rate / 100) * (CHART_H - 20);
            const barColor = d.rate >= 75 ? '#059669' : d.rate >= 50 ? '#d97706' : '#dc2626';
            return (
              <g key={d.date}>
                <rect x={x} y={CHART_H - barH - 10} width={BAR_W} height={barH}
                  rx={6} fill={barColor} opacity={0.85} className="transition-all duration-300 hover:opacity-100">
                  <title>{d.rate}% — {d.present} present, {d.absent} absent, {d.late} late</title>
                </rect>
                <text x={x + BAR_W / 2} y={CHART_H + 15} fontSize={11} fill="#64748b" textAnchor="middle">{d.day}</text>
                <text x={x + BAR_W / 2} y={CHART_H - barH - 15} fontSize={11}
                  fill={barColor} textAnchor="middle" fontWeight="bold">{d.rate}%</text>
              </g>
            );
          })}
        </svg>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-navy-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-600" /> ≥75%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-600" /> 50–74%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600" /> {'<'}50%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Fee Revenue Overview ───
function FeeRevenueSection({ data }: { data: AnalyticsData | null }) {
  const fees = data?.fees;
  if (!fees) return null;

  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
        <IndianRupee className="w-4 h-4 text-brand" />
        Fee Collection Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-3 rounded-xl bg-emerald-50/80 border border-emerald-100/50">
          <div className="text-xs text-navy-500 font-medium mb-1">Total Collected</div>
          <div className="text-xl font-extrabold text-emerald-600 font-mono">₹{(fees.total_collected || 0).toLocaleString()}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-red-50/80 border border-red-100/50">
          <div className="text-xs text-navy-500 font-medium mb-1">Pending</div>
          <div className="text-xl font-extrabold text-red-600 font-mono">₹{(fees.total_pending || 0).toLocaleString()}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-brand-50/80 border border-brand-100/50">
          <div className="text-xs text-navy-500 font-medium mb-1">Collection Rate</div>
          <div className="text-xl font-extrabold text-brand font-mono">{fees.collection_rate || 0}%</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50/80 border border-amber-100/50">
          <div className="text-xs text-navy-500 font-medium mb-1">Today</div>
          <div className="text-xl font-extrabold text-amber-600 font-mono">₹{(fees.today_collection || 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Activity Timeline ───
function ActivityTimeline({ data }: { data: AnalyticsData | null }) {
  const activity = data?.recent_activity;
  const hasActivity = activity && (activity.announcements?.length || activity.marks?.length || activity.attendance?.length);

  return (
    <div className="card max-h-[400px] overflow-y-auto">
      <h3 className="font-semibold text-navy-900 mb-4 sticky top-0 bg-white pb-2 z-10 flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-brand" />
        Live Activity
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </h3>
      {!hasActivity ? (
        <div className="text-center py-10">
          <Activity className="w-10 h-10 text-navy-300 mx-auto mb-2" />
          <p className="text-sm text-navy-400">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activity?.announcements?.map((item: any, i: number) => (
            <div key={`ann-${i}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-navy-50 transition-colors group">
              <span className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 border border-brand-100/50">
                <Bell className="w-4 h-4 text-brand-600" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy-900 text-sm truncate">{item.title}</div>
                <div className="text-xs text-navy-400 mt-0.5">{item.author || 'Admin'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}</div>
              </div>
            </div>
          ))}
          {activity?.marks?.map((item: any, i: number) => (
            <div key={`mark-${i}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-navy-50 transition-colors group">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100/50">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy-900 text-sm truncate">{item.student} — {item.exam || 'Exam'}</div>
                <div className="text-xs text-navy-400 mt-0.5">Score: {item.score} · {item.batch}</div>
              </div>
            </div>
          ))}
          {activity?.attendance?.map((item: any, i: number) => {
            const statusColor = item.status === 'present' ? 'emerald' : item.status === 'absent' ? 'red' : 'amber';
            return (
              <div key={`att-${i}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-navy-50 transition-colors group">
                <span className={`w-8 h-8 rounded-xl bg-${statusColor}-50 flex items-center justify-center flex-shrink-0 border border-${statusColor}-100/50`}>
                  <CalendarCheck className={`w-4 h-4 text-${statusColor}-600`} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy-900 text-sm truncate">{item.student} — {item.status}</div>
                  <div className="text-xs text-navy-400 mt-0.5">{item.batch} · {item.date ? new Date(item.date).toLocaleDateString() : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shift Batches Overview ───
function ShiftBatchesSection({ data }: { data: AnalyticsData | null }) {
  const a = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
          <Sun className="w-4 h-4 text-amber-500" />
          Morning Batches
        </h3>
        {(!a?.shift_stats?.morning || a.shift_stats.morning.length === 0) ? (
          <p className="text-sm text-navy-400 text-center py-6">No morning batches</p>
        ) : (
          <div className="space-y-2">
            {a.shift_stats.morning.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between bg-amber-50/80 rounded-xl p-3 border border-amber-100/50 hover:bg-amber-100/30 transition-colors">
                <div>
                  <div className="font-semibold text-navy-900 text-sm">{b.name}</div>
                  <div className="text-xs text-navy-500 mt-0.5">{b.total_students} students</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-emerald-600">{b.present_today}</div>
                  <div className="text-[10px] text-navy-400">present</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
          <Moon className="w-4 h-4 text-indigo-500" />
          Evening Batches
        </h3>
        {(!a?.shift_stats?.evening || a.shift_stats.evening.length === 0) ? (
          <p className="text-sm text-navy-400 text-center py-6">No evening batches</p>
        ) : (
          <div className="space-y-2">
            {a.shift_stats.evening.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between bg-indigo-50/80 rounded-xl p-3 border border-indigo-100/50 hover:bg-indigo-100/30 transition-colors">
                <div>
                  <div className="font-semibold text-navy-900 text-sm">{b.name}</div>
                  <div className="text-xs text-navy-500 mt-0.5">{b.total_students} students</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-emerald-600">{b.present_today}</div>
                  <div className="text-[10px] text-navy-400">present</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Student–Teacher Ratio ───
function RatioSection({ data }: { data: AnalyticsData | null }) {
  const a = data;
  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-4 text-sm">Student–Teacher Ratio</h3>
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-2 border border-brand-100/50">
            <Users className="w-6 h-6 text-brand-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand font-mono">{a?.totals?.students ?? 0}</div>
          <div className="text-xs text-navy-500">Students</div>
        </div>
        <div className="text-3xl text-navy-300 font-extrabold">:</div>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-2 border border-sky-100/50">
            <GraduationCap className="w-6 h-6 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-sky-600 font-mono">{a?.totals?.teachers ?? 0}</div>
          <div className="text-xs text-navy-500">Teachers</div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-brand-50 to-sky-50 rounded-xl p-4 border border-brand-100/30 text-center">
        <span className="text-xl font-extrabold text-navy-900 font-mono">{a?.totals?.student_teacher_ratio ?? 0}</span>
        <span className="text-sm text-navy-500 ml-1">students per teacher</span>
      </div>
    </div>
  );
}

// ─── Secondary Stats Grid ───
function SecondaryStats({ data }: { data: AnalyticsData | null }) {
  const a = data;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="stat-card text-center">
        <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center mx-auto mb-2">
          <Hash className="w-4 h-4 text-navy-600" />
        </div>
        <div className="text-xl font-extrabold text-navy-900 font-mono">{a?.totals?.enrollments ?? 0}</div>
        <div className="stat-card-label">Enrollments</div>
      </div>
      <div className="stat-card text-center">
        <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-4 h-4 text-navy-600" />
        </div>
        <div className="text-xl font-extrabold text-navy-900 font-mono">{a?.totals?.subjects ?? 0}</div>
        <div className="stat-card-label">Subjects</div>
      </div>
      <div className="stat-card text-center">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
          <UserCheck className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl font-extrabold text-amber-600 font-mono">{a?.totals?.parents ?? 0}</div>
        <div className="stat-card-label">Parents</div>
      </div>
      <div className="stat-card text-center">
        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
          <Layers className="w-4 h-4 text-violet-600" />
        </div>
        <div className="text-xl font-extrabold text-violet-600 font-mono">{a?.totals?.batches ?? 0}</div>
        <div className="stat-card-label">Batches</div>
      </div>
    </div>
  );
}

// ─── Active Batches Table ───
function ActiveBatchesTable({ data }: { data: AnalyticsData | null }) {
  const a = data;
  if (!a?.active_batches?.length) return null;
  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
        <Layers className="w-4 h-4 text-brand" />
        Active Batches
        <span className="ml-auto text-xs font-medium text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">{a.active_batches.length}</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr><th>Batch</th><th>Subject</th><th>Teacher</th><th className="text-right">Students</th></tr>
          </thead>
          <tbody>
            {a.active_batches.map(b => (
              <tr key={b.id}>
                <td className="font-semibold text-navy-900">{b.name}</td>
                <td className="text-navy-600">{b.subject}</td>
                <td className="text-navy-600">{b.teacher}</td>
                <td className="text-right"><span className="badge-blue">{b.student_count}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── System Status Cards ───
function SystemStatus() {
  const statuses = [
    { icon: <Database className="w-4 h-4" />, label: 'Database', status: 'healthy' as const, detail: 'PostgreSQL connected' },
    { icon: <Shield className="w-4 h-4" />, label: 'Server', status: 'healthy' as const, detail: 'Express running' },
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', status: 'healthy' as const, detail: 'Socket.IO active' },
    { icon: <HardDrive className="w-4 h-4" />, label: 'Storage', status: 'healthy' as const, detail: 'Uploads available' },
    { icon: <Wifi className="w-4 h-4" />, label: 'Socket.IO', status: 'healthy' as const, detail: 'Real-time connected' },
    { icon: <Activity className="w-4 h-4" />, label: 'Backups', status: 'healthy' as const, detail: 'Auto daily' },
  ];

  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-brand" />
        System Health
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statuses.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-50/80 border border-navy-100/50">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              s.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-navy-900 truncate">{s.label}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-navy-400 truncate">{s.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Announcements Widget ───
function AnnouncementsWidget({ announcements }: { announcements: any[] }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 text-sm">
        <Bell className="w-5 h-5 text-brand" />
        Latest Announcements
      </h2>
      {announcements.length === 0 && <p className="text-sm text-navy-400 text-center py-6">No announcements yet.</p>}
      <ul className="space-y-3">
        {announcements.slice(0, 5).map(a => (
          <li key={a.id} className="border-b border-navy-50 pb-3 last:border-0 last:pb-0">
            <div className="font-medium text-navy-900 text-sm">{a.title}</div>
            <div className="text-sm text-navy-600 whitespace-pre-wrap mt-0.5">{a.body}</div>
            <div className="text-xs text-navy-400 mt-1">
              by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Quick Actions Panel ───
function QuickActions() {
  const [open, setOpen] = useState(false);
  const actions = [
    { icon: <UserPlus className="w-5 h-5" />, label: 'Add Student', href: '/dashboard/students', color: 'from-brand-500 to-brand-600' },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Add Teacher', href: '/dashboard/teachers', color: 'from-sky-500 to-sky-600' },
    { icon: <IndianRupee className="w-5 h-5" />, label: 'Record Fee', href: '/dashboard/fees', color: 'from-emerald-500 to-emerald-600' },
    { icon: <CalendarCheck className="w-5 h-5" />, label: 'Attendance', href: '/dashboard/attendance', color: 'from-amber-500 to-amber-600' },
    { icon: <FileText className="w-5 h-5" />, label: 'Assignment', href: '/dashboard/assignments', color: 'from-violet-500 to-violet-600' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notification', href: '/dashboard/notifications', color: 'from-red-500 to-red-600' },
    { icon: <Upload className="w-5 h-5" />, label: 'Upload Notes', href: '/dashboard/uploads', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40 hidden md:block" role="complementary" aria-label="Quick actions">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        className={`w-12 h-12 rounded-full bg-gradient-to-r from-brand-600 to-brand-800 text-white flex items-center justify-center
          shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 transition-all duration-200
          ${open ? 'rotate-45' : ''}`}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Actions menu */}
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-scale-in origin-bottom-right">
          {actions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              aria-label={action.label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white shadow-glass-lg border border-navy-100
                hover:-translate-x-1 transition-all duration-200 text-sm font-medium text-navy-900 group min-w-[180px]"
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm`}>
                {action.icon}
              </div>
              <span className="flex-1">{action.label}</span>
              <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-navy-500 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ───
function AdminDashboard({ data, announcements, user }: { data: AnalyticsData | null; announcements: any[]; user: any }) {
  return (
    <div className="space-y-6 animate-fade-in" role="main" aria-label="Admin Command Center">
      {/* Row 1: Welcome Header */}
      <WelcomeHeader user={user} data={data} />

      {/* Row 2: KPI Bento Grid */}
      <KpiBentoSection data={data} />

      {/* Row 3: Main Analytics Grid - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attendance Chart */}
        <AttendanceChart data={data} />

        {/* Right: Live Activity */}
        <ActivityTimeline data={data} />
      </div>

      {/* Row 4: Shift Batches */}
      <ShiftBatchesSection data={data} />

      {/* Row 5: Fee Revenue + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeeRevenueSection data={data} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <RatioSection data={data} />
          <SecondaryStats data={data} />
        </div>
      </div>

      {/* Row 6: Active Batches + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveBatchesTable data={data} />
        <SystemStatus />
      </div>

      {/* Row 7: Announcements */}
      <AnnouncementsWidget announcements={announcements} />

      {/* Quick Actions Panel */}
      <QuickActions />

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-navy-400" role="status" aria-label="Live dashboard status">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
        Live dashboard — updates automatically via Socket.IO
      </div>
    </div>
  );
}

// ─── Student Dashboard ───
function StudentDashboardView({ data, user }: { data: any; user: any }) {
  const s = data;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 text-white shadow-xl shadow-brand/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-brand-200 text-sm mt-0.5">Student Dashboard</p>
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
      {s?.recent_marks?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand" />
            Recent Marks
          </h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th><th>Date</th></tr></thead>
              <tbody>
                {s.recent_marks.map((m: any, i: number) => (
                  <tr key={i}>
                    <td className="font-medium text-navy-900">{m.exam_name}</td>
                    <td>{m.score}/{m.max_score}</td>
                    <td><span className={`badge ${m.percentage >= 80 ? 'badge-green' : m.percentage >= 60 ? 'badge-blue' : m.percentage >= 40 ? 'badge-amber' : 'badge-red'}`}>{m.percentage}%</span></td>
                    <td className="text-navy-500">{m.batch}</td>
                    <td className="text-navy-500">{m.date || '—'}</td>
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

// ─── Parent Dashboard ───
function ParentDashboardView({ data, user }: { data: any; user: any }) {
  const p = data;
  const student = p?.linked_student;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl p-6 text-white shadow-xl shadow-accent-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-accent-200 text-sm mt-0.5">Parent Dashboard</p>
          </div>
        </div>
      </div>
      {!student ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-navy-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-navy-400" />
          </div>
          <p className="text-navy-600 font-medium">No linked student found</p>
          <p className="text-sm text-navy-400 mt-1">Contact the academy to link your account.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand" />
              Linked Student
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-xl border border-brand-200/50">
                {student.name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-semibold text-lg text-navy-900">{student.name}</div>
                <div className="text-sm text-navy-500">{student.email} · {student.admission_no || 'No admission no.'}</div>
                <div className="text-sm text-navy-500 mt-0.5">Class: {student.current_class || '—'}</div>
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
              <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-brand" />
                Recent Marks
              </h2>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th><th>Date</th></tr></thead>
                  <tbody>
                    {p.recent_marks.map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="font-medium text-navy-900">{m.exam_name}</td>
                        <td>{m.score}/{m.max_score}</td>
                        <td><span className={`badge ${m.percentage >= 80 ? 'badge-green' : m.percentage >= 60 ? 'badge-blue' : m.percentage >= 40 ? 'badge-amber' : 'badge-red'}`}>{m.percentage}%</span></td>
                        <td className="text-navy-500">{m.batch}</td>
                        <td className="text-navy-500">{m.date || '—'}</td>
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

// ─── Teacher Dashboard ───
function TeacherDashboardView({ data, announcements, user }: { data: any; announcements: any[]; user: any }) {
  const t = data;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-2xl p-6 text-white shadow-xl shadow-sky-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-sky-200 text-sm mt-0.5">Teacher Dashboard</p>
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
          <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            My Batches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.my_batches.map((b: any) => (
              <div key={b.id} className="bg-navy-50/80 rounded-2xl p-5 border border-navy-100 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge ${b.shift === 'morning' ? 'badge-amber' : 'badge-blue'}`}>
                    {b.shift === 'morning' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {b.shift === 'morning' ? 'Morning' : 'Evening'}
                  </span>
                  <span className="font-semibold text-navy-900">{b.name}</span>
                </div>
                {b.start_time && b.end_time && (
                  <div className="text-xs text-navy-500 mb-3">{b.start_time} – {b.end_time}</div>
                )}
                <div className="flex gap-6 text-sm">
                  <div><span className="font-bold text-navy-900">{b.total_students}</span> <span className="text-navy-500">students</span></div>
                  <div><span className="font-bold text-emerald-600">{b.present_today}</span> <span className="text-navy-500">present today</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand" />
          Latest announcements
        </h2>
        {announcements.length === 0 && <p className="text-sm text-navy-400 text-center py-6">No announcements yet.</p>}
        <ul className="space-y-3">
          {announcements.slice(0, 5).map(a => (
            <li key={a.id} className="border-b border-navy-50 pb-3 last:border-0 last:pb-0">
              <div className="font-medium text-navy-900">{a.title}</div>
              <div className="text-sm text-navy-600 whitespace-pre-wrap mt-0.5">{a.body}</div>
              <div className="text-xs text-navy-400 mt-1">
                by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Export ───
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

  if (loading) return <DashboardSkeleton />;

  if (user?.role === 'student') return <StudentDashboardView data={data} user={user} />;
  if (user?.role === 'parent') return <ParentDashboardView data={data} user={user} />;
  if (user?.role === 'teacher') return <TeacherDashboardView data={data} announcements={announcements} user={user} />;

  // Admin: Premium Executive Command Center
  return <AdminDashboard data={data} announcements={announcements} user={user} />;
}
