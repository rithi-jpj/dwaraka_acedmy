'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Loading text to show alongside the spinner (default "Saving…") */
  loadingText?: string;
  /** Variant matching the project's button styles */
  variant?: 'primary' | 'outline' | 'danger' | 'success' | 'ghost';
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/20 hover:from-brand-light hover:to-brand hover:shadow-xl hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
  danger:
    'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0',
  success:
    'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      loading = false,
      loadingText,
      variant = 'primary',
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <Loader2
            className="w-4 h-4 animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        <span className={loading ? 'opacity-90' : ''}>
          {loading ? loadingText || children : children}
        </span>
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
