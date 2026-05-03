import { useState } from 'react';
import { Spinner, tokens } from '@fluentui/react-components';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { PackageCard } from '@/components/PackageCard';
import { FilterBar } from '@/components/FilterSidebar';
import { usePackages } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { SortOption } from '@/types';

export function Home() {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('downloads');

  const { packages, loading } = usePackages({ search, categories: categories.length ? categories : undefined, sort });
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: tokens.colorNeutralBackground2,
    }}>
      <Header />
      <HeroBanner />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        selectedCategories={categories}
        onCategoriesChange={setCategories}
        sort={sort}
        onSortChange={setSort}
        packageCount={packages.length}
      />

      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: tokens.spacingVerticalL,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: `0 ${tokens.spacingHorizontalM}`,
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
              <Spinner label="Loading packages..." />
            </div>
          ) : packages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: tokens.spacingVerticalXXL,
              color: tokens.colorNeutralForeground3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokens.spacingVerticalM,
            }}>
              <div>No packages found. {search && 'Try a different search term.'}</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: tokens.spacingHorizontalL,
            }}>
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isFavorite={isFavorite(pkg.id)}
                  onToggleFavorite={() => toggle(pkg.id)}
                  isAuthenticated={!!user}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: tokens.spacingVerticalM,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        background: tokens.colorNeutralBackground1,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground4,
        flexShrink: 0,
      }}>
        Built with Fluent UI &middot; Powered by Supabase &middot; Design Canvas Plugins
      </footer>
    </div>
  );
}
