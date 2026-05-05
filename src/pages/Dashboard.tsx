import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Spinner,
  TabList,
  Tab,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  tokens,
} from '@fluentui/react-components';
import { Delete20Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import { PackageCard } from '@/components/PackageCard';
import { Header } from '@/components/Header';
import type { Package } from '@/types';

type DashTab = 'favorites' | 'my-packages' | 'collections';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favoriteIds, isFavorite, toggle } = useFavorites();
  const [tab, setTab] = useState<DashTab>('favorites');
  const [favoritePackages, setFavoritePackages] = useState<Package[]>([]);
  const [myPackages, setMyPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPkgLoading, setMyPkgLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const loadMyPackages = useCallback(async () => {
    if (!user) { setMyPkgLoading(false); return; }
    setMyPkgLoading(true);
    const { data } = await supabase
      .from('packages')
      .select('*, categories(*), author:authors(*)')
      .eq('added_by', user.id)
      .order('created_at', { ascending: false });
    setMyPackages((data as Package[]) ?? []);
    setMyPkgLoading(false);
  }, [user]);

  useEffect(() => { loadMyPackages(); }, [loadMyPackages]);

  useEffect(() => {
    if (!user || favoriteIds.size === 0) { setLoading(false); return; }

    supabase
      .from('packages')
      .select('*, categories(*), author:authors(*)')
      .in('id', Array.from(favoriteIds))
      .then(({ data }) => {
        setFavoritePackages((data as Package[]) ?? []);
        setLoading(false);
      });
  }, [user, favoriteIds]);

  if (authLoading) {
    return <Spinner label="Loading..." />;
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
        <Header />
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text size={500}>Sign in to view your dashboard</Text>
          <br />
          <Button appearance="primary" onClick={() => navigate('/')} style={{ marginTop: tokens.spacingVerticalM }}>
            Go to catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
      <Header />

      <main style={{ flex: 1, overflow: 'auto', padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Text size={600} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalM }}>
            My Dashboard
          </Text>

          <TabList
            selectedValue={tab}
            onTabSelect={(_e, data) => setTab(data.value as DashTab)}
            size="small"
            style={{ marginBottom: tokens.spacingVerticalL }}
          >
            <Tab value="favorites">Favorites ({favoriteIds.size})</Tab>
            <Tab value="my-packages">My Packages ({myPackages.length})</Tab>
            <Tab value="collections">Collections</Tab>
          </TabList>

          {tab === 'favorites' && (
            loading ? (
              <Spinner label="Loading favorites..." />
            ) : favoritePackages.length === 0 ? (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                No favorites yet. Browse the catalog and heart some packages!
              </Text>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: tokens.spacingHorizontalL,
              }}>
                {favoritePackages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isFavorite={isFavorite(pkg.id)}
                    onToggleFavorite={() => toggle(pkg.id)}
                    isAuthenticated
                  />
                ))}
              </div>
            )
          )}

          {tab === 'my-packages' && (
            myPkgLoading ? (
              <Spinner label="Loading your packages..." />
            ) : myPackages.length === 0 ? (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                You haven't added any packages yet. Use the "Add Package" button in the catalog to contribute.
              </Text>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: tokens.spacingHorizontalL,
              }}>
                {myPackages.map(pkg => (
                  <div key={pkg.id} style={{ position: 'relative', maxWidth: 420 }}>
                    <PackageCard
                      pkg={pkg}
                      isFavorite={false}
                      onToggleFavorite={() => {}}
                      isAuthenticated
                      hideFavorite
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      size="small"
                      title="Remove package"
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg); }}
                    />
                  </div>
                ))}
              </div>
            )
          )}

          <Dialog open={!!deleteTarget} onOpenChange={(_e, data) => { if (!data.open) setDeleteTarget(null); }}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Remove package?</DialogTitle>
                <DialogContent>
                  This will remove <strong>{deleteTarget?.name}</strong> from the catalog. This cannot be undone.
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                  </DialogTrigger>
                  <Button
                    appearance="primary"
                    onClick={async () => {
                      if (!deleteTarget) return;
                      await supabase.from('packages').delete().eq('id', deleteTarget.id);
                      setDeleteTarget(null);
                      loadMyPackages();
                    }}
                  >
                    Remove
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>

          {tab === 'collections' && (
            <Text style={{ color: tokens.colorNeutralForeground3 }}>
              Collections coming soon. Create curated lists of packages to share with your team.
            </Text>
          )}
        </div>
      </main>
    </div>
  );
}
