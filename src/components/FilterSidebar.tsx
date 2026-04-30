import {
  Dropdown,
  Option,
  Label,
  tokens,
} from '@fluentui/react-components';
import { useCategories } from '@/hooks/usePackages';
import type { SortOption } from '@/types';

interface FilterSidebarProps {
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'recent', label: 'Recently Published' },
  { value: 'name', label: 'Name (A-Z)' },
];

export function FilterSidebar({ selectedCategory, onCategoryChange, sort, onSortChange }: FilterSidebarProps) {
  const categories = useCategories();

  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacingVerticalM,
      minWidth: 200,
      padding: tokens.spacingVerticalM,
    }}>
      <div>
        <Label weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS, display: 'block' }}>
          Category
        </Label>
        <Dropdown
          placeholder="All categories"
          value={categories.find(c => c.slug === selectedCategory)?.name ?? 'All categories'}
          onOptionSelect={(_e, data) => onCategoryChange(data.optionValue as string)}
        >
          <Option value="">All categories</Option>
          {categories.map(cat => (
            <Option key={cat.slug} value={cat.slug}>{cat.name}</Option>
          ))}
        </Dropdown>
      </div>

      <div>
        <Label weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS, display: 'block' }}>
          Sort by
        </Label>
        <Dropdown
          value={SORT_OPTIONS.find(s => s.value === sort)?.label ?? ''}
          onOptionSelect={(_e, data) => onSortChange(data.optionValue as SortOption)}
        >
          {SORT_OPTIONS.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Dropdown>
      </div>
    </aside>
  );
}
