'use client';

import PageLoader from '@/components/ui/PageLoader';

export default function ChangePasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-900">
      <PageLoader label="Preparing security form…" />
    </div>
  );
}
