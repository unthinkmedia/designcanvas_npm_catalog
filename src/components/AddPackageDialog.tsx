import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Field,
  Spinner,
  Badge,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Search16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { useCategories } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { fetchNpmPackage, fetchWeeklyDownloads, fetchBundleSize } from '@/lib/npm-api';

function extractGithubOwner(repoUrl?: string): string | null {
  if (!repoUrl) return null;
  const match = repoUrl.match(/github\.com[/:]([^/]+)/);
  return match?.[1] ?? null;
}

async function fetchPluginMetaName(packageName: string, version: string): Promise<string | null> {
  if (!version) return null;
  try {
    const res = await fetch(`https://unpkg.com/${encodeURIComponent(packageName)}@${version}/dist/index.js`);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/meta:\s*\{[^}]*name:\s*"([^"]+)"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

interface AddPackageDialogProps {
  onAdded?: () => void;
}

export function AddPackageDialog({ onAdded }: AddPackageDialogProps) {
  const categories = useCategories();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Lookup state
  const [npmName, setNpmName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looked, setLooked] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  // Form fields (populated by lookup or manually)
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [description, setDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [license, setLicense] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [hasTypes, setHasTypes] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Show detail fields after successful lookup or manual fallback
  const showFields = looked || manualEntry;

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reset = () => {
    setNpmName('');
    setLookupError(null);
    setLooked(false);
    setManualEntry(false);
    setName('');
    setScope('');
    setDescription('');
    setCategoryIds([]);
    setRepoUrl('');
    setTags('');
    setLicense('');
    setLatestVersion('');
    setHasTypes(false);
    setDisplayName('');
    setSaveError(null);
  };

  const handleLookup = async () => {
    const trimmed = npmName.trim();
    if (!trimmed) return;

    setLookupLoading(true);
    setLookupError(null);
    setLooked(false);

    try {
      const info = await fetchNpmPackage(trimmed);

      // Check for duplicates in the catalog
      const pkgName = info.name.startsWith('@') ? info.name.split('/')[1] : info.name;
      const pkgScope = info.name.startsWith('@') ? info.name.slice(1).split('/')[0] : null;
      let dupQuery = supabase.from('packages').select('id').eq('name', pkgName);
      if (pkgScope) dupQuery = dupQuery.eq('scope', pkgScope);
      else dupQuery = dupQuery.is('scope', null);
      const { data: existing } = await dupQuery.maybeSingle();
      if (existing) {
        setLookupError(`"${info.name}" is already in the catalog.`);
        setLookupLoading(false);
        return;
      }

      // Parse scope/name
      if (info.name.startsWith('@')) {
        const [s, n] = info.name.slice(1).split('/');
        setScope(s ?? '');
        setName(n ?? '');
      } else {
        setScope('');
        setName(info.name);
      }

      setDescription(info.description ?? '');
      setLatestVersion(info['dist-tags']?.latest ?? '');
      setLicense(info.license ?? '');

      // Repo URL
      if (info.repository?.url) {
        const clean = info.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
        setRepoUrl(clean);
      }

      // Check for types in latest version
      const latest = info['dist-tags']?.latest;
      if (latest && info.versions?.[latest]) {
        const v = info.versions[latest];
        setHasTypes(!!(v.types || v.typings));
      }

      // Fetch downloads + bundle size + plugin meta.name in parallel
      const [downloads, bundle, pluginDisplayName] = await Promise.all([
        fetchWeeklyDownloads(trimmed),
        fetchBundleSize(trimmed),
        fetchPluginMetaName(trimmed, latest ?? ''),
      ]);

      if (pluginDisplayName) setDisplayName(pluginDisplayName);

      // Store these for the save
      setLookupMeta({
        downloads,
        bundleGzip: bundle?.gzip ?? null,
        maintainer: info.maintainers?.[0]?.name ?? null,
        repoOwner: extractGithubOwner(info.repository?.url),
      });
      setLooked(true);
    } catch {
      setLookupError(`Package "${trimmed}" not found on npm`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Extra metadata from lookup (not editable in form)
  const [lookupMeta, setLookupMeta] = useState<{
    downloads: number;
    bundleGzip: number | null;
    maintainer: string | null;
    repoOwner: string | null;
  }>({
    downloads: 0,
    bundleGzip: null,
    maintainer: null,
    repoOwner: null,
  });

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const fullName = scope ? `@${scope}/${name}` : name;

    // Upsert author: prefer signed-in user's GitHub identity, fallback to npm data
    let authorId: string | null = null;
    const signedInGh = user?.user_metadata?.['user_name'] as string | undefined;
    const ghUsername = signedInGh ?? lookupMeta.repoOwner ?? lookupMeta.maintainer;
    if (ghUsername) {
      const { data: existing } = await supabase
        .from('authors')
        .select('id')
        .eq('github_username', ghUsername)
        .single();

      if (existing) {
        authorId = existing.id;
      } else {
        const { data: newAuthor } = await supabase
          .from('authors')
          .insert({
            github_username: ghUsername,
            display_name: ghUsername,
            avatar_url: `https://github.com/${ghUsername}.png`,
            github_url: `https://github.com/${ghUsername}`,
          })
          .select('id')
          .single();
        authorId = newAuthor?.id ?? null;
      }
    }

    const { data: inserted, error } = await supabase.from('packages').insert({
      name,
      scope: scope || null,
      display_name: displayName || null,
      description: description || null,
      author_id: authorId,
      added_by: user?.id ?? null,
      npm_url: `https://www.npmjs.com/package/${encodeURIComponent(fullName)}`,
      repo_url: repoUrl || null,
      tags: tagList,
      license: license || null,
      latest_version: latestVersion || null,
      has_types: hasTypes,
      weekly_downloads: lookupMeta.downloads,
      bundle_size_gzip: lookupMeta.bundleGzip,
      last_published_at: null,
      metrics_updated_at: new Date().toISOString(),
    }).select('id').single();

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    // Insert category associations (max 3 enforced by DB trigger)
    if (inserted && categoryIds.length > 0) {
      const { error: catError } = await supabase.from('package_categories').insert(
        categoryIds.map(cid => ({ package_id: inserted.id, category_id: cid }))
      );
      if (catError) {
        setSaveError(catError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setOpen(false);
    reset();
    onAdded?.();
    window.dispatchEvent(new CustomEvent('package-added'));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(_e, data) => {
        setOpen(data.open);
        if (!data.open) reset();
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="outline" icon={<Add24Regular />}>
          Add Package
        </Button>
      </DialogTrigger>

      <DialogSurface style={{ maxWidth: 560 }}>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action="close">
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<Dismiss16Regular />}
                />
              </DialogTrigger>
            }
          >
            Add an npm Package
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>

            {/* Step 1: npm lookup */}
            <Field
              label="npm package name"
              hint={!showFields ? 'Search for a package to auto-fill its details' : 'e.g. react, @tanstack/react-query, lodash'}
              validationState={lookupError ? 'error' : undefined}
              validationMessage={lookupError ? (
                <span>
                  {lookupError}{' '}
                  <Button
                    appearance="transparent"
                    size="small"
                    style={{ minWidth: 0, padding: 0, height: 'auto', textDecoration: 'underline' }}
                    onClick={() => { setManualEntry(true); setLookupError(null); }}
                  >
                    Enter details manually
                  </Button>
                </span>
              ) : undefined}
            >
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Input
                  value={npmName}
                  onChange={(_e, d) => { setNpmName(d.value); setLooked(false); setLookupError(null); }}
                  placeholder="@scope/package-name"
                  contentBefore={<Search16Regular />}
                  style={{ flex: 1 }}
                  autoFocus={!showFields}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                />
                <Button
                  appearance="outline"
                  onClick={handleLookup}
                  disabled={!npmName.trim() || lookupLoading}
                  icon={lookupLoading ? <Spinner size="tiny" /> : looked ? <Checkmark16Regular /> : undefined}
                >
                  {lookupLoading ? 'Looking up…' : looked ? 'Found' : 'Lookup'}
                </Button>
              </div>
            </Field>

            {/* Step 2: Details (shown after lookup or manual entry) */}
            {showFields && (
              <>
                {looked && (
                  <div style={{
                    display: 'flex',
                    gap: tokens.spacingHorizontalS,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {latestVersion && <Badge appearance="tint" color="brand">v{latestVersion}</Badge>}
                    {license && <Badge appearance="outline">{license}</Badge>}
                    {hasTypes && <Badge appearance="tint" color="success" icon={<Checkmark16Regular />}>TypeScript</Badge>}
                    {lookupMeta.downloads > 0 && (
                      <Badge appearance="outline">{lookupMeta.downloads.toLocaleString()} downloads/wk</Badge>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
                }}>
                  <Field label="Package name" required>
                    <Input value={name} onChange={(_e, d) => setName(d.value)} placeholder="react-query" />
                  </Field>
                  <Field label="Scope">
                    <Input
                      value={scope}
                      onChange={(_e, d) => setScope(d.value)}
                      placeholder="tanstack"
                      contentBefore={<Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>@</Text>}
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <Textarea
                    value={description}
                    onChange={(_e, d) => setDescription(d.value)}
                    placeholder="What does this package do?"
                    rows={2}
                    resize="vertical"
                  />
                </Field>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
                }}>
                  <Field label="Categories" hint="Select up to 3 categories">
                    <Dropdown
                      multiselect
                      placeholder="Select categories"
                      selectedOptions={categoryIds}
                      onOptionSelect={(_e, d) => {
                        if (d.selectedOptions.length <= 3) {
                          setCategoryIds(d.selectedOptions);
                        }
                      }}
                    >
                      {categories.map(c => (
                        <Option key={c.id} value={c.id}>{c.name}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Tags" hint="Comma-separated">
                    <Input
                      value={tags}
                      onChange={(_e, d) => setTags(d.value)}
                      placeholder="react, hooks, state"
                    />
                  </Field>
                </div>

                <Field label="Repository URL">
                  <Input
                    value={repoUrl}
                    onChange={(_e, d) => setRepoUrl(d.value)}
                    placeholder="https://github.com/org/repo"
                    type="url"
                  />
                </Field>
              </>
            )}

            {saveError && (
              <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {saveError}
              </Text>
            )}
          </DialogContent>

          {showFields && (
            <DialogActions>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={!name.trim() || saving}
                icon={saving ? <Spinner size="tiny" /> : <Add24Regular />}
              >
                {saving ? 'Adding…' : 'Add Package'}
              </Button>
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
