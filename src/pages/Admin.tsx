import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Field,
  Spinner,
  Card,
  Badge,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  makeStyles,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  Dismiss24Regular,
  Globe24Regular,
  Tag24Regular,
  Info16Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/usePackages';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import type { Package } from '@/types';

const useStyles = makeStyles({
  formPanel: {
    marginBottom: tokens.spacingVerticalL,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`,
    borderRadius: tokens.borderRadiusXLarge,
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    maxWidth: '640px',
  },
  fullSpan: {
    gridColumn: '1 / -1',
  },
  sectionLabel: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
  },
  formActions: {
    gridColumn: '1 / -1',
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalXS,
  },
  pkgRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },
});

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const categories = useCategories();
  const styles = useStyles();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [formName, setFormName] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRepoUrl, setFormRepoUrl] = useState('');
  const [formNpmUrl, setFormNpmUrl] = useState('');
  const [formTags, setFormTags] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from('packages').select('*, category:categories(*)').order('name');
    setPackages((data as Package[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async () => {
    setSaving(true);
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    await supabase.from('packages').insert({
      name: formName,
      scope: formScope || null,
      description: formDesc || null,
      category_id: formCategory || null,
      npm_url: formNpmUrl || `https://www.npmjs.com/package/${formScope ? `@${formScope}/` : ''}${formName}`,
      repo_url: formRepoUrl || null,
      tags,
    });
    setShowAdd(false);
    setFormName(''); setFormScope(''); setFormDesc(''); setFormCategory(''); setFormRepoUrl(''); setFormNpmUrl(''); setFormTags('');
    setSaving(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('packages').delete().eq('id', id);
    fetchAll();
  };

  if (authLoading) return <Spinner label="Loading..." />;

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
        <Header />
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text size={500}>Admin access required</Text>
          <br />
          <Button appearance="primary" onClick={() => navigate('/')} style={{ marginTop: tokens.spacingVerticalM }}>
            Go to catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: tokens.colorNeutralBackground2 }}>
      <Header />

      <main style={{ flex: 1, overflow: 'auto', padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalM }}>
          <Text size={600} weight="semibold">Admin — Manage Packages</Text>
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowAdd(!showAdd)}>
            Add Package
          </Button>
        </div>

        {showAdd && (
          <Card className={styles.formPanel}>
            <div className={styles.formHeader}>
              <Text size={500} weight="semibold">Add New Package</Text>
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setShowAdd(false)}
                aria-label="Close form"
              />
            </div>

            <div className={styles.formGrid}>
              {/* ── Package identity ── */}
              <Field label="Package name" required hint="The npm package name without scope">
                <Input
                  value={formName}
                  onChange={(_e, d) => setFormName(d.value)}
                  placeholder="e.g. react-query"
                  autoFocus
                />
              </Field>

              <Field label="Scope" hint="Omit the @ prefix">
                <Input
                  value={formScope}
                  onChange={(_e, d) => setFormScope(d.value)}
                  placeholder="e.g. tanstack"
                  contentBefore={<Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>@</Text>}
                />
              </Field>

              <Field label="Description" className={styles.fullSpan}>
                <Textarea
                  value={formDesc}
                  onChange={(_e, d) => setFormDesc(d.value)}
                  placeholder="A brief description of what the package does"
                  rows={3}
                  resize="vertical"
                />
              </Field>

              {/* ── Classification ── */}
              <div className={styles.sectionLabel}>
                <Tag24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Classification
                </Text>
              </div>

              <Field label="Category">
                <Dropdown
                  placeholder="Select a category"
                  value={categories.find(c => c.id === formCategory)?.name ?? ''}
                  onOptionSelect={(_e, d) => setFormCategory(d.optionValue as string)}
                >
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Tags" hint="Comma-separated keywords for search">
                <Input
                  value={formTags}
                  onChange={(_e, d) => setFormTags(d.value)}
                  placeholder="e.g. react, hooks, state"
                />
              </Field>

              {/* ── Links ── */}
              <div className={styles.sectionLabel}>
                <Globe24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Links
                </Text>
              </div>

              <Field label="Repository URL" className={styles.fullSpan}>
                <Input
                  value={formRepoUrl}
                  onChange={(_e, d) => setFormRepoUrl(d.value)}
                  placeholder="https://github.com/org/repo"
                  type="url"
                />
              </Field>

              <Field
                label="npm URL"
                className={styles.fullSpan}
                hint={
                  <>
                    <Info16Regular style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                    Auto-generated from name &amp; scope if left blank
                  </>
                }
              >
                <Input
                  value={formNpmUrl}
                  onChange={(_e, d) => setFormNpmUrl(d.value)}
                  placeholder="https://www.npmjs.com/package/..."
                  type="url"
                />
              </Field>

              {/* ── Actions ── */}
              <div className={styles.formActions}>
                <Button appearance="primary" onClick={handleAdd} disabled={!formName.trim() || saving}>
                  {saving ? <><Spinner size="tiny" /> Saving…</> : 'Add Package'}
                </Button>
                <Button appearance="subtle" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <Spinner label="Loading packages..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
            {packages.map(pkg => (
              <Card key={pkg.id} className={styles.pkgRow}>
                <div>
                  <Text weight="semibold">
                    {pkg.scope ? `@${pkg.scope}/` : ''}{pkg.name}
                  </Text>
                  {pkg.latest_version && (
                    <Badge appearance="outline" size="small" style={{ marginLeft: tokens.spacingHorizontalXS }}>
                      v{pkg.latest_version}
                    </Badge>
                  )}
                  <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                    {pkg.description ?? 'No description'}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                  <Dialog>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="subtle" size="small" icon={<Delete24Regular />} title="Delete" />
                    </DialogTrigger>
                    <DialogSurface>
                      <DialogBody>
                        <DialogTitle>Delete package?</DialogTitle>
                        <DialogContent>
                          This will remove <strong>{pkg.name}</strong> from the catalog. This cannot be undone.
                        </DialogContent>
                        <DialogActions>
                          <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Cancel</Button>
                          </DialogTrigger>
                          <Button appearance="primary" onClick={() => handleDelete(pkg.id)}>Delete</Button>
                        </DialogActions>
                      </DialogBody>
                    </DialogSurface>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
