'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentForm from '@/components/StudentForm';
import { api } from '@/lib/api';
export default function NewStudentPage() { const [batches, setBatches] = useState<any[]>([]); const [message, setMessage] = useState(''); const router = useRouter(); useEffect(() => { api.get('/batches').then(r => setBatches(r.data)); }, []); return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Add student</h1><p className="text-sm text-slate-500">A linked student login account will be created.</p></div>{message && <div className="card text-green-700">{message}</div>}<StudentForm batches={batches} onSaved={(student, password) => { setMessage(`Student created. Temporary password: ${password}`); setTimeout(() => router.push(`/dashboard/students/${student.id}`), 1200); }} /></div>; }
