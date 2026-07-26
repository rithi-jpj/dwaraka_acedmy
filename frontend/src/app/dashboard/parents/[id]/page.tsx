'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ParentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [parent, setParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/parents/${params.id}`).then(r => {
      setParent(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="p-10 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
      <p className="text-sm text-slate-500 mt-3">Loading profile…</p>
    </div>
  );

  if (!parent) return (
    <div className="p-10 text-center">
      <p className="text-slate-500">Parent not found</p>
      <button onClick={() => router.back()} className="btn-outline mt-4">Go back</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand">{parent.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{parent.name}</h1>
              <p className="text-sm text-slate-500">{parent.email} · {parent.phone || 'No phone'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            parent.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>{parent.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Linked Students */}
      <div className="card">
        <h2 className="font-semibold mb-4">Linked Students ({parent.linked_students?.length || 0})</h2>
        {(!parent.linked_students || parent.linked_students.length === 0) ? (
          <p className="text-sm text-slate-500 text-center py-8">No students linked to this parent account.</p>
        ) : (
          <div className="space-y-6">
            {parent.linked_students.map((ls: any) => (
              <div key={ls.student?.id || ls.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">{ls.student?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{ls.student?.name}</div>
                      <div className="text-xs text-slate-500">
                        {ls.student?.admission_no || 'No admission'} · Class {ls.student?.current_class || '—'} · {ls.relationship}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/dashboard/students/${ls.student?.id}`)}
                    className="btn-outline text-xs">View Student</button>
                </div>

                {/* Attendance Stats */}
                {ls.attendance_stats && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase mb-2">Attendance</div>
                    <div className="flex gap-3">
                      {[
                        { label: 'Present', count: ls.attendance_stats.present || 0, color: 'bg-green-50 text-green-700' },
                        { label: 'Absent', count: ls.attendance_stats.absent || 0, color: 'bg-red-50 text-red-700' },
                        { label: 'Late', count: ls.attendance_stats.late || 0, color: 'bg-amber-50 text-amber-700' },
                      ].map(s => (
                        <div key={s.label} className={`px-3 py-2 rounded-lg text-center min-w-[70px] ${s.color}`}>
                          <div className="text-lg font-bold">{s.count}</div>
                          <div className="text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enrolled Batches */}
                {ls.enrollments?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase mb-2">Enrolled Batches</div>
                    <div className="flex flex-wrap gap-2">
                      {ls.enrollments.map((e: any) => (
                        <span key={e.id} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium">
                          {e.Batch?.name} <span className="text-slate-400">({e.Batch?.Subject?.name})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Marks */}
                {ls.recent_marks?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase mb-2">Recent Marks</div>
                    <table className="table text-sm">
                      <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th></tr></thead>
                      <tbody>
                        {ls.recent_marks.map((m: any) => (
                          <tr key={m.id}>
                            <td className="font-medium">{m.exam_name}</td>
                            <td>{m.score} / {m.max_score}</td>
                            <td>{((m.score / m.max_score) * 100).toFixed(1)}%</td>
                            <td className="text-slate-500">{m.Batch?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
