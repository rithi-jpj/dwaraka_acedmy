'use client';

interface SkeletonCardProps {
  /** Number of content lines (default 3) */
  lines?: number;
  /** Show an avatar/circle placeholder at the top (default false) */
  avatar?: boolean;
  /** Additional className */
  className?: string;
}

export default function SkeletonCard({
  lines = 3,
  avatar = false,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100/80 p-5 animate-fade-in ${className}`}
      aria-hidden="true"
    >
      {avatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded skeleton" />
            <div className="h-2.5 w-1/3 rounded skeleton" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded skeleton"
            style={{ width: `${Math.max(45, 100 - i * 15)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
