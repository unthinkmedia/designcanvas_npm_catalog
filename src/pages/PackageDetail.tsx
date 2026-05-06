import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Badge,
  Button,
  Avatar,
  TabList,
  Tab,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Heart24Regular,
  Heart24Filled,
  Copy24Regular,
  Copy16Regular,
  Checkmark16Regular,
  Bug24Regular,
  Open16Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { useState, useEffect, useCallback } from 'react';
import { usePackageDetail } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { MetricsBadges } from '@/components/MetricsBadges';
import { buildIssuesUrl, fetchNpmPackage } from '@/lib/npm-api';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import Markdown from 'react-markdown';

function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <pre {...props} style={{ position: 'relative', ...(props.style ?? {}) }}>
      {children}
      <button
        onClick={handleCopy}
        title="Copy code"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: tokens.colorNeutralBackground1,
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          borderRadius: 6,
          padding: '4px 6px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: tokens.colorNeutralForeground2,
          fontSize: 12,
          opacity: copied ? 1 : 0.7,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
      >
        {copied ? <Checkmark16Regular /> : <Copy16Regular />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </pre>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) return extractText((node as any).props.children);
  return '';
}

type DetailTab = 'readme' | 'versions' | 'dependencies';

export function PackageDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { pkg, loading } = usePackageDetail(name ?? '');
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const [tab, setTab] = useState<DetailTab>('readme');

  // Fetch live data from npm registry
  const [readme, setReadme] = useState<string | null>(null);
  const [versions, setVersions] = useState<{ version: string; date: string }[]>([]);
  const [deps, setDeps] = useState<Record<string, string>>({});
  const [devDeps, setDevDeps] = useState<Record<string, string>>({});
  const [npmLoading, setNpmLoading] = useState(true);

  useEffect(() => {
    if (!pkg) return;
    const fullName = pkg.scope ? `@${pkg.scope}/${pkg.name}` : pkg.name;
    setNpmLoading(true);
    fetchNpmPackage(fullName)
      .then(async (info) => {
        setReadme(info.readme ?? null);

        // Build version list from time field (excludes 'created' and 'modified')
        const versionList = Object.entries(info.time)
          .filter(([key]) => key !== 'created' && key !== 'modified')
          .map(([version, date]) => ({ version, date }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setVersions(versionList);

        // Get deps from latest version
        const latest = info['dist-tags']?.latest;
        if (latest && info.versions?.[latest]) {
          setDeps(info.versions[latest].dependencies ?? {});
          setDevDeps(info.versions[latest].devDependencies ?? {});
        }

        // Sync latest version + publish date back to DB if changed
        if (latest && latest !== pkg.latest_version) {
          const lastPublished = info.time?.[latest] ?? new Date().toISOString();
          await supabase.rpc('update_package_metrics', {
            p_id: pkg.id,
            p_latest_version: latest,
            p_last_published_at: lastPublished,
            p_weekly_downloads: pkg.weekly_downloads,
            p_metrics_updated_at: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        setReadme(null);
      })
      .finally(() => setNpmLoading(false));
  }, [pkg]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
          <Spinner label="Loading package..." />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
        <Header />
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text size={500}>Package not found</Text>
          <br />
          <Button appearance="subtle" onClick={() => navigate('/')}>Back to catalog</Button>
        </div>
      </div>
    );
  }

  const fullName = pkg.scope ? `@${pkg.scope}/${pkg.name}` : pkg.name;
  const displayName = pkg.display_name ?? fullName;
  const installCmd = `npm install ${fullName}`;
  const issuesUrl = buildIssuesUrl(pkg.repo_url, pkg.issues_url, fullName, pkg.latest_version);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
      <Header />

      <main style={{ flex: 1, overflow: 'auto', padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/')}
          style={{ marginBottom: tokens.spacingVerticalM }}
        >
          Back to catalog
        </Button>

        <Card style={{ marginBottom: tokens.spacingVerticalXL, padding: tokens.spacingVerticalL }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Text size={700} weight="bold">{displayName}</Text>
                {pkg.latest_version && (
                  <Badge appearance="filled" color="brand">v{pkg.latest_version}</Badge>
                )}
              </div>
              <Text size={400} style={{ color: tokens.colorNeutralForeground2, marginTop: tokens.spacingVerticalXS }}>
                {pkg.description}
              </Text>

              {pkg.author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalS }}>
                  <Avatar
                    name={pkg.author.display_name ?? pkg.author.github_username}
                    image={pkg.author.avatar_url ? { src: pkg.author.avatar_url } : undefined}
                    size={32}
                  />
                  <Text size={300}>{pkg.author.display_name ?? pkg.author.github_username}</Text>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
              {user && (
                <Button
                  appearance="subtle"
                  icon={isFavorite(pkg.id) ? <Heart24Filled style={{ color: tokens.colorPaletteRedForeground1 }} /> : <Heart24Regular />}
                  onClick={() => toggle(pkg.id)}
                />
              )}
              <Button
                appearance="subtle"
                icon={<Copy24Regular />}
                onClick={() => navigator.clipboard.writeText(installCmd)}
                title="Copy install command"
              />
              <Button
                appearance="subtle"
                icon={<Bug24Regular />}
                as="a"
                href={issuesUrl}
                target="_blank"
                rel="noopener"
                title="Report issue"
              />
              {pkg.npm_url && (
                <Button appearance="subtle" icon={<Open16Regular />} as="a" href={pkg.npm_url} target="_blank" rel="noopener" />
              )}
              {user && pkg.added_by === user.id && (
                <Dialog>
                  <DialogTrigger disableButtonEnhancement>
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      title="Remove package"
                    />
                  </DialogTrigger>
                  <DialogSurface>
                    <DialogBody>
                      <DialogTitle>Remove package?</DialogTitle>
                      <DialogContent>
                        This will remove <strong>{displayName}</strong> from the catalog. This cannot be undone.
                      </DialogContent>
                      <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                          <Button appearance="secondary">Cancel</Button>
                        </DialogTrigger>
                        <Button
                          appearance="primary"
                          onClick={async () => {
                            await supabase.from('packages').delete().eq('id', pkg.id);
                            navigate('/');
                          }}
                        >
                          Remove
                        </Button>
                      </DialogActions>
                    </DialogBody>
                  </DialogSurface>
                </Dialog>
              )}
            </div>
          </div>

          <div style={{
            marginTop: tokens.spacingVerticalM,
            padding: tokens.spacingVerticalS,
            background: tokens.colorNeutralBackground3,
            borderRadius: tokens.borderRadiusMedium,
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text font="monospace" size={300}>{installCmd}</Text>
            <Button
              appearance="subtle"
              size="small"
              icon={<Copy24Regular />}
              onClick={() => navigator.clipboard.writeText(installCmd)}
            />
          </div>

          <div style={{ marginTop: tokens.spacingVerticalM }}>
            <MetricsBadges pkg={pkg} />
          </div>

          {pkg.tags.length > 0 && (
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'nowrap', marginTop: tokens.spacingVerticalS, overflow: 'hidden' }}>
              {pkg.tags.map(tag => (
                <Badge key={tag} appearance="tint" size="small">{tag}</Badge>
              ))}
            </div>
          )}
        </Card>

        <TabList
          selectedValue={tab}
          onTabSelect={(_e, data) => setTab(data.value as DetailTab)}
          style={{ marginBottom: tokens.spacingVerticalL }}
        >
          <Tab value="readme">README</Tab>
          <Tab value="versions">Versions</Tab>
          <Tab value="dependencies">Dependencies</Tab>
        </TabList>

        <Card style={{ padding: tokens.spacingVerticalL }}>
          {tab === 'readme' && (
            npmLoading ? (
              <Spinner label="Loading README..." />
            ) : readme ? (
              (() => {
                // Strip the leading h1 if it matches the package name (avoids repetition with header card)
                const trimmed = readme.replace(/^\s*#\s+.+\n*/, '');
                return (
              <div className="readme-content" style={{ lineHeight: 1.8, color: tokens.colorNeutralForeground1, fontSize: tokens.fontSizeBase300 }}>
                <style>{`
                  .readme-content a { color: ${tokens.colorBrandForegroundLink}; text-decoration: underline; }
                  .readme-content a:hover { color: ${tokens.colorBrandForegroundLinkHover}; }
                  .readme-content h1, .readme-content h2, .readme-content h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
                  .readme-content p { margin-bottom: 0.75em; }
                  .readme-content pre { background: ${tokens.colorNeutralBackground3}; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; position: relative; }
                  .readme-content code { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 0.9em; }
                  .readme-content p > code { background: ${tokens.colorNeutralBackground3}; padding: 2px 6px; border-radius: 4px; }
                  .readme-content ul, .readme-content ol { padding-left: 1.5em; margin-bottom: 0.75em; }
                  .readme-content li { margin-bottom: 0.25em; }
                  .readme-content blockquote { border-left: 3px solid ${tokens.colorBrandStroke1}; padding-left: 1em; margin: 1em 0; color: ${tokens.colorNeutralForeground2}; }
                `}</style>
                <Markdown components={{ pre: CodeBlock }}>{trimmed}</Markdown>
              </div>
              );
              })()
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                No README available for this package.
              </Text>
            )
          )}
          {tab === 'versions' && (
            npmLoading ? (
              <Spinner label="Loading versions..." />
            ) : versions.length === 0 ? (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>No version data available.</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS }}>
                {versions.slice(0, 50).map(v => (
                  <div key={v.version} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${tokens.spacingVerticalXS} 0`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                    <Badge appearance={v.version === pkg!.latest_version ? 'filled' : 'outline'} color={v.version === pkg!.latest_version ? 'brand' : 'informative'} size="medium">
                      v{v.version}
                    </Badge>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      {new Date(v.date).toLocaleDateString()}
                    </Text>
                  </div>
                ))}
                {versions.length > 50 && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground4, textAlign: 'center', paddingTop: tokens.spacingVerticalS }}>
                    Showing 50 of {versions.length} versions
                  </Text>
                )}
              </div>
            )
          )}
          {tab === 'dependencies' && (
            npmLoading ? (
              <Spinner label="Loading dependencies..." />
            ) : Object.keys(deps).length === 0 && Object.keys(devDeps).length === 0 ? (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>No dependencies.</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                {Object.keys(deps).length > 0 && (
                  <div>
                    <Text weight="semibold" size={300} block style={{ marginBottom: tokens.spacingVerticalS }}>
                      Dependencies ({Object.keys(deps).length})
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS }}>
                      {Object.entries(deps).map(([dep, ver]) => (
                        <Badge key={dep} appearance="outline" size="medium">
                          {dep} {ver}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(devDeps).length > 0 && (
                  <div>
                    <Text weight="semibold" size={300} block style={{ marginBottom: tokens.spacingVerticalS }}>
                      Dev Dependencies ({Object.keys(devDeps).length})
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS }}>
                      {Object.entries(devDeps).map(([dep, ver]) => (
                        <Badge key={dep} appearance="outline" size="medium" color="subtle">
                          {dep} {ver}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </Card>
        </div>
      </main>
    </div>
  );
}
