import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Button,
  Input,
  Textarea,
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
  Delete24Regular,
  Dismiss24Regular,
  Edit24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import type { Package } from '@/types';

const useStyles = makeStyles({
  pkgRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },
  editRow: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    maxWidth: '640px',
  },
});

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const styles = useStyles();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editNpmUrl, setEditNpmUrl] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setEditDisplayName(pkg.display_name ?? '');
    setEditDesc(pkg.description ?? '');
    setEditScope(pkg.scope ?? '');
    setEditRepoUrl(pkg.repo_url ?? '');
    setEditNpmUrl(pkg.npm_url ?? '');
    setEditTags((pkg.tags ?? []).join(', '));
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (pkg: Package) => {
    setEditSaving(true);
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    await supabase.from('packages').update({
      display_name: editDisplayName || null,
      description: editDesc || null,
      scope: editScope || null,
      repo_url: editRepoUrl || null,
      npm_url: editNpmUrl || null,
      tags,
    }).eq('id', pkg.id);
    setEditingId(null);
    setEditSaving(false);
    fetchAll();
  };

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from('packages').select('*, categories(*)')  .order('name');
    setPackages((data as Package[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
        <div style={{ marginBottom: tokens.spacingVerticalM }}>
          <Text size={600} weight="semibold">Admin — Manage Packages</Text>
        </div>

        {loading ? (
          <Spinner label="Loading packages..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
            {packages.map(pkg => (
              <Card key={pkg.id} className={editingId === pkg.id ? styles.editRow : styles.pkgRow}>
                {editingId === pkg.id ? (
                  /* ── Inline edit form ── */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS }}>
                      <Text size={400} weight="semibold">
                        Editing: {pkg.scope ? `@${pkg.scope}/` : ''}{pkg.name}
                      </Text>
                      <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={cancelEdit} size="small" aria-label="Cancel edit" />
                    </div>
                    <div className={styles.editGrid}>
                      <Field label="Display Name" hint="Friendly name shown on cards">
                        <Input
                          value={editDisplayName}
                          onChange={(_e, d) => setEditDisplayName(d.value)}
                          placeholder="e.g. A11y Checker"
                          autoFocus
                        />
                      </Field>
                      <Field label="Scope" hint="Omit the @ prefix">
                        <Input
                          value={editScope}
                          onChange={(_e, d) => setEditScope(d.value)}
                          placeholder="e.g. tanstack"
                          contentBefore={<Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>@</Text>}
                        />
                      </Field>
                      <Field label="Tags" hint="Comma-separated">
                        <Input
                          value={editTags}
                          onChange={(_e, d) => setEditTags(d.value)}
                          placeholder="e.g. react, hooks"
                        />
                      </Field>
                      <Field label="Description" style={{ gridColumn: '1 / -1' }}>
                        <Textarea
                          value={editDesc}
                          onChange={(_e, d) => setEditDesc(d.value)}
                          placeholder="Package description"
                          rows={2}
                          resize="vertical"
                          autoFocus
                        />
                      </Field>
                      <Field label="Repository URL">
                        <Input
                          value={editRepoUrl}
                          onChange={(_e, d) => setEditRepoUrl(d.value)}
                          placeholder="https://github.com/org/repo"
                          type="url"
                        />
                      </Field>
                      <Field label="npm URL">
                        <Input
                          value={editNpmUrl}
                          onChange={(_e, d) => setEditNpmUrl(d.value)}
                          placeholder="https://www.npmjs.com/package/..."
                          type="url"
                        />
                      </Field>
                    </div>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalS }}>
                      <Button appearance="primary" icon={<Checkmark24Regular />} onClick={() => handleSaveEdit(pkg)} disabled={editSaving} size="small">
                        {editSaving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button appearance="subtle" onClick={cancelEdit} size="small">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Read-only row ── */
                  <>
                    <div>
                      <Text weight="semibold">
                        {pkg.display_name ?? (pkg.scope ? `@${pkg.scope}/` : '') + pkg.name}
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
                      <Button appearance="subtle" size="small" icon={<Edit24Regular />} title="Edit" onClick={() => startEdit(pkg)} />
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
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
