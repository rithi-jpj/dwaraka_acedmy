'use client';

interface SkeletonTableProps {
  /** Number of rows (default 5) */
  rows?: number;
  /** Number of columns (default 4) */
  columns?: number;
  /** Additional className */
  className?: string;
}

export default function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100/80 overflow-hidden animate-fade-in ${className}`}
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded skeleton flex-1 mr-3 last:mr-0"
            style={{ width: `${Math.max(15, 30 - i * 4)}%` }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex px-4 py-3.5 border-b border-slate-50 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, col) => (
            <div
              key={col}
              className="h-3 rounded skeleton flex-1 mr-3 last:mr-0"
              style={{
                width: `${Math.max(20, 50 - col * 10 - row * 3)}%`,
                opacity: Math.max(0.3, 1 - row * 0.12),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
