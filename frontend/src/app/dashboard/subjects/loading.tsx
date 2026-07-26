'use client';

import SkeletonTable from '@/components/ui/SkeletonTable';

export default function SubjectsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded skeleton" />
          <div className="h-4 w-48 rounded skeleton" />
        </div>
        <div className="h-10 w-32 rounded-xl skeleton" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-xl skeleton" />
        <div className="h-10 w-28 rounded-xl skeleton" />
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
