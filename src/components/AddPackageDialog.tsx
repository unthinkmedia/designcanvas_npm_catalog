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
import { supabase } from '@/lib/supabase';
import { fetchNpmPackage, fetchWeeklyDownloads, fetchBundleSize } from '@/lib/npm-api';

interface AddPackageDialogProps {
  onAdded?: () => void;
}

export function AddPackageDialog({ onAdded }: AddPackageDialogProps) {
  const categories = useCategories();
  const [open, setOpen] = useState(false);

  // Lookup state
  const [npmName, setNpmName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looked, setLooked] = useState(false);

  // Form fields (populated by lookup or manually)
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [license, setLicense] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [hasTypes, setHasTypes] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reset = () => {
    setNpmName('');
    setLookupError(null);
    setLooked(false);
    setName('');
    setScope('');
    setDescription('');
    setCategoryId('');
    setRepoUrl('');
    setTags('');
    setLicense('');
    setLatestVersion('');
    setHasTypes(false);
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

      // Fetch downloads + bundle size in parallel
      const [downloads, bundle] = await Promise.all([
        fetchWeeklyDownloads(trimmed),
        fetchBundleSize(trimmed),
      ]);

      // Store these for the save
      setLookupMeta({ downloads, bundleGzip: bundle?.gzip ?? null });
      setLooked(true);
    } catch {
      setLookupError(`Package "${trimmed}" not found on npm`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Extra metadata from lookup (not editable in form)
  const [lookupMeta, setLookupMeta] = useState<{ downloads: number; bundleGzip: number | null }>({
    downloads: 0,
    bundleGzip: null,
  });

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const fullName = scope ? `@${scope}/${name}` : name;

    const { error } = await supabase.from('packages').insert({
      name,
      scope: scope || null,
      description: description || null,
      category_id: categoryId || null,
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
    });

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
    reset();
    onAdded?.();
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
        <Button appearance="primary" icon={<Add24Regular />}>
          Add Package
        </Button>
      </DialogTrigger>

      <DialogSurface style={{ maxWidth: 560 }}>
        <DialogBody>
          <DialogTitle>Add an npm Package</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>

            {/* npm lookup */}
            <Field
              label="npm package name"
              hint="e.g. react, @tanstack/react-query, lodash"
              validationState={lookupError ? 'error' : undefined}
              validationMessage={lookupError}
            >
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Input
                  value={npmName}
                  onChange={(_e, d) => { setNpmName(d.value); setLooked(false); setLookupError(null); }}
                  placeholder="@scope/package-name"
                  contentBefore={<Search16Regular />}
                  style={{ flex: 1 }}
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

            {/* Editable fields */}
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
              <Field label="Category">
                <Dropdown
                  placeholder="Select a category"
                  value={categories.find(c => c.id === categoryId)?.name ?? ''}
                  onOptionSelect={(_e, d) => setCategoryId(d.optionValue as string)}
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

            {saveError && (
              <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {saveError}
              </Text>
            )}
          </DialogContent>

          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" icon={<Dismiss16Regular />}>Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
              icon={saving ? <Spinner size="tiny" /> : <Add24Regular />}
            >
              {saving ? 'Adding…' : 'Add Package'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
