'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export type User = {
  id: string; name: string; email: string; phone?: string;
  role: 'admin' | 'teacher' | 'student';
  must_change_password: boolean; is_active: boolean;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user as User;
  };

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
