import {
  Card,
  Text,
  Badge,
  Button,
  Avatar,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  Heart24Regular,
  Heart24Filled,
  ArrowDownload16Regular,
  Star16Regular,
  Archive16Regular,
  CheckmarkCircle16Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { formatDownloads, formatBytes, timeAgo } from '@/lib/npm-api';
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

  return (
    <Card
      style={{
        cursor: 'pointer',
        minWidth: 280,
        flex: '1 1 320px',
        maxWidth: 420,
        background: tokens.colorNeutralBackground3,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusLarge,
        padding: 0,
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onClick={() => navigate(`/package/${encodeURIComponent(pkg.name)}`)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = tokens.colorBrandStroke1;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${tokens.colorBrandStroke2}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = tokens.colorNeutralStroke2;
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}` }}>
        {/* Title row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacingVerticalXS,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, minWidth: 0, overflow: 'hidden' }}>
            <Text weight="semibold" size={400} truncate style={{ color: tokens.colorNeutralForeground1 }}>
              {displayName}
            </Text>
            {pkg.latest_version && (
              <Badge appearance="tint" size="small" color="brand" style={{ flexShrink: 0 }}>
                v{pkg.latest_version}
              </Badge>
            )}
          </div>
          {isAuthenticated && (
            <Button
              appearance="subtle"
              size="small"
              icon={isFavorite ? <Heart24Filled style={{ color: tokens.colorPaletteRedForeground1 }} /> : <Heart24Regular />}
              onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              style={{ minWidth: 'auto', padding: 2 }}
            />
          )}
        </div>

        {/* Author */}
        {pkg.author && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacingHorizontalXS,
            marginBottom: tokens.spacingVerticalS,
          }}>
            <Avatar
              name={pkg.author.display_name ?? pkg.author.github_username}
              image={pkg.author.avatar_url ? { src: pkg.author.avatar_url } : undefined}
              size={16}
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              by {pkg.author.display_name ?? pkg.author.github_username}
            </Text>
          </div>
        )}

        {/* Description */}
        <Text size={200} style={{
          color: tokens.colorNeutralForeground2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '20px',
          minHeight: 40,
        }}>
          {pkg.description ?? 'No description'}
        </Text>

        {/* Tags */}
        {pkg.tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: tokens.spacingHorizontalXS,
            flexWrap: 'nowrap',
            marginTop: tokens.spacingVerticalS,
            overflow: 'hidden',
          }}>
            {pkg.tags.slice(0, 3).map(tag => (
              <Badge key={tag} appearance="outline" size="small" style={{
                color: tokens.colorNeutralForeground3,
                borderColor: tokens.colorNeutralStroke2,
              }}>{tag}</Badge>
            ))}
            {pkg.tags.length > 3 && (
              <Badge appearance="outline" size="small" style={{
                color: tokens.colorNeutralForeground4,
                borderColor: tokens.colorNeutralStroke2,
              }}>+{pkg.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </div>

      {/* Bottom metrics bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        background: tokens.colorNeutralBackground2,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'hidden', minWidth: 0 }}>
          <Tooltip content="Weekly downloads" relationship="label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <ArrowDownload16Regular style={{ fontSize: 12 }} />
              {formatDownloads(pkg.weekly_downloads)}
            </span>
          </Tooltip>
          <Tooltip content="GitHub stars" relationship="label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Star16Regular style={{ fontSize: 12 }} />
              {formatDownloads(pkg.github_stars)}
            </span>
          </Tooltip>
          {pkg.bundle_size_gzip != null && (
            <Tooltip content="Bundle size (gzip)" relationship="label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Archive16Regular style={{ fontSize: 12 }} />
                {formatBytes(pkg.bundle_size_gzip)}
              </span>
            </Tooltip>
          )}
          {pkg.has_types && (
            <Tooltip content="TypeScript types" relationship="label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: tokens.colorBrandForeground1 }}>
                <CheckmarkCircle16Regular style={{ fontSize: 12 }} />
                TS
              </span>
            </Tooltip>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {pkg.category && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
              {pkg.category.name}
            </Text>
          )}
          {pkg.last_published_at && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
              {timeAgo(pkg.last_published_at)}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}
