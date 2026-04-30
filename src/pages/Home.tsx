import { useState } from 'react';
import { Text, Spinner, tokens } from '@fluentui/react-components';
import { Header } from '@/components/Header';
import { PackageCard } from '@/components/PackageCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { usePackages } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { SortOption } from '@/types';

export function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('downloads');

  const { packages, loading } = usePackages({ search, category: category || undefined, sort });
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header search={search} onSearchChange={setSearch} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FilterSidebar
          selectedCategory={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />

        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: tokens.spacingVerticalL,
        }}>
          <div style={{ marginBottom: tokens.spacingVerticalM }}>
            <Text size={600} weight="semibold">
              Explore Packages
            </Text>
            {!loading && (
              <Text size={300} style={{ marginLeft: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground3 }}>
                {packages.length} {packages.length === 1 ? 'package' : 'packages'}
              </Text>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
              <Spinner label="Loading packages..." />
            </div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
              <Text size={400} style={{ color: tokens.colorNeutralForeground3 }}>
                No packages found. {search && 'Try a different search term.'}
              </Text>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: tokens.spacingHorizontalM,
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
        </main>
      </div>
    </div>
  );
}
