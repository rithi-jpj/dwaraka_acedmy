'use client';

import SkeletonCard from '@/components/ui/SkeletonCard';
import SkeletonTable from '@/components/ui/SkeletonTable';

export default function MarksLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded skeleton" />
          <div className="h-4 w-52 rounded skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
      </div>
      <SkeletonTable rows={7} columns={5} />
    </div>
  );
}
