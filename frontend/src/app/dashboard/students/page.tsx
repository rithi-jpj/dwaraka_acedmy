'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Users, GraduationCap, BookOpen, Layers, CalendarCheck, ClipboardCheck,
  UserCheck, TrendingUp, Bell, User, FileText, IndianRupee, Search,
  Plus, ChevronDown, ChevronUp, Grid3X3, List, Table2, SlidersHorizontal,
  X, ArrowUpDown, Download, Upload, Check, AlertCircle, Eye, Edit2,
  Trash2, Key, Phone, Mail, MapPin, Shield, Award, BookMarked, Star,
  Clock, ArrowRight, Filter, RefreshCw, MoreHorizontal,
  ChevronLeft, ChevronRight, Activity,
} from 'lucide-react';

type Student = {
  id: string; name: string; email: string; phone: string | null;
  admission_no: string | null;
  current_class: string | null;
  guardian_name: string | null; guardian_phone: string | null;
  is_active: boolean;
  enrollment_count: number;
  created_at: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  roll_no?: string;
  section?: string;
};

// ─── Animated Counter ───
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
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

// ─── Toast ───
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[100] px-5 py-3.5 rounded-2xl shadow-glass-lg text-sm font-semibold
      animate-fade-in backdrop-blur-2xl flex items-center gap-2.5 ${
      type === 'success' ? 'bg-emerald-600/95 text-white' : 'bg-red-600/95 text-white'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ─── Empty State ───
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4 border border-brand-100/50">
        <Users className="w-8 h-8 text-brand-600" />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2">No students found</h3>
      <p className="text-sm text-navy-500 mb-6 max-w-sm mx-auto">
        Get started by adding your first student to the academy management system.
      </p>
      <button onClick={onAdd} className="btn">
        <Plus className="w-4 h-4" />
        Add Your First Student
      </button>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon, label, value, color = 'brand' }: {
  icon: React.ReactNode; label: string; value: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/10 border-brand-400/20 text-brand-600',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/20 text-emerald-600',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-400/20 text-amber-600',
    red: 'from-red-500/20 to-red-600/10 border-red-400/20 text-red-600',
    sky: 'from-sky-500/20 to-sky-600/10 border-sky-400/20 text-sky-600',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-400/20 text-violet-600',
    emeraldLight: 'from-emerald-100/80 to-emerald-50/80 border-emerald-200/50 text-emerald-700',
  };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.brand} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-extrabold tracking-tight font-mono ${
        color === 'brand' ? 'text-brand' : color === 'emerald' ? 'text-emerald-600' :
        color === 'amber' ? 'text-amber-600' : color === 'red' ? 'text-red-600' :
        color === 'sky' ? 'text-sky-600' : 'text-navy-900'
      }`}>
        <AnimatedValue value={value} />
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// ─── Loading Skeleton ───
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl skeleton" />
          <div className="h-4 w-64 rounded-xl skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 max-w-md rounded-xl skeleton" />
        <div className="h-10 w-28 rounded-xl skeleton" />
        <div className="h-10 w-28 rounded-xl skeleton" />
      </div>
      <div className="h-80 rounded-2xl skeleton" />
    </div>
  );
}

// ─── Student Card (Grid View) ───
function StudentCard({ student, onView, onEdit, onDelete, onResetPwd }: {
  student: Student; onView: (id: string) => void;
  onEdit: (s: Student) => void; onDelete: (id: string) => void;
  onResetPwd: (id: string) => void;
}) {
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="card-bento group relative overflow-hidden">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${student.is_active ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-red-400 to-red-500'}`} />

      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg
          flex-shrink-0 shadow-lg ${student.is_active ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-navy-400 to-navy-500'}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-navy-900 text-base truncate group-hover:text-brand-700 transition-colors">
            {student.name}
          </h3>
          <p className="text-xs text-navy-500 mt-0.5 truncate">{student.admission_no || 'No admission no.'}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          student.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
        }`}>
          {student.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
          <span>{student.current_class ? `Class ${student.current_class}` : 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <Mail className="w-3.5 h-3.5 text-brand-400" />
          <span className="truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <Phone className="w-3.5 h-3.5 text-brand-400" />
          <span>{student.phone || '—'}</span>
        </div>
        {student.guardian_name && (
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <User className="w-3.5 h-3.5 text-brand-400" />
            <span className="truncate">{student.guardian_name} ({student.guardian_phone || '—'})</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-navy-100/60">
        <button onClick={() => onView(student.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
            text-brand-600 hover:bg-brand-50 transition-colors" title="View details">
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button onClick={() => onEdit(student)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
            text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button onClick={() => onResetPwd(student.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
            text-sky-600 hover:bg-sky-50 transition-colors" title="Reset password">
          <Key className="w-3.5 h-3.5" />
          Reset
        </button>
        <button onClick={() => onDelete(student.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
            text-red-600 hover:bg-red-50 transition-colors" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Student Drawer (Right-side panel) ───
function StudentDrawer({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'attendance' | 'fees' | 'parents'>('profile');

  useEffect(() => {
    setLoading(true);
    api.get(`/students/${studentId}`).then(r => {
      setDetail(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white dark:bg-navy-800 h-full overflow-y-auto animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-navy-800 border-b border-navy-100 dark:border-navy-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            {loading ? 'Loading...' : detail?.name || 'Student Details'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
            aria-label="Close drawer">
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-20 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
            <div className="h-48 rounded-2xl skeleton" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Profile Summary */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl
                bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg`}>
                {detail.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white truncate">{detail.name}</h3>
                <p className="text-sm text-navy-500 dark:text-navy-400">{detail.admission_no || 'No admission no.'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    detail.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
                  }`}>
                    {detail.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {detail.current_class && (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      bg-brand-50 text-brand-700 border border-brand-200/50">
                      Class {detail.current_class}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-navy-100 dark:border-navy-700 pb-1 overflow-x-auto">
              {[
                { id: 'profile' as const, label: 'Profile', icon: User },
                { id: 'academic' as const, label: 'Academic', icon: BookMarked },
                { id: 'attendance' as const, label: 'Attendance', icon: CalendarCheck },
                { id: 'fees' as const, label: 'Fees', icon: IndianRupee },
                { id: 'parents' as const, label: 'Parents', icon: Users },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap
                      ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'text-navy-500 hover:text-navy-700 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700/50'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Roll Number" value={detail.roll_no} />
                  <InfoItem label="Date of Birth" value={detail.date_of_birth} />
                  <InfoItem label="Blood Group" value={detail.blood_group} />
                  <InfoItem label="Gender" value={detail.gender} />
                  <InfoItem label="Phone" value={detail.phone} />
                  <InfoItem label="Email" value={detail.email} />
                </div>
                {detail.address && (
                  <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-100/50">
                    <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">Address</p>
                    <p className="text-sm text-navy-700">{detail.address}</p>
                  </div>
                )}
                {detail.guardian_name && (
                  <div className="p-4 rounded-xl bg-brand-50/80 border border-brand-100/50">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Guardian</p>
                    <p className="text-sm font-medium text-navy-900">{detail.guardian_name}</p>
                    <p className="text-xs text-navy-500 mt-0.5">{detail.guardian_phone || ''}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-4">
                {detail.recent_marks?.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-brand" />
                      Recent Marks
                    </h4>
                    <div className="space-y-2">
                      {detail.recent_marks.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between bg-navy-50 rounded-xl p-3 border border-navy-100/50">
                          <div>
                            <div className="text-sm font-medium text-navy-900">{m.exam_name}</div>
                            <div className="text-xs text-navy-500">{m.Batch?.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-brand">{m.score}/{m.max_score}</div>
                            <div className="text-xs text-navy-400">{((m.score / m.max_score) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookMarked className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                    <p className="text-sm text-navy-400">No marks recorded yet</p>
                  </div>
                )}

                {detail.enrollments?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2 mt-4">
                      <Layers className="w-4 h-4 text-brand" />
                      Enrolled Batches
                    </h4>
                    <div className="space-y-2">
                      {detail.enrollments.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between bg-navy-50 rounded-xl p-3 border border-navy-100/50">
                          <div>
                            <div className="text-sm font-medium text-navy-900">{e.Batch?.name}</div>
                            <div className="text-xs text-navy-500">{e.Batch?.Subject?.name}</div>
                          </div>
                          <span className="text-xs text-navy-400 bg-white px-2 py-1 rounded-lg border border-navy-100">
                            {e.Batch?.shift || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                {detail.attendance_stats ? (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: 'Present', count: detail.attendance_stats.present || 0, color: 'emerald' },
                        { label: 'Absent', count: detail.attendance_stats.absent || 0, color: 'red' },
                        { label: 'Late', count: detail.attendance_stats.late || 0, color: 'amber' },
                      ].map(s => (
                        <div key={s.label} className={`text-center p-4 rounded-xl bg-${s.color}-50/80 border border-${s.color}-100/50`}>
                          <div className={`text-2xl font-extrabold font-mono text-${s.color}-600`}>{s.count}</div>
                          <div className={`text-xs font-medium text-navy-500 mt-1`}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-navy-400">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      Total records: {(detail.attendance_stats.present || 0) + (detail.attendance_stats.absent || 0) + (detail.attendance_stats.late || 0)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarCheck className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                    <p className="text-sm text-navy-400">No attendance data</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="text-center py-8">
                <IndianRupee className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                <p className="text-sm text-navy-400">Fee details available in the Fees module</p>
                <Link href="/dashboard/fees" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  View Fee Records <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {activeTab === 'parents' && (
              <div>
                {detail.linked_parents?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.linked_parents.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl bg-brand-50/80 border border-brand-100/50">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold border border-brand-200/50">
                          {p.parent?.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-navy-900">{p.parent?.name}</div>
                          <div className="flex items-center gap-2 text-xs text-navy-500 mt-0.5">
                            <Mail className="w-3 h-3" /> {p.parent?.email}
                            {p.parent?.phone && <><span>·</span><Phone className="w-3 h-3" /> {p.parent.phone}</>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                    <p className="text-sm text-navy-400">No linked parents</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-navy-800 border-t border-navy-100 dark:border-navy-700 -mx-6 px-6 py-4 mt-6">
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/students/${studentId}`}
                  className="btn flex-1">
                  <Eye className="w-4 h-4" />
                  Full Profile
                </Link>
                <Link href={`/dashboard/attendance?student=${studentId}`}
                  className="btn-outline flex-1">
                  <CalendarCheck className="w-4 h-4" />
                  Attendance
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-navy-500">Failed to load student details</p>
            <button onClick={onClose} className="btn-outline mt-4">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="p-3 rounded-xl bg-navy-50/80 border border-navy-100/50">
      <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-navy-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

