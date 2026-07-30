'use client';
import { useState } from 'react';
import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Search, User, Settings, LogOut, Sun, Moon,
  ChevronDown, LayoutDashboard, GraduationCap,
} from 'lucide-react';

// ─── Types ───
interface TopbarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  user: any;
  notifCount: number;
  avatar: string;
  pathname: string;
}

export default function Topbar({
  mobileOpen, setMobileOpen, user, notifCount, avatar, pathname,
}: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Generate breadcrumb label from pathname
  const breadcrumbLabel = pathname === '/dashboard'
    ? 'Dashboard'
    : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Page';

  return (
    <header className="sticky top-0 z-30 glass-nav shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800 transition-all"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-navy-400 dark:text-navy-500 hover:text-brand-600 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
            </Link>
            <span className="text-navy-300 dark:text-navy-600">/</span>
            <span className="text-navy-700 dark:text-navy-200 font-medium capitalize">
              {breadcrumbLabel}
            </span>
          </div>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-50 dark:bg-navy-800/50 border border-navy-100 dark:border-navy-700/50 text-navy-400 text-sm min-w-[200px]">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-navy-600 dark:text-navy-200 placeholder-navy-400 w-full text-sm"
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-all"
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-white dark:border-navy-900">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-glass-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-navy-100 dark:border-navy-700">
                    <p className="text-sm font-bold text-navy-900 dark:text-white">Notifications</p>
                  </div>
                  <div className="p-4 text-center text-sm text-navy-400">
                    <p>No unread notifications</p>
                  </div>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block p-3 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 border-t border-navy-100 dark:border-navy-700 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-800 transition-all"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xs">
                {avatar}
              </div>
              <span className="hidden md:block text-sm font-medium text-navy-700 dark:text-navy-200 max-w-[120px] truncate">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="hidden md:block w-3.5 h-3.5 text-navy-400" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-glass-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-navy-100 dark:border-navy-700">
                    <p className="text-sm font-bold text-navy-900 dark:text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-navy-500 capitalize">{user?.role || ''}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/change-password"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Change Password
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
