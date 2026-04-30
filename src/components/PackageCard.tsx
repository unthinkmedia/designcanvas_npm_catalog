import {
  Card,
  CardHeader,
  Text,
  Badge,
  Button,
  Avatar,
  tokens,
} from '@fluentui/react-components';
import {
  Heart24Regular,
  Heart24Filled,
  Copy24Regular,
  Bug24Regular,
  Open16Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { MetricsBadges } from './MetricsBadges';
import { buildIssuesUrl } from '@/lib/npm-api';
import type { Package } from '@/types';

interface PackageCardProps {
  pkg: Package;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isAuthenticated: boolean;
}

export function PackageCard({ pkg, isFavorite, onToggleFavorite, isAuthenticated }: PackageCardProps) {
  const navigate = useNavigate();
  const displayName = pkg.scope ? `@${pkg.scope}/${pkg.name}` : pkg.name;

  const copyInstall = () => {
    navigator.clipboard.writeText(`npm install ${displayName}`);
  };

  const issuesUrl = buildIssuesUrl(pkg.repo_url, pkg.issues_url, displayName, pkg.latest_version);

  return (
    <Card
      style={{ cursor: 'pointer', minWidth: 280, flex: '1 1 320px' }}
      onClick={() => navigate(`/package/${encodeURIComponent(pkg.name)}`)}
    >
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Text weight="semibold" size={400}>{displayName}</Text>
            {pkg.latest_version && (
              <Badge appearance="outline" size="small" color="informative">
                v{pkg.latest_version}
              </Badge>
            )}
          </div>
        }
        description={
          pkg.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
              <Avatar
                name={pkg.author.display_name ?? pkg.author.github_username}
                image={pkg.author.avatar_url ? { src: pkg.author.avatar_url } : undefined}
                size={20}
              />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {pkg.author.display_name ?? pkg.author.github_username}
              </Text>
            </div>
          )
        }
      />

      <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
        {pkg.description ?? 'No description'}
      </Text>

      {pkg.tags.length > 0 && (
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' }}>
          {pkg.tags.slice(0, 4).map(tag => (
            <Badge key={tag} appearance="tint" size="small">{tag}</Badge>
          ))}
          {pkg.tags.length > 4 && (
            <Badge appearance="outline" size="small">+{pkg.tags.length - 4}</Badge>
          )}
        </div>
      )}

      <MetricsBadges pkg={pkg} compact />

      <div
        style={{ display: 'flex', gap: tokens.spacingHorizontalXS, marginTop: tokens.spacingVerticalXS }}
        onClick={e => e.stopPropagation()}
      >
        {isAuthenticated && (
          <Button
            appearance="subtle"
            size="small"
            icon={isFavorite ? <Heart24Filled style={{ color: tokens.colorPaletteRedForeground1 }} /> : <Heart24Regular />}
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        )}
        <Button appearance="subtle" size="small" icon={<Copy24Regular />} onClick={copyInstall} title="Copy install command" />
        <Button
          appearance="subtle"
          size="small"
          icon={<Bug24Regular />}
          as="a"
          href={issuesUrl}
          target="_blank"
          rel="noopener"
          title="Report issue"
        />
        {pkg.npm_url && (
          <Button
            appearance="subtle"
            size="small"
            icon={<Open16Regular />}
            as="a"
            href={pkg.npm_url}
            target="_blank"
            rel="noopener"
            title="View on npm"
          />
        )}
      </div>
    </Card>
  );
}