// ─── Bulk Action Toolbar ───
function BulkToolbar({ selected, onClear, onAction }: {
  selected: Set<string>; onClear: () => void; onAction: (action: string) => void;
}) {
  if (selected.size === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 rounded-2xl border border-brand-100/50 animate-fade-in">
      <span className="text-sm font-semibold text-brand-700">{selected.size} selected</span>
      <div className="flex items-center gap-2 ml-auto">
        <button onClick={() => onAction('export')} className="btn-ghost text-xs text-navy-600">Export</button>
        <button onClick={() => onAction('activate')} className="btn-ghost text-xs text-emerald-600">Activate</button>
        <button onClick={() => onAction('deactivate')} className="btn-ghost text-xs text-red-600">Deactivate</button>
        <button onClick={onClear} className="btn-ghost text-xs text-navy-500">Clear</button>
      </div>
    </div>
  );
}

// ─── Main Students Page ───
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [classes, setClasses] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    guardian_name: '', guardian_phone: '', current_class: '', batch_id: '',
    gender: '', date_of_birth: '', blood_group: '', roll_no: '', section: '',
  });
  const [batches, setBatches] = useState<any[]>([]);

  // Temp password modal
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20', search, sort_by: sortBy, sort_order: sortOrder,
      });
      if (filterActive) params.set('is_active', filterActive);
      if (filterClass) params.set('current_class', filterClass);
      if (filterGender) params.set('gender', filterGender);

      const { data } = await api.get(`/students?${params}`);
      setStudents(data.students);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
      if (data.filters?.classes) setClasses(data.filters.classes);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load students', 'error');
    }
    setLoading(false);
  }, [page, search, filterActive, filterClass, filterGender, sortBy, sortOrder, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/batches/my').then(r => setBatches(r.data)).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sort = (field: string) => {
    if (sortBy === field) setSortOrder(o => o === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortOrder('ASC'); }
    setPage(1);
  };

  const sortIcon = (field: string) => sortBy === field ? (sortOrder === 'ASC' ? ' ↑' : ' ↓') : '';

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', address: '', guardian_name: '', guardian_phone: '',
      current_class: '', batch_id: '', gender: '', date_of_birth: '', blood_group: '', roll_no: '', section: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (s: any) => {
    setForm({
      name: s.name, email: s.email, phone: s.phone || '', address: s.address || '',
      guardian_name: s.guardian_name || '', guardian_phone: s.guardian_phone || '',
      current_class: s.current_class || '', batch_id: s.batch_id || '',
      gender: s.gender || '', date_of_birth: s.date_of_birth || '',
      blood_group: s.blood_group || '', roll_no: s.roll_no || '', section: s.section || '',
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/students/${editId}`, form);
        showToast('Student updated successfully', 'success');
      } else {
        const { data } = await api.post('/students', form);
        setTempPwd(data.tempPassword);
        showToast('Student created successfully', 'success');
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
      await api.delete(`/students/${deleteId}`);
      showToast('Student deleted', 'success');
      setDeleteId(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteId(null);
    }
  };

  const resetPwd = async (id: string) => {
    try {
      const { data } = await api.post(`/students/${id}/reset-password`);
      setTempPwd(data.tempPassword);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Reset failed', 'error');
    }
  };

  // Statistics
  const stats = useMemo(() => ({
    total,
    active: students.filter(s => s.is_active).length,
    inactive: students.filter(s => !s.is_active).length,
    withGuardian: students.filter(s => s.guardian_name).length,
  }), [students, total]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Student Lifecycle Center
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            {total} student{total !== 1 && 's'} enrolled · Manage academic journey, attendance, and more
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center gap-0.5 bg-navy-50 dark:bg-navy-800 rounded-xl p-0.5 border border-navy-100 dark:border-navy-700">
            <button onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-navy-700 shadow-sm text-brand-600' : 'text-navy-400 hover:text-navy-600'}`}
              aria-label="Table view">
              <Table2 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-navy-700 shadow-sm text-brand-600' : 'text-navy-400 hover:text-navy-600'}`}
              aria-label="Grid view">
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="btn">
            <Plus className="w-4 h-4" />
            {showForm ? 'Close' : 'Add Student'}
          </button>
        </div>
      </div>

      {/* ── Statistics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={total} color="brand" />
        <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Active Students" value={stats.active} color="emerald" />
        <StatCard icon={<User className="w-5 h-5" />} label="Inactive" value={stats.inactive} color="amber" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="With Guardian" value={stats.withGuardian} color="sky" />
      </div>

      {/* ── Create/Edit Form ── */}
      {showForm && (
        <div className="card border border-brand-200/50">
          <h2 className="font-bold text-navy-900 mb-5 flex items-center gap-2">
            {editId ? <Edit2 className="w-5 h-5 text-brand" /> : <Plus className="w-5 h-5 text-brand" />}
            {editId ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="label">Class</label>
              <input className="input" value={form.current_class} onChange={e => setForm({ ...form, current_class: e.target.value })} placeholder="e.g. 10, 11, 12" />
            </div>
            <div>
              <label className="label">Section</label>
              <input className="input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. A, B" />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input className="input" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input className="input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select className="input" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Guardian Name</label>
              <input className="input" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Guardian Phone</label>
              <input className="input" value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Assign Batch</label>
              <select className="input" value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                <option value="">No batch</option>
                {batches.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.shift}) — {b.Subject?.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button className="btn">{editId ? 'Update Student' : 'Create Student'}</button>
              <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input className="input pl-10 w-full" placeholder="Search by name, email, admission no..."
            value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(1); }} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost text-sm ${showFilters ? 'text-brand-600 bg-brand-50' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <select className="input max-w-[130px]" value={filterActive}
          onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select className="input max-w-[130px]" value={filterClass}
          onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>

        <span className="text-sm text-navy-500 dark:text-navy-400 font-medium px-2">
          {total} student{total !== 1 && 's'}
        </span>
      </div>

      {/* ── Expanded Filters ── */}
      {showFilters && (
        <div className="card bg-navy-50/50 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input max-w-[150px]" value={filterGender}
              onChange={e => { setFilterGender(e.target.value); setPage(1); }}>
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <button onClick={() => {
              setFilterActive(''); setFilterClass(''); setFilterGender(''); setPage(1);
            }} className="btn-ghost text-xs text-navy-500">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Actions ── */}
      <BulkToolbar selected={selected} onClear={() => setSelected(new Set())}
        onAction={(action) => showToast(`Bulk ${action} — coming soon`, 'success')} />

      {/* ── Content ── */}
      {loading ? <LoadingSkeleton /> : students.length === 0 ? (
        <EmptyState onAdd={() => { resetForm(); setShowForm(true); }} />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {students.map(s => (
            <StudentCard key={s.id} student={s}
              onView={(id) => setDrawerId(id)}
              onEdit={openEdit} onDelete={(id) => setDeleteId(id)}
              onResetPwd={resetPwd} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    <input type="checkbox" className="rounded border-navy-300"
                      onChange={e => {
                        if (e.target.checked) setSelected(new Set(students.map(s => s.id)));
                        else setSelected(new Set());
                      }}
                      checked={selected.size === students.length && students.length > 0} />
                  </th>
                  <th className="cursor-pointer hover:text-brand select-none" onClick={() => sort('name')}>
                    Name{sortIcon('name')}
                  </th>
                  <th className="cursor-pointer hover:text-brand select-none hidden md:table-cell" onClick={() => sort('admission_no')}>
                    Admission{sortIcon('admission_no')}
                  </th>
                  <th className="hidden lg:table-cell">Email</th>
                  <th>Phone</th>
                  <th className="cursor-pointer hover:text-brand select-none" onClick={() => sort('current_class')}>
                    Class{sortIcon('current_class')}
                  </th>
                  <th className="hidden lg:table-cell">Guardian</th>
                  <th className="cursor-pointer hover:text-brand select-none" onClick={() => sort('is_active')}>
                    Status{sortIcon('is_active')}
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const isSelected = selected.has(s.id);
                  return (
                    <tr key={s.id} className={`hover:bg-brand-50/30 transition cursor-pointer ${isSelected ? 'bg-brand-50/50' : ''}`}
                      onClick={() => setDrawerId(s.id)}>
                      <td className="w-10" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-navy-300"
                          checked={isSelected}
                          onChange={() => {
                            const next = new Set(selected);
                            if (isSelected) next.delete(s.id); else next.add(s.id);
                            setSelected(next);
                          }} />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold
                            ${s.is_active ? 'bg-gradient-to-br from-brand-500 to-brand-600' : 'bg-gradient-to-br from-navy-400 to-navy-500'}`}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-navy-900 text-sm">{s.name}</div>
                            <div className="text-[10px] text-navy-400">{s.admission_no || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-navy-600 hidden md:table-cell">{s.admission_no || '—'}</td>
                      <td className="text-sm text-navy-600 hidden lg:table-cell">{s.email}</td>
                      <td className="text-sm text-navy-600">{s.phone || '—'}</td>
                      <td>{s.current_class ? `Class ${s.current_class}` : '—'}</td>
                      <td className="text-sm text-navy-600 hidden lg:table-cell">{s.guardian_name || '—'}</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
                        }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDrawerId(s.id)}
                            className="p-1.5 rounded-lg hover:bg-brand-50 text-navy-400 hover:text-brand-600 transition" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-navy-400 hover:text-amber-600 transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => resetPwd(s.id)}
                            className="p-1.5 rounded-lg hover:bg-sky-50 text-navy-400 hover:text-sky-600 transition" title="Reset password">
                            <Key className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(s.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-navy-400 hover:text-red-600 transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-navy-100 bg-navy-50/30">
            <span className="text-xs text-navy-500">
              Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)}
                className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors">««</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-navy-700">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors flex items-center gap-1">
                Next <ChevronRight className="w-3 h-3" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-navy-200/50 disabled:opacity-30 transition-colors">»»</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Temp Password Modal ── */}
      {tempPwd && (
        <div className="modal-overlay" onClick={() => setTempPwd(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg mb-2">Temporary Password</h3>
            <p className="text-sm text-navy-600 mb-4">Share this temporary password with the student. They will be prompted to change it on first login.</p>
            <div className="bg-brand-50 rounded-2xl p-4 text-center mb-5 border border-brand-100">
              <code className="text-2xl font-mono font-bold text-brand tracking-wider">{tempPwd}</code>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(tempPwd); setTempPwd(null); }}
                className="btn flex-1">Copy & Close</button>
              <button onClick={() => setTempPwd(null)} className="btn-outline flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg mb-2">Delete Student</h3>
            <p className="text-sm text-navy-600 mb-5">Are you sure you want to delete this student? This action cannot be undone. All related data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="btn-danger flex-1">
                <Trash2 className="w-4 h-4" />
                Delete Student
              </button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Detail Drawer ── */}
      {drawerId && (
        <StudentDrawer studentId={drawerId} onClose={() => setDrawerId(null)} />
      )}
    </div>
  );
}
