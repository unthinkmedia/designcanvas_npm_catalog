import { useState, useEffect, useRef, useCallback } from 'react';
import { tokens, Spinner, Text } from '@fluentui/react-components';
import ReactMarkdown from 'react-markdown';
import { Header } from '@/components/Header';

const README_URL =
  'https://raw.githubusercontent.com/unthinkmedia/designcanvas_npm_catalog/main/README.md';

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1]!.length;
      const text = match[2]!.trim();
      entries.push({ id: slugify(text), text, level });
    }
  }
  return entries;
}

export function Docs() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(README_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(setMarkdown)
      .catch(() => setMarkdown('# Unable to load README\n\nPlease check the repository.'))
      .finally(() => setLoading(false));
  }, []);

  const toc = extractToc(markdown);

  // Track which heading is in view
  useEffect(() => {
    const container = contentRef.current;
    if (!container || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { root: container, rootMargin: '0px 0px -80% 0px', threshold: 0.1 },
    );

    const headings = container.querySelectorAll('h1[id], h2[id], h3[id]');
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [markdown, toc]);

  const scrollTo = useCallback((id: string) => {
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Custom heading renderer that adds id anchors
  const headingRenderer = (level: 1 | 2 | 3 | 4 | 5 | 6) =>
    function Heading({ children }: { children?: React.ReactNode }) {
      const text = extractTextFromChildren(children);
      const id = slugify(text);
      const Tag = `h${level}` as any;
      return <Tag id={id} style={{ scrollMarginTop: 16 }}>{children}</Tag>;
    };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: tokens.colorNeutralBackground3,
    }}>
      <Header />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
          <Spinner label="Loading docs..." />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main content */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
            }}
          >
            <div style={{
              maxWidth: 820,
              margin: '0 auto',
              lineHeight: 1.7,
              color: tokens.colorNeutralForeground1,
            }}>
              <ReactMarkdown
                components={{
                  h1: headingRenderer(1),
                  h2: headingRenderer(2),
                  h3: headingRenderer(3),
                  h4: headingRenderer(4),
                  h5: headingRenderer(5),
                  h6: headingRenderer(6),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: tokens.colorBrandForegroundLink }}
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.startsWith('language-');
                    return isBlock ? (
                      <pre style={{
                        background: tokens.colorNeutralBackground1,
                        padding: tokens.spacingVerticalM,
                        borderRadius: tokens.borderRadiusMedium,
                        overflow: 'auto',
                        fontSize: 13,
                      }}>
                        <code>{children}</code>
                      </pre>
                    ) : (
                      <code style={{
                        background: tokens.colorNeutralBackground1,
                        padding: '2px 6px',
                        borderRadius: tokens.borderRadiusSmall,
                        fontSize: '0.9em',
                      }}>
                        {children}
                      </code>
                    );
                  },
                  table: ({ children }) => (
                    <div style={{ overflow: 'auto' }}>
                      <table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        margin: `${tokens.spacingVerticalM} 0`,
                      }}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{
                      borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
                      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
                      textAlign: 'left',
                    }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td style={{
                      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
                    }}>
                      {children}
                    </td>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>

          {/* Right-side TOC nav */}
          {toc.length > 0 && (
            <nav style={{
              width: 240,
              minWidth: 240,
              borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
              overflow: 'auto',
              padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
              position: 'sticky',
              top: 0,
            }}>
              <Text
                size={200}
                weight="semibold"
                style={{
                  display: 'block',
                  marginBottom: tokens.spacingVerticalM,
                  color: tokens.colorNeutralForeground3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                On this page
              </Text>
              {toc.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => scrollTo(entry.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: `4px 0 4px ${(entry.level - 1) * 12}px`,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: activeId === entry.id
                      ? tokens.colorBrandForeground1
                      : tokens.colorNeutralForeground3,
                    fontWeight: activeId === entry.id ? 600 : 400,
                    borderLeft: activeId === entry.id
                      ? `2px solid ${tokens.colorBrandForeground1}`
                      : '2px solid transparent',
                    paddingLeft: `${(entry.level - 1) * 12 + 8}px`,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {entry.text}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

/** Recursively extract plain text from React children. */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as any).props.children);
  }
  return '';
}
