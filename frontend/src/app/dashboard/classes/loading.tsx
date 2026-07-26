'use client';

import SkeletonCard from '@/components/ui/SkeletonCard';

export default function ClassesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded skeleton" />
          <div className="h-4 w-48 rounded skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
