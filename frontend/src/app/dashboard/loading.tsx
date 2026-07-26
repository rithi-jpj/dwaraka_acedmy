'use client';

import PageLoader from '@/components/ui/PageLoader';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 flex">
      {/* Skeleton sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/90 dark:bg-slate-900/95 border-r border-slate-100 dark:border-slate-700/50">
        {/* Logo section */}
        <div className="px-4 h-16 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded skeleton" />
            <div className="h-2 w-1/2 rounded skeleton" />
          </div>
        </div>

        {/* User info skeleton */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl skeleton shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 rounded skeleton" />
            <div className="h-2 w-1/3 rounded skeleton" />
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-5 h-5 rounded skeleton shrink-0" />
              <div className="h-3 rounded skeleton" style={{ width: `${Math.max(40, 80 - i * 5)}%` }} />
            </div>
          ))}
        </div>

        {/* Footer skeleton */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <div className="h-8 rounded-xl skeleton" />
        </div>
      </aside>

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top header skeleton */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="h-5 w-40 rounded skeleton" />
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 rounded skeleton" />
              <div className="w-8 h-8 rounded-xl skeleton" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <PageLoader label="Loading dashboard…" />
        </main>
      </div>
    </div>
  );
}
