'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  BookOpen, CalendarDays, Clock, CheckCircle2, Target, Trophy,
  Sparkles, Brain, Flame, GraduationCap,
  Bell, Download, FileText, Star, ChevronRight,
  BookMarked, Users, Zap, TrendingUp, Award,
} from 'lucide-react';

// ─── Circular Progress Ring ───
function ProgressRing({ pct, size = 80, stroke = 6, color = '#1E40AF', label, value }: {
  pct: number; size?: number; stroke?: number; color?: string; label?: string; value?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  const gap = circ - dash;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold font-mono tracking-tight" style={{ color }}>{value || `${Math.round(pct)}%`}</span>
        </div>
      </div>
      {label && <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">{label}</span>}
    </div>
  );
}

// ─── Subject Progress Bar ───
function SubjectBar({ name, pct, color = 'from-brand-500 to-brand-600' }: {
  name: string; pct: number; color?: string;
}) {
  const barColor = pct >= 75 ? 'from-emerald-500 to-emerald-600' : pct >= 50 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600';
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 text-xs font-semibold text-navy-700 truncate flex-shrink-0">{name}</span>
      <div className="flex-1 h-2.5 rounded-full bg-navy-100 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold font-mono" style={{
        color: pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
      }}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Achievement Badge ───
function Badge({ icon, label, earned = true }: {
  icon: React.ReactNode; label: string; earned?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300
      ${earned
        ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5'
        : 'bg-navy-50/50 border border-navy-100/50 opacity-50 grayscale'
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${earned ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm' : 'bg-navy-200 text-navy-400'}`}>
        {icon}
      </div>
      <span className="text-[9px] font-semibold text-navy-600 text-center leading-tight max-w-[72px]">{label}</span>
      {earned && <span className="text-[8px] text-amber-600 font-bold">✓ Earned</span>}
    </div>
  );
}

// ─── Schedule Time Slot ───
function ScheduleSlot({ time, subject, teacher, status }: {
  time: string; subject: string; teacher?: string; status?: 'ongoing' | 'upcoming' | 'completed';
}) {
  const statusColors: Record<string, string> = {
    ongoing: 'bg-emerald-500',
    upcoming: 'bg-brand-400',
    completed: 'bg-navy-300',
  };
  const borderColors: Record<string, string> = {
    ongoing: 'border-emerald-400',
    upcoming: 'border-brand-300',
    completed: 'border-navy-200',
  };
  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 ${borderColors[status || 'upcoming']} bg-white hover:shadow-sm transition-all duration-200`}>
      {/* Time indicator dot */}
      <div className="flex flex-col items-center">
        <span className={`w-3 h-3 rounded-full ${statusColors[status || 'upcoming']} shadow-sm`} />
        <div className="w-0.5 h-10 bg-navy-100 mt-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy-800">{time}</span>
          {status === 'ongoing' && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider animate-pulse">Live</span>
          )}
        </div>
        <div className="text-sm font-semibold text-navy-900 mt-0.5">{subject}</div>
        {teacher && <div className="text-xs text-navy-500 mt-0.5">{teacher}</div>}
      </div>
      {status === 'ongoing' && (
        <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          Join
        </button>
      )}
    </div>
  );
}

// ─── Assignment Kanban Card ───
function AssignmentCard({ title, subject, dueDate, status }: {
  title: string; subject?: string; dueDate?: string; status: 'todo' | 'in_progress' | 'submitted' | 'reviewed';
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    todo: { label: 'To Do', color: 'text-navy-600', bg: 'bg-navy-100/50', border: 'border-navy-200/50' },
    in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200/50' },
    submitted: { label: 'Submitted', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200/50' },
    reviewed: { label: 'Reviewed', color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200/50' },
  };
  const cfg = statusConfig[status];
  return (
    <div className={`p-3.5 rounded-2xl border ${cfg.border} ${cfg.bg} hover:shadow-sm transition-all duration-200 cursor-pointer`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-bold text-navy-800 leading-snug flex-1">{title}</h4>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {cfg.label}
        </span>
      </div>
      {subject && <p className="text-[10px] text-navy-500">{subject}</p>}
      {dueDate && (
        <div className="flex items-center gap-1 mt-2 text-[9px] text-navy-400">
          <Clock className="w-3 h-3" />
          Due: {dueDate}
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ───
function LearningHubSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting skeleton */}
      <div className="rounded-3xl skeleton h-36" />
      {/* Progress rings skeleton */}
      <div className="flex justify-center gap-6 py-4">
        {[...Array(4)].map((_, i) => <div key={i} className="w-24 h-28 rounded-2xl skeleton" />)}
      </div>
      {/* Schedule skeleton */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
      </div>
      {/* Marks skeleton */}
      <div className="h-40 rounded-2xl skeleton" />
    </div>
  );
}

// ─── Empty State ───
function LearningEmpty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-12 h-12 rounded-2xl bg-navy-50 flex items-center justify-center border border-navy-100/50 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-navy-600">{title}</p>
      {desc && <p className="text-xs text-navy-400 mt-1 text-center">{desc}</p>}
    </div>
  );
}

// ─── Quote Card ───
const MOTIVATIONAL_QUOTES = [
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { q: 'Education is the most powerful weapon to change the world.', a: 'Nelson Mandela' },
  { q: 'Success is the sum of small efforts repeated day in and day out.', a: 'Robert Collier' },
  { q: 'The beautiful thing about learning is that nobody can take it away from you.', a: 'B.B. King' },
  { q: 'Your attitude, not your aptitude, will determine your altitude.', a: 'Zig Ziglar' },
];

// ─── Main Student Dashboard ───
function StudentLearningHub({ profile, attendance, marksData }: {
  profile: any; attendance: any; marksData: any;
}) {
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayQuote = MOTIVATIONAL_QUOTES[today.getDate() % MOTIVATIONAL_QUOTES.length];

  // Attendance percentage
  const attStats = attendance?.stats || { present: 0, absent: 0, late: 0 };
  const attTotal = attStats.present + attStats.absent + attStats.late;
  const attPct = attTotal > 0 ? Math.round((attStats.present / attTotal) * 100) : 0;

  // Marks by subject
  const marksBySubject = marksData?.by_batch || {};
  const subjectNames = Object.keys(marksBySubject);

  // Assignments placeholder
  type AssignmentStatus = 'todo' | 'in_progress' | 'submitted' | 'reviewed';
  const assignments: { title: string; subject: string; dueDate: string; status: AssignmentStatus }[] = [
    { title: 'Quadratic Equations', subject: 'Mathematics', dueDate: 'Tomorrow', status: 'in_progress' },
    { title: 'Newton\'s Laws Lab Report', subject: 'Physics', dueDate: 'Fri, 12 Aug', status: 'todo' },
    { title: 'Periodic Table Quiz', subject: 'Chemistry', dueDate: 'Submitted', status: 'submitted' },
  ];

  // Schedule
  const schedule = [
    { time: '8:00 AM', subject: 'Mathematics', teacher: 'Mr. Sharma', status: 'ongoing' as const },
    { time: '10:00 AM', subject: 'Physics', teacher: 'Mrs. Patel', status: 'upcoming' as const },
    { time: '2:00 PM', subject: 'Chemistry', teacher: 'Dr. Verma', status: 'upcoming' as const },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* ── Header: Morning Greeting ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-xl shadow-brand-200/50">
        {/* Playful decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-400" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-emerald-400" />
          <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-purple-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
                {greeting}, {profile?.name?.split(' ')[0] || 'Student'}
                <span className="text-2xl">☀️</span>
              </h1>
              <p className="text-brand-200/90 text-sm mt-1">{dateStr}</p>
            </div>
            {/* Study Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/10">
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-extrabold text-amber-300">3</span>
              <span className="text-[10px] text-brand-200">day streak</span>
            </div>
          </div>

          {/* Today's Goal Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
              <span className="font-bold text-white">{subjectNames.length || 0}</span> subjects
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
              <span className="font-bold text-emerald-300">{assignments.filter(a => a.status === 'todo').length}</span> assignments due
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
              <span className="font-bold text-amber-300">{attPct}%</span> attendance
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-brand-200/80 italic leading-relaxed">
              &ldquo;{todayQuote.q}&rdquo;
              <span className="block text-brand-300/60 text-[10px] mt-0.5">— {todayQuote.a}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Learning Progress Rings ── */}
      <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
        <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-brand-500" />
          Learning Progress
        </h2>
        <div className="flex justify-center gap-6 sm:gap-10 flex-wrap">
          <ProgressRing pct={attPct} color="#1E40AF" label="Attendance" />
          <ProgressRing pct={65} color="#059669" label="Assignments" value={`${assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length}/${assignments.length}`} />
          <ProgressRing pct={marksData?.stats?.average_percentage || 0} color="#D97706" label="Exam Prep" />
          <ProgressRing pct={80} color="#7C3AED" label="Overall" />
        </div>
      </div>

      {/* ── Today's Schedule ── */}
      <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
        <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-brand-500" />
          Today&apos;s Schedule
        </h2>
        <div className="space-y-2.5">
          {schedule.map((s, i) => (
            <ScheduleSlot key={i} {...s} />
          ))}
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Assignments (Kanban) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-brand-500" />
              Assignments
            </h2>
            <Link href="/dashboard/assignments" className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {assignments.length > 0 ? assignments.map((a, i) => (
              <AssignmentCard key={i} {...a} />
            )) : (
              <LearningEmpty icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                title="No assignments due! 🎉" desc="Enjoy your free time." />
            )}
          </div>
        </div>

        {/* Recent Marks */}
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-brand-500" />
              My Performance
            </h2>
            {marksData?.stats && (
              <span className="text-[10px] font-bold font-mono text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-100/50">
                Avg: {marksData.stats.average_percentage}%
              </span>
            )}
          </div>
          {subjectNames.length > 0 ? (
            <div className="space-y-1">
              {subjectNames.map((name) => {
                const batchMarks = marksBySubject[name] || [];
                const avg = batchMarks.length > 0
                  ? batchMarks.reduce((s: number, m: any) => s + (m.score / m.max_score) * 100, 0) / batchMarks.length
                  : 0;
                return <SubjectBar key={name} name={name} pct={avg} />;
              })}
            </div>
          ) : (
            <LearningEmpty icon={<TrendingUp className="w-6 h-6 text-navy-400" />}
              title="No marks yet" desc="Subject performance will appear here once exams are graded." />
          )}
        </div>
      </div>

      {/* ── Attendance + Achievements Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance Ring */}
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-brand-500" />
            My Attendance
          </h2>
          {attTotal > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ProgressRing pct={attPct} size={104} stroke={8} color="#1E40AF" />
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1 border border-emerald-100/50">
                    <span className="text-xs font-extrabold text-emerald-600">{attStats.present}</span>
                  </div>
                  <span className="text-[9px] font-semibold text-navy-500 uppercase tracking-wider">Present</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-1 border border-red-100/50">
                    <span className="text-xs font-extrabold text-red-600">{attStats.absent}</span>
                  </div>
                  <span className="text-[9px] font-semibold text-navy-500 uppercase tracking-wider">Absent</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-1 border border-amber-100/50">
                    <span className="text-xs font-extrabold text-amber-600">{attStats.late}</span>
                  </div>
                  <span className="text-[9px] font-semibold text-navy-500 uppercase tracking-wider">Late</span>
                </div>
              </div>
            </>
          ) : (
            <LearningEmpty icon={<CalendarDays className="w-6 h-6 text-navy-400" />}
              title="No attendance data yet" desc="Records will appear once marked." />
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Achievements
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <Badge icon={<Trophy className="w-5 h-5" />} label="Perfect Attendance" earned={attPct >= 90} />
            <Badge icon={<Star className="w-5 h-5" />} label="Top Performer" earned={(marksData?.stats?.average_percentage || 0) >= 80} />
            <Badge icon={<BookMarked className="w-5 h-5" />} label="Assignment Master" earned={assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length >= 2} />
            <Badge icon={<Flame className="w-5 h-5" />} label="7-Day Streak" earned={false} />
            <Badge icon={<Brain className="w-5 h-5" />} label="Quick Learner" earned={true} />
            <Badge icon={<Sparkles className="w-5 h-5" />} label="Rising Star" earned={true} />
          </div>
        </div>
      </div>

      {/* ── Upcoming Exams ── */}
      <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
        <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-brand-500" />
          Upcoming Exams
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { subject: 'Mathematics', date: 'Aug 15, 2026', type: 'Mid Term', daysLeft: 16, progress: 60 },
            { subject: 'Physics', date: 'Aug 20, 2026', type: 'Quarterly', daysLeft: 21, progress: 40 },
            { subject: 'Chemistry', date: 'Sep 5, 2026', type: 'Unit Test', daysLeft: 37, progress: 75 },
            { subject: 'Biology', date: 'Sep 12, 2026', type: 'Practical', daysLeft: 44, progress: 30 },
          ].map((exam, i) => (
            <div key={i} className="p-4 rounded-2xl bg-navy-50/60 border border-navy-100/50 hover:border-brand-200/50 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-navy-900">{exam.subject}</span>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-100/50">
                      {exam.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-navy-500">
                    <CalendarDays className="w-3 h-3 text-brand-400" />
                    {exam.date}
                  </div>
                </div>
                {/* Countdown */}
                <div className="text-center flex-shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-extrabold font-mono ${
                    exam.daysLeft <= 7 ? 'bg-red-50 text-red-600 border border-red-100/50' :
                    exam.daysLeft <= 21 ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                  }`}>
                    {exam.daysLeft}
                  </div>
                  <div className="text-[8px] text-navy-400 mt-1 uppercase tracking-wider font-semibold">Days</div>
                </div>
              </div>
              {/* Revision Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[9px] text-navy-400 mb-1">
                  <span>Revision</span>
                  <span className="font-bold font-mono">{exam.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-navy-200/50 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                    exam.progress >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                    exam.progress >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-navy-400 to-navy-500'
                  }`} style={{ width: `${exam.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Links: Learning Resources ── */}
      <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
        <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-brand-500" />
          Learning Resources
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <FileText className="w-5 h-5" />, label: 'My Notes', href: '/dashboard/assignments', color: 'from-brand-400 to-brand-500' },
            { icon: <Download className="w-5 h-5" />, label: 'Downloads', href: '/dashboard/assignments', color: 'from-emerald-400 to-emerald-500' },
            { icon: <BookOpen className="w-5 h-5" />, label: 'Study Material', href: '/dashboard/assignments', color: 'from-purple-400 to-purple-500' },
            { icon: <GraduationCap className="w-5 h-5" />, label: 'Practice Tests', href: '/dashboard/marks', color: 'from-amber-400 to-amber-500' },
          ].map((r, i) => (
            <Link key={i} href={r.href}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-navy-50/60 border border-navy-100/50 hover:bg-navy-100/30 hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shadow-sm`}>
                {r.icon}
              </div>
              <span className="text-xs font-semibold text-navy-700 group-hover:text-navy-900 transition-colors">{r.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Enrolled Batches ── */}
      {profile?.enrollments?.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
            My Batches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/30 border border-brand-100/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold border border-brand-200/50 flex-shrink-0">
                  {e.Batch?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-navy-900 truncate">{e.Batch?.name}</div>
                  <div className="text-xs text-navy-500">{e.Batch?.Subject?.name}</div>
                  <div className="text-[10px] text-navy-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {e.Batch?.schedule || 'No schedule'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Announcements ── */}
      {profile?.announcements?.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-brand-500" />
              Announcements
            </h2>
            <Link href="/dashboard/announcements" className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {profile.announcements.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-2xl bg-navy-50/60 border border-navy-100/50 hover:bg-navy-100/30 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 border border-brand-100/50">
                  <Bell className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-navy-800 truncate">{a.title}</div>
                  <div className="text-[10px] text-navy-500 mt-0.5 line-clamp-2">{a.body}</div>
                  <div className="text-[9px] text-navy-400 mt-1">
                    {a.author?.name} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Motivation Card ── */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-amber-50/50 border border-brand-100/50 p-5 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">Keep Going!</span>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-sm font-medium text-navy-700 italic max-w-md mx-auto leading-relaxed">
          &ldquo;The expert in anything was once a beginner. Every session, every problem, every question brings you closer to your goals.&rdquo;
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-navy-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Study streak: <span className="font-bold text-amber-600">3 days</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-navy-500">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            Weekly goal: <span className="font-bold text-emerald-600">65%</span>
          </div>
        </div>
      </div>

      {/* ── Live Indicator ── */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-navy-400 pb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Learning Hub — updated in real-time
      </div>
    </div>
  );
}

// ─── Parent Dashboard ───
function ParentDashboardView({ data }: { data: any }) {
  if (!data) return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-3 border border-navy-100/50">
        <Users className="w-7 h-7 text-navy-400" />
      </div>
      <p className="text-sm text-navy-500">Could not load parent data.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 p-6 text-white shadow-xl shadow-amber-200/50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-amber-300" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Family Dashboard</h1>
              <p className="text-amber-200 text-sm mt-0.5">
                {data.linked_students?.length || 0} linked student(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Students */}
      {(!data.linked_students || data.linked_students.length === 0) ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-navy-100/50 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-3 border border-navy-100/50">
            <Users className="w-7 h-7 text-navy-400" />
          </div>
          <p className="text-sm text-navy-600 font-medium">No students linked yet</p>
          <p className="text-xs text-navy-400 mt-1">Use the Parent Request feature to link a student.</p>
        </div>
      ) : (
        data.linked_students.map((ls: any) => (
          <div key={ls.student?.id || ls.id} className="bg-white rounded-3xl border-2 border-navy-100/50 shadow-sm overflow-hidden">
            {/* Student header */}
            <div className="bg-gradient-to-r from-brand-50 to-brand-100/30 px-5 py-4 border-b border-brand-100/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold text-lg border border-brand-200/50">
                    {ls.student?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="font-bold text-navy-900">{ls.student?.name}</h2>
                    <p className="text-xs text-navy-500">
                      {ls.student?.admission_no} · Class {ls.student?.current_class}{ls.student?.section ? `-${ls.student.section}` : ''} · {ls.relationship}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/students/${ls.student?.id}`}
                  className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors">
                  View Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Attendance Stats */}
              {ls.attendance && (
                <div>
                  <div className="text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <CalendarDays className="w-3 h-3 text-brand-400" />
                    Attendance
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2">
                      {[
                        { label: 'Present', count: ls.attendance.stats?.present || 0, className: 'bg-emerald-50 text-emerald-700 border-emerald-100/50' },
                        { label: 'Absent', count: ls.attendance.stats?.absent || 0, className: 'bg-red-50 text-red-700 border-red-100/50' },
                        { label: 'Late', count: ls.attendance.stats?.late || 0, className: 'bg-amber-50 text-amber-700 border-amber-100/50' },
                      ].map(s => (
                        <span key={s.label} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${s.className}`}>
                          {s.count} {s.label}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100/50">
                      {ls.attendance.percentage || 0}%
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Marks */}
              {ls.marks?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-brand-400" />
                    Recent Marks
                  </div>
                  <div className="space-y-1.5">
                    {ls.marks.slice(0, 5).map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-navy-50/60 border border-navy-100/50">
                        <div>
                          <span className="text-xs font-semibold text-navy-800">{m.exam_name}</span>
                          <span className="text-[10px] text-navy-400 ml-2">{m.Batch?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-navy-800">{m.score}/{m.max_score}</span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                            (m.score / m.max_score) >= 0.75 ? 'bg-emerald-50 text-emerald-700' :
                            (m.score / m.max_score) >= 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {((m.score / m.max_score) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batches */}
              {ls.enrollments?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <GraduationCap className="w-3 h-3 text-brand-400" />
                    Enrolled Batches
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ls.enrollments.map((e: any) => (
                      <span key={e.id} className="px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-100/50 text-[10px] font-semibold">
                        {e.Batch?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Announcements */}
      {data.announcements?.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-brand-500" />
              Latest Announcements
            </h2>
          </div>
          <div className="space-y-2">
            {data.announcements.slice(0, 5).map((a: any) => (
              <div key={a.id} className="p-3.5 rounded-2xl bg-navy-50/60 border border-navy-100/50 hover:bg-navy-100/30 transition-colors">
                <div className="text-sm font-semibold text-navy-900">{a.title}</div>
                <div className="text-xs text-navy-600 mt-0.5 leading-relaxed">{a.body}</div>
                <div className="text-[10px] text-navy-400 mt-1.5">
                  by {a.author?.name} · {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function MyRecordsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [marks, setMarks] = useState<any>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([
        api.get('/my/profile'),
        api.get('/my/attendance?limit=5'),
        api.get('/my/marks'),
      ]).then(([p, a, m]) => {
        setProfile(p.data);
        setAttendance(a.data);
        setMarks(m.data);
      }).finally(() => setLoading(false));
    } else if (user?.role === 'parent') {
      api.get('/my/parent-dashboard').then(r => {
        setParentData(r.data);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LearningHubSkeleton />;

  if (!user) return null;

  if (user.role === 'parent') {
    return <ParentDashboardView data={parentData} />;
  }

  if (user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-3 border border-navy-100/50">
          <Users className="w-7 h-7 text-navy-400" />
        </div>
        <p className="text-sm text-navy-500">This page is for students and parents only.</p>
      </div>
    );
  }

  return <StudentLearningHub profile={profile} attendance={attendance} marksData={marks} />;
}
