import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Upload,
  Trash2,
  Plus,
  X,
  Code2,
  LayoutList,
  Pencil,
  Check,
} from 'lucide-react';
import {
  fetchBrandDna,
  fetchBrandDnaRaw,
  updateBrandDnaRaw,
  updateBrandSection,
  fetchBrandMedia,
  uploadBrandMedia,
  deleteBrandMedia,
  fetchBrandProducts,
  createBrandProduct,
  updateBrandProduct,
  deleteBrandProduct,
  fetchReferenceAds,
  uploadReferenceAd,
  updateReferenceAdLabel,
  deleteReferenceAd,
} from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Section = 'overview' | 'visual_system' | 'photography_direction' | 'ad_creative_style' | 'prompt_modifier';

const SECTION_LABELS: Record<Section, string> = {
  overview: 'Brand Overview',
  visual_system: 'Visual System',
  photography_direction: 'Photography Direction',
  ad_creative_style: 'Ad Creative Style',
  prompt_modifier: 'Image Prompt Modifier',
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  delivery_platform: string;
  distinctive_features: string[];
  ecosystem: string;
}

function TagList({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add item and press Enter"
          className="h-9 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} className="h-9 px-3">
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}

function SectionCard({ title, children, onSave, saving, defaultOpen = false }: {
  title: string; children: React.ReactNode; onSave: () => void; saving: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden py-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && (
        <>
          <Separator />
          <CardContent className="space-y-4 pt-4 pb-5">
            {children}
            <div className="flex justify-end pt-2">
              <Button onClick={onSave} disabled={saving}>
                <Save size={14} />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

function ProductImages({ productId }: { productId: string }) {
  const [files, setFiles] = useState<{ filename: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productId) fetchBrandMedia('product-images', productId).then(setFiles);
  }, [productId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadBrandMedia('product-images', file, productId);
      setFiles((prev) => [...prev, { filename: result.filename, url: result.url }]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    await deleteBrandMedia('product-images', filename, productId);
    setFiles((prev) => prev.filter((f) => f.filename !== filename));
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Images</span>
        <label className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-muted text-xs text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
          <Upload size={12} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">No images yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {files.map((f) => (
            <div key={f.filename} className="group relative rounded-lg overflow-hidden bg-background aspect-square">
              <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(f.filename)}
                  className="h-7 w-7 rounded-full"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '', description: '', price: '', delivery_platform: '', distinctive_features: [], ecosystem: '',
};

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProduct, setNewProduct] = useState<{ id: string } & Omit<Product, 'id'>>({ id: '', ...EMPTY_PRODUCT });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBrandProducts().then(setProducts).catch(console.error);
  }, []);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({ ...p });
    setExpandedId(p.id);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const updated = await updateBrandProduct(id, editDraft as Record<string, unknown>);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBrandProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleCreate = async () => {
    if (!newProduct.id || !newProduct.name) return;
    setCreating(true);
    try {
      const created = await createBrandProduct(newProduct as Record<string, unknown>);
      setProducts((prev) => [...prev, created]);
      setNewProduct({ id: '', ...EMPTY_PRODUCT });
      setShowNewForm(false);
      setExpandedId(created.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {products.map((p) => {
        const isOpen = expandedId === p.id;
        const isEditing = editingId === p.id;
        const draft = isEditing ? editDraft : p;

        return (
          <Card key={p.id} className="overflow-hidden py-0">
            <div className="flex items-center justify-between px-5 py-3">
              <button
                onClick={() => setExpandedId(isOpen ? null : p.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="font-semibold text-foreground">{p.name}</span>
                {p.price && <span className="text-xs text-accent">{p.price}</span>}
                {isOpen
                  ? <ChevronUp size={14} className="text-muted-foreground ml-auto" />
                  : <ChevronDown size={14} className="text-muted-foreground ml-auto" />}
              </button>
              <div className="flex items-center gap-1 ml-4">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={() => handleSave(p.id)} disabled={saving}>
                      <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      className="h-8 w-8 hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isOpen && (
              <>
                <Separator />
                <CardContent className="pt-4 pb-5 space-y-4">
                  {isEditing ? (
                    <>
                      <TextField label="Name" value={(draft as Product).name ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} />
                      <TextField label="Description" value={(draft as Product).description ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, description: v }))} multiline />
                      <TextField label="Price" value={(draft as Product).price ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, price: v }))} />
                      <TextField label="Delivery Platform" value={(draft as Product).delivery_platform ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, delivery_platform: v }))} />
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Distinctive Features</Label>
                        <TagList values={(draft as Product).distinctive_features ?? []} onChange={(v) => setEditDraft((d) => ({ ...d, distinctive_features: v }))} />
                      </div>
                      <TextField label="Ecosystem / Future Plans" value={(draft as Product).ecosystem ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, ecosystem: v }))} multiline />
                    </>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {p.description && <p className="text-foreground">{p.description}</p>}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {p.price && <span><span className="text-muted-foreground">Price:</span> <span className="text-foreground">{p.price}</span></span>}
                        {p.delivery_platform && <span><span className="text-muted-foreground">Platform:</span> <span className="text-foreground">{p.delivery_platform}</span></span>}
                      </div>
                      {p.distinctive_features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {p.distinctive_features.map((f) => (
                            <Badge key={f} variant="secondary">{f}</Badge>
                          ))}
                        </div>
                      )}
                      {p.ecosystem && <p className="text-xs text-muted-foreground">{p.ecosystem}</p>}
                    </div>
                  )}

                  <ProductImages productId={p.id} />
                </CardContent>
              </>
            )}
          </Card>
        );
      })}

      {showNewForm ? (
        <Card className="border-primary/30">
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold text-foreground">New Product</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID (slug)</Label>
                <Input
                  value={newProduct.id}
                  onChange={(e) => setNewProduct((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="gold_trading_bot"
                  className="font-mono text-sm"
                />
              </div>
              <TextField label="Name" value={newProduct.name} onChange={(v) => setNewProduct((p) => ({ ...p, name: v }))} />
            </div>
            <TextField label="Description" value={newProduct.description} onChange={(v) => setNewProduct((p) => ({ ...p, description: v }))} multiline />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Price" value={newProduct.price} onChange={(v) => setNewProduct((p) => ({ ...p, price: v }))} />
              <TextField label="Platform" value={newProduct.delivery_platform} onChange={(v) => setNewProduct((p) => ({ ...p, delivery_platform: v }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newProduct.id || !newProduct.name}>
                <Plus size={14} /> {creating ? 'Creating…' : 'Create product'}
              </Button>
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors"
        >
          <Plus size={16} /> Add product
        </button>
      )}
    </div>
  );
}

function ReferenceImages() {
  const [files, setFiles] = useState<{ filename: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBrandMedia('reference-images').then(setFiles);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadBrandMedia('reference-images', file);
      setFiles((prev) => [...prev, { filename: result.filename, url: result.url }]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    await deleteBrandMedia('reference-images', filename);
    setFiles((prev) => prev.filter((f) => f.filename !== filename));
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Reference Images</h3>
          <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-muted text-sm text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload'}
            <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {files.map((f) => (
              <div key={f.filename} className="group relative rounded-lg overflow-hidden bg-background aspect-square">
                {f.filename.match(/\.(mp4|mov)$/i) ? (
                  <video src={f.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(f.filename)}
                    className="h-7 w-7 rounded-full"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RefAd { filename: string; url: string; label: string }

function ReferenceAdsLibrary() {
  const [ads, setAds] = useState<RefAd[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchReferenceAds().then(setAds); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadReferenceAd(file);
      setAds((prev) => [...prev, result]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSaveLabel = async (filename: string) => {
    const updated = await updateReferenceAdLabel(filename, labelDraft);
    setAds((prev) => prev.map((a) => a.filename === filename ? { ...a, label: updated.label } : a));
    setEditingLabel(null);
  };

  const handleDelete = async (filename: string) => {
    await deleteReferenceAd(filename);
    setAds((prev) => prev.filter((a) => a.filename !== filename));
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Reference Ads Library</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ads de referencia de la marca — usados como contexto en generación.</p>
          </div>
          <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-muted text-sm text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
            <Upload size={14} />
            {uploading ? 'Subiendo…' : 'Subir ad'}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        {ads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay ads de referencia todavía.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ads.map((ad) => (
              <div key={ad.filename} className="group relative rounded-lg overflow-hidden bg-background border border-border">
                <img src={ad.url} alt={ad.label || ad.filename} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setEditingLabel(ad.filename); setLabelDraft(ad.label); }}
                    className="h-7 text-xs"
                  >
                    <Pencil size={11} /> Etiquetar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(ad.filename)}
                    className="h-7 text-xs"
                  >
                    <Trash2 size={11} /> Eliminar
                  </Button>
                </div>
                {ad.label && (
                  <div className="px-2 py-1 text-xs text-muted-foreground truncate border-t border-border">{ad.label}</div>
                )}
                {editingLabel === ad.filename && (
                  <div className="absolute inset-x-0 bottom-0 bg-card p-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      autoFocus
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(ad.filename)}
                      placeholder="Etiqueta..."
                      className="h-7 text-xs"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleSaveLabel(ad.filename)} className="h-7 w-7 text-accent">
                      <Check size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingLabel(null)} className="h-7 w-7">
                      <X size={13} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlainTextEditor({ onSwitchToStructured: _onSwitchToStructured }: { onSwitchToStructured: () => void }) {
  const [jsonStr, setJsonStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBrandDnaRaw().then((data) => {
      setJsonStr(data.json_str);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      JSON.parse(jsonStr);
      await updateBrandDnaRaw(jsonStr);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Editing brand-dna.json directly. Invalid JSON will be rejected on save.</p>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <Textarea
        value={jsonStr}
        onChange={(e) => setJsonStr(e.target.value)}
        rows={30}
        spellCheck={false}
        className="font-mono text-xs"
      />
    </div>
  );
}

export default function Brand() {
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState<Section | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  useEffect(() => {
    fetchBrandDna().then(setDna);
  }, []);

  if (!dna) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading brand DNA…</div>;
  }

  const get = (section: string, field: string): string =>
    ((dna[section] as Record<string, unknown>)?.[field] as string) ?? '';

  const getList = (section: string, field: string): string[] =>
    ((dna[section] as Record<string, unknown>)?.[field] as string[]) ?? [];

  const set = (section: string, field: string, value: unknown) => {
    setDna((prev) => ({
      ...prev!,
      [section]: { ...(prev![section] as object), [field]: value },
    }));
  };

  const save = async (section: Section) => {
    setSaving(section);
    try {
      const sectionKey = section === 'prompt_modifier' ? 'prompt-modifier' : section.replace(/_/g, '-');
      const body = section === 'prompt_modifier'
        ? { image_prompt_modifier: dna.image_prompt_modifier }
        : dna[section];
      await updateBrandSection(sectionKey, body as Record<string, unknown>);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Brand</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your brand identity, visual system, and media assets.</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('structured')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'structured' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutList size={13} /> Structured
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'raw' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Code2 size={13} /> Plain text
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        <PlainTextEditor onSwitchToStructured={() => setViewMode('structured')} />
      ) : (
        <>
          <SectionCard title={SECTION_LABELS.overview} onSave={() => save('overview')} saving={saving === 'overview'} defaultOpen>
            <TextField label="Brand Name" value={get('overview', 'name')} onChange={(v) => set('overview', 'name', v)} />
            <TextField label="Tagline" value={get('overview', 'tagline')} onChange={(v) => set('overview', 'tagline', v)} />
            <TextField label="Design Agency" value={get('overview', 'design_agency')} onChange={(v) => set('overview', 'design_agency', v)} />
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Voice Adjectives</Label>
              <TagList values={getList('overview', 'voice_adjectives')} onChange={(v) => set('overview', 'voice_adjectives', v)} />
            </div>
            <TextField label="Positioning" value={get('overview', 'positioning')} onChange={(v) => set('overview', 'positioning', v)} multiline />
            <TextField label="Competitive Differentiation" value={get('overview', 'competitive_differentiation')} onChange={(v) => set('overview', 'competitive_differentiation', v)} multiline />
          </SectionCard>

          <SectionCard title={SECTION_LABELS.visual_system} onSave={() => save('visual_system')} saving={saving === 'visual_system'}>
            <TextField label="Primary Font" value={get('visual_system', 'primary_font')} onChange={(v) => set('visual_system', 'primary_font', v)} />
            <TextField label="Secondary Font" value={get('visual_system', 'secondary_font')} onChange={(v) => set('visual_system', 'secondary_font', v)} />
            <TextField label="Primary Color" value={get('visual_system', 'primary_color')} onChange={(v) => set('visual_system', 'primary_color', v)} />
            <TextField label="Secondary Color" value={get('visual_system', 'secondary_color')} onChange={(v) => set('visual_system', 'secondary_color', v)} />
            <TextField label="Accent Color" value={get('visual_system', 'accent_color')} onChange={(v) => set('visual_system', 'accent_color', v)} />
            <TextField label="Background Colors" value={get('visual_system', 'background_colors')} onChange={(v) => set('visual_system', 'background_colors', v)} />
            <TextField label="Text Colors" value={get('visual_system', 'text_colors')} onChange={(v) => set('visual_system', 'text_colors', v)} />
            <TextField label="CTA Style" value={get('visual_system', 'cta_style')} onChange={(v) => set('visual_system', 'cta_style', v)} />
          </SectionCard>

          <SectionCard title={SECTION_LABELS.photography_direction} onSave={() => save('photography_direction')} saving={saving === 'photography_direction'}>
            <TextField label="Lighting" value={get('photography_direction', 'lighting')} onChange={(v) => set('photography_direction', 'lighting', v)} multiline />
            <TextField label="Color Grading" value={get('photography_direction', 'color_grading')} onChange={(v) => set('photography_direction', 'color_grading', v)} />
            <TextField label="Composition" value={get('photography_direction', 'composition')} onChange={(v) => set('photography_direction', 'composition', v)} />
            <TextField label="Subject Matter" value={get('photography_direction', 'subject_matter')} onChange={(v) => set('photography_direction', 'subject_matter', v)} />
            <TextField label="Props and Surfaces" value={get('photography_direction', 'props_and_surfaces')} onChange={(v) => set('photography_direction', 'props_and_surfaces', v)} />
            <TextField label="Mood" value={get('photography_direction', 'mood')} onChange={(v) => set('photography_direction', 'mood', v)} />
          </SectionCard>

          <Card className="overflow-hidden py-0">
            <div className="px-5 py-4">
              <h3 className="font-semibold text-foreground">Product Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Each product has its own description and image gallery.</p>
            </div>
            <Separator />
            <CardContent className="pt-5">
              <ProductsManager />
            </CardContent>
          </Card>

          <SectionCard title={SECTION_LABELS.ad_creative_style} onSave={() => save('ad_creative_style')} saving={saving === 'ad_creative_style'}>
            <TextField label="Typical Formats" value={get('ad_creative_style', 'typical_formats')} onChange={(v) => set('ad_creative_style', 'typical_formats', v)} multiline />
            <TextField label="Text Overlay Style" value={get('ad_creative_style', 'text_overlay_style')} onChange={(v) => set('ad_creative_style', 'text_overlay_style', v)} multiline />
            <TextField label="Photo vs Illustration" value={get('ad_creative_style', 'photo_vs_illustration')} onChange={(v) => set('ad_creative_style', 'photo_vs_illustration', v)} multiline />
            <TextField label="UGC Usage" value={get('ad_creative_style', 'ugc_usage')} onChange={(v) => set('ad_creative_style', 'ugc_usage', v)} />
            <TextField label="Offer Presentation" value={get('ad_creative_style', 'offer_presentation')} onChange={(v) => set('ad_creative_style', 'offer_presentation', v)} multiline />
          </SectionCard>

          <SectionCard title={SECTION_LABELS.prompt_modifier} onSave={() => save('prompt_modifier')} saving={saving === 'prompt_modifier'}>
            <p className="text-xs text-muted-foreground">
              This text is automatically prepended to every image generation prompt to enforce brand visual style.
            </p>
            <Textarea
              value={(dna.image_prompt_modifier as string) ?? ''}
              onChange={(e) => setDna((prev) => ({ ...prev!, image_prompt_modifier: e.target.value }))}
              rows={5}
              className="font-mono text-sm"
            />
          </SectionCard>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Reference Images</h3>
            <ReferenceImages />
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Reference Ads Library</h3>
            <ReferenceAdsLibrary />
          </div>
        </>
      )}
    </div>
  );
}
