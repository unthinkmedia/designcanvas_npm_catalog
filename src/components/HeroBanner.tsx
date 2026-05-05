import { useState, useEffect, useMemo } from 'react';
import { Text, Button, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { MeshBackground, WireframeMesh } from '@/components/AnimatedBackground';

const ROTATING_WORDS = ['connect', 'inspect', 'create', 'annotate', 'verify', 'theme', 'deploy', 'critique', 'iterate', 'ship', 'automate', 'share', 'evaluate', 'scaffold', 'refine', 'test'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function RotatingWord() {
  const words = useMemo(() => shuffle(ROTATING_WORDS), []);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % words.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <span style={{
      color: tokens.colorBrandForeground1,
      display: 'inline-block',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: fade ? 1 : 0,
      transform: fade ? 'translateY(0)' : 'translateY(6px)',
    }}>
      {words[index]}
    </span>
  );
}


export function HeroBanner() {
  return (
    <div data-hero style={{
      position: 'relative',
      background: tokens.colorNeutralBackground3,
      padding: `64px ${tokens.spacingHorizontalXL}`,
      overflow: 'hidden',
    }}>
      <MeshBackground />
      <WireframeMesh />
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: 1280,
        margin: '0 auto',
        padding: `0 ${tokens.spacingHorizontalM}`,
      }}>
        <Text size={800} weight="bold" as="h1" style={{
          display: 'block',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: tokens.spacingVerticalS,
        }}>
            Build agentic browser tools that <RotatingWord />.
        </Text>
        <Text size={300} style={{
          color: tokens.colorNeutralForeground3,
          display: 'block',
          marginBottom: tokens.spacingVerticalL,
        }}>
          Plugin architecture &middot; CLI tooling &middot; Shared services &middot; LLM integration
        </Text>

        <Button
          appearance="primary"
          size="large"
          icon={<ArrowDownload24Regular />}
          as="a"
          href="https://www.npmjs.com/package/@design-canvas/toolbox"
          target="_blank"
          rel="noopener noreferrer"
        >
          Install Toolbox
        </Button>
      </div>
    </div>
  );
}
