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
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Heart24Regular,
  Heart24Filled,
  Copy24Regular,
  Bug24Regular,
  Open16Regular,
} from '@fluentui/react-icons';
import { useState } from 'react';
import { usePackageDetail } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { MetricsBadges } from '@/components/MetricsBadges';
import { buildIssuesUrl } from '@/lib/npm-api';
import { Header } from '@/components/Header';

type DetailTab = 'readme' | 'versions' | 'dependencies';

export function PackageDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { pkg, loading } = usePackageDetail(name ?? '');
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const [tab, setTab] = useState<DetailTab>('readme');
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header search={search} onSearchChange={setSearch} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
          <Spinner label="Loading package..." />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header search={search} onSearchChange={setSearch} />
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text size={500}>Package not found</Text>
          <br />
          <Button appearance="subtle" onClick={() => navigate('/')}>Back to catalog</Button>
        </div>
      </div>
    );
  }

  const displayName = pkg.scope ? `@${pkg.scope}/${pkg.name}` : pkg.name;
  const installCmd = `npm install ${displayName}`;
  const issuesUrl = buildIssuesUrl(pkg.repo_url, pkg.issues_url, displayName, pkg.latest_version);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header search={search} onSearchChange={setSearch} />

      <main style={{ flex: 1, overflow: 'auto', padding: tokens.spacingVerticalL }}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/')}
          style={{ marginBottom: tokens.spacingVerticalM }}
        >
          Back to catalog
        </Button>

        <Card style={{ marginBottom: tokens.spacingVerticalL }}>
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

          <MetricsBadges pkg={pkg} />

          {pkg.tags.length > 0 && (
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap', marginTop: tokens.spacingVerticalS }}>
              {pkg.tags.map(tag => (
                <Badge key={tag} appearance="tint" size="small">{tag}</Badge>
              ))}
            </div>
          )}
        </Card>

        <TabList
          selectedValue={tab}
          onTabSelect={(_e, data) => setTab(data.value as DetailTab)}
          style={{ marginBottom: tokens.spacingVerticalM }}
        >
          <Tab value="readme">README</Tab>
          <Tab value="versions">Versions</Tab>
          <Tab value="dependencies">Dependencies</Tab>
        </TabList>

        <Card>
          {tab === 'readme' && (
            <Text style={{ color: tokens.colorNeutralForeground2 }}>
              README content will be loaded from the npm registry and rendered with react-markdown.
            </Text>
          )}
          {tab === 'versions' && (
            <Text style={{ color: tokens.colorNeutralForeground2 }}>
              Version history will be loaded from the npm registry.
            </Text>
          )}
          {tab === 'dependencies' && (
            <Text style={{ color: tokens.colorNeutralForeground2 }}>
              Dependencies will be loaded from the npm registry.
            </Text>
          )}
        </Card>
      </main>
    </div>
  );
}
