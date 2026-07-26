'use client';

import SkeletonCard from '@/components/ui/SkeletonCard';

export default function AnnouncementsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded skeleton" />
          <div className="h-4 w-56 rounded skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="space-y-4">
        <SkeletonCard lines={4} avatar />
        <SkeletonCard lines={3} avatar />
        <SkeletonCard lines={5} avatar />
      </div>
    </div>
  );
}
