import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MOCK_PACKAGES, MOCK_CATEGORIES } from '@/lib/mock-data';
import type { Package, Category, SortOption } from '@/types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UsePackagesOptions {
  categories?: string[];
  search?: string;
  sort?: SortOption;
  tag?: string;
}

const SORT_MAP: Record<SortOption, { column: string; ascending: boolean }> = {
  downloads: { column: 'weekly_downloads', ascending: false },
  stars: { column: 'github_stars', ascending: false },
  recent: { column: 'last_published_at', ascending: false },
  name: { column: 'name', ascending: true },
};

export function usePackages({ categories, search, sort = 'downloads', tag }: UsePackagesOptions = {}) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesKey = categories?.join(',') ?? '';

  const mockResult = useMemo(() => {
    if (!USE_MOCK) return null;
    let result = [...MOCK_PACKAGES];
    if (categories && categories.length > 0) result = result.filter(p => p.category?.slug != null && categories.includes(p.category.slug));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (tag) result = result.filter(p => p.tags.includes(tag));
    const sortFn = SORT_MAP[sort];
    result.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortFn.column] as number | string ?? 0;
      const bv = (b as unknown as Record<string, unknown>)[sortFn.column] as number | string ?? 0;
      return sortFn.ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey, search, sort, tag]);

  const fetchPackages = useCallback(async () => {
    if (USE_MOCK) {
      setPackages(mockResult!);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase
      .from('packages')
      .select('*, category:categories(*), author:authors(*)')
      .order(SORT_MAP[sort].column, { ascending: SORT_MAP[sort].ascending });

    if (categories && categories.length > 0) {
      query = query.in('category.slug', categories);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    } else {
      setPackages((data as Package[]) ?? []);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey, search, sort, tag]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  return { packages, loading, error, refetch: fetchPackages };
}

export function usePackageDetail(name: string) {
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setPkg(MOCK_PACKAGES.find(p => p.name === name) ?? null);
      setLoading(false);
      return;
    }
    supabase
      .from('packages')
      .select('*, category:categories(*), author:authors(*)')
      .eq('name', name)
      .single()
      .then(({ data }) => {
        setPkg(data as Package | null);
        setLoading(false);
      });
  }, [name]);

  return { pkg, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (USE_MOCK) {
      setCategories(MOCK_CATEGORIES);
      return;
    }
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  return categories;
}
