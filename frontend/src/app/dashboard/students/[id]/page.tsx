'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/students/${params.id}`).then(r => {
      setStudent(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="p-10 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
      <p className="text-sm text-slate-500 mt-3">Loading profile…</p>
    </div>
  );

  if (!student) return (
    <div className="p-10 text-center">
      <p className="text-slate-500">Student not found</p>
      <button onClick={() => router.back()} className="btn-outline mt-4">Go back</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand">{student.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-sm text-slate-500">{student.admission_no || 'No admission no'} · {student.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>{student.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Roll No</dt><dd className="text-sm font-medium">{student.roll_no || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Class</dt><dd className="text-sm font-medium">{student.current_class ? `Class ${student.current_class}${student.section ? `-${student.section}` : ''}` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Date of Birth</dt><dd className="text-sm font-medium">{student.date_of_birth || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Phone</dt><dd className="text-sm font-medium">{student.phone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Address</dt><dd className="text-sm font-medium">{student.address || '—'}</dd></div>
          </dl>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-4">Guardian Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Guardian Name</dt><dd className="text-sm font-medium">{student.guardian_name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-slate-500">Guardian Phone</dt><dd className="text-sm font-medium">{student.guardian_phone || '—'}</dd></div>
          </dl>
        </div>
      </div>

      {/* Attendance Summary */}
      {student.attendance_stats && (
        <div className="card">
          <h2 className="font-semibold mb-4">Attendance Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Present', count: student.attendance_stats.present || 0, color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Absent', count: student.attendance_stats.absent || 0, color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Late', count: student.attendance_stats.late || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(s => (
              <div key={s.label} className={`border rounded-lg p-4 text-center ${s.color}`}>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Batches */}
      {student.enrollments?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Enrolled Batches ({student.enrollments.length})</h2>
          <div className="space-y-3">
            {student.enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div>
                  <div className="font-medium text-sm">{e.Batch?.name}</div>
                  <div className="text-xs text-slate-500">{e.Batch?.Subject?.name}</div>
                </div>
                <span className="text-xs text-slate-400">{e.Batch?.schedule || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Marks */}
      {student.recent_marks?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Marks</h2>
          <table className="table">
            <thead><tr><th>Exam</th><th>Score</th><th>Percentage</th><th>Batch</th><th>Date</th></tr></thead>
            <tbody>
              {student.recent_marks.map((m: any) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.exam_name}</td>
                  <td>{m.score} / {m.max_score}</td>
                  <td>{((m.score / m.max_score) * 100).toFixed(1)}%</td>
                  <td className="text-slate-500">{m.Batch?.name}</td>
                  <td className="text-slate-500">{m.exam_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Linked Parents */}
      {student.linked_parents?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Linked Parents</h2>
          {student.linked_parents.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-700">{p.parent?.name?.charAt(0)}</span>
              </div>
              <div>
                <div className="font-medium text-sm">{p.parent?.name}</div>
                <div className="text-xs text-slate-500">{p.parent?.email} · {p.parent?.phone || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
