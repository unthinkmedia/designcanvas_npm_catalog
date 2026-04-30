import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }

    setLoading(true);
    supabase
      .from('user_favorites')
      .select('package_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setFavoriteIds(new Set((data ?? []).map(d => d.package_id)));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (packageId: string) => {
    if (!user) return;

    if (favoriteIds.has(packageId)) {
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(packageId); return next; });
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('package_id', packageId);
    } else {
      setFavoriteIds(prev => new Set(prev).add(packageId));
      await supabase.from('user_favorites').insert({ user_id: user.id, package_id: packageId });
    }
  }, [user, favoriteIds]);

  const isFavorite = useCallback((packageId: string) => favoriteIds.has(packageId), [favoriteIds]);

  return { favoriteIds, isFavorite, toggle, loading };
}
