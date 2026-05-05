import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Package, Category, SortOption } from '@/types';

interface UsePackagesOptions {
  categories?: string[];
  search?: string;
  sort?: SortOption;
  tag?: string;
}

const SORT_MAP: Record<SortOption, { column: string; ascending: boolean }> = {
  downloads: { column: 'weekly_downloads', ascending: false },
  loved: { column: 'favorite_count', ascending: false },
  recent: { column: 'last_published_at', ascending: false },
  name: { column: 'name', ascending: true },
};

export function usePackages({ categories, search, sort = 'downloads', tag }: UsePackagesOptions = {}) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesKey = categories?.join(',') ?? '';

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('packages')
      .select('*, categories(*), author:authors(*)')
      .order(SORT_MAP[sort].column, { ascending: SORT_MAP[sort].ascending });

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
      let result = (data as Package[]) ?? [];
      // Client-side filter for multi-category (many-to-many)
      if (categories && categories.length > 0) {
        result = result.filter(pkg =>
          pkg.categories?.some(cat => categories.includes(cat.slug))
        );
      }
      setPackages(result);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey, search, sort, tag]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  useEffect(() => {
    const handler = () => fetchPackages();
    window.addEventListener('package-added', handler);
    return () => window.removeEventListener('package-added', handler);
  }, [fetchPackages]);

  return { packages, loading, error, refetch: fetchPackages };
}

export function usePackageDetail(name: string) {
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('packages')
      .select('*, categories(*), author:authors(*)')
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
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  return categories;
}
