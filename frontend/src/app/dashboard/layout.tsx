'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, BookMarked,
  ClipboardCheck, CalendarCheck, Layers, UserPlus, UserCheck,
  FileText, Bell, User, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Home, Sun, Moon,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
  { href: '/dashboard/users', label: 'Users', icon: Users, roles: ['admin'] },
  { href: '/dashboard/teachers', label: 'Teachers', icon: GraduationCap, roles: ['admin'] },
  { href: '/dashboard/students', label: 'Students', icon: User, roles: ['admin'] },
  { href: '/dashboard/subjects', label: 'Subjects', icon: BookOpen, roles: ['admin'] },
  { href: '/dashboard/classes', label: 'Classes', icon: BookMarked, roles: ['admin'] },
  { href: '/dashboard/marks', label: 'Marks', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher'] },
  { href: '/dashboard/batches', label: 'Batches', icon: Layers, roles: ['admin', 'teacher'] },
  { href: '/dashboard/parent-requests', label: 'Parent Requests', icon: UserPlus, roles: ['admin'] },
  { href: '/dashboard/parents', label: 'Parents', icon: UserCheck, roles: ['admin'] },
  { href: '/dashboard/request-parent', label: 'Request Parent', icon: UserPlus, roles: ['student'] },
  { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Bell, roles: ['admin', 'teacher', 'student', 'parent'] },
  { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
];

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  teacher: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  student: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  parent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode with localStorage and system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // Listen for system preference changes when no manual override
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.must_change_password) router.replace('/change-password');
  }, [user, loading, router]);

  if (loading || !user) {
    return <FullScreenLoader label="Authenticating…" />;
  }

  const nav = navItems.filter(n => n.roles.includes(user.role));

  const avatar = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl
        border-r border-slate-100 dark:border-slate-700/50 shadow-sidebar transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative w-14 h-14 flex-shrink-0">
            <img src="/images/logo/logo.svg" alt="Dwaraka Academy" className="object-contain w-14 h-14 dark:hidden" />
            <img src="/images/logo/logo-white.svg" alt="Dwaraka Academy" className="object-contain w-14 h-14 hidden dark:block" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">Dwaraka Academy</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Management</div>
              <div className="text-[9px] text-slate-400/60 dark:text-slate-500/60 italic mt-0.5 leading-tight">Excellence in Education Since 2020</div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center              text-brand-700 dark:text-brand-300 font-extrabold flex-shrink-0 shadow-sm border border-brand-200/50 dark:border-brand-700/30 ${collapsed ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-base'}`}>
            {avatar}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</div>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 ${roleBadgeColors[user.role] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {user.role}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {nav.map(n => {
            const isActive = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out group
                  ${isActive
                    ? 'bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/40 dark:to-slate-800 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-100 dark:border-brand-700/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-300'
                  }
                  ${collapsed ? 'justify-center' : ''}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-200
                  ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'}`} />
                {!collapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className={`p-2 ${collapsed ? 'text-center' : ''}`}>
          <button onClick={toggleDarkMode}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-500
              hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-500/10
              transition-all duration-200 w-full
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logout */}
        <div className={`p-2 border-t border-slate-100 dark:border-slate-700 ${collapsed ? 'text-center' : ''}`}>
          <button onClick={logout}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-500
              hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 w-full
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}>
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700/50 shadow-nav">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            {/* Left: Mobile menu + title */}
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <img src="/images/logo/logo.svg" alt="Dwaraka Academy" className="object-contain w-8 h-8 dark:hidden" />
                    <img src="/images/logo/logo-white.svg" alt="Dwaraka Academy" className="object-contain w-8 h-8 hidden dark:block" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Dwaraka Academy</span>
                </div>
              </div>
            </div>

            {/* Right: User info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-right">
                <div className="text-xs">
                  <div className="font-semibold text-slate-800 dark:text-white">{user.name}</div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${roleBadgeColors[user.role] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center
                text-brand-700 dark:text-brand-300 font-extrabold text-sm shadow-sm border border-brand-200/50 dark:border-brand-700/30">
                {avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 animate-page-enter dark:bg-slate-800/30">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <BottomNav role={user.role} pathname={pathname} />
    </div>
  );
}

function BottomNav({ role, pathname }: { role: string; pathname: string }) {
  const bottomItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/students', label: 'Students', icon: Users, roles: ['admin'] },
    { href: '/dashboard/marks', label: 'Marks', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/batches', label: 'Batches', icon: Layers, roles: ['admin', 'teacher'] },
    { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
  ];

  // For teacher: replace Students with Attendance
  const teacherItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/marks', label: 'Marks', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/batches', label: 'Batches', icon: Layers, roles: ['admin', 'teacher'] },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
  ];

  // For student: attendance + assignments + request parent + my records
  const studentItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['student'] },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
    { href: '/dashboard/request-parent', label: 'Parent', icon: UserPlus, roles: ['student'] },
    { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
  ];

  // For parent: home + announcements + my records
  const parentItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/announcements', label: 'Announcements', icon: Bell, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
  ];

  const items = role === 'teacher' ? teacherItems
    : role === 'student' ? studentItems
    : role === 'parent' ? parentItems
    : bottomItems;

  const visible = items.filter(i => i.roles.includes(role));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-700/50 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5">
        {visible.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                isActive
                  ? 'text-brand-600'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 shadow-sm'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : ''
                }`} />
              </div>

              <span className={`text-[10px] font-medium leading-tight ${
                isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
              }`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
