import {
  Input,
  Dropdown,
  Option,
  ToggleButton,
  tokens,
} from '@fluentui/react-components';
import { Search16Regular } from '@fluentui/react-icons';
import { useCategories } from '@/hooks/usePackages';
import type { SortOption } from '@/types';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (slugs: string[]) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  packageCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'recent', label: 'Recently Published' },
  { value: 'name', label: 'Name (A-Z)' },
];

export function FilterBar({
  search,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  sort,
  onSortChange,
  packageCount,
}: FilterBarProps) {
  const categories = useCategories();

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter(s => s !== slug));
    } else {
      onCategoriesChange([...selectedCategories, slug]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacingVerticalM,
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      background: tokens.colorNeutralBackground1,
    }}>
      {/* Multi-select category toggles */}
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: tokens.spacingHorizontalXS,
        overflow: 'auto',
      }}>
        {categories.map(cat => (
          <ToggleButton
            key={cat.slug}
            size="small"
            checked={selectedCategories.includes(cat.slug)}
            onClick={() => toggleCategory(cat.slug)}
            style={{ flexShrink: 0 }}
          >
            {cat.name}
          </ToggleButton>
        ))}
      </div>

      {/* Search + sort row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
      }}>
        <div style={{ flex: 1, maxWidth: 400 }}>
          <Input
            contentBefore={<Search16Regular />}
            placeholder="Search packages..."
            value={search}
            onChange={(_e, data) => onSearchChange(data.value)}
            size="small"
            style={{ width: '100%' }}
          />
        </div>

        <Dropdown
          placeholder="Sort by"
          value={SORT_OPTIONS.find(s => s.value === sort)?.label ?? ''}
          onOptionSelect={(_e, data) => onSortChange(data.optionValue as SortOption)}
          size="small"
          style={{ minWidth: 160 }}
        >
          {SORT_OPTIONS.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Dropdown>

        <span style={{
          marginLeft: 'auto',
          fontSize: tokens.fontSizeBase200,
          color: tokens.colorNeutralForeground3,
        }}>
          {packageCount} {packageCount === 1 ? 'package' : 'packages'}
        </span>
      </div>
    </div>
  );
}
