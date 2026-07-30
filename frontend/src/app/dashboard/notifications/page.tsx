'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Megaphone, Send, Bell, Info, AlertTriangle, CheckCircle, GraduationCap, IndianRupee, Calendar, User, Trash2, Inbox, History, RefreshCw, X } from 'lucide-react';

const notifTypes = ['information', 'warning', 'success', 'exam', 'fee_reminder', 'holiday', 'assignment', 'event'] as const;
const audiences = ['all', 'students', 'teachers', 'parents', 'specific'] as const;
const priorities = ['low', 'normal', 'high', 'urgent'] as const;

const typeIcons: Record<string, any> = {
  information: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  exam: GraduationCap,
  fee_reminder: IndianRupee,
  holiday: Calendar,
  assignment: Megaphone,
  event: Bell,
};

const typeColors: Record<string, string> = {
  information: 'bg-blue-100 text-blue-700 border-blue-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-purple-100 text-purple-700 border-purple-200',
  fee_reminder: 'bg-red-100 text-red-700 border-red-200',
  holiday: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  assignment: 'bg-orange-100 text-orange-700 border-orange-200',
  event: 'bg-pink-100 text-pink-700 border-pink-200',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'inbox' | 'send' | 'history'>(isAdmin ? 'send' : 'inbox');

  // Inbox state
  const [inbox, setInbox] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [inboxPages, setInboxPages] = useState(1);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Send state
  const [form, setForm] = useState({
    title: '', body: '', audience: 'all' as typeof audiences[number],
    type: 'information' as typeof notifTypes[number],
    priority: 'normal' as typeof priorities[number],
    target_user_ids: [] as string[],
    link_url: '',
  });
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [targetSearch, setTargetSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPages, setHistoryPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load inbox
  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const params = new URLSearchParams({ page: String(inboxPage), limit: '20' });
      const { data } = await api.get(`/notifications/inbox?${params}`);
      setInbox(data.receipts || []);
      setUnreadCount(data.unread_count || 0);
      setInboxTotal(data.pagination?.total || 0);
      setInboxPages(data.pagination?.pages || 1);
    } catch (e) {
      console.warn('Failed to load inbox:', e);
    }
    setLoadingInbox(false);
  }, [inboxPage]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({ page: String(historyPage), limit: '20' });
      const { data } = await api.get(`/notifications?${params}`);
      setHistory(data.notifications || []);
      setHistoryTotal(data.pagination?.total || 0);
      setHistoryPages(data.pagination?.pages || 1);
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    setLoadingHistory(false);
  }, [historyPage]);

  useEffect(() => { if (isAdmin) { loadHistory(); } }, [loadHistory, isAdmin]);
  useEffect(() => { loadInbox(); }, [loadInbox]);

  // Load users for target selection
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/students?limit=500').then(r => setStudents(r.data.students || [])).catch(() => {});
    api.get('/teachers?limit=200').then(r => setTeachers(r.data.teachers || [])).catch(() => {});
    api.get('/parents?limit=500').then(r => setParents(r.data.parents || [])).catch(() => {});
  }, [isAdmin]);

  // Mark as read
  const markRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/mark-read/${notificationId}`);
      loadInbox();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      loadInbox();
      showToast('All notifications marked as read', 'success');
    } catch {}
  };

  // Send notification
  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) return setFormError('Title is required');
    if (!form.body.trim()) return setFormError('Body is required');

    setSending(true);
    try {
      await api.post('/notifications/send', {
        ...form,
        target_user_ids: form.audience === 'specific' ? selectedTargets : [],
      });
      showToast('Notification sent successfully', 'success');
      setForm({ title: '', body: '', audience: 'all', type: 'information', priority: 'normal', target_user_ids: [], link_url: '' });
      setSelectedTargets([]);
      if (isAdmin) loadHistory();
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Failed to send');
    }
    setSending(false);
  };

  // Delete notification
  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      showToast('Notification deleted', 'success');
      loadHistory();
    } catch {}
  };

  // Filter target users
  const filterTargets = () => {
    const search = targetSearch.toLowerCase();
    const all = [
      ...students.map((s: any) => ({ id: s.id, name: s.name, label: `${s.name} (${s.admission_no || 'Student'})` })),
      ...teachers.map((t: any) => ({ id: t.id, name: t.name, label: `${t.name} (Teacher)` })),
      ...parents.map((p: any) => ({ id: p.id, name: p.name, label: `${p.name} (Parent)` })),
    ];
    if (!search) return all.slice(0, 50);
    return all.filter(t => t.name.toLowerCase().includes(search) || t.label.toLowerCase().includes(search)).slice(0, 50);
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const TypeIcon = (type: string) => {
    const Icon = typeIcons[type] || Megaphone;
    return <Icon className="w-4 h-4" />;
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {toast && <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
          <p className="text-sm text-navy-500 mt-1">
            {isAdmin ? 'Send and manage notifications' : 'Your notification inbox'}
            {unreadCount > 0 && <span className="ml-2 text-brand font-semibold">({unreadCount} unread)</span>}
          </p>
        </div>
        {!isAdmin && unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-outline">
            <CheckCircle className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-50 rounded-2xl p-1 w-fit">
        {[
          { key: 'send', label: 'Send', icon: Send },
          { key: 'history', label: 'History', icon: History },
          { key: 'inbox', label: 'My Inbox', icon: Inbox },
        ].filter(tab => tab.key === 'inbox' || isAdmin).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Send Notification Form */}
      {(activeTab === 'send' && isAdmin) && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-brand" /> Send Notification
          </h2>
          <form onSubmit={sendNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Exam Schedule for Class 10" required />
              </div>
              <div className="md:col-span-2">
                <label className="label">Message *</label>
                <textarea className="input" rows={4} value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                  placeholder="Enter notification content..." required />
              </div>
              <div>
                <label className="label">Audience</label>
                <select className="input" value={form.audience} onChange={e => setForm({...form, audience: e.target.value as any})}>
                  <option value="all">Everyone</option>
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="parents">Parents</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                  {notifTypes.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}>
                  {priorities.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Link URL (optional)</label>
                <input className="input" value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})}
                  placeholder="https://..." />
              </div>
            </div>

            {/* Specific user selection */}
            {form.audience === 'specific' && (
              <div>
                <label className="label">Select Recipients ({selectedTargets.length} selected)</label>
                <input className="input mb-2" placeholder="Search users..." value={targetSearch}
                  onChange={e => setTargetSearch(e.target.value)} />
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {filterTargets().map(t => (
                    <label key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedTargets.includes(t.id)}
                        onChange={() => toggleTarget(t.id)} className="rounded border-slate-300" />
                      <span className="font-medium">{t.name}</span>
                      <span className="text-slate-400 text-xs">{t.label.split('(')[1]?.replace(')', '') || ''}</span>
                    </label>
                  ))}
                  {filterTargets().length === 0 && (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">No users found</div>
                  )}
                </div>
              </div>
            )}

            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</div>}

            <button className="btn" disabled={sending}>
              {sending ? 'Sending...' : `Send to ${form.audience === 'all' ? 'Everyone' : form.audience === 'specific' ? `${selectedTargets.length} Users` : form.audience}`}
            </button>
          </form>
        </div>
      )}

      {/* History (Admin) */}
      {(activeTab === 'history' && isAdmin) && (
        <div className="card p-0 overflow-hidden">
          {loadingHistory ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((n: any) => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                          {n.type?.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          n.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          n.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          n.priority === 'low' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                        }`}>{n.priority}</span>
                        <span className="text-xs text-slate-400">
                          To: {n.audience === 'all' ? 'Everyone' : n.audience}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800">{n.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.body}</p>
                      <div className="text-xs text-slate-400 mt-2">
                        Sent by {n.sender?.name || 'Unknown'} · {new Date(n.sent_at || n.created_at).toLocaleString()}
                        {n.read_percentage !== undefined && ` · ${n.read_receipts}/${n.total_receipts} read (${n.read_percentage}%)`}
                      </div>
                    </div>
                    <button onClick={() => deleteNotif(n.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/80">
            <span className="text-xs text-navy-500">{historyTotal} total</span>
            <div className="flex items-center gap-1">
              <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">« Prev</button>
              <span className="px-3 py-1 text-xs text-navy-600 font-medium">Page {historyPage} of {historyPages}</span>
              <button disabled={historyPage >= historyPages} onClick={() => setHistoryPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">Next »</button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox (all users) */}
      {activeTab === 'inbox' && (
        <div className="card p-0 overflow-hidden">
          {loadingInbox ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-navy-300" />
              </div>
              <p className="text-navy-500 font-medium">No notifications yet</p>
              <p className="text-sm text-navy-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {inbox.map((r: any) => {
                const n = r.notification;
                if (!n) return null;
                return (
                  <div key={r.id} className={`p-4 hover:bg-navy-50/50 transition ${!r.is_read ? 'bg-brand-50/30' : ''}`}
                    onClick={() => { if (!r.is_read) markRead(n.id); }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeColors[n.type] || 'bg-slate-100'}`}>
                        {TypeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${!r.is_read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</h3>
                          {!r.is_read && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            n.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                            n.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>{n.priority}</span>
                          <span>{n.sender?.name ? `by ${n.sender.name}` : ''}</span>
                          <span>{new Date(n.sent_at || n.created_at).toLocaleDateString()}</span>
                          {r.is_read && <span className="text-slate-300">· Read</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/80">
            <span className="text-xs text-navy-500">{inboxTotal} notification{inboxTotal !== 1 && 's'}</span>
            <div className="flex items-center gap-1">
              <button disabled={inboxPage <= 1} onClick={() => setInboxPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">« Prev</button>
              <span className="px-3 py-1 text-xs text-navy-600 font-medium">Page {inboxPage} of {inboxPages}</span>
              <button disabled={inboxPage >= inboxPages} onClick={() => setInboxPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-xl hover:bg-navy-100 disabled:opacity-30 transition">Next »</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
