'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.must_change_password) router.replace('/change-password');
    else router.replace('/dashboard');
  }, [user, loading, router]);
  return <div className="p-10 text-center text-slate-500">Loading…</div>;
}
