'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function BatchDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const batchId = params.id;

  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrollId, setEnrollId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [markForm, setMarkForm] = useState({ student_id: '', exam_name: '', score: 0, max_score: 100, exam_date: '' });

  const loadStudents = () => api.get(`/batches/${batchId}/students`).then(r => setStudents(r.data));
  const loadNotes = () => api.get(`/notes/batch/${batchId}`).then(r => setNotes(r.data));
  const loadMarks = () => api.get(`/marks/batch/${batchId}`).then(r => setMarks(r.data));

  useEffect(() => {
    loadStudents(); loadNotes(); loadMarks();
    if (user?.role === 'admin') api.get('/users?role=student').then(r => setAllStudents(r.data));
  }, [batchId, user]);

  const enroll = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/enrollments', { student_id: enrollId, batch_id: batchId });
    setEnrollId(''); loadStudents();
  };

  const saveAttendance = async () => {
    const entries = students.map(s => ({
      student_id: s.id, status: (statuses[s.id] || 'present') as any,
    }));
    await api.post('/attendance', { batch_id: batchId, date, entries });
    alert('Saved');
  };

  const uploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file); fd.append('title', noteTitle); fd.append('batch_id', batchId);
    await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setNoteTitle(''); setFile(null); loadNotes();
  };

  const addMark = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/marks', { ...markForm, batch_id: batchId, score: Number(markForm.score), max_score: Number(markForm.max_score) });
    setMarkForm({ student_id: '', exam_name: '', score: 0, max_score: 100, exam_date: '' });
    loadMarks();
  };

  const downloadNote = async (id: string, name: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/notes/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Enroll student</h2>
          <form onSubmit={enroll} className="flex gap-3">
            <select className="input" value={enrollId} onChange={e => setEnrollId(e.target.value)} required>
              <option value="">Student…</option>
              {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
            <button className="btn">Enroll</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Attendance</h2>
        <div className="flex items-center gap-3 mb-3">
          <input className="input max-w-xs" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn" onClick={saveAttendance}>Save</button>
        </div>
        <table className="table">
          <thead><tr><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <select className="input max-w-[160px]" value={statuses[s.id] || 'present'}
                    onChange={e => setStatuses({ ...statuses, [s.id]: e.target.value })}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Marks</h2>
        <form onSubmit={addMark} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <select className="input" value={markForm.student_id} onChange={e => setMarkForm({ ...markForm, student_id: e.target.value })} required>
            <option value="">Student…</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input" placeholder="Exam" value={markForm.exam_name} onChange={e => setMarkForm({ ...markForm, exam_name: e.target.value })} required />
          <input className="input" type="number" placeholder="Score" value={markForm.score} onChange={e => setMarkForm({ ...markForm, score: Number(e.target.value) })} required />
          <input className="input" type="number" placeholder="Max" value={markForm.max_score} onChange={e => setMarkForm({ ...markForm, max_score: Number(e.target.value) })} required />
          <input className="input" type="date" value={markForm.exam_date} onChange={e => setMarkForm({ ...markForm, exam_date: e.target.value })} />
          <button className="btn">Add</button>
        </form>
        <table className="table">
          <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Date</th></tr></thead>
          <tbody>
            {marks.map(m => (
              <tr key={m.id}>
                <td>{m.student?.name}</td><td>{m.exam_name}</td>
                <td>{m.score} / {m.max_score}</td><td>{m.exam_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Notes / Materials</h2>
        <form onSubmit={uploadNote} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input className="input" placeholder="Title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} required />
          <input className="input" type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
          <button className="btn">Upload</button>
        </form>
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="flex items-center justify-between border-b py-2">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-slate-500">{n.original_name} · {(n.size_bytes / 1024).toFixed(1)} KB</div>
              </div>
              <button className="btn-outline" onClick={() => downloadNote(n.id, n.original_name)}>Download</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
