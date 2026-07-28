'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import {
  Globe, Plus, Pencil, Trash2, Search, GripVertical,
  LayoutDashboard, BookOpen, Users, Award, MessageCircle,
  Image as ImageIcon, Download, Phone, Settings, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown,
} from 'lucide-react';

const SECTION_META: Record<string, { label: string; icon: any }> = {
  hero: { label: 'Hero', icon: LayoutDashboard },
  about: { label: 'About', icon: BookOpen },
  course: { label: 'Courses', icon: BookOpen },
  faculty: { label: 'Faculty', icon: Users },
  result: { label: 'Results', icon: Award },
  testimonial: { label: 'Testimonials', icon: MessageCircle },
  gallery: { label: 'Gallery', icon: ImageIcon },
  download: { label: 'Downloads', icon: Download },
  contact: { label: 'Contact', icon: Phone },
  setting: { label: 'Settings', icon: Settings },
};

export default function WebsiteManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('hero');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ key: '', data: '{}', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [rawData, setRawData] = useState<string>('{}');
  const [dataEditorOpen, setDataEditorOpen] = useState(false);

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const overIdxRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ section, limit: '100' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/content?${params}`);
      setItems(data.items || []);
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to load content', 'error');
    }
    setLoading(false);
  }, [section, search, showToast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const sectionList = Object.entries(SECTION_META);

  const openCreate = () => {
    setEditId(null);
    setForm({ key: '', data: '{}', sort_order: 0, is_active: true });
    setRawData('{}');
    setDataEditorOpen(false);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    const dataStr = typeof item.data === 'object' ? JSON.stringify(item.data, null, 2) : item.data || '{}';
    setForm({ key: item.key || '', data: dataStr, sort_order: item.sort_order || 0, is_active: item.is_active });
    setRawData(dataStr);
    setDataEditorOpen(false);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        showToast('Invalid JSON in data field', 'error');
        setSaving(false);
        return;
      }

      if (editId) {
        await api.patch(`/content/${editId}`, {
          key: form.key,
          data: parsedData,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        showToast('Content updated', 'success');
      } else {
        await api.post('/content', {
          section,
          key: form.key,
          data: parsedData,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        showToast('Content created', 'success');
      }
      setShowForm(false);
      loadItems();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Save failed', 'error');
    }
    setSaving(false);
  };

  const confirmDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    try {
      await api.delete(`/content/${id}`);
      showToast('Content deleted', 'success');
      loadItems();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/content/${id}/toggle`);
      loadItems();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Toggle failed', 'error');
    }
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    // Use ref to avoid re-renders on every pixel move
    if (overIdxRef.current !== idx) {
      overIdxRef.current = idx;
      setOverIdx(idx);
    }
  };

  const handleDragLeave = () => {
    overIdxRef.current = null;
    setOverIdx(null);
  };

  const handleDrop = async (dropIdx: number) => {
    setOverIdx(null);
    overIdxRef.current = null;
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      return;
    }

    // Reorder items in local state
    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setItems(reordered);
    setDragIdx(null);

    // Persist new sort order to backend
    setSavingOrder(true);
    try {
      await Promise.all(
        reordered.map((item, i) =>
          api.patch(`/content/${item.id}`, { sort_order: i })
        )
      );
      showToast('Order updated', 'success');
    } catch (e: any) {
      showToast('Failed to save order', 'error');
      loadItems(); // Revert on error
    }
    setSavingOrder(false);
  };

  const moveItem = async (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);
    setItems(reordered);

    try {
      await Promise.all(
        reordered.map((item, i) =>
          api.patch(`/content/${item.id}`, { sort_order: i })
        )
      );
    } catch {
      loadItems(); // Revert on error
    }
  };

  const SectionIcon = SECTION_META[section]?.icon || Globe;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Website Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all public website content — changes are reflected immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savingOrder && (
            <span className="text-xs text-slate-500 animate-pulse">Saving order…</span>
          )}
          <button onClick={openCreate} className="btn flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Content
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sectionList.map(([key, meta]) => {
          const Icon = meta.icon;
          const isActive = section === key;
          return (
            <button key={key} onClick={() => { setSection(key); setSearch(''); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand/30 hover:text-brand'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="input pl-9 w-full" placeholder="Search by key or title…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card border-2 border-brand/20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <SectionIcon className="w-4 h-4 text-brand" />
            {editId ? 'Edit Content' : 'New Content'} — {SECTION_META[section]?.label}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Key (identifier)</label>
                <input className="input" placeholder="e.g. main-heading, card-1"
                  value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} />
              </div>
              <div>
                <label className="label">Sort Order</label>
                <input className="input" type="number" value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                  <span className="text-sm text-slate-600">Active</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Data (JSON)</label>
                <button type="button" onClick={() => setDataEditorOpen(!dataEditorOpen)}
                  className="text-xs text-brand hover:underline">
                  {dataEditorOpen ? 'Simple view' : 'Raw JSON editor'}
                </button>
              </div>
              {dataEditorOpen ? (
                <textarea className="input font-mono text-xs min-h-[200px]"
                  value={rawData} onChange={e => setRawData(e.target.value)} />
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Title</label>
                      <input className="input" placeholder="Title"
                        value={(() => { try { return JSON.parse(rawData).title || ''; } catch { return ''; } })()}
                        onChange={e => {
                          try {
                            const d = JSON.parse(rawData);
                            d.title = e.target.value;
                            setRawData(JSON.stringify(d, null, 2));
                          } catch {}
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Subtitle / Description</label>
                      <input className="input" placeholder="Description"
                        value={(() => { try { return JSON.parse(rawData).description || JSON.parse(rawData).subtitle || ''; } catch { return ''; } })()}
                        onChange={e => {
                          try {
                            const d = JSON.parse(rawData);
                            d.description = e.target.value;
                            setRawData(JSON.stringify(d, null, 2));
                          } catch {}
                        }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Image URL</label>
                    <input className="input" placeholder="/images/example.jpg"
                      value={(() => { try { return JSON.parse(rawData).image || JSON.parse(rawData).photo || ''; } catch { return ''; } })()}
                      onChange={e => {
                        try {
                          const d = JSON.parse(rawData);
                          d.image = e.target.value;
                          setRawData(JSON.stringify(d, null, 2));
                        } catch {}
                      }} />
                  </div>
                </div>
              )}
              {!dataEditorOpen && (
                <button type="button" onClick={() => setDataEditorOpen(true)}
                  className="text-xs text-brand mt-1 hover:underline">
                  Switch to raw JSON for advanced fields
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Content List with Drag & Drop */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading content…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <Globe className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No content in this section</p>
          <p className="text-sm text-slate-400 mt-1">Click &quot;Add Content&quot; to create your first item.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-slate-400">
              Drag items to reorder · {items.length} item{items.length !== 1 && 's'}
            </span>
          </div>
          {items.map((item, idx) => {
            const dataObj = typeof item.data === 'object' ? item.data : {};
            const title = dataObj.title || dataObj.name || item.key || '(no title)';
            const desc = dataObj.description || dataObj.subtitle || '';
            const image = dataObj.image || dataObj.photo || '';
            const isDragging = dragIdx === idx;
            const isOver = overIdx === idx;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                className={`card flex items-start gap-3 transition-all duration-200 ${
                  !item.is_active ? 'opacity-60' : ''
                } ${
                  isDragging ? 'shadow-xl scale-[1.02] border-brand/30 bg-brand-50/30' : ''
                } ${
                  isOver ? 'border-t-2 border-t-brand border-dashed' : ''
                } hover:shadow-md cursor-grab active:cursor-grabbing`}
              >
                {/* Drag handle */}
                <div className="flex flex-col items-center gap-0.5 pt-2 text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-[10px] font-mono text-slate-400">{idx + 1}</span>
                </div>

                {image && (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{title}</h3>
                    {item.key && (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 font-mono">
                        {item.key}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {desc && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{desc}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>Order: {item.sort_order}</span>
                    <span>Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* Move up/down buttons */}
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => toggleActive(item.id)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand transition"
                    title={item.is_active ? 'Deactivate' : 'Activate'}>
                    {item.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmDelete(item.id)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
