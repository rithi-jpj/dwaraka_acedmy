'use client';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface PremiumDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function PremiumDialog({ open, onClose, title, children, maxWidth = 'max-w-md' }: PremiumDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white rounded-3xl shadow-modal ${maxWidth} w-full mx-4 animate-scale-in border border-navy-100`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h3 className="font-semibold text-lg text-navy-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
