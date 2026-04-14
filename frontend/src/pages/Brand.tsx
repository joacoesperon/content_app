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
} from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Small reusable components ────────────────────────────────────────────────

function TagList({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-carbon-light text-sm text-gray-light">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-gray-mid hover:text-white"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add item and press Enter"
          className="flex-1 bg-carbon border border-carbon-light rounded px-3 py-1.5 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric"
        />
        <button onClick={add} className="px-3 py-1.5 bg-carbon-light rounded text-sm text-gray-light hover:text-white"><Plus size={14} /></button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full bg-carbon border border-carbon-light rounded px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric resize-y" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-carbon border border-carbon-light rounded px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric" />
      )}
    </div>
  );
}

function SectionCard({ title, children, onSave, saving, defaultOpen = false }: {
  title: string; children: React.ReactNode; onSave: () => void; saving: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-carbon-dark border border-carbon-light rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-carbon-light/30 transition-colors">
        <span className="font-semibold text-white">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-mid" /> : <ChevronDown size={16} className="text-gray-mid" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-carbon-light pt-4">
          {children}
          <div className="flex justify-end pt-2">
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-electric rounded-lg text-sm font-medium text-white hover:bg-electric/80 disabled:opacity-50 transition-colors">
              <Save size={14} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Images Gallery ───────────────────────────────────────────────────

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
        <span className="text-xs font-medium text-gray-mid uppercase tracking-wider">Product Images</span>
        <label className="flex items-center gap-1.5 px-2.5 py-1 bg-carbon-light rounded text-xs text-gray-light hover:text-white cursor-pointer transition-colors">
          <Upload size={12} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-gray-mid">No images yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {files.map((f) => (
            <div key={f.filename} className="group relative rounded-lg overflow-hidden bg-carbon aspect-square">
              <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => handleDelete(f.filename)} className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Products Manager ─────────────────────────────────────────────────────────

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
          <div key={p.id} className="bg-carbon-dark border border-carbon-light rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <button
                onClick={() => setExpandedId(isOpen ? null : p.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="font-semibold text-white">{p.name}</span>
                {p.price && <span className="text-xs text-neon">{p.price}</span>}
                {isOpen ? <ChevronUp size={14} className="text-gray-mid ml-auto" /> : <ChevronDown size={14} className="text-gray-mid ml-auto" />}
              </button>
              <div className="flex items-center gap-2 ml-4">
                {isEditing ? (
                  <>
                    <button onClick={() => handleSave(p.id)} disabled={saving}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-electric/20 text-electric text-xs hover:bg-electric/30 disabled:opacity-50">
                      <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-2.5 py-1 rounded-lg bg-carbon-light text-gray-mid text-xs hover:text-white">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded text-gray-mid hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-gray-mid hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-carbon-light pt-4 space-y-4">
                {isEditing ? (
                  <>
                    <TextField label="Name" value={(draft as Product).name ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} />
                    <TextField label="Description" value={(draft as Product).description ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, description: v }))} multiline />
                    <TextField label="Price" value={(draft as Product).price ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, price: v }))} />
                    <TextField label="Delivery Platform" value={(draft as Product).delivery_platform ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, delivery_platform: v }))} />
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">Distinctive Features</label>
                      <TagList values={(draft as Product).distinctive_features ?? []} onChange={(v) => setEditDraft((d) => ({ ...d, distinctive_features: v }))} />
                    </div>
                    <TextField label="Ecosystem / Future Plans" value={(draft as Product).ecosystem ?? ''} onChange={(v) => setEditDraft((d) => ({ ...d, ecosystem: v }))} multiline />
                  </>
                ) : (
                  <div className="space-y-2 text-sm">
                    {p.description && <p className="text-gray-light">{p.description}</p>}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {p.price && <span><span className="text-gray-mid">Price:</span> <span className="text-white">{p.price}</span></span>}
                      {p.delivery_platform && <span><span className="text-gray-mid">Platform:</span> <span className="text-white">{p.delivery_platform}</span></span>}
                    </div>
                    {p.distinctive_features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.distinctive_features.map((f) => (
                          <span key={f} className="px-2 py-0.5 rounded-full bg-carbon-light text-xs text-gray-light">{f}</span>
                        ))}
                      </div>
                    )}
                    {p.ecosystem && <p className="text-xs text-gray-mid">{p.ecosystem}</p>}
                  </div>
                )}

                {/* Per-product images */}
                <ProductImages productId={p.id} />
              </div>
            )}
          </div>
        );
      })}

      {/* New product form */}
      {showNewForm ? (
        <div className="bg-carbon-dark border border-electric/30 rounded-xl px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-white">New Product</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">ID (slug)</label>
              <input
                value={newProduct.id}
                onChange={(e) => setNewProduct((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="gold_trading_bot"
                className="w-full bg-carbon border border-carbon-light rounded px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric"
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
            <button onClick={handleCreate} disabled={creating || !newProduct.id || !newProduct.name}
              className="flex items-center gap-2 px-4 py-2 bg-electric rounded-lg text-sm font-medium text-white hover:bg-electric/80 disabled:opacity-50 transition-colors">
              <Plus size={14} /> {creating ? 'Creating…' : 'Create product'}
            </button>
            <button onClick={() => setShowNewForm(false)}
              className="px-4 py-2 rounded-lg bg-carbon-light text-sm text-gray-mid hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNewForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-carbon-light text-sm text-gray-mid hover:text-white hover:border-gray-mid transition-colors">
          <Plus size={16} /> Add product
        </button>
      )}
    </div>
  );
}

// ─── Reference Images (general, not per-product) ──────────────────────────────

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
    <div className="bg-carbon-dark border border-carbon-light rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Reference Images</h3>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-carbon-light rounded-lg text-sm text-gray-light hover:text-white cursor-pointer transition-colors">
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-gray-mid">No files yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.filename} className="group relative rounded-lg overflow-hidden bg-carbon aspect-square">
              {f.filename.match(/\.(mp4|mov)$/i) ? (
                <video src={f.url} className="w-full h-full object-cover" />
              ) : (
                <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => handleDelete(f.filename)} className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plain Text Editor ────────────────────────────────────────────────────────

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
      JSON.parse(jsonStr); // validate locally first
      await updateBrandDnaRaw(jsonStr);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-mid py-8 text-center">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-mid">Editing brand-dna.json directly. Invalid JSON will be rejected on save.</p>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-electric rounded-lg text-sm font-medium text-white hover:bg-electric/80 disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <textarea
        value={jsonStr}
        onChange={(e) => setJsonStr(e.target.value)}
        rows={30}
        spellCheck={false}
        className="w-full bg-carbon-dark border border-carbon-light rounded-xl px-4 py-3 text-xs text-gray-light font-mono resize-y focus:outline-none focus:border-electric"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Brand() {
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState<Section | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  useEffect(() => {
    fetchBrandDna().then(setDna);
  }, []);

  if (!dna) {
    return <div className="flex items-center justify-center h-64 text-gray-mid text-sm">Loading brand DNA…</div>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Brand</h2>
          <p className="text-sm text-gray-mid mt-1">Manage your brand identity, visual system, and media assets.</p>
        </div>
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-carbon-light rounded-lg p-1">
          <button
            onClick={() => setViewMode('structured')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'structured' ? 'bg-carbon text-white' : 'text-gray-mid hover:text-white'
            }`}
          >
            <LayoutList size={13} /> Structured
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'raw' ? 'bg-carbon text-white' : 'text-gray-mid hover:text-white'
            }`}
          >
            <Code2 size={13} /> Plain text
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        <PlainTextEditor onSwitchToStructured={() => setViewMode('structured')} />
      ) : (
        <>
          {/* Overview */}
          <SectionCard title={SECTION_LABELS.overview} onSave={() => save('overview')} saving={saving === 'overview'} defaultOpen>
            <TextField label="Brand Name" value={get('overview', 'name')} onChange={(v) => set('overview', 'name', v)} />
            <TextField label="Tagline" value={get('overview', 'tagline')} onChange={(v) => set('overview', 'tagline', v)} />
            <TextField label="Design Agency" value={get('overview', 'design_agency')} onChange={(v) => set('overview', 'design_agency', v)} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">Voice Adjectives</label>
              <TagList values={getList('overview', 'voice_adjectives')} onChange={(v) => set('overview', 'voice_adjectives', v)} />
            </div>
            <TextField label="Positioning" value={get('overview', 'positioning')} onChange={(v) => set('overview', 'positioning', v)} multiline />
            <TextField label="Competitive Differentiation" value={get('overview', 'competitive_differentiation')} onChange={(v) => set('overview', 'competitive_differentiation', v)} multiline />
          </SectionCard>

          {/* Visual System */}
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

          {/* Photography Direction */}
          <SectionCard title={SECTION_LABELS.photography_direction} onSave={() => save('photography_direction')} saving={saving === 'photography_direction'}>
            <TextField label="Lighting" value={get('photography_direction', 'lighting')} onChange={(v) => set('photography_direction', 'lighting', v)} multiline />
            <TextField label="Color Grading" value={get('photography_direction', 'color_grading')} onChange={(v) => set('photography_direction', 'color_grading', v)} />
            <TextField label="Composition" value={get('photography_direction', 'composition')} onChange={(v) => set('photography_direction', 'composition', v)} />
            <TextField label="Subject Matter" value={get('photography_direction', 'subject_matter')} onChange={(v) => set('photography_direction', 'subject_matter', v)} />
            <TextField label="Props and Surfaces" value={get('photography_direction', 'props_and_surfaces')} onChange={(v) => set('photography_direction', 'props_and_surfaces', v)} />
            <TextField label="Mood" value={get('photography_direction', 'mood')} onChange={(v) => set('photography_direction', 'mood', v)} />
          </SectionCard>

          {/* Products */}
          <div className="bg-carbon-dark border border-carbon-light rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-carbon-light">
              <h3 className="font-semibold text-white">Product Details</h3>
              <p className="text-xs text-gray-mid mt-0.5">Each product has its own description and image gallery.</p>
            </div>
            <div className="p-5">
              <ProductsManager />
            </div>
          </div>

          {/* Ad Creative Style */}
          <SectionCard title={SECTION_LABELS.ad_creative_style} onSave={() => save('ad_creative_style')} saving={saving === 'ad_creative_style'}>
            <TextField label="Typical Formats" value={get('ad_creative_style', 'typical_formats')} onChange={(v) => set('ad_creative_style', 'typical_formats', v)} multiline />
            <TextField label="Text Overlay Style" value={get('ad_creative_style', 'text_overlay_style')} onChange={(v) => set('ad_creative_style', 'text_overlay_style', v)} multiline />
            <TextField label="Photo vs Illustration" value={get('ad_creative_style', 'photo_vs_illustration')} onChange={(v) => set('ad_creative_style', 'photo_vs_illustration', v)} multiline />
            <TextField label="UGC Usage" value={get('ad_creative_style', 'ugc_usage')} onChange={(v) => set('ad_creative_style', 'ugc_usage', v)} />
            <TextField label="Offer Presentation" value={get('ad_creative_style', 'offer_presentation')} onChange={(v) => set('ad_creative_style', 'offer_presentation', v)} multiline />
          </SectionCard>

          {/* Image Prompt Modifier */}
          <SectionCard title={SECTION_LABELS.prompt_modifier} onSave={() => save('prompt_modifier')} saving={saving === 'prompt_modifier'}>
            <p className="text-xs text-gray-mid">
              This text is automatically prepended to every image generation prompt to enforce brand visual style.
            </p>
            <textarea
              value={(dna.image_prompt_modifier as string) ?? ''}
              onChange={(e) => setDna((prev) => ({ ...prev!, image_prompt_modifier: e.target.value }))}
              rows={5}
              className="w-full bg-carbon border border-carbon-light rounded px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric resize-y font-mono"
            />
          </SectionCard>

          {/* Reference Images */}
          <div>
            <h3 className="text-base font-semibold text-white mb-3">Reference Images</h3>
            <ReferenceImages />
          </div>
        </>
      )}
    </div>
  );
}
