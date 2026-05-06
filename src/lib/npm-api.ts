const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_API = 'https://api.npmjs.org';
const BUNDLEPHOBIA = 'https://bundlephobia.com/api';

export interface NpmPackageInfo {
  name: string;
  description: string;
  readme?: string;
  'dist-tags': { latest: string };
  license?: string;
  time: Record<string, string>;
  maintainers: { name: string; email?: string }[];
  repository?: { type: string; url: string };
  versions: Record<string, { types?: string; typings?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>;
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
  const encodedName = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
  const res = await fetch(`${NPM_REGISTRY}/${encodedName}`);
  if (!res.ok) throw new Error(`npm registry: ${res.status}`);
  return res.json();
}

export async function fetchWeeklyDownloads(name: string): Promise<number> {
  const encodedName = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
  const res = await fetch(`${NPM_API}/downloads/point/last-week/${encodedName}`);
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

/**
 * Fetch the latest version + publish date for a package from npm.
 * Uses the abbreviated registry endpoint for speed.
 */
export async function fetchLatestVersion(name: string): Promise<{ version: string; date: string; downloads: number } | null> {
  try {
    const encodedName = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
    // Fetch packument for dist-tags + time
    const res = await fetch(`${NPM_REGISTRY}/${encodedName}`);
    if (!res.ok) return null;
    const data = await res.json();
    const version = data['dist-tags']?.latest;
    if (!version) return null;
    const date = data.time?.[version] ?? new Date().toISOString();
    const downloads = await fetchWeeklyDownloads(name);
    return { version, date, downloads };
  } catch {
    return null;
  }
}
