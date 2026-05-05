import {
  Input,
  Dropdown,
  Option,
  ToggleButton,
  Button,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import { Search16Regular } from '@fluentui/react-icons';
import { useCategories } from '@/hooks/usePackages';
import type { Package, SortOption } from '@/types';

const useFilterStyles = makeStyles({
  pill: {
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    '&:active': {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
    },
  },
});

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (slugs: string[]) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  packageCount: number;
  allPackages?: Package[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'loved', label: 'Most Loved' },
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
  allPackages,
}: FilterBarProps) {
  const categories = useCategories();
  const styles = useFilterStyles();

  // Only show categories that have at least 1 package
  const activeSlugs = new Set(
    (allPackages ?? []).flatMap(pkg => pkg.categories?.map(c => c.slug) ?? [])
  );
  const visibleCategories = allPackages
    ? categories.filter(c => activeSlugs.has(c.slug))
    : categories;

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onCategoriesChange([]);
    } else {
      onCategoriesChange([slug]);
    }
  };

  return (
    <div style={{
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
      background: 'transparent',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: `0 ${tokens.spacingHorizontalM}`,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
      }}>
      {/* Multi-select category toggles — wrapping layout */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        alignItems: 'center',
      }}>
        {visibleCategories.map(cat => (
          <ToggleButton
            key={cat.slug}
            size="small"
            shape="circular"
            className={selectedCategories.includes(cat.slug) ? undefined : styles.pill}
            checked={selectedCategories.includes(cat.slug)}
            onClick={() => toggleCategory(cat.slug)}
            style={{
              background: selectedCategories.includes(cat.slug) ? undefined : tokens.colorNeutralBackground1,
            }}
          >
            {cat.name}
          </ToggleButton>
        ))}
        {selectedCategories.length > 0 && (
          <Button
            size="small"
            appearance="subtle"
            onClick={() => onCategoriesChange([])}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search + sort row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
      }}>
        <div style={{ flex: 1, maxWidth: 480 }}>
          <Input
            contentBefore={<Search16Regular />}
            placeholder="Search packages..."
            value={search}
            onChange={(_e, data) => onSearchChange(data.value)}
            size="medium"
            appearance="filled-lighter"
            style={{ width: '100%', borderRadius: tokens.borderRadiusXLarge }}
          />
        </div>

        <Dropdown
          placeholder="Sort by"
          value={SORT_OPTIONS.find(s => s.value === sort)?.label ?? ''}
          onOptionSelect={(_e, data) => onSortChange(data.optionValue as SortOption)}
          size="medium"
          appearance="filled-lighter"
          style={{ minWidth: 180, borderRadius: tokens.borderRadiusXLarge }}
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
    </div>
  );
}
