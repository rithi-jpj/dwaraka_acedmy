'use client';

import SkeletonTable from '@/components/ui/SkeletonTable';

export default function TeachersLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded skeleton" />
          <div className="h-4 w-52 rounded skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-xl skeleton" />
        <div className="h-10 w-28 rounded-xl skeleton" />
      </div>
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}
