'use client';

import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FeeReceiptProps {
  fee: any;
  onClose: () => void;
}

export default function FeeReceipt({ fee, onClose }: FeeReceiptProps) {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    
    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${fee.invoice_no || fee.id?.slice(0, 8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; padding: 40px 20px; }
          .receipt { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #6D28D9, #8B5CF6); padding: 32px 40px 24px; text-align: center; }
          .header h1 { color: #fff; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; }
          .body { padding: 32px 40px; }
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #6b7280; }
          .row .value { font-weight: 600; color: #111827; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; border-top: 2px solid #e5e7eb; margin-top: 8px; }
          .total-row .label { font-weight: 700; color: #111827; }
          .total-row .value { font-weight: 800; color: #6D28D9; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-partial { background: #fef3c7; color: #92400e; }
          .status-pending { background: #fee2e2; color: #991b1b; }
          .footer { padding: 20px 40px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
          @media print {
            body { background: #fff; padding: 0; }
            .receipt { box-shadow: none; border: 1px solid #e5e7eb; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const handleDownloadPDF = async () => {
    // Browser print to PDF (save as PDF)
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    
    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${fee.invoice_no || fee.id?.slice(0, 8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 0; background: #fff; }
          .receipt { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #6D28D9, #8B5CF6); padding: 32px 40px 24px; text-align: center; }
          .header h1 { color: #fff; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; }
          .body { padding: 32px 40px; }
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
          .row .label { color: #6b7280; }
          .row .value { font-weight: 600; color: #111827; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; border-top: 2px solid #e5e7eb; }
          .total-row .value { font-weight: 800; color: #6D28D9; }
          .footer { padding: 20px 40px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const statusClass = fee.status === 'paid' ? 'status-paid' : fee.status === 'partial' ? 'status-partial' : 'status-pending';
  const balance = fee.amount - fee.paid_amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        {/* Action bar */}
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Fee Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm font-medium flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition text-sm font-medium flex items-center gap-1.5">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef}>
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-8 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <span className="text-2xl font-extrabold text-white">DA</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Dwaraka Academy</h1>
            <p className="text-purple-200 text-sm mt-1">Excellence in Education Since 2020</p>
            <p className="text-purple-300 text-xs mt-0.5">12-2-711/A/75, Site 2, LIC Colony, Mehdipatnam, Hyderabad - 500028</p>
            <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
              {fee.status === 'paid' ? 'PAID RECEIPT' : fee.status === 'partial' ? 'PARTIAL PAYMENT' : 'PENDING INVOICE'}
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Invoice & Receipt Info */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="section">
                  <h3>Invoice Details</h3>
                  <div className="row"><span className="label">Invoice No</span><span className="value">{fee.invoice_no || fee.id?.slice(0, 8).toUpperCase()}</span></div>
                  <div className="row"><span className="label">Academic Year</span><span className="value">{fee.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)}</span></div>
                  <div className="row"><span className="label">Due Date</span><span className="value">{fee.due_date ? new Date(fee.due_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  <div className="row"><span className="label">Payment Date</span><span className="value">{fee.payment_date ? new Date(fee.payment_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  <div className="row"><span className="label">Status</span><span className={`status-badge ${statusClass}`}>{fee.status?.toUpperCase()}</span></div>
                </div>
              </div>
              <div>
                <div className="section">
                  <h3>Student Information</h3>
                  <div className="row"><span className="label">Student Name</span><span className="value">{fee.student?.name || '—'}</span></div>
                  <div className="row"><span className="label">Admission No</span><span className="value">{fee.student?.admission_no || '—'}</span></div>
                  <div className="row"><span className="label">Class</span><span className="value">{fee.student?.current_class || '—'}</span></div>
                  <div className="row"><span className="label">Section</span><span className="value">{fee.student?.section || '—'}</span></div>
                  <div className="row"><span className="label">Batch</span><span className="value">{fee.Batch?.name || '—'}</span></div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="section">
              <h3>Fee Details</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="row"><span className="label">Fee Head</span><span className="value">{fee.fee_head}</span></div>
                {fee.term && <div className="row"><span className="label">Term</span><span className="value">{fee.term}</span></div>}
                <div className="row"><span className="label">Total Fee Amount</span><span className="value">₹{fee.amount?.toLocaleString() || '0'}</span></div>
                <div className="row"><span className="label">Amount Paid</span><span className="value" style={{color: '#059669'}}>₹{fee.paid_amount?.toLocaleString() || '0'}</span></div>
                {fee.payment_mode && (
                  <div className="row"><span className="label">Payment Mode</span><span className="value">{fee.payment_mode?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></div>
                )}
                {fee.transaction_id && <div className="row"><span className="label">Transaction ID</span><span className="value" style={{fontFamily: 'monospace', fontSize: '13px'}}>{fee.transaction_id}</span></div>}
                <div className="total-row">
                  <span className="label">Balance Due</span>
                  <span className="value" style={{color: balance > 0 ? '#dc2626' : '#059669'}}>
                    {balance > 0 ? `₹${balance.toLocaleString()}` : '₹0 (Fully Paid)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {fee.remarks && (
              <div className="section mt-4">
                <h3>Remarks</h3>
                <p className="text-sm text-slate-600 italic bg-slate-50 rounded-lg p-3">{fee.remarks}</p>
              </div>
            )}

            {/* Generated By & QR placeholder */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                <p>Generated by: {user?.name || 'Admin'}</p>
                <p>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 text-slate-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <rect x="6" y="6" width="4" height="4" />
                    <rect x="14" y="6" width="4" height="4" />
                    <rect x="6" y="14" width="4" height="4" />
                    <rect x="14" y="14" width="4" height="4" />
                    <rect x="10" y="10" width="4" height="4" />
                  </svg>
                  <span className="text-[8px] text-slate-400">Verified</span>
                </div>
              </div>
            </div>

            {/* Verification note */}
            <div className="mt-4 text-center text-[10px] text-slate-300">
              This is a computer-generated receipt. No signature required.
              Verify at: {typeof window !== 'undefined' ? window.location.origin : 'https://dwarakaacademy.com'}/verify/{fee.invoice_no || fee.id}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
            Dwaraka Academy — Excellence in Education Since 2020<br />
            12-2-711/A/75, Site 2, LIC Colony, Mehdipatnam, Hyderabad - 500028<br />
            Phone: +91 9030698785 | Email: info@dwarakaacademy.com
          </div>
        </div>
      </div>
    </div>
  );
}
