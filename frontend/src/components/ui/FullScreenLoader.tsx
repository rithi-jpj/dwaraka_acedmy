'use client';
import { useEffect, useState } from 'react';

interface FullScreenLoaderProps {
  /** Optional minimum display time in ms (default 800) */
  minDisplayMs?: number;
  /** Optional label below the spinner */
  label?: string;
}

export default function FullScreenLoader({
  minDisplayMs = 800,
  label = 'Loading…',
}: FullScreenLoaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to prevent flash on fast loads
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-navy-900 animate-fade-in"
      role="status"
      aria-label={label}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-accent-500/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        {/* Premium rotating gradient ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-brand-400/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-400 border-r-accent-400 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-600/10 backdrop-blur-sm flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent-400 animate-ping-soft" />
          </div>
        </div>

        {/* Branding */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Dwaraka Academy</h1>
          <p className="text-[11px] text-brand-300/70 font-medium italic">Excellence in Education Since 2020</p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-300/60 animate-bounce-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-300/60 animate-bounce-dot" style={{ animationDelay: '0.15s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-300/60 animate-bounce-dot" style={{ animationDelay: '0.3s' }} />
        </div>

        <p className="text-xs text-brand-300/50 mt-1">{label}</p>
      </div>
    </div>
  );
}
