'use client';

import SkeletonCard from '@/components/ui/SkeletonCard';
import SkeletonTable from '@/components/ui/SkeletonTable';

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded skeleton" />
          <div className="h-4 w-56 rounded skeleton" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-44 rounded-xl skeleton" />
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
      </div>
      <SkeletonTable rows={6} columns={4} />
    </div>
  );
}
