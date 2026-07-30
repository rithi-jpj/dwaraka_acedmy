'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { Eye, Edit3, Key, ToggleLeft, Trash2, Copy, Printer, User, CheckCircle, AlertTriangle } from 'lucide-react';

type U = {
  id: string; name: string; email: string; phone: string | null;
  role: string; is_active: boolean; must_change_password: boolean;
  created_at: string; admission_no: string | null;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'student' });

  // Credential modal (one-time after create)
  const [credentialData, setCredentialData] = useState<{ name: string; username: string; tempPassword: string; role: string } | null>(null);

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detail modal
  const [detailUser, setDetailUser] = useState<U | null>(null);

  // Edit modal
  const [editUser, setEditUser] = useState<U | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  // Reset password modal
  const [resetData, setResetData] = useState<{ name: string; pwd: string } | null>(null);

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<U | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    setLoading(true);
    const params = filterRole ? `?role=${filterRole}` : '';
    api.get(`/users${params}`).then(r => {
      setUsers(Array.isArray(r.data) ? r.data : (r.data.users || []));
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filterRole]);

  // Auto-refresh via Socket.IO when any user changes
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onRefresh = () => load();
    s.on('analytics:refresh', onRefresh);
    return () => { s.off('analytics:refresh', onRefresh); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users', form);
      const username = data.user.role === 'student' ? (data.user.admission_no || data.user.email) : data.user.email;
      setCredentialData({ name: data.user.name, username, tempPassword: data.tempPassword, role: data.user.role });
      setForm({ name: '', email: '', phone: '', role: 'student' });
      setShowForm(false);
      load();
      showToast('User created successfully', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to create user', 'error');
    }
  };

  const openEdit = (u: U) => {
    setEditUser(u);
    setEditForm({ name: u.name, phone: u.phone || '' });
    setOpenMenuId(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.patch(`/users/${editUser.id}`, editForm);
      showToast('User updated', 'success');
      setEditUser(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Update failed', 'error');
    }
  };

  const openDetail = (u: U) => {
    setDetailUser(u);
    setOpenMenuId(null);
  };

  const openProfile = (u: U) => {
    setOpenMenuId(null);
    if (u.role === 'student') {
      router.push('/dashboard/students');
    } else if (u.role === 'teacher') {
      router.push('/dashboard/teachers');
    }
  };

  const reset = async (u: U) => {
    setOpenMenuId(null);
    try {
      const { data } = await api.post(`/users/${u.id}/reset-password`);
      setResetData({ name: u.name, pwd: data.tempPassword });
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Reset failed', 'error');
    }
  };

  const toggleActive = async (u: U) => {
    setOpenMenuId(null);
    try {
      await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
      showToast(u.is_active ? 'User deactivated' : 'User activated', 'success');
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/users/${deleteUser.id}`);
      showToast(`User ${deleteUser.name} deleted permanently`, 'success');
      setDeleteUser(null);
      setOpenMenuId(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Delete failed', 'error');
      setDeleteUser(null);
    }
  };

  const copyCredentials = () => {
    if (!credentialData) return;
    const text = `Username: ${credentialData.username}\nPassword: ${credentialData.tempPassword}`;
    navigator.clipboard.writeText(text);
    showToast('Credentials copied', 'success');
  };

  const printCredentials = () => {
    if (!credentialData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Student Credentials</title><style>
      body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      p { color: #555; margin-bottom: 24px; }
      .box { border: 2px dashed #333; padding: 20px; display: inline-block; text-align: left; }
      .label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
      .value { font-size: 20px; font-weight: bold; margin-bottom: 16px; font-family: monospace; }
    </style></head><body>
      <h1>Dwaraka Academy</h1>
      <p>Student account credentials for <strong>${credentialData.name}</strong></p>
      <div class="box">
        <div class="label">Username</div>
        <div class="value">${credentialData.username}</div>
        <div class="label">Temporary Password</div>
        <div class="value">${credentialData.tempPassword}</div>
      </div>
      <p style="margin-top:32px;font-size:13px;color:#999;">Please change your password after first login.</p>
      <script>window.print();</script>
    </body></html>`);
    win.document.close();
  };

  const getActions = (u: U) => {
    const items: { label: string; icon: React.ReactNode; onClick: () => void; hidden?: boolean }[] = [
      { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: () => openDetail(u) },
      { label: 'Edit', icon: <Edit3 className="w-4 h-4" />, onClick: () => openEdit(u) },
      {
        label: u.role === 'student' ? 'Open Student Profile' : u.role === 'teacher' ? 'Open Teacher Profile' : '',
        icon: <User className="w-4 h-4" />,
        onClick: () => openProfile(u),
        hidden: u.role === 'admin',
      },
      { label: 'Reset Password', icon: <Key className="w-4 h-4" />, onClick: () => reset(u) },
      {
        label: u.is_active ? 'Deactivate' : 'Activate',
        icon: <ToggleLeft className="w-4 h-4" />,
        onClick: () => toggleActive(u),
      },
      { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => { setDeleteUser(u); setOpenMenuId(null); } },
    ];
    return items.filter(i => !i.hidden);
  };

  const roleBadge = (role: string) => {
    const cls: Record<string, string> = {
      admin: 'badge-purple',
      teacher: 'badge-blue',
      student: 'badge-green',
      parent: 'badge-amber',
    };
    return <span className={cls[role] || 'badge-slate'}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all users across roles</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setCredentialData(null); }}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition text-sm font-medium">
          {showForm ? '✕ Close' : '+ Add User'}
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="card border border-brand/20">
          <h2 className="font-semibold mb-4">Add New User</h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="input" placeholder="Full Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="Email" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="input" placeholder="Phone" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
            <select className="input" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn">Create</button>
          </form>
        </div>
      )}

      {/* Role Filter */}
      <div className="flex items-center gap-3">
        <select className="input max-w-[180px]" value={filterRole}
          onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
        <span className="text-sm text-slate-500">{users.length} user{users.length !== 1 && 's'}</span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-slate-500 font-medium">No users found</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add User" to create one</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td>
                      <div className="font-medium text-sm">{u.name}</div>
                      {u.admission_no && (
                        <div className="text-xs text-slate-400">{u.admission_no}</div>
                      )}
                    </td>
                    <td className="text-sm">{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="relative">
                      <div className="flex justify-center">
                        <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {openMenuId === u.id && (
                        <div ref={menuRef}
                          className="absolute right-0 top-full mt-1 z-40 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 overflow-hidden">
                          {getActions(u).map((action, i) => (
                            <button key={i} onClick={action.onClick}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                              <span className="text-slate-400 flex-shrink-0">{action.icon}</span>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credential Modal (one-time after create) */}
      {credentialData && (
        <div className="modal-overlay" onClick={() => setCredentialData(null)}>
          <div className="modal-content p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">{credentialData.role === 'student' ? 'Student Created Successfully' : 'User Created Successfully'}</h3>
            <p className="text-sm text-slate-500 mb-5">{credentialData.role === 'student' ? 'Please save these credentials. The password will never be shown again.' : 'Share these credentials with the user. The password will never be shown again.'}</p>
            <div className="bg-slate-50 rounded-lg p-4 text-left mb-5 space-y-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Username</div>
                <div className="text-base font-mono font-bold text-slate-800 mt-0.5">{credentialData.username}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Temporary Password</div>
                <div className="text-base font-mono font-bold text-brand mt-0.5">{credentialData.tempPassword}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={copyCredentials}
                className="btn w-full">
                <Copy className="w-4 h-4" />
                Copy Credentials
              </button>
              <button onClick={printCredentials}
                className="btn-outline w-full">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button onClick={() => setCredentialData(null)}
                className="text-sm text-slate-500 hover:text-slate-700 pt-1">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{detailUser.name}</h2>
                  <p className="text-sm text-slate-500">{detailUser.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {roleBadge(detailUser.role)}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{detailUser.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Phone</div>
                  <div className="text-sm font-medium mt-0.5">{detailUser.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Username</div>
                  <div className="text-sm font-medium mt-0.5">{detailUser.admission_no || detailUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Must Change Password</div>
                  <div className="text-sm font-medium mt-0.5">{detailUser.must_change_password ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Created</div>
                  <div className="text-sm font-medium mt-0.5">{new Date(detailUser.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {detailUser.role === 'student' && (
                  <button onClick={() => { setDetailUser(null); router.push('/dashboard/students'); }}
                    className="btn-outline text-sm flex-1">Open Student Profile</button>
                )}
                {detailUser.role === 'teacher' && (
                  <button onClick={() => { setDetailUser(null); router.push('/dashboard/teachers'); }}
                    className="btn-outline text-sm flex-1">Open Teacher Profile</button>
                )}
                <button onClick={() => setDetailUser(null)}
                  className="btn-outline text-sm flex-1">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-1">Edit User</h3>
            <p className="text-sm text-slate-500 mb-4">{editUser.name} · {editUser.email}</p>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn flex-1">Save</button>
                <button type="button" onClick={() => setEditUser(null)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetData && (
        <div className="modal-overlay" onClick={() => setResetData(null)}>
          <div className="modal-content p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">Password Reset</h3>
            <p className="text-sm text-slate-500 mb-5">Share this temporary password with <strong>{resetData.name}</strong>. It will be shown only once.</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-5">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">New Temporary Password</div>
              <div className="text-xl font-mono font-bold text-brand">{resetData.pwd}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(resetData.pwd); }}
                className="btn flex-1">Copy Password</button>
              <button onClick={() => setResetData(null)}
                className="btn-outline flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteUser && (
        <div className="modal-overlay" onClick={() => setDeleteUser(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-center">Confirm Delete</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Are you sure you want to permanently delete <strong>{deleteUser.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex-1 transition">Delete Permanently</button>
              <button onClick={() => setDeleteUser(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
