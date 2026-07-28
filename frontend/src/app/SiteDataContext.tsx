'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────
export interface SiteData {
  hero?: Record<string, any>;
  about?: Record<string, any>;
  contact?: Record<string, any>;
  settings?: Record<string, any>;
  courses?: any[];
  faculty?: any[];
  'student-results'?: any[];
  testimonials?: any[];
  gallery?: any[];
  downloads?: any[];
  timeline?: any[];
  'why-us'?: any[];
}

interface SiteDataContextValue {
  data: SiteData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SiteDataContext = createContext<SiteDataContextValue>({
  data: {},
  loading: true,
  error: null,
  refetch: () => {},
});

export function useSiteData() {
  return useContext(SiteDataContext);
}

// ── Sections that should remain as arrays ────────────────────────────────
const ARRAY_SECTIONS = new Set([
  'courses', 'faculty', 'student-results', 'testimonials',
  'gallery', 'downloads', 'timeline', 'why-us',
]);

/**
 * Group items by section and merge singleton sections into a single object.
 */
function groupBySection(items: any[]): SiteData {
  const grouped: Record<string, any[]> = {};
  for (const item of items) {
    if (!item.section) continue;
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  const result: Record<string, any> = {};
  for (const [section, sectionItems] of Object.entries(grouped)) {
    if (ARRAY_SECTIONS.has(section)) {
      // Return array of data objects
      result[section] = sectionItems
        .filter(i => i.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(i => (typeof i.data === 'object' && i.data !== null ? i.data : {}));
    } else {
      // Singleton sections — merge all item data into one object
      const merged: Record<string, any> = {};
      for (const item of sectionItems) {
        if (typeof item.data === 'object' && item.data !== null) {
          Object.assign(merged, item.data);
        }
      }
      result[section] = merged;
    }
  }
  return result as SiteData;
}

// ── Module-level cache (single source of truth) ──────────────────────────
let cachedData: SiteData | null = null;
let cacheTimestamp = 0;
let inflightPromise: Promise<SiteData> | null = null;
const CACHE_TTL = 60_000;

async function fetchAllContent(): Promise<SiteData> {
  // Return cached data if fresh
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  // Dedup in-flight requests — return the same promise
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      // Single batch request to get all content at once
      const { data } = await api.get('/content?limit=500');
      const grouped = groupBySection(data?.items || []);
      cachedData = grouped;
      cacheTimestamp = Date.now();
      return grouped;
    } catch (e: any) {
      // On error, keep stale cache if available
      if (cachedData) return cachedData;
      throw e;
    }
  })();

  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────
export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SiteData>(cachedData || {});
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllContent();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load site content');
        // Keep stale data if available
        if (cachedData) setData(cachedData);
      }
    }
    if (mountedRef.current) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return (
    <SiteDataContext.Provider value={{ data, loading, error, refetch: load }}>
      {children}
    </SiteDataContext.Provider>
  );
}
