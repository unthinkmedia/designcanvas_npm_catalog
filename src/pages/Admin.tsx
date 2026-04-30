import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Label,
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
} from '@fluentui/react-components';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/usePackages';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import type { Package } from '@/types';

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const categories = useCategories();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header search={search} onSearchChange={setSearch} />
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header search={search} onSearchChange={setSearch} />

      <main style={{ flex: 1, overflow: 'auto', padding: tokens.spacingVerticalL }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalM }}>
          <Text size={600} weight="semibold">Admin — Manage Packages</Text>
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowAdd(!showAdd)}>
            Add Package
          </Button>
        </div>

        {showAdd && (
          <Card style={{ marginBottom: tokens.spacingVerticalL, padding: tokens.spacingVerticalM }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
              Add New Package
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, maxWidth: 480 }}>
              <div>
                <Label required>Package name</Label>
                <Input value={formName} onChange={(_e, d) => setFormName(d.value)} placeholder="my-package" />
              </div>
              <div>
                <Label>Scope (without @)</Label>
                <Input value={formScope} onChange={(_e, d) => setFormScope(d.value)} placeholder="myorg" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formDesc} onChange={(_e, d) => setFormDesc(d.value)} placeholder="What does this package do?" />
              </div>
              <div>
                <Label>Category</Label>
                <Dropdown
                  placeholder="Select category"
                  value={categories.find(c => c.id === formCategory)?.name ?? ''}
                  onOptionSelect={(_e, d) => setFormCategory(d.optionValue as string)}
                >
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Dropdown>
              </div>
              <div>
                <Label>Repository URL</Label>
                <Input value={formRepoUrl} onChange={(_e, d) => setFormRepoUrl(d.value)} placeholder="https://github.com/org/repo" />
              </div>
              <div>
                <Label>npm URL (auto-generated if blank)</Label>
                <Input value={formNpmUrl} onChange={(_e, d) => setFormNpmUrl(d.value)} placeholder="https://www.npmjs.com/package/..." />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={formTags} onChange={(_e, d) => setFormTags(d.value)} placeholder="react, hooks, state" />
              </div>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Button appearance="primary" onClick={handleAdd} disabled={!formName || saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button appearance="subtle" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <Spinner label="Loading packages..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
            {packages.map(pkg => (
              <Card key={pkg.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
      </main>
    </div>
  );
}
