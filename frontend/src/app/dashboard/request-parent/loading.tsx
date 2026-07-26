'use client';

import PageLoader from '@/components/ui/PageLoader';

export default function RequestParentLoading() {
  return (
    <div className="min-h-[60vh] animate-fade-in">
      <div className="space-y-2 mb-6">
        <div className="h-7 w-48 rounded skeleton" />
        <div className="h-4 w-64 rounded skeleton" />
      </div>
      <PageLoader label="Preparing request form…" />
    </div>
  );
}
