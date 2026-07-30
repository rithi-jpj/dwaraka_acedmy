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
  Rocket, Sunrise, Sunset, Moon as MoonIcon,
} from 'lucide-react';

// ─── Aurora Section Wrapper ───
const blobSizeMap: Record<string, string> = {
  '64': 'w-64 h-64', '48': 'w-48 h-48', '40': 'w-40 h-40',
  '32': 'w-32 h-32', '28': 'w-28 h-28', '24': 'w-24 h-24',
};

function AuroraSection({ gradient, blobs, children, className = '' }: {
  gradient: string; blobs?: { color: string; pos: string; size: string }[];
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${gradient} ${className}`}>
      {/* Floating blobs */}
      {blobs?.map((b, i) => (
        <div key={i}
          className={`absolute ${b.pos} ${blobSizeMap[b.size] || ''} rounded-full ${b.color} blur-3xl opacity-30 animate-float pointer-events-none`}
          style={{ animationDelay: `${i * 2}s`, animationDuration: '8s' }}
        />
      ))}
      <div className="relative z-10 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

// ─── Animated Glow Circle ───
function GlowProgress({ pct, size = 96, label, value, grad = 'from-brand-400 via-brand-500 to-accent-400' }: {
  pct: number; size?: number; label?: string; value?: string; grad?: string;
}) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  const gap = circ - dash;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size + 8, height: size + 8 }}>
        {/* Glow behind */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-30 bg-gradient-to-br from-brand-400 via-brand-500 to-accent-400 animate-pulse" />
        {/* Ring */}
        <svg width={size + 8} height={size + 8} viewBox={`0 0 ${size + 8} ${size + 8}`} className="transform -rotate-90 drop-shadow-lg">
          <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={r} fill="none"
            stroke={`url(#glow-${label?.replace(/\s/g, '')})`} strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
          <defs>
            <linearGradient id={`glow-${label?.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#F4B400" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold font-mono text-white drop-shadow-md">
            {value || `${Math.round(pct)}%`}
          </span>
        </div>
      </div>
      {label && <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">{label}</span>}
    </div>
  );
}

// ─── Gradient Progress Bar ───
function GradientBar({ name, pct }: { name: string; pct: number }) {
  const barGrad = pct >= 75 ? 'from-emerald-400 via-emerald-500 to-green-600'
    : pct >= 50 ? 'from-amber-400 via-amber-500 to-orange-600'
    : 'from-rose-400 via-red-500 to-red-600';
  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <span className="w-20 text-xs font-bold text-white/80 truncate flex-shrink-0">{name}</span>
      <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${barGrad} transition-all duration-700 ease-out shadow-lg`}
          style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold font-mono text-white/90">{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Achievement Badge ───
function AchievementBadge({ icon, label, earned = true, xp = 0 }: {
  icon: React.ReactNode; label: string; earned?: boolean; xp?: number;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300
      ${earned
        ? 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-white/15'
        : 'bg-white/5 border border-white/10 opacity-40 grayscale'
      }`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg
        ${earned
          ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-white drop-shadow-md'
          : 'bg-white/10 text-white/40'
        }`}>
        {icon}
      </div>
      <span className="text-[9px] font-semibold text-white/80 text-center leading-tight max-w-[76px]">{label}</span>
      {earned && (
        <span className="flex items-center gap-0.5 text-[8px] text-amber-300 font-bold">
          <Sparkles className="w-2.5 h-2.5" />+{xp} XP
        </span>
      )}
    </div>
  );
}

// ─── Journey Timeline Step ───
function JourneyStep({ time, label, color, status }: {
  time: string; label: string; color: string; status?: 'done' | 'current' | 'upcoming';
}) {
  const statusColors: Record<string, string> = {
    done: `${color} ring-2 ring-white/50`,
    current: `${color} ring-4 ring-white/60 shadow-lg shadow-white/20 animate-pulse`,
    upcoming: `${color} opacity-60`,
  };
  return (
    <div className="flex items-center gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${statusColors[status || 'upcoming']} transition-all duration-300`} />
        <div className="w-0.5 h-12 bg-white/10 group-last:hidden" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold ${status === 'done' ? 'text-white/80' : status === 'current' ? 'text-white' : 'text-white/50'}`}>
          {time}
        </div>
        <div className={`text-sm font-bold ${status === 'current' ? 'text-white' : 'text-white/70'}`}>{label}</div>
      </div>
      {status === 'current' && (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/20 text-white border border-white/20 uppercase tracking-wider">
          In Progress
        </span>
      )}
      {status === 'done' && (
        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
      )}
    </div>
  );
}

// ─── Assignment Card ───
function GradCard({ title, subject, dueDate, status, grad }: {
  title: string; subject?: string; dueDate?: string; status: string; grad: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${grad} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
      {/* Status ribbon */}
      <div className="absolute -top-1 -right-8 w-16 h-8 bg-white/20 backdrop-blur-sm rotate-45" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-xs font-bold text-white leading-snug flex-1">{title}</h4>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-white/20
            ${status === 'todo' ? 'bg-white/10 text-white/80' : status === 'in_progress' ? 'bg-amber-400/30 text-amber-200' : status === 'submitted' ? 'bg-emerald-400/30 text-emerald-200' : 'bg-brand-400/30 text-brand-200'}`}>
            {status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : status === 'submitted' ? 'Submitted' : 'Reviewed'}
          </span>
        </div>
        {subject && <p className="text-[10px] text-white/70">{subject}</p>}
        {dueDate && (
          <div className="flex items-center gap-1 mt-2 text-[9px] text-white/60">
            <Clock className="w-3 h-3" />
            Due: {dueDate}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Aurora Skeleton ───
function AuroraSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-fade-in">
      <div className="h-64 rounded-3xl bg-gradient-to-br from-brand-800/50 to-brand-600/30 skeleton" />
      <div className="h-40 rounded-3xl skeleton" />
      <div className="h-48 rounded-3xl skeleton" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-36 rounded-3xl skeleton" />
        <div className="h-36 rounded-3xl skeleton" />
      </div>
    </div>
  );
}

// ─── Empty State ───
function AuroraEmpty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 mb-3 backdrop-blur-sm">
        {icon}
      </div>
      <p className="text-sm font-bold text-white/80">{title}</p>
      {desc && <p className="text-xs text-white/50 mt-1 text-center max-w-xs">{desc}</p>}
    </div>
  );
}

// ─── Quotes ───
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
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const GreetIcon = hour < 12 ? Sunrise : hour < 17 ? Sunrise : hour < 21 ? Sunset : MoonIcon;
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayQuote = MOTIVATIONAL_QUOTES[today.getDate() % MOTIVATIONAL_QUOTES.length];

  const attStats = attendance?.stats || { present: 0, absent: 0, late: 0 };
  const attTotal = attStats.present + attStats.absent + attStats.late;
  const attPct = attTotal > 0 ? Math.round((attStats.present / attTotal) * 100) : 0;

  const marksBySubject = marksData?.by_batch || {};
  const subjectNames = Object.keys(marksBySubject);

  type AssignmentStatus = 'todo' | 'in_progress' | 'submitted' | 'reviewed';
  const assignments: { title: string; subject: string; dueDate: string; status: AssignmentStatus; grad: string }[] = [
    { title: 'Quadratic Equations', subject: 'Mathematics', dueDate: 'Tomorrow', status: 'in_progress', grad: 'from-amber-500 via-orange-500 to-rose-500' },
    { title: "Newton's Laws Lab Report", subject: 'Physics', dueDate: 'Fri, 12 Aug', status: 'todo', grad: 'from-sky-500 via-blue-500 to-indigo-500' },
    { title: 'Periodic Table Quiz', subject: 'Chemistry', dueDate: 'Wed, 17 Aug', status: 'submitted', grad: 'from-emerald-400 via-green-500 to-teal-500' },
  ];

  const journeySteps = [
    { time: '7:00 AM', label: 'Morning Revision', color: 'bg-sky-400', status: 'done' as const },
    { time: '8:00 AM', label: 'Physics — Motion & Forces', color: 'bg-brand-400', status: 'done' as const },
    { time: '10:00 AM', label: 'Mathematics — Quadratic Eqs', color: 'bg-amber-400', status: 'current' as const },
    { time: '2:00 PM', label: 'Chemistry — Periodic Table', color: 'bg-emerald-400', status: 'upcoming' as const },
    { time: '4:00 PM', label: 'Homework & Revision', color: 'bg-purple-400', status: 'upcoming' as const },
  ];

  const schedule = [
    { time: '8:00 AM', subject: 'Mathematics', teacher: 'Mr. Sharma', room: 'Room 201', status: 'ongoing' as const },
    { time: '10:00 AM', subject: 'Physics', teacher: 'Mrs. Patel', room: 'Lab 1', status: 'upcoming' as const },
    { time: '2:00 PM', subject: 'Chemistry', teacher: 'Dr. Verma', room: 'Room 105', status: 'upcoming' as const },
  ];

  const exams = [
    { subject: 'Mathematics', date: 'Aug 15, 2026', type: 'Mid Term', daysLeft: 16, progress: 60 },
    { subject: 'Physics', date: 'Aug 20, 2026', type: 'Quarterly', daysLeft: 21, progress: 40 },
    { subject: 'Chemistry', date: 'Sep 5, 2026', type: 'Unit Test', daysLeft: 37, progress: 75 },
    { subject: 'Biology', date: 'Sep 12, 2026', type: 'Practical', daysLeft: 44, progress: 30 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-enter pb-8">
      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 1: HERO — Large aurora header */}
      {/* ─────────────────────────────────────────────── */}
      <AuroraSection
        gradient="bg-gradient-to-br from-brand-800 via-brand-600 to-purple-900 shadow-2xl shadow-brand-500/20"
        blobs={[
          { color: 'bg-purple-500', pos: '-top-20 -right-20', size: '64' },
          { color: 'bg-accent-500', pos: '-bottom-20 -left-20', size: '48' },
          { color: 'bg-cyan-500', pos: 'top-1/2 right-1/4', size: '32' },
        ]}
        className="text-white"
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar + greeting */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 flex items-center justify-center
              text-white font-extrabold text-3xl shadow-2xl shadow-brand-500/30 border border-white/20 flex-shrink-0">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                {greeting}, {profile?.name?.split(' ')[0] || 'Student'}
                <GreetIcon className="w-7 h-7 text-accent-300" />
              </h1>
              <p className="text-brand-200 mt-1 text-sm">{dateStr}</p>
              {/* Streak + XP */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-extrabold text-amber-300">3</span>
                  <span className="text-[10px] text-brand-200">day streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <Zap className="w-4 h-4 text-accent-300" />
                  <span className="text-sm font-extrabold text-accent-300">1,250</span>
                  <span className="text-[10px] text-brand-200">XP</span>
                </div>
              </div>
            </div>
          </div>
          {/* CTA */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl
              bg-gradient-to-r from-accent-500 via-accent-400 to-amber-400 text-navy-900 font-extrabold text-sm
              shadow-2xl shadow-accent-500/30 hover:shadow-accent-400/40 hover:-translate-y-0.5 transition-all duration-200">
              <Rocket className="w-5 h-5" />
              Continue Learning
            </button>
          </div>
        </div>

        {/* Goal chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
          <div className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            <span className="font-bold text-white">{subjectNames.length || 0}</span> subjects
          </div>
          <div className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            <span className="font-bold text-emerald-300">{assignments.filter(a => a.status === 'todo').length}</span> assignments due
          </div>
          <div className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            <span className="font-bold text-amber-300">{attPct}%</span> attendance
          </div>
          <div className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-brand-100">
            <span className="font-bold text-accent-300">{exams.filter(e => e.daysLeft <= 21).length}</span> upcoming exams
          </div>
        </div>

        {/* Quote */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-accent-300 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-brand-200/80 italic leading-relaxed">
            &ldquo;{todayQuote.q}&rdquo;
            <span className="block text-brand-300/60 text-xs mt-0.5">— {todayQuote.a}</span>
          </p>
        </div>
      </AuroraSection>

      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 2: TODAY'S JOURNEY — Colorful timeline */}
      {/* ─────────────────────────────────────────────── */}
      <AuroraSection
        gradient="bg-gradient-to-br from-sky-800 via-blue-700 to-indigo-900 shadow-xl"
        blobs={[{ color: 'bg-cyan-400', pos: '-top-16 -left-16', size: '48' }, { color: 'bg-brand-400', pos: '-bottom-16 -right-16', size: '40' }]}
        className="text-white"
      >
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-sky-300" />
          Today&apos;s Journey
        </h2>
        <div className="space-y-0">
          {journeySteps.map((step, i) => (
            <JourneyStep key={i} {...step} />
          ))}
        </div>
      </AuroraSection>

      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 3: LEARNING PROGRESS — Glow rings */}
      {/* ─────────────────────────────────────────────── */}
      <AuroraSection
        gradient="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-xl"
        blobs={[{ color: 'bg-purple-400', pos: 'top-1/2 -right-24', size: '64' }, { color: 'bg-pink-400', pos: '-bottom-12 left-1/4', size: '40' }]}
        className="text-white"
      >
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-300" />
          Learning Progress
        </h2>
        <div className="flex justify-center gap-6 sm:gap-12 flex-wrap">
          <GlowProgress pct={attPct} label="Attendance" />
          <GlowProgress pct={65} label="Assignments" value={`${assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length}/${assignments.length}`} />
          <GlowProgress pct={marksData?.stats?.average_percentage || 0} label="Exam Prep" />
          <GlowProgress pct={80} label="Overall" />
        </div>
      </AuroraSection>

      {/* ─── Two-column: Assignments + Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4: ASSIGNMENTS — Gradient cards */}
        <AuroraSection
          gradient="bg-gradient-to-br from-amber-800 via-orange-700 to-rose-900 shadow-xl"
          blobs={[{ color: 'bg-amber-400', pos: '-top-16 -right-16', size: '40' }, { color: 'bg-rose-400', pos: '-bottom-12 -left-12', size: '32' }]}
          className="text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-300" />
              Assignments
            </h2>
            <Link href="/dashboard/assignments" className="text-[10px] font-bold text-amber-200 hover:text-white flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {assignments.length > 0 ? assignments.map((a, i) => (
              <GradCard key={i} {...a} />
            )) : (
              <AuroraEmpty icon={<CheckCircle2 className="w-6 h-6 text-emerald-300" />}
                title="No assignments due! 🎉" desc="Enjoy your free time." />
            )}
          </div>
        </AuroraSection>

        {/* SECTION 5: PERFORMANCE — Gradient bars */}
        <AuroraSection
          gradient="bg-gradient-to-br from-emerald-800 via-green-700 to-teal-900 shadow-xl"
          blobs={[{ color: 'bg-emerald-400', pos: '-top-16 -left-16', size: '40' }, { color: 'bg-teal-400', pos: '-bottom-12 -right-12', size: '32' }]}
          className="text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-300" />
              My Performance
            </h2>
            {marksData?.stats && (
              <span className="text-[10px] font-bold font-mono text-emerald-200 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
                Avg: {marksData.stats.average_percentage}%
              </span>
            )}
          </div>
          {subjectNames.length > 0 ? (
            <div>
              {subjectNames.map((name) => {
                const batchMarks = marksBySubject[name] || [];
                const avg = batchMarks.length > 0
                  ? batchMarks.reduce((s: number, m: any) => s + (m.score / m.max_score) * 100, 0) / batchMarks.length
                  : 0;
                return <GradientBar key={name} name={name} pct={avg} />;
              })}
            </div>
          ) : (
            <AuroraEmpty icon={<TrendingUp className="w-6 h-6 text-white/50" />}
              title="No marks yet" desc="Subject performance will appear once exams are graded." />
          )}
        </AuroraSection>
      </div>

      {/* ─── Two-column: Schedule + Achievements ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 6: UPCOMING CLASSES */}
        <AuroraSection
          gradient="bg-gradient-to-br from-cyan-800 via-sky-700 to-blue-900 shadow-xl"
          blobs={[{ color: 'bg-cyan-400', pos: '-top-12 -right-12', size: '32' }, { color: 'bg-blue-400', pos: '-bottom-12 left-1/3', size: '28' }]}
          className="text-white"
        >
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-cyan-300" />
            Upcoming Classes
          </h2>
          <div className="space-y-2.5">
            {schedule.map((s, i) => {
              const statusColors: Record<string, string> = {
                ongoing: 'border-emerald-400 bg-emerald-500/10',
                upcoming: 'border-white/20 bg-white/5',
                completed: 'border-white/10 bg-white/5 opacity-60',
              };
              return (
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${statusColors[s.status || 'upcoming']} backdrop-blur-sm hover:bg-white/10 transition-all duration-200`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'ongoing' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-white/30'}`} />
                    <div className="w-0.5 h-8 bg-white/10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/70">{s.time}</span>
                      {s.status === 'ongoing' && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider animate-pulse">Live</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{s.subject}</div>
                    <div className="text-[10px] text-white/50">{s.teacher} · {s.room}</div>
                  </div>
                  {s.status === 'ongoing' && (
                    <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200">
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </AuroraSection>

        {/* SECTION 7: ACHIEVEMENTS */}
        <AuroraSection
          gradient="bg-gradient-to-br from-amber-800 via-yellow-700 to-orange-900 shadow-xl"
          blobs={[{ color: 'bg-yellow-400', pos: '-top-12 -left-12', size: '32' }, { color: 'bg-amber-400', pos: '-bottom-12 -right-12', size: '28' }]}
          className="text-white"
        >
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-300" />
            Achievements
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <AchievementBadge icon={<Trophy className="w-5 h-5" />} label="Perfect Attendance" earned={attPct >= 90} xp={250} />
            <AchievementBadge icon={<Star className="w-5 h-5" />} label="Top Performer" earned={(marksData?.stats?.average_percentage || 0) >= 80} xp={500} />
            <AchievementBadge icon={<BookMarked className="w-5 h-5" />} label="Assignment Master" earned={assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length >= 2} xp={300} />
            <AchievementBadge icon={<Flame className="w-5 h-5" />} label="7-Day Streak" earned={false} xp={700} />
            <AchievementBadge icon={<Brain className="w-5 h-5" />} label="Quick Learner" earned={true} xp={150} />
            <AchievementBadge icon={<Sparkles className="w-5 h-5" />} label="Rising Star" earned={true} xp={200} />
          </div>
          {/* XP summary */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-300" /> Total XP</span>
            <span className="font-extrabold text-amber-300 font-mono text-sm">1,250</span>
          </div>
        </AuroraSection>
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 8: UPCOMING EXAMS — Countdown cards */}
      {/* ─────────────────────────────────────────────── */}
      <AuroraSection
        gradient="bg-gradient-to-br from-rose-900 via-red-800 to-pink-900 shadow-xl"
        blobs={[{ color: 'bg-rose-400', pos: '-top-16 -right-16', size: '40' }, { color: 'bg-pink-400', pos: '-bottom-16 left-1/3', size: '32' }]}
        className="text-white"
      >
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-5 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-rose-300" />
          Upcoming Exams
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exams.map((exam, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 group">
              {/* Countdown number */}
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-lg font-extrabold font-mono ${
                    exam.daysLeft <= 7 ? 'text-rose-300' : exam.daysLeft <= 21 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>{exam.daysLeft}</div>
                  <div className="text-[7px] text-white/40 uppercase tracking-widest font-bold">Days</div>
                </div>
              </div>
              <div className="pr-14">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{exam.subject}</span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/10">
                    {exam.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/50">
                  <CalendarDays className="w-3 h-3" /> {exam.date}
                </div>
              </div>
              {/* Revision progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[9px] text-white/40 mb-1">
                  <span>Revision</span>
                  <span className="font-bold font-mono">{exam.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                    exam.progress >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                    exam.progress >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`} style={{ width: `${exam.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AuroraSection>

      {/* ─── Two-column: Resources + Announcements ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 9: LEARNING RESOURCES */}
        <AuroraSection
          gradient="bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 shadow-xl"
          blobs={[{ color: 'bg-violet-400', pos: '-top-12 -right-12', size: '32' }, { color: 'bg-fuchsia-400', pos: '-bottom-12 left-1/4', size: '24' }]}
          className="text-white"
        >
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-300" />
            Learning Resources
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <FileText className="w-5 h-5" />, label: 'My Notes', href: '/dashboard/assignments', grad: 'from-brand-500 to-brand-600' },
              { icon: <Download className="w-5 h-5" />, label: 'Downloads', href: '/dashboard/assignments', grad: 'from-emerald-500 to-emerald-600' },
              { icon: <BookOpen className="w-5 h-5" />, label: 'Study Material', href: '/dashboard/assignments', grad: 'from-purple-500 to-purple-600' },
              { icon: <GraduationCap className="w-5 h-5" />, label: 'Practice Tests', href: '/dashboard/marks', grad: 'from-amber-500 to-amber-600' },
            ].map((r, i) => (
              <Link key={i} href={r.href}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.grad} flex items-center justify-center shadow-lg`}>
                  {r.icon}
                </div>
                <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{r.label}</span>
              </Link>
            ))}
          </div>
        </AuroraSection>

        {/* SECTION 10: ANNOUNCEMENTS */}
        <AuroraSection
          gradient="bg-gradient-to-br from-slate-800 via-navy-800 to-gray-900 shadow-xl"
          blobs={[{ color: 'bg-brand-400', pos: '-top-12 -left-12', size: '28' }, { color: 'bg-slate-400', pos: '-bottom-12 -right-12', size: '24' }]}
          className="text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-300" />
              Announcements
            </h2>
            <Link href="/dashboard/announcements" className="text-[10px] font-bold text-brand-200 hover:text-white flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {profile?.announcements?.length > 0 ? (
            <div className="space-y-2">
              {profile.announcements.slice(0, 3).map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/30 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
                    <Bell className="w-4 h-4 text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{a.title}</div>
                    <div className="text-[10px] text-white/60 mt-0.5 line-clamp-2">{a.body}</div>
                    <div className="text-[9px] text-white/40 mt-1 flex items-center gap-2">
                      <span>{a.author?.name}</span>
                      <span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AuroraEmpty icon={<Bell className="w-6 h-6 text-white/50" />}
              title="No announcements yet" desc="Updates from the academy will appear here." />
          )}
        </AuroraSection>
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 11: ENROLLED BATCHES */}
      {/* ─────────────────────────────────────────────── */}
      {profile?.enrollments?.length > 0 && (
        <AuroraSection
          gradient="bg-gradient-to-br from-brand-700 via-brand-600 to-sky-800 shadow-xl"
          blobs={[{ color: 'bg-sky-400', pos: '-top-12 -right-12', size: '32' }, { color: 'bg-brand-300', pos: '-bottom-12 left-1/3', size: '24' }]}
          className="text-white"
        >
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-sky-300" />
            My Batches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {e.Batch?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">{e.Batch?.name}</div>
                  <div className="text-xs text-white/60">{e.Batch?.Subject?.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {e.Batch?.schedule || 'No schedule'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AuroraSection>
      )}

      {/* ─────────────────────────────────────────────── */}
      {/* SECTION 12: DAILY MOTIVATION — Large aurora quote */}
      {/* ─────────────────────────────────────────────── */}
      <AuroraSection
        gradient="bg-gradient-to-br from-brand-900 via-purple-800 to-accent-900 shadow-xl"
        blobs={[
          { color: 'bg-accent-400', pos: '-top-16 left-1/3', size: '40' },
          { color: 'bg-purple-400', pos: '-bottom-16 right-1/4', size: '48' },
          { color: 'bg-cyan-400', pos: 'top-1/2 -right-16', size: '32' },
        ]}
        className="text-white text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent-300" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Keep Going!</span>
          <Sparkles className="w-5 h-5 text-accent-300" />
        </div>
        <p className="text-lg font-medium italic text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          &ldquo;The expert in anything was once a beginner. Every session, every problem, every question brings you closer to your goals.&rdquo;
        </p>
        <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-sm text-white/60">
            <Flame className="w-4 h-4 text-amber-300" />
            Study streak: <span className="font-bold text-amber-300">3 days</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/60">
            <Target className="w-4 h-4 text-emerald-300" />
            Weekly goal: <span className="font-bold text-emerald-300">65%</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/60">
            <Zap className="w-4 h-4 text-accent-300" />
            Level: <span className="font-bold text-accent-300">Silver</span>
          </div>
        </div>
      </AuroraSection>

      {/* ── Live Indicator ── */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
        Learning Hub — Aurora Live
      </div>
    </div>
  );
}

// ─── Parent Dashboard ───
function ParentDashboardView({ data }: { data: any }) {
  if (!data) return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
        <Users className="w-8 h-8 text-white/50" />
      </div>
      <p className="text-sm text-white/60">Could not load parent data.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-enter pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-800 via-amber-600 to-orange-900 text-white p-8 shadow-2xl shadow-amber-500/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-amber-300 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-2xl flex items-center justify-center border border-white/10">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Family Dashboard</h1>
            <p className="text-amber-200 text-sm mt-1">{data.linked_students?.length || 0} linked student(s)</p>
          </div>
        </div>
      </div>

      {/* Linked Students */}
      {(!data.linked_students || data.linked_students.length === 0) ? (
        <div className="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white/50" />
          </div>
          <p className="text-white/80 font-bold text-lg">No students linked yet</p>
          <p className="text-white/40 text-sm mt-1">Use the Parent Request feature to link a student.</p>
        </div>
      ) : (
        data.linked_students.map((ls: any) => (
          <div key={ls.student?.id || ls.id} className="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-200">
            <div className="bg-gradient-to-r from-brand-700/50 to-brand-600/30 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {ls.student?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">{ls.student?.name}</h2>
                    <p className="text-xs text-white/60">
                      {ls.student?.admission_no} · Class {ls.student?.current_class}{ls.student?.section ? `-${ls.student.section}` : ''} · {ls.relationship}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/students/${ls.student?.id}`}
                  className="text-[10px] font-bold text-brand-200 hover:text-white flex items-center gap-0.5 transition-colors">
                  View Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {ls.attendance && (
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <CalendarDays className="w-3 h-3 text-brand-300" />
                    Attendance
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2">
                      {[
                        { label: 'Present', count: ls.attendance.stats?.present || 0, cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                        { label: 'Absent', count: ls.attendance.stats?.absent || 0, cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
                        { label: 'Late', count: ls.attendance.stats?.late || 0, cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                      ].map(s => (
                        <span key={s.label} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${s.cls}`}>
                          {s.count} {s.label}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-bold font-mono text-brand-200 bg-brand-500/20 px-3 py-1.5 rounded-xl border border-brand-500/30">
                      {ls.attendance.percentage || 0}%
                    </span>
                  </div>
                </div>
              )}
              {ls.marks?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-brand-300" />
                    Recent Marks
                  </div>
                  <div className="space-y-1.5">
                    {ls.marks.slice(0, 5).map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                        <div>
                          <span className="text-xs font-bold text-white/90">{m.exam_name}</span>
                          <span className="text-[10px] text-white/40 ml-2">{m.Batch?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-white/90">{m.score}/{m.max_score}</span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                            (m.score / m.max_score) >= 0.75 ? 'bg-emerald-500/20 text-emerald-300' :
                            (m.score / m.max_score) >= 0.5 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {((m.score / m.max_score) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ls.enrollments?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <GraduationCap className="w-3 h-3 text-brand-300" />
                    Enrolled Batches
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ls.enrollments.map((e: any) => (
                      <span key={e.id} className="px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-200 border border-brand-500/30 text-[10px] font-bold">
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
        <div className="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-300" />
            Latest Announcements
          </h2>
          <div className="space-y-2">
            {data.announcements.slice(0, 5).map((a: any) => (
              <div key={a.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-sm font-bold text-white">{a.title}</div>
                <div className="text-xs text-white/60 mt-0.5 leading-relaxed">{a.body}</div>
                <div className="text-[10px] text-white/40 mt-1.5">
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

  if (loading) return <AuroraSkeleton />;
  if (!user) return null;

  if (user.role === 'parent') {
    return <ParentDashboardView data={parentData} />;
  }

  if (user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
          <Users className="w-8 h-8 text-white/50" />
        </div>
        <p className="text-sm text-white/60">This page is for students and parents only.</p>
      </div>
    );
  }

  return <StudentLearningHub profile={profile} attendance={attendance} marksData={marks} />;
}
