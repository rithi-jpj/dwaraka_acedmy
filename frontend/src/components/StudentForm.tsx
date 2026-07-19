'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Props = { student?: any; batches: any[]; onSaved: (student: any, temporaryPassword?: string) => void };
const fields = ['admission_number', 'roll_number', 'first_name', 'last_name', 'dob', 'blood_group', 'email', 'phone', 'parent_phone', 'class_id', 'address', 'city', 'state', 'country', 'pincode'];

export default function StudentForm({ student, batches, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, string>>({ gender: 'male', status: 'active', country: 'India', ...student });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const set = (name: string, value: string) => setForm(current => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (key !== 'photo' && key !== 'user' && value !== undefined && value !== null) data.append(key, String(value)); });
      if (file) data.append('photo', file);
      const response = student ? await api.put(`/students/${student.id}`, data) : await api.post('/students', data);
      onSaved(response.data.student, response.data.temporaryPassword);
    } catch (e: any) { setError(e?.response?.data?.error || e?.response?.data?.details?.[0]?.message || 'Unable to save student'); }
    finally { setSaving(false); }
  };
  const input = (name: string, label: string, type = 'text', required = false) => <div><label className="label">{label}</label><input className="input" type={type} value={form[name] || ''} onChange={e => set(name, e.target.value)} required={required} /></div>;
  return <form onSubmit={submit} className="space-y-6">
    <section className="card"><h2 className="font-semibold mb-4">Personal details</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {input('admission_number', 'Admission number', 'text', true)}{input('roll_number', 'Roll number')}{input('first_name', 'First name', 'text', true)}{input('last_name', 'Last name', 'text', true)}{input('dob', 'Date of birth', 'date', true)}
      <div><label className="label">Gender</label><select className="input" value={form.gender || 'male'} onChange={e => set('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>{input('blood_group', 'Blood group')}
      <div><label className="label">Photo</label><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} />{preview && <img src={preview} alt="Student photo preview" className="mt-2 h-20 w-20 rounded object-cover" />}</div>
    </div></section>
    <section className="card"><h2 className="font-semibold mb-4">Account and contact</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {!student && input('username', 'Username', 'text', true)}{student && input('username', 'Username')}{!student && input('temporary_password', 'Temporary password (optional)', 'password')}
      {input('email', 'Email', 'email', true)}{input('phone', 'Student phone', 'tel', true)}{input('parent_phone', 'Parent phone', 'tel')}
    </div></section>
    <section className="card"><h2 className="font-semibold mb-4">Academic details</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{input('class_id', 'Class', 'text', true)}<div><label className="label">Batch</label><select className="input" value={form.batch_id || ''} onChange={e => set('batch_id', e.target.value)}><option value="">No batch</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div></div></section>
    <section className="card"><h2 className="font-semibold mb-4">Address</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{input('address', 'Address')}{input('city', 'City')}{input('state', 'State')}{input('country', 'Country')}{input('pincode', 'Pincode')}</div></section>
    {student?.photo && <button type="button" className="btn-outline mr-3" onClick={async () => { await api.delete(`/students/${student.id}/photo`); window.location.reload(); }}>Remove current photo</button>}
    {error && <p className="text-sm text-red-600">{error}</p>}<button className="btn" disabled={saving}>{saving ? 'Saving…' : student ? 'Save changes' : 'Create student'}</button>
  </form>;
}
