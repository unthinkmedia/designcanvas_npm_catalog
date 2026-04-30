const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_API = 'https://api.npmjs.org';
const BUNDLEPHOBIA = 'https://bundlephobia.com/api';

export interface NpmPackageInfo {
  name: string;
  description: string;
  'dist-tags': { latest: string };
  license?: string;
  time: Record<string, string>;
  maintainers: { name: string; email?: string }[];
  repository?: { type: string; url: string };
  versions: Record<string, { types?: string; typings?: string }>;
}

export interface NpmDownloads {
  downloads: number;
  package: string;
  start: string;
  end: string;
}

export interface BundlephobiaResult {
  gzip: number;
  size: number;
  dependencyCount: number;
}

export async function fetchNpmPackage(name: string): Promise<NpmPackageInfo> {
  const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`npm registry: ${res.status}`);
  return res.json();
}

export async function fetchWeeklyDownloads(name: string): Promise<number> {
  const res = await fetch(`${NPM_API}/downloads/point/last-week/${encodeURIComponent(name)}`);
  if (!res.ok) return 0;
  const data: NpmDownloads = await res.json();
  return data.downloads;
}

export async function fetchBundleSize(name: string): Promise<BundlephobiaResult | null> {
  try {
    const res = await fetch(`${BUNDLEPHOBIA}/size?package=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function buildIssuesUrl(repoUrl: string | null, issuesUrl: string | null, packageName: string, version: string | null): string {
  if (issuesUrl) return issuesUrl;
  if (!repoUrl) return `https://github.com/search?q=${encodeURIComponent(packageName)}&type=repositories`;

  const clean = repoUrl.replace(/\.git$/, '').replace(/^git\+/, '');
  const title = encodeURIComponent(`[${packageName}] `);
  const body = encodeURIComponent(
    `**Package:** ${packageName}\n**Version:** ${version ?? 'unknown'}\n\n**Description:**\n\n`
  );
  return `${clean}/issues/new?title=${title}&labels=bug&body=${body}`;
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}kB`;
  return `${bytes}B`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
