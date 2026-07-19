'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function StudentPhoto({ url, name }: { url: string; name: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => { let objectUrl = ''; api.get(url, { responseType: 'blob' }).then(r => { objectUrl = URL.createObjectURL(r.data); setSrc(objectUrl); }).catch(() => setSrc('')); return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [url]);
  return src ? <img src={src} alt={`${name}'s photo`} className="h-24 w-24 rounded-lg object-cover border border-slate-200" /> : <div className="h-24 w-24 rounded-lg bg-slate-100 text-slate-400 grid place-items-center text-xs">No photo</div>;
}
