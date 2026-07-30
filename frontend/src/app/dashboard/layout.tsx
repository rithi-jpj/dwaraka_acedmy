'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import { api } from '@/lib/api';
import { onSocketEvent } from '@/lib/socket';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, BookMarked,
  ClipboardCheck, CalendarCheck, Layers, UserPlus, UserCheck,
  FileText, Bell, User, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Home, Sun, Moon, Globe, IndianRupee, Megaphone, Upload,
  Search, Settings, Clock, Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Navigation Configuration ───
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

// ─── Sidebar ───
function Sidebar({
  collapsed, setCollapsed, mobileOpen, setMobileOpen,
  pathname, nav, user, notifCount, avatar, darkMode, toggleDarkMode
}: {
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
  pathname: string; nav: { href: string; label: string; icon: any; roles: string[]; badge?: string }[]; user: any; notifCount: number;
  avatar: string; darkMode: boolean; toggleDarkMode: () => void;
}) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col
        bg-navy-900 text-white
        border-r border-navy-800 shadow-sidebar transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo Area */}
        <div className={`flex items-center gap-3 h-16 px-4 border-b border-navy-800/80 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm text-white tracking-tight">Dwaraka Academy</div>
              <div className="text-[10px] text-navy-400 font-medium uppercase tracking-wider mt-0.5">Management</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 scrollbar-thin">
          {/* Group: Main */}
          {!collapsed && (
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-navy-400/60">
              Main Menu
            </div>
          )}
          {nav.map(n => {
            const isActive = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out
                  ${isActive
                    ? 'bg-brand-600/15 text-brand-100 shadow-sm border border-brand-500/10'
                    : 'text-navy-400 hover:bg-navy-800/60 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-200
                  ${isActive ? 'text-brand-400' : 'text-navy-500 group-hover:text-brand-400'}`} />
                {!collapsed && <span>{n.label}</span>}
                {'badge' in n && n.badge === 'notif' && notifCount > 0 && (
                  <span className={`${collapsed ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'}
                    min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full
                    bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm`}>
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex-shrink-0 border-t border-navy-800/80 px-2 py-3 space-y-1">
          {/* Theme toggle */}
          <button onClick={toggleDarkMode}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium text-navy-400
              hover:text-accent-400 hover:bg-navy-800/60 transition-all duration-200 w-full
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center rounded-xl text-navy-400 hover:text-white hover:bg-navy-800/60 transition-all duration-200 w-full py-2.5">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Top Navbar ───
function TopNavbar({
  mobileOpen, setMobileOpen, user, notifCount, avatar, pathname
}: {
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
  user: any; notifCount: number; avatar: string; pathname: string;
}) {
  const { logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const crumbs = generateBreadcrumbs(pathname);

  // Fetch recent notifications
  useEffect(() => {
    if (showNotifs) {
      api.get('/notifications/inbox?limit=5').then(r => {
        setRecentNotifs(r.data?.notifications || r.data || []);
      }).catch(() => {});
    }
  }, [showNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Simple search - navigate to relevant page
      const q = searchQuery.toLowerCase();
      const match = navItems.find(n => n.label.toLowerCase().includes(q) && n.roles.includes(user.role));
      if (match) window.location.href = match.href;
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Logout with confirmation
  const handleLogout = () => {
    setShowProfile(false);
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-navy-100 dark:border-navy-800/50 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-4">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-navy-500 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-navy-300 dark:text-navy-600 flex-shrink-0" />}
                {i === crumbs.length - 1 ? (
                  <span className="font-semibold text-navy-800 dark:text-white truncate">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-navy-400 dark:text-navy-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-50 dark:bg-navy-800/60
              border border-navy-200 dark:border-navy-700/50 text-navy-400 dark:text-navy-500
              hover:border-brand-300 dark:hover:border-brand-600/50 hover:text-navy-600 dark:hover:text-navy-300
              transition-all duration-200 text-sm w-56 cursor-text">
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white dark:bg-navy-800
              border border-navy-200 dark:border-navy-700 text-[10px] font-medium text-navy-400 dark:text-navy-500">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search */}
          <button onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-navy-500 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="Search">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-navy-500 dark:text-navy-400
                hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              aria-label={showNotifs ? 'Close notifications' : 'Open notifications'}>
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-1
                  rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm border-2 border-white dark:border-navy-900">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-800 rounded-2xl
                shadow-modal border border-navy-100 dark:border-navy-700 overflow-hidden animate-scale-in origin-top-right">
                <div className="px-5 py-4 border-b border-navy-100 dark:border-navy-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-navy-900 dark:text-white text-sm">Notifications</h3>
                    <Link href="/dashboard/notifications"
                      onClick={() => setShowNotifs(false)}
                      className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
                      View all
                    </Link>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Bell className="w-8 h-8 text-navy-300 dark:text-navy-600 mx-auto mb-2" />
                      <p className="text-sm text-navy-400 dark:text-navy-500">No new notifications</p>
                    </div>
                  ) : (
                    recentNotifs.map((n: any, i: number) => (
                      <Link key={n.id || i} href="/dashboard/notifications"
                        onClick={() => setShowNotifs(false)}
                        className={`block px-5 py-3 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors
                          ${!n.read_at ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}>
                        <p className="text-sm font-medium text-navy-900 dark:text-white truncate">{n.title}</p>
                        <p className="text-xs text-navy-400 dark:text-navy-500 mt-0.5 truncate">{n.message}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-600 dark:to-brand-800
                flex items-center justify-center text-brand-700 dark:text-brand-200 font-bold text-sm
                shadow-sm border border-brand-200/50 dark:border-brand-500/20">
                {avatar}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-navy-900 dark:text-white leading-tight">{user.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                    ${roleBadgeColors[user.role] || 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300'}`}>
                    {roleIcons[user.role]}
                    {user.role}
                  </span>
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-navy-800 rounded-2xl
                shadow-modal border border-navy-100 dark:border-navy-700 overflow-hidden animate-scale-in origin-top-right">
                <div className="px-5 py-4 border-b border-navy-100 dark:border-navy-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-600 dark:to-brand-800
                      flex items-center justify-center text-brand-700 dark:text-brand-200 font-bold text-base
                      shadow-sm border border-brand-200/50 dark:border-brand-500/20">
                      {avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-navy-900 dark:text-white truncate">{user.name}</div>
                      <div className="text-xs text-navy-400 dark:text-navy-500 truncate">{user.email}</div>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/my"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-navy-600 dark:text-navy-300
                      hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors">
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link href="/change-password"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-navy-600 dark:text-navy-300
                      hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors">
                    <Settings className="w-4 h-4" />
                    Change Password
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl bg-white dark:bg-navy-800 rounded-2xl shadow-modal border border-navy-100 dark:border-navy-700 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-3.5 border-b border-navy-100 dark:border-navy-700">
              <Search className="w-5 h-5 text-navy-400 dark:text-navy-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search students, teachers, fees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 outline-none border-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-navy-100 dark:bg-navy-700
                text-[10px] font-medium text-navy-400 dark:text-navy-500">ESC</kbd>
            </form>
            <div className="px-5 py-3">
              <p className="text-xs text-navy-400 dark:text-navy-500">
                Type to search pages and navigate with <kbd className="px-1 rounded bg-navy-100 dark:bg-navy-700 text-navy-500">Enter</kbd>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </header>
  );
}

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
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/90 dark:bg-navy-900/95
      backdrop-blur-xl border-t border-navy-200/80 dark:border-navy-700/50 shadow-lg
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
    <div className="min-h-screen bg-surface dark:bg-navy-900 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed} setCollapsed={setCollapsed}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        pathname={pathname} nav={nav} user={user}
        notifCount={notifCount} avatar={avatar}
        darkMode={darkMode} toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
          user={user} notifCount={notifCount} avatar={avatar}
          pathname={pathname}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 animate-page-enter">
          {children}
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
