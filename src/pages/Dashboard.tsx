import { useState, useEffect } from 'react';
import { Text, Spinner, TabList, Tab, Button, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import { PackageCard } from '@/components/PackageCard';
import { Header } from '@/components/Header';
import type { Package } from '@/types';

type DashTab = 'favorites' | 'collections';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favoriteIds, isFavorite, toggle } = useFavorites();
  const [tab, setTab] = useState<DashTab>('favorites');
  const [favoritePackages, setFavoritePackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || favoriteIds.size === 0) { setLoading(false); return; }

    supabase
      .from('packages')
      .select('*, category:categories(*), author:authors(*)')
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
