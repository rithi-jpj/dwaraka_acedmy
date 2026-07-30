'use client';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-glow text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200/30 flex items-center justify-center mx-auto mb-4">
        <div className="text-brand-400">{icon}</div>
      </div>
      <p className="text-navy-700 font-bold text-lg">{title}</p>
      {description && <p className="text-sm text-navy-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
