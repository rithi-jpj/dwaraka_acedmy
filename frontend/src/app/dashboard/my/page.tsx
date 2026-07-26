'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function MyRecordsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [marks, setMarks] = useState<any>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([
        api.get('/my/profile'),
        api.get('/my/attendance?limit=5'),
        api.get('/my/marks'),
      ]).then(([p, a, m]) => {
        setProfile(p.data);
        setAttendance(a.data);
        setMarks(m.data);
      }).finally(() => setLoading(false));
    } else if (user?.role === 'parent') {
      api.get('/my/parent-dashboard').then(r => {
        setParentData(r.data);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return (
    <div className="p-10 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
      <p className="text-sm text-slate-500 mt-3">Loading your dashboard…</p>
    </div>
  );

  if (!user) return null;

  // PARENT DASHBOARD
  if (user.role === 'parent') {
    if (!parentData) return <div className="card p-6 text-center text-slate-500">Could not load parent data.</div>;
    return (
      <div className="space-y-6">
        <div className="card bg-gradient-to-r from-brand/5 to-transparent border-brand/10">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome, {user.name} · {parentData.linked_students?.length || 0} linked student(s)
          </p>
        </div>

        {/* Linked Students */}
        {(!parentData.linked_students || parentData.linked_students.length === 0) ? (
          <div className="card text-center py-12">
            <p className="text-slate-500">No students are linked to your account yet.</p>
          </div>
        ) : (
          parentData.linked_students.map((ls: any) => (
            <div key={ls.student?.id || ls.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{ls.student?.name}</h2>
                  <p className="text-xs text-slate-500">
                    {ls.student?.admission_no} · Class {ls.student?.current_class}{ls.student?.section ? `-${ls.student.section}` : ''} · {ls.relationship}
                  </p>
                </div>
              </div>

              {/* Attendance Stats */}
              {ls.attendance && (
                <div className="mb-4">
                  <div className="text-xs text-slate-500 uppercase mb-2">Attendance</div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex gap-2">
                      {[
                        { label: 'Present', count: ls.attendance.stats?.present || 0, color: 'bg-green-50 text-green-700' },
                        { label: 'Absent', count: ls.attendance.stats?.absent || 0, color: 'bg-red-50 text-red-700' },
                        { label: 'Late', count: ls.attendance.stats?.late || 0, color: 'bg-amber-50 text-amber-700' },
                      ].map(s => (
                        <span key={s.label} className={`px-2 py-1 rounded text-xs font-medium ${s.color}`}>
                          {s.count} {s.label}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {ls.attendance.percentage || 0}% attendance
                    </span>
                  </div>
                  {ls.attendance.records?.length > 0 && (
                    <table className="table text-xs">
                      <thead><tr><th>Date</th><th>Status</th><th>Batch</th></tr></thead>
                      <tbody>
                        {ls.attendance.records.map((a: any) => (
                          <tr key={a.id}>
                            <td>{a.date}</td>
                            <td><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              a.status === 'present' ? 'bg-green-100 text-green-700' :
                              a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{a.status}</span></td>
                            <td className="text-slate-500">{a.Batch?.name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Marks */}
              {ls.marks?.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-2">Recent Marks</div>
                  <table className="table text-xs">
                    <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th></tr></thead>
                    <tbody>
                      {ls.marks.map((m: any) => (
                        <tr key={m.id}>
                          <td className="font-medium">{m.exam_name}</td>
                          <td>{m.score}/{m.max_score}</td>
                          <td>{((m.score / m.max_score) * 100).toFixed(1)}%</td>
                          <td className="text-slate-500">{m.Batch?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Batches */}
              {ls.enrollments?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 uppercase mb-1">Enrolled Batches</div>
                  <div className="flex flex-wrap gap-1">
                    {ls.enrollments.map((e: any) => (
                      <span key={e.id} className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {e.Batch?.name} ({e.Batch?.Subject?.name})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Announcements */}
        {parentData.announcements?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3">Latest Announcements</h2>
            {parentData.announcements.slice(0, 5).map((a: any) => (
              <div key={a.id} className="border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-xs text-slate-600 whitespace-pre-wrap">{a.body}</div>
                <div className="text-xs text-slate-400 mt-1">by {a.author?.name} · {new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (user.role !== 'student') {
    return <div className="card p-6 text-center text-slate-500">This page is for students and parents only.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="card bg-gradient-to-r from-brand/5 to-transparent border-brand/10">
        <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
        <p className="text-sm text-slate-500 mt-1">
          {profile?.admission_no && <span>Admission No: {profile.admission_no} · </span>}
          {profile?.current_class && <span>Class {profile.current_class}{profile?.section ? `-${profile.section}` : ''} · </span>}
          {profile?.enrollments?.length > 0 && <span>{profile.enrollments.length} enrolled batch(es)</span>}
        </p>
      </div>

      {/* Profile quick info */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-xs text-slate-500 uppercase mb-1">Guardian</div>
            <div className="font-medium">{profile.guardian_name || 'Not set'}</div>
            {profile.guardian_phone && <div className="text-xs text-slate-400">{profile.guardian_phone}</div>}
          </div>
          <div className="card">
            <div className="text-xs text-slate-500 uppercase mb-1">Roll No</div>
            <div className="font-medium">{profile.roll_no || 'Not assigned'}</div>
          </div>
          <div className="card">
            <div className="text-xs text-slate-500 uppercase mb-1">Date of Birth</div>
            <div className="font-medium">{profile.date_of_birth || 'Not set'}</div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      {attendance && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Attendance</h2>
          </div>
          {attendance.stats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Present', count: attendance.stats.present || 0, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Absent', count: attendance.stats.absent || 0, color: 'bg-red-50 text-red-700 border-red-200' },
                { label: 'Late', count: attendance.stats.late || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map(s => (
                <div key={s.label} className={`border rounded-lg p-3 text-center ${s.color}`}>
                  <div className="text-xl font-bold">{s.count}</div>
                  <div className="text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {attendance.records?.length > 0 ? (
            <table className="table text-sm">
              <thead><tr><th>Date</th><th>Status</th><th>Batch</th></tr></thead>
              <tbody>
                {attendance.records.map((a: any) => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'present' ? 'bg-green-100 text-green-700' :
                        a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className="text-slate-500">{a.Batch?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No attendance records yet.</p>
          )}
        </div>
      )}

      {/* Marks Summary */}
      {marks && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Marks</h2>
          </div>
          {marks.stats && (
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center min-w-[100px]">
                  <div className="text-xl font-bold text-blue-700">{marks.stats.total_exams}</div>
                  <div className="text-xs text-blue-600">Total Exams</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center min-w-[100px]">
                  <div className="text-xl font-bold text-purple-700">{marks.stats.average_percentage}%</div>
                  <div className="text-xs text-purple-600">Average</div>
                </div>
              </div>
            </div>
          )}
          {marks.marks?.length > 0 ? (
            <table className="table text-sm">
              <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Batch</th><th>Date</th></tr></thead>
              <tbody>
                {marks.marks.slice(0, 10).map((m: any) => (
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
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No marks recorded yet.</p>
          )}

          {/* By Batch Breakdown */}
          {marks.by_batch && Object.keys(marks.by_batch).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">By Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(marks.by_batch).map(([batchName, batchMarks]: [string, any]) => {
                  const avg = (batchMarks as any[]).reduce((s, m) => s + (m.score / m.max_score) * 100, 0) / (batchMarks as any[]).length;
                  return (
                    <div key={batchName} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium">{batchName}</div>
                      <div className="text-xs text-slate-500">{(batchMarks as any[]).length} exam(s) · {avg.toFixed(1)}% avg</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrolled Batches */}
      {profile?.enrollments?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">My Batches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.enrollments.map((e: any) => (
              <div key={e.id} className="bg-slate-50 rounded-lg p-4">
                <div className="font-medium text-sm">{e.Batch?.name}</div>
                <div className="text-xs text-slate-500">{e.Batch?.Subject?.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Teacher: {e.Batch?.teacher?.name} · {e.Batch?.schedule || 'No schedule'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
