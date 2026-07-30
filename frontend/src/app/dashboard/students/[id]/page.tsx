'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, User, Mail, Phone, MapPin, CalendarDays, BookMarked,
  GraduationCap, Layers, CalendarCheck, ClipboardCheck, Users,
  IndianRupee, AlertCircle, Award,
  BookOpen, FileText, Edit2, ChevronRight, Activity, Hash,
} from 'lucide-react';
import Link from 'next/link';

// ─── Info Item ───
function InfoItem({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="p-3.5 rounded-xl bg-navy-50/80 border border-navy-100/50 hover:border-navy-200/50 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-navy-500 uppercase tracking-wider mb-1.5">
        {icon && <span className="text-brand-400">{icon}</span>}
        {label}
      </div>
      <p className="text-sm font-medium text-navy-900">{value || '—'}</p>
    </div>
  );
}

// ─── Tab Button ───
function TabBtn({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap
        ${active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 shadow-sm border border-brand-200/50'
          : 'text-navy-500 hover:text-navy-700 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700/50 border border-transparent'
        }`}>
      {icon}
      {label}
    </button>
  );
}

// ─── Attendance Ring ───
function AttendanceRing({ present, absent, late }: { present: number; absent: number; late: number }) {
  const total = present + absent + late;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (percentage / 100);
  const gap = circ - dash;

  return (
    <div className="relative flex flex-col items-center gap-3">
      <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
        {/* Background */}
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        {/* Progress arc */}
        <circle cx="48" cy="48" r={r} fill="none" stroke="url(#attGrad)" strokeWidth="6"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
        <defs>
          <linearGradient id="attGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#F4B400" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold font-mono text-navy-900">{percentage}%</span>
        <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider">Present</span>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="h-36 rounded-3xl skeleton" />
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl skeleton" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 rounded-xl skeleton" />
          <div className="h-4 w-32 rounded-xl skeleton" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-10 w-24 rounded-xl skeleton" />)}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
      </div>
    </div>
  );
}

// ─── Error State ───
function ErrorState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100/50">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2">Failed to load student</h3>
      <p className="text-sm text-navy-500 mb-6">Something went wrong while fetching the student details. Please try again.</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onRetry} className="btn">
          <Activity className="w-4 h-4" />
          Retry
        </button>
        <button onClick={onBack} className="btn-outline">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}

// ─── Main Student Profile Page ───
export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'attendance' | 'parents'>('profile');

  const load = () => {
    setLoading(true);
    setError(false);
    api.get(`/students/${params.id}`).then(r => {
      setStudent(r.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setError(true);
    });
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={load} onBack={() => router.back()} />;
  if (!student) return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-navy-400" />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2">Student not found</h3>
      <p className="text-sm text-navy-500 mb-6">This student may have been removed or the link is incorrect.</p>
      <button onClick={() => router.back()} className="btn-outline">
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );

  const initials = student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'academic' as const, label: 'Academic', icon: <BookMarked className="w-3.5 h-3.5" /> },
    { id: 'attendance' as const, label: 'Attendance', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { id: 'parents' as const, label: 'Parents', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Back Button ── */}
      <button onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500 hover:text-navy-700 transition-colors px-1 py-1">
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* ── Cover Header ── */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Cover gradient */}
        <div className="h-40 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent" />
          </div>
        </div>

        {/* Profile info overlay */}
        <div className="px-6 pb-5 pt-0 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center
              text-white font-bold text-2xl shadow-xl border-4 border-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white">
                  {student.name}
                </h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  student.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                    : 'bg-red-50 text-red-700 border-red-200/50'
                }`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{student.admission_no || 'No admission no.'}</span>
                {student.current_class && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span>Class {student.current_class}{student.section ? `-${student.section}` : ''}</span>
                  </>
                )}
                {student.email && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span>{student.email}</span>
                  </>
                )}
              </p>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Link href={`/dashboard/students/${params.id}/edit`}
                className="btn-outline text-xs px-3 py-2">
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Roll Number', value: student.roll_no || '—', icon: <Hash />, color: 'brand', iconBg: 'from-brand-500/20 to-brand-600/10 border-brand-400/20', textColor: 'text-brand' },
          { label: 'Date of Birth', value: student.date_of_birth || '—', icon: <CalendarDays />, color: 'emerald', iconBg: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/20', textColor: 'text-emerald-600' },
          { label: 'Blood Group', value: student.blood_group || '—', icon: <Award />, color: 'red', iconBg: 'from-red-500/20 to-red-600/10 border-red-400/20', textColor: 'text-red-600' },
          { label: 'Gender', value: student.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : '—', icon: <User />, color: 'sky', iconBg: 'from-sky-500/20 to-sky-600/10 border-sky-400/20', textColor: 'text-sky-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.iconBg} flex items-center justify-center mx-auto mb-2`}>
              {s.icon}
            </div>
            <div className={`text-lg font-extrabold tracking-tight font-mono ${s.textColor}`}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1.5 border-b border-navy-100 dark:border-navy-700 pb-1.5 overflow-x-auto scrollbar-thin">
        {tabs.map(tab => (
          <TabBtn
            key={tab.id}
            active={activeTab === tab.id}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[300px]">
        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Email" value={student.email} icon={<Mail className="w-3 h-3" />} />
              <InfoItem label="Phone" value={student.phone} icon={<Phone className="w-3 h-3" />} />
              <InfoItem label="Roll Number" value={student.roll_no} icon={<Hash className="w-3 h-3" />} />
              <InfoItem label="Date of Birth" value={student.date_of_birth} icon={<CalendarDays className="w-3 h-3" />} />
              <InfoItem label="Blood Group" value={student.blood_group} icon={<Award className="w-3 h-3" />} />
              <InfoItem label="Gender" value={student.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : '—'} icon={<User className="w-3 h-3" />} />
              <InfoItem label="Class" value={student.current_class ? `Class ${student.current_class}${student.section ? `-${student.section}` : ''}` : '—'} icon={<GraduationCap className="w-3 h-3" />} />
              <InfoItem label="Admission Number" value={student.admission_no} icon={<FileText className="w-3 h-3" />} />
            </div>

            {student.address && (
              <div className="p-4 rounded-2xl bg-navy-50/80 border border-navy-100/50">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-navy-500 uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3 h-3 text-brand-400" />
                  Address
                </div>
                <p className="text-sm font-medium text-navy-900">{student.address}</p>
              </div>
            )}

            {student.guardian_name && (
              <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-100/50">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                  <Users className="w-3 h-3" />
                  Guardian
                </div>
                <p className="text-sm font-semibold text-navy-900">{student.guardian_name}</p>
                {student.guardian_phone && (
                  <p className="text-xs text-navy-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-brand-400" />
                    {student.guardian_phone}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Academic Tab ── */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* Recent Marks */}
            <div>
              <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-brand" />
                Recent Marks
              </h3>
              {student.recent_marks?.length > 0 ? (
                <div className="space-y-2.5">
                  {student.recent_marks.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-navy-50/80 rounded-2xl p-4 border border-navy-100/50 hover:border-navy-200/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-navy-900">{m.exam_name}</div>
                        <div className="text-xs text-navy-500 mt-0.5 flex items-center gap-2">
                          <GraduationCap className="w-3 h-3 text-brand-400" />
                          {m.Batch?.name || '—'}
                          {m.exam_date && (
                            <>
                              <span className="text-navy-300">·</span>
                              <CalendarDays className="w-3 h-3 text-brand-400" />
                              {m.exam_date}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-base font-bold text-brand">{m.score}/{m.max_score}</div>
                        <div className={`text-xs font-semibold ${
                          (m.score / m.max_score) >= 0.75 ? 'text-emerald-600' :
                          (m.score / m.max_score) >= 0.5 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {((m.score / m.max_score) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <ClipboardCheck className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                  <p className="text-sm text-navy-400">No marks recorded yet</p>
                </div>
              )}
            </div>

            {/* Enrolled Batches */}
            {student.enrollments?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  Enrolled Batches ({student.enrollments.length})
                </h3>
                <div className="space-y-2.5">
                  {student.enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between bg-navy-50/80 rounded-2xl p-4 border border-navy-100/50 hover:border-navy-200/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-navy-900">{e.Batch?.name}</div>
                        <div className="text-xs text-navy-500 mt-0.5">{e.Batch?.Subject?.name}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-xs font-medium text-navy-600 bg-white px-3 py-1.5 rounded-xl border border-navy-100 shadow-sm">
                          {e.Batch?.shift || '—'} {e.Batch?.schedule || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No academic data */}
            {(!student.recent_marks?.length && !student.enrollments?.length) && (
              <div className="card text-center py-8">
                <BookOpen className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                <p className="text-sm text-navy-400">No academic data available</p>
              </div>
            )}
          </div>
        )}

        {/* ── Attendance Tab ── */}
        {activeTab === 'attendance' && (
          <div>
            {student.attendance_stats ? (
              <div className="space-y-6">
                {/* Circular Ring */}
                <div className="card flex flex-col items-center py-8">
                  <div className="relative flex items-center justify-center">
                    <AttendanceRing
                      present={student.attendance_stats.present || 0}
                      absent={student.attendance_stats.absent || 0}
                      late={student.attendance_stats.late || 0}
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-6">
                    {[
                      { label: 'Present', count: student.attendance_stats.present || 0, bgClass: 'bg-emerald-50/80 border-emerald-100/50', textClass: 'text-emerald-600' },
                      { label: 'Absent', count: student.attendance_stats.absent || 0, bgClass: 'bg-red-50/80 border-red-100/50', textClass: 'text-red-600' },
                      { label: 'Late', count: student.attendance_stats.late || 0, bgClass: 'bg-amber-50/80 border-amber-100/50', textClass: 'text-amber-600' },
                    ].map(s => (
                      <div key={s.label} className={`text-center p-3.5 rounded-2xl ${s.bgClass}`}>
                        <div className={`text-xl font-extrabold font-mono ${s.textClass}`}>{s.count}</div>
                        <div className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="card flex items-center justify-center gap-2 text-xs text-navy-500 py-4">
                  <CalendarCheck className="w-3.5 h-3.5 text-brand-400" />
                  Total attendance records: {(student.attendance_stats.present || 0) + (student.attendance_stats.absent || 0) + (student.attendance_stats.late || 0)}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <CalendarCheck className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                <p className="text-sm text-navy-500 font-medium">No attendance data available</p>
                <p className="text-xs text-navy-400 mt-1">Attendance records will appear once marked by teachers.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Parents Tab ── */}
        {activeTab === 'parents' && (
          <div>
            {student.linked_parents?.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" />
                  Linked Parents ({student.linked_parents.length})
                </h3>
                {student.linked_parents.map((p: any) => (
                  <div key={p.id} className="flex items-start gap-4 p-4 rounded-2xl bg-brand-50/80 border border-brand-100/50 hover:border-brand-200/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold text-lg border border-brand-200/50 flex-shrink-0">
                      {p.parent?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-navy-900">{p.parent?.name || 'Unknown'}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-brand-400" />
                          {p.parent?.email || '—'}
                        </span>
                        {p.parent?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-brand-400" />
                            {p.parent.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy-400 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <Users className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                <p className="text-sm text-navy-500 font-medium">No linked parents</p>
                <p className="text-xs text-navy-400 mt-1">Parents can be linked through the Parent Request module.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Actions Footer ── */}
      <div className="card bg-navy-50/50 border border-navy-100/50">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/students/${params.id}/edit`}
            className="btn text-sm">
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Link>
          <Link href={`/dashboard/attendance?student=${params.id}`}
            className="btn-outline text-sm">
            <CalendarCheck className="w-4 h-4" />
            View Attendance
          </Link>
          <Link href={`/dashboard/marks?student=${params.id}`}
            className="btn-outline text-sm">
            <ClipboardCheck className="w-4 h-4" />
            View Marks
          </Link>
          <Link href={`/dashboard/fees?student=${params.id}`}
            className="btn-outline text-sm">
            <IndianRupee className="w-4 h-4" />
            Fee Records
          </Link>
        </div>
      </div>
    </div>
  );
}
