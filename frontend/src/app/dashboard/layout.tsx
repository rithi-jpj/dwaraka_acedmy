'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import { api } from '@/lib/api';
import { onSocketEvent } from '@/lib/socket';
import { LayoutDashboard, Users, GraduationCap, BookOpen, BookMarked,
  ClipboardCheck, CalendarCheck, Layers, UserPlus, UserCheck,
  FileText, Bell, User, LogOut, Globe, IndianRupee, Megaphone, Upload,
  Clock, Activity, Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// ─── Navigation Configuration ───
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
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
  { href: '/dashboard/fees', label: 'Fees', icon: IndianRupee, roles: ['admin'] },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Megaphone, roles: ['admin', 'teacher', 'student', 'parent'], badge: 'notif' },
  { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
  { href: '/dashboard/uploads', label: 'Uploads', icon: Upload, roles: ['admin'] },
  { href: '/dashboard/website', label: 'Website', icon: Globe, roles: ['admin'] },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Bell, roles: ['admin', 'teacher', 'student', 'parent'] },
  { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
];

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-gradient-to-r from-brand-500 to-brand-600 text-white',
  teacher: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white',
  student: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  parent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white',
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <LayoutDashboard className="w-3.5 h-3.5" />,
  teacher: <GraduationCap className="w-3.5 h-3.5" />,
  student: <User className="w-3.5 h-3.5" />,
  parent: <Users className="w-3.5 h-3.5" />,
};

// ─── Breadcrumb Generator ───
function generateBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = '';
  for (const part of parts) {
    href += `/${part}`;
    const label = part === 'dashboard' ? 'Home'
      : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, href });
  }
  return crumbs;
}

// ─── Sidebar (imported from @/components/Sidebar) ───
// ─── Topbar (imported from @/components/Topbar) ───

// ─── Mobile Bottom Navigation ───
function BottomNav({ role, pathname, notifCount }: { role: string; pathname: string; notifCount?: number }) {
  const bottomItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/students', label: 'Students', icon: Users, roles: ['admin'] },
    { href: '/dashboard/marks', label: 'Marks', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/batches', label: 'Batches', icon: Layers, roles: ['admin', 'teacher'] },
    { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
  ];

  const teacherItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/marks', label: 'Marks', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { href: '/dashboard/batches', label: 'Batches', icon: Layers, roles: ['admin', 'teacher'] },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
  ];

  const studentItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['student'] },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText, roles: ['admin', 'teacher', 'student'] },
    { href: '/dashboard/request-parent', label: 'Parent', icon: UserPlus, roles: ['student'] },
    { href: '/dashboard/my', label: 'My Records', icon: User, roles: ['student', 'parent'] },
  ];

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

  // Add notifications item for all roles
  if (!visible.find(i => i.href === '/dashboard/notifications')) {
    visible.push({ href: '/dashboard/notifications', label: 'Alerts', icon: Bell, roles: [role] });
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden glass-nav
      border-t border-navy-200/80 dark:border-navy-700/50 shadow-lg
      pb-2">
      <div className="flex items-center justify-around px-2 py-1.5">
        {visible.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-navy-400 dark:text-navy-500 hover:text-navy-600 dark:hover:text-navy-300'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive ? 'bg-brand-50 dark:bg-brand-500/10 shadow-sm' : 'hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? 'text-brand-600 dark:text-brand-400 scale-110' : ''
                }`} />
                {item.href === '/dashboard/notifications' && notifCount && notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-1
                    rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm border-2 border-white dark:border-navy-900">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${
                isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-navy-400 dark:text-navy-500'
              }`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Main Dashboard Layout ───
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Fetch unread notification count
  useEffect(() => {
    const fetchCount = () => {
      api.get('/notifications/unread').then(r => {
        setNotifCount(r.data.count || 0);
      }).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    const cleanup = onSocketEvent('notifications:new', fetchCount);
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  // Sync dark mode
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

  // System preference listener
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

  // Auth redirects
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.must_change_password) router.replace('/change-password');
  }, [user, loading, router]);

  // Current time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !user) {
    return <FullScreenLoader label="Authenticating\u2026" />;
  }

  const nav = navItems.filter(n => n.roles.includes(user.role));
  const avatar = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-surface dark:bg-navy-900 flex relative">
      {/* Aurora background animation for the entire app shell */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar
          collapsed={collapsed} setCollapsed={setCollapsed}
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
          pathname={pathname} nav={nav} user={user}
          notifCount={notifCount} avatar={avatar}
          darkMode={darkMode} toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Navbar */}
        <Topbar
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
          user={user} notifCount={notifCount} avatar={avatar}
          pathname={pathname}
        />

        {/* Page Content with Framer Motion transitions */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="hidden lg:flex items-center justify-between px-6 py-3 border-t border-navy-100 dark:border-navy-800/50 bg-white/50 dark:bg-navy-900/50">
          <p className="text-xs text-navy-400 dark:text-navy-500">
            &copy; {new Date().getFullYear()} Dwaraka Academy Management System
          </p>
          <div className="flex items-center gap-4 text-xs text-navy-400 dark:text-navy-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {currentTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              System Online
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role={user.role} pathname={pathname} notifCount={notifCount} />
    </div>
  );
}
