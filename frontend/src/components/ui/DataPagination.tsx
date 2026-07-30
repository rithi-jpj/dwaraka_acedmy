'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
}

export default function DataPagination({ page, totalPages, total, limit = 20, onPageChange }: DataPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/80">
      <span className="text-xs text-navy-500">
        Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition-all font-medium"
          aria-label="First page"
        >
          ««
        </button>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition-all font-medium flex items-center gap-1"
        >
          <ChevronLeft className="w-3 h-3" /> Prev
        </button>
        <span className="px-3 py-1 text-xs text-navy-600 font-semibold min-w-[100px] text-center">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition-all font-medium flex items-center gap-1"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition-all font-medium"
          aria-label="Last page"
        >
          »»
        </button>
      </div>
      <span className="text-xs text-navy-400 hidden sm:inline">{limit} per page</span>
    </div>
  );
}
