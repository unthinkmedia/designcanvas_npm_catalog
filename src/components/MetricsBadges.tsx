import { Badge, Text, Tooltip, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Star24Regular,
  Bug24Regular,
  Archive24Regular,
  CheckmarkCircle16Regular,
} from '@fluentui/react-icons';
import { formatDownloads, formatBytes, timeAgo } from '@/lib/npm-api';
import type { Package } from '@/types';

interface MetricsBadgesProps {
  pkg: Package;
  compact?: boolean;
}

export function MetricsBadges({ pkg, compact }: MetricsBadgesProps) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: compact ? tokens.spacingHorizontalXS : tokens.spacingHorizontalS,
      fontSize: tokens.fontSizeBase200,
      color: tokens.colorNeutralForeground3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    }}>
      <Tooltip content="Weekly downloads" relationship="label">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <ArrowDownload24Regular style={{ width: 14, height: 14 }} />
          {formatDownloads(pkg.weekly_downloads)}/wk
        </span>
      </Tooltip>

      <Tooltip content="GitHub stars" relationship="label">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <Star24Regular style={{ width: 14, height: 14 }} />
          {formatDownloads(pkg.github_stars)}
        </span>
      </Tooltip>

      {pkg.bundle_size_gzip != null && (
        <Tooltip content="Bundle size (gzip)" relationship="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Archive24Regular style={{ width: 14, height: 14 }} />
            {formatBytes(pkg.bundle_size_gzip)}
          </span>
        </Tooltip>
      )}

      {pkg.license && (
        <Badge appearance="outline" size="small" color="informative">{pkg.license}</Badge>
      )}

      {pkg.has_types && (
        <Tooltip content="TypeScript types included" relationship="label">
          <Badge appearance="tint" size="small" color="brand" icon={<CheckmarkCircle16Regular />}>
            TS
          </Badge>
        </Tooltip>
      )}

      {!compact && pkg.open_issues_count > 0 && (
        <Tooltip content="Open issues" relationship="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Bug24Regular style={{ width: 14, height: 14 }} />
            {pkg.open_issues_count}
          </span>
        </Tooltip>
      )}

      {pkg.last_published_at && (
        <Tooltip content={`Last published: ${new Date(pkg.last_published_at).toLocaleDateString()}`} relationship="label">
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            {timeAgo(pkg.last_published_at)}
          </Text>
        </Tooltip>
      )}
    </div>
  );
}
