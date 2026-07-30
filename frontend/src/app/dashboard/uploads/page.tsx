'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Upload, Trash2, Search, FileIcon, Image, FileText, FileSpreadsheet, ExternalLink, RefreshCw, Download, Eye } from 'lucide-react';

export default function UploadsPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (filterType) params.set('type', filterType);
      const { data } = await api.get(`/uploads?${params}`);
      setFiles(data.files || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load files', 'error');
    }
    setLoading(false);
  }, [page, filterType, showToast]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      return showToast('File too large. Maximum size is 25 MB.', 'error');
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      showToast('File uploaded successfully', 'success');
      loadFiles();
    } catch (e: any) {
      showToast(e.message || 'Upload failed', 'error');
    }
    setUploading(false);
    e.target.value = '';
  };

  // Delete file
  const deleteFile = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/uploads/${deleteId}`);
      showToast('File deleted', 'success');
      setDeleteId(null);
      loadFiles();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const getFileIcon = (mime: string) => {
    if (!mime) return <FileIcon className="w-8 h-8 text-slate-400" />;
    if (mime.startsWith('image/')) return <Image className="w-8 h-8 text-emerald-500" />;
    if (mime.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (mime.includes('word') || mime.includes('document')) return <FileText className="w-8 h-8 text-blue-600" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(f =>
    !search ||
    f.filename?.toLowerCase().includes(search.toLowerCase()) ||
    f.original_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition z-10">
              ✕
            </button>
            {previewUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Preview not available for this file type</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                  className="btn inline-flex items-center gap-2 mt-4">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">File Management</h1>
          <p className="text-sm text-slate-500 mt-1">Upload, manage, and preview files</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" className="hidden" onChange={handleUpload}
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              disabled={uploading} />
          </label>
          <button onClick={loadFiles} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search files..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[150px]" value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
        </select>
        <span className="text-sm text-slate-500">{total} file{total !== 1 && 's'}</span>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="card text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Uploading file...</p>
        </div>
      )}

      {/* File Grid */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No files found</p>
          <p className="text-sm text-slate-400 mt-1">Upload files to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map(f => {
            const isImage = f.is_image || f.mime_type?.startsWith('image/');
            return (
              <div key={f.filename} className="card p-0 overflow-hidden group hover:shadow-lg transition-all duration-200">
                {/* Preview */}
                <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => setPreviewUrl(f.url)}>
                  {isImage ? (
                    <img src={f.url} alt={f.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {getFileIcon(f.mime_type)}
                      <span className="text-xs text-slate-400 font-medium">
                        {f.mime_type?.includes('pdf') ? 'PDF Document' :
                         f.mime_type?.includes('excel') || f.mime_type?.includes('spreadsheet') ? 'Spreadsheet' :
                         f.mime_type?.includes('word') || f.mime_type?.includes('document') ? 'Word Document' :
                         'File'}
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-800 truncate" title={f.filename}>
                    {f.filename?.replace(/^\d+-/, '') || f.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{formatSize(f.size)}</span>
                    <span className="text-[10px] text-slate-400">
                      {f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-xs text-brand font-medium hover:text-brand-dark transition flex items-center justify-center gap-1 py-1 rounded hover:bg-brand-50">
                      <Download className="w-3 h-3" /> Download
                    </a>
                    <button onClick={() => setDeleteId(f.filename)}
                      className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1 py-1 px-2 rounded hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} total files</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
              « Prev
            </button>
            <span className="px-3 py-1 text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
              Next »
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Delete File</h3>
            <p className="text-sm text-slate-600 mb-2">Are you sure you want to delete this file?</p>
            <p className="text-xs text-slate-400 mb-4 font-mono truncate">{deleteId}</p>
            <div className="flex gap-3">
              <button onClick={deleteFile} className="btn bg-red-600 hover:bg-red-700 text-white flex-1">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
