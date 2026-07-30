'use client';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };

  return (
    <div className="card text-center py-12">
      <RefreshCw className={`${sizeClasses[size]} animate-spin mx-auto text-brand mb-3`} />
      {message && <p className="text-sm text-navy-500">{message}</p>}
    </div>
  );
}
