import { Text, Button, tokens } from '@fluentui/react-components';
import {
  Box24Filled,
  ArrowDownload24Regular,
  PuzzlePieceRegular,
  Open16Regular,
  PlugConnectedRegular,
  ShieldCheckmark20Regular,
  Wand20Regular,
} from '@fluentui/react-icons';

const FEATURES = [
  { icon: <PlugConnectedRegular style={{ fontSize: 18 }} />, text: 'Connect via CLI in seconds' },
  { icon: <ShieldCheckmark20Regular />, text: 'Shared services out of the box — storage, clipboard, screenshots, events' },
  { icon: <Wand20Regular />, text: 'Built-in AI copilot integration for every plugin' },
];

export function HeroBanner() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${tokens.colorNeutralBackground5} 0%, ${tokens.colorNeutralBackground4} 40%, ${tokens.colorNeutralBackground3} 100%)`,
      padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
      position: 'relative',
      overflow: 'hidden',
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    }}>
      {/* Grid overlay effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${tokens.colorBrandStroke2} 1px, transparent 1px),
          linear-gradient(90deg, ${tokens.colorBrandStroke2} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1280,
        margin: '0 auto',
        padding: `0 ${tokens.spacingHorizontalM}`,
      }}>
        {/* Title + tagline */}
        <div style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalL }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacingHorizontalM,
            marginBottom: tokens.spacingVerticalS,
          }}>
            <Box24Filled style={{ fontSize: 40, color: tokens.colorBrandForeground1 }} />
            <Text size={800} weight="bold" style={{
              background: `linear-gradient(135deg, ${tokens.colorBrandForeground2}, ${tokens.colorBrandForeground1}, ${tokens.colorBrandForegroundLink})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Design Canvas Plugins
            </Text>
          </div>
          <Text size={400} style={{ color: tokens.colorNeutralForeground3, maxWidth: 580, display: 'inline-block', lineHeight: '1.5' }}>
            Build plugins in minutes, not days — with a simple lifecycle, shared services, and a CLI that ties it all together.
          </Text>
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: tokens.spacingHorizontalS,
          marginBottom: tokens.spacingVerticalL,
        }}>
          {FEATURES.map(f => (
            <div key={f.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacingHorizontalXS,
              padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
              borderRadius: tokens.borderRadiusCircular,
              background: tokens.colorNeutralBackground1,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              color: tokens.colorNeutralForeground2,
              fontSize: tokens.fontSizeBase200,
            }}>
              <span style={{ color: tokens.colorBrandForeground1, display: 'flex' }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        {/* Two CTAs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: tokens.spacingHorizontalM,
          flexWrap: 'wrap',
        }}>
          <Button
            appearance="primary"
            size="large"
            icon={<ArrowDownload24Regular />}
            as="a"
            href="https://www.npmjs.com/package/@design-canvas/toolbox"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install Design Canvas
          </Button>
          <Button
            appearance="outline"
            size="large"
            icon={<PuzzlePieceRegular />}
            as="a"
            href="https://github.com/unthinkmedia/dc-example-hello"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create Your Own Plugin
            <Open16Regular style={{ marginLeft: tokens.spacingHorizontalXS }} />
          </Button>
        </div>
      </div>
    </div>
  );
}
