'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.must_change_password) router.replace('/change-password');
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-10 text-center">Loading…</div>;

  const nav = [
    { href: '/dashboard', label: 'Home', roles: ['admin', 'teacher', 'student'] },
    { href: '/dashboard/users', label: 'Users', roles: ['admin'] },
    { href: '/dashboard/subjects', label: 'Subjects', roles: ['admin'] },
    { href: '/dashboard/batches', label: 'Batches', roles: ['admin', 'teacher'] },
    { href: '/dashboard/announcements', label: 'Announcements', roles: ['admin', 'teacher', 'student'] },
    { href: '/dashboard/students', label: 'Students', roles: ['admin'] },
    { href: '/dashboard/profile', label: 'My profile', roles: ['student'] },
    { href: '/dashboard/my', label: 'My records', roles: ['student'] },
  ].filter(n => n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="font-bold text-brand">Dwaraka Academy</div>
          <div className="text-xs text-slate-500 mt-1">{user.name} · {user.role}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="m-3 btn-outline">Sign out</button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
