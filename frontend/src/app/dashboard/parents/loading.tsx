'use client';

import SkeletonTable from '@/components/ui/SkeletonTable';

export default function ParentsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded skeleton" />
          <div className="h-4 w-48 rounded skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <SkeletonTable rows={4} columns={5} />
    </div>
  );
}
