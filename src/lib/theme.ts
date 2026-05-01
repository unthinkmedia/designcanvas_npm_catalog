import {
  createDarkTheme,
  type BrandVariants,
  type Theme,
} from '@fluentui/react-components';

/**
 * NextGen Purple brand color scale from the Foundry Design System.
 * Generated through Fluent Theme Designer for optimal accessibility.
 */
const nextGenPurple: BrandVariants = {
  10: '#030206',
  20: '#1A1326',
  30: '#2B1D44',
  40: '#38255E',
  50: '#472E79',
  60: '#553695',
  70: '#643FB2',
  80: '#8251EE',
  90: '#8251EE',
  100: '#9263F1',
  110: '#A175F3',
  120: '#AF86F5',
  130: '#BC98F7',
  140: '#C9AAF9',
  150: '#D5BCFB',
  160: '#E1CEFC',
};

const baseDark = createDarkTheme(nextGenPurple);

/**
 * AI Foundry dark theme — extends Fluent's dark theme with:
 *  - NextGen Purple brand variants
 *  - Custom neutral background layering
 *  - Brand foreground overrides for dark-mode contrast
 *  - Aptos font family
 */
export const foundryDarkTheme: Theme = {
  ...baseDark,

  // ── Dark Theme Background Overrides ──
  colorNeutralBackground1: 'hsl(0, 0%, 12%)',   // Grey 12 — page content
  colorNeutralBackground2: 'hsl(0, 0%, 10%)',   // Grey 10 — elevated surfaces
  colorNeutralBackground3: 'hsl(0, 0%, 8%)',    // Grey 8  — filled darker
  colorNeutralBackground4: 'hsl(0, 0%, 6%)',    // Grey 6  — shell/sidebar
  colorNeutralBackground5: 'hsl(0, 0%, 3%)',    // Grey 3  — deepest
  colorNeutralBackground6: 'hsl(0, 0%, 0%)',    // True black

  // ── Brand Foreground Overrides (contrast-safe) ──
  colorBrandForeground1: '#A175F3',              // variant 110
  colorBrandForeground2: '#AF86F5',              // variant 120
  colorBrandForegroundLink: '#C9AAF9',           // variant 140

  // ── Typography ──
  fontFamilyBase: "'Aptos', sans-serif",
  fontFamilyMonospace: "'Aptos Mono', Menlo, Monaco, Consolas, monospace",
  fontFamilyNumeric: "'Aptos', sans-serif",
};
