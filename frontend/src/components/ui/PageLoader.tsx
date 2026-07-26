'use client';

interface PageLoaderProps {
  /** Optional descriptive text */
  label?: string;
  /** Show sidebar skeleton (default false — just a centered spinner) */
  sidebar?: boolean;
}

export default function PageLoader({ label = 'Loading…', sidebar = false }: PageLoaderProps) {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[60vh] animate-fade-in"
      role="status"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Ring spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-purple-200/30" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-purple-500 border-r-purple-400 animate-spin-slow" />
        </div>

        {label && (
          <p className="text-sm text-slate-400 font-medium">{label}</p>
        )}
      </div>
    </div>
  );
}
