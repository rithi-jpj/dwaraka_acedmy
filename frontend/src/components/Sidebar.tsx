'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, User, LogOut,
  Sun, Moon, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ───
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  pathname: string;
  nav: NavItem[];
  user: any;
  notifCount: number;
  avatar: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Sidebar({
  collapsed, setCollapsed, mobileOpen, setMobileOpen,
  pathname, nav, user, notifCount, avatar, darkMode, toggleDarkMode,
}: SidebarProps) {
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-navy-700/50">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-glow-blue">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-base font-extrabold text-white truncate"
            >
              Dwaraka <span className="text-accent-400">Academy</span>
            </motion.span>
          )}
        </Link>
      </div>

      {/* User profile card */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-2xl bg-white/5 border border-navy-700/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-navy-400 capitalize">{user?.role || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-brand-500/15 to-brand-600/10 text-brand-300 glow-ring'
                  : 'text-navy-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                active
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-blue'
                  : 'bg-navy-800/50 group-hover:bg-navy-700/50'
              }`}>
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-navy-400 group-hover:text-white'}`} />
              </div>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {!collapsed && item.href === '/dashboard/notifications' && notifCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-navy-700/50 space-y-2">
        {!collapsed && (
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-navy-300 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-navy-800/50 flex items-center justify-center">
              {darkMode ? <Sun className="w-5 h-5 text-accent-400" /> : <Moon className="w-5 h-5 text-navy-400" />}
            </div>
            <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}

        <Link href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-navy-300 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-navy-800/50 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center py-2 rounded-2xl text-navy-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block h-screen glass-sidebar overflow-hidden sticky top-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] glass-sidebar lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
