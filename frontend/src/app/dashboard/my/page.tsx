'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MyRecordsPage() {
  const [att, setAtt] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  useEffect(() => {
    api.get('/attendance/me').then(r => setAtt(r.data));
    api.get('/marks/me').then(r => setMarks(r.data));
  }, []);
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-4">My attendance</h2>
        <table className="table">
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>{att.map(a => <tr key={a.id}><td>{a.date}</td><td>{a.status}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">My marks</h2>
        <table className="table">
          <thead><tr><th>Exam</th><th>Score</th><th>Date</th></tr></thead>
          <tbody>{marks.map(m => <tr key={m.id}><td>{m.exam_name}</td><td>{m.score} / {m.max_score}</td><td>{m.exam_date || '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
