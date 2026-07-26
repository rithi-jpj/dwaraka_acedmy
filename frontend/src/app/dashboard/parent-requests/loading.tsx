'use client';

import SkeletonTable from '@/components/ui/SkeletonTable';

export default function ParentRequestsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded skeleton" />
          <div className="h-4 w-56 rounded skeleton" />
        </div>
      </div>
      <SkeletonTable rows={4} columns={5} />
    </div>
  );
}
