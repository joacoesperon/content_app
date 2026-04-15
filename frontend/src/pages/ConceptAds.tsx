import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Loader2,
  Play,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildConceptPrompt,
  deleteConceptOutput,
  fetchAvatars,
  fetchFormats,
  fetchBrandProducts,
  fetchConceptOutputs,
  getConceptImageUrl,
  getConceptWsUrl,
  parsePlan,
  prepareReference,
  startConceptGeneration,
  startRemix,
  uploadReference,
} from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import ImageGrid from '../components/ImageGrid';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Avatar {
  id: string;
  name: string;
  description: string;
  pain_points: string[];
}

interface Format {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
}

interface ConceptItem {
  concept_index: number;
  avatar_id: string;
  format_id: string;
  hook: string;
  angle: string;
  prompt_additions: string;
  aspect_ratio: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors"
    >
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface RemixRef {
  src: string;
  path: string;
  filename: string;
}

export default function ConceptAds() {
  const [activeTab, setActiveTab] = useState<'concepts' | 'remix' | 'history'>('concepts');
  const [remixRef, setRemixRef] = useState<RemixRef | null>(null);

  const handleRemixThis = (ref: RemixRef) => {
    setRemixRef(ref);
    setActiveTab('remix');
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-2">Concept Ads</h1>
      <p className="text-gray-mid mb-6">
        Generate angle-driven creatives by avatar × format. Plan with Claude, generate with FAL.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-carbon-light rounded-xl p-1 mb-8 w-fit">
        {(['concepts', 'remix', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-carbon text-white'
                : 'text-gray-mid hover:text-gray-light'
            }`}
          >
            {tab === 'concepts' ? 'Concepts Mode' : tab === 'remix' ? 'Remix Mode' : 'Historial'}
          </button>
        ))}
      </div>

      {activeTab === 'concepts' ? (
        <ConceptsMode />
      ) : activeTab === 'remix' ? (
        <RemixMode initialRef={remixRef} onRefConsumed={() => setRemixRef(null)} />
      ) : (
        <OutputsHistory onRemixThis={handleRemixThis} />
      )}
    </div>
  );
}

// ─── Concepts Mode ────────────────────────────────────────────────────────────

function ConceptsMode() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [selectedAvatars, setSelectedAvatars] = useState<Set<string>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());

  // Settings
  const [count, setCount] = useState(6);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [resolution, setResolution] = useState('2K');
  const [numImages, setNumImages] = useState(2);

  // Product + brand options
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [useProductImages, setUseProductImages] = useState(false);
  const [useBrandDna, setUseBrandDna] = useState(true);
  const [useBrandModifier, setUseBrandModifier] = useState(false);
  const [offerCta, setOfferCta] = useState('');

  // Manual Planner — Concept Plan
  const [conceptPrompt, setConceptPrompt] = useState('');
  const [showConceptPromptModal, setShowConceptPromptModal] = useState(false);
  const [pastePlanRaw, setPastePlanRaw] = useState('');
  const [conceptPlan, setConceptPlan] = useState<ConceptItem[]>([]);
  const [planError, setPlanError] = useState('');
  const [loadingBuildPrompt, setLoadingBuildPrompt] = useState(false);
  const [loadingParsePlan, setLoadingParsePlan] = useState(false);

  // Generation
  const [jobId, setJobId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);

  const { messages, status, reset } = useWebSocket(jobId, getConceptWsUrl);

  useEffect(() => {
    fetchAvatars().then(setAvatars).catch(console.error);
    fetchFormats().then(setFormats).catch(console.error);
    fetchBrandProducts().then((ps: Product[]) => {
      setProducts(ps);
      if (ps.length > 0) setSelectedProductId(ps[0].id);
    }).catch(console.error);
  }, []);

  // Process WS messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.type === 'concept_done') {
      const folder = last.folder as string;
      const imgs = last.images as string[];
      const newImgs = imgs.map((f) => ({
        src: getConceptImageUrl(folder, f),
        label: `#${last.concept_index} ${last.format_id} × ${last.avatar_id} — ${f}`,
      }));
      setGeneratedImages((prev) => [...prev, ...newImgs]);
    }
    if (last.type === 'status' && last.status === 'completed') {
      setGenerating(false);
    }
  }, [messages]);

  const toggleAvatar = (id: string) => {
    setSelectedAvatars((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBuildConceptPrompt = async () => {
    if (selectedAvatars.size === 0 || selectedFormats.size === 0) {
      setPlanError('Seleccioná al menos un avatar y un formato');
      return;
    }
    setLoadingBuildPrompt(true);
    setPlanError('');
    try {
      const res = await buildConceptPrompt({
        avatar_ids: Array.from(selectedAvatars),
        format_ids: Array.from(selectedFormats),
        count,
        aspect_ratio: aspectRatio,
        product_id: selectedProductId,
        use_product_images: useProductImages,
        use_brand_dna: useBrandDna,
        offer_cta: offerCta,
      });
      setConceptPrompt(res.prompt);
      setShowConceptPromptModal(true);
    } catch (e) {
      setPlanError(String(e));
    } finally {
      setLoadingBuildPrompt(false);
    }
  };

  const handleParsePlan = async () => {
    setLoadingParsePlan(true);
    setPlanError('');
    try {
      const res = await parsePlan(pastePlanRaw);
      setConceptPlan(res.concepts);
      setShowConceptPromptModal(false);
    } catch (e) {
      setPlanError(String(e));
    } finally {
      setLoadingParsePlan(false);
    }
  };

  const handleGenerate = async () => {
    if (conceptPlan.length === 0) return;
    setGenError(null);
    setGeneratedImages([]);
    reset();
    setGenerating(true);
    try {
      const result = await startConceptGeneration({
        concepts: conceptPlan,
        resolution,
        num_images: numImages,
        use_brand_modifier: useBrandModifier,
      });
      if (result.error) {
        setGenError(result.error);
        setGenerating(false);
        return;
      }
      setJobId(result.job_id);
    } catch (e) {
      setGenError(String(e));
      setGenerating(false);
    }
  };

  const progressMessages = messages.filter(
    (m) => m.type === 'progress' || m.type === 'concept_done' || m.type === 'concept_error'
  );
  const completedCount = messages.filter((m) => m.type === 'concept_done').length;
  const errorCount = messages.filter((m) => m.type === 'concept_error').length;
  const totalConcepts = (messages.find((m) => m.type === 'progress')?.total as number) || 0;

  const avatarsMap = Object.fromEntries(avatars.map((a) => [a.id, a]));
  const formatsMap = Object.fromEntries(formats.map((f) => [f.id, f]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left panel ── */}
        <div className="space-y-4">
          {/* Avatars — selection only */}
          <div className="bg-carbon-light rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Avatars</h2>
              <span className="text-xs text-gray-mid">
                {selectedAvatars.size} seleccionado{selectedAvatars.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {avatars.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAvatars.has(a.id)
                      ? 'border-neon/50 bg-neon/10'
                      : 'border-carbon bg-carbon hover:border-carbon-light'
                  }`}
                  onClick={() => toggleAvatar(a.id)}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center ${
                      selectedAvatars.has(a.id) ? 'bg-neon border-neon' : 'border-gray-mid'
                    }`}
                  >
                    {selectedAvatars.has(a.id) && <CheckCircle size={10} className="text-carbon" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{a.name}</div>
                    <div className="text-xs text-gray-mid mt-0.5 line-clamp-1">{a.description}</div>
                  </div>
                </div>
              ))}
              {avatars.length === 0 && (
                <p className="text-xs text-gray-mid text-center py-4">
                  No hay avatares. Creálos en la tool <span className="text-electric">Avatars</span>.
                </p>
              )}
            </div>
          </div>

          {/* Formats */}
          <div className="bg-carbon-light rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-3">Formatos</h2>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleFormat(f.id)}
                  className={`text-left p-3 rounded-lg border transition-all text-xs ${
                    selectedFormats.has(f.id)
                      ? 'border-neon/50 bg-neon/10 text-white'
                      : 'border-carbon bg-carbon text-gray-mid hover:border-carbon-light hover:text-gray-light'
                  }`}
                >
                  <div className="font-medium">{f.name}</div>
                  <div className="text-gray-mid mt-0.5 line-clamp-2">{f.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          {/* Settings */}
          <div className="bg-carbon-light rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Configuración</h2>

            {/* Product selector */}
            {products.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-mid mb-1">Producto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-mid mb-1">Conceptos a generar</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
                >
                  {[4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-mid mb-1">Aspect ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
                >
                  {['1:1', '4:5', '9:16', '16:9', '3:4'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-mid mb-1">Resolución</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="0.5K">0.5K (rápido)</option>
                  <option value="1K">1K (test)</option>
                  <option value="2K">2K (producción)</option>
                  <option value="4K">4K (hero)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-mid mb-1">Imágenes por concepto</label>
                <select
                  value={numImages}
                  onChange={(e) => setNumImages(Number(e.target.value))}
                  className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
                >
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Toggles — planning prompt */}
            <p className="text-xs text-gray-mid mb-1">Prompt de planificación (Claude)</p>
            <div className="flex flex-wrap gap-4 mb-1">
              <label className="flex items-center gap-2 text-xs text-gray-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBrandDna}
                  onChange={(e) => setUseBrandDna(e.target.checked)}
                  className="accent-electric"
                />
                Incluir Brand Kit (DNA)
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProductImages}
                  onChange={(e) => setUseProductImages(e.target.checked)}
                  className="accent-electric"
                />
                Incluir imágenes del producto
              </label>
            </div>
            {/* Toggles — image generation */}
            <p className="text-xs text-gray-mid mb-1 mt-3">Generación de imágenes (FAL)</p>
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 text-xs text-gray-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBrandModifier}
                  onChange={(e) => setUseBrandModifier(e.target.checked)}
                  className="accent-electric"
                />
                Aplicar brand modifier visual
              </label>
            </div>

            {/* Offer / CTA */}
            <div className="mb-4">
              <label className="block text-xs text-gray-mid mb-1">Offer / CTA (opcional)</label>
              <input
                type="text"
                value={offerCta}
                onChange={(e) => setOfferCta(e.target.value)}
                placeholder="Shop Now, 20% off first order"
                className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric/50"
              />
            </div>

            {/* Build prompt button */}
            <button
              onClick={handleBuildConceptPrompt}
              disabled={loadingBuildPrompt || selectedAvatars.size === 0 || selectedFormats.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-sm transition-colors disabled:opacity-40"
            >
              {loadingBuildPrompt ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {selectedAvatars.size === 0 || selectedFormats.size === 0
                ? 'Seleccioná avatares y formatos primero'
                : 'Generar prompt para Claude'}
            </button>

            {planError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={13} />
                {planError}
              </div>
            )}
          </div>

          {/* Concept prompt modal (inline) */}
          {showConceptPromptModal && (
            <div className="bg-carbon-light rounded-xl p-5 border border-electric/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Prompt listo — copialo a claude.ai</h3>
                <div className="flex items-center gap-2">
                  <CopyButton text={conceptPrompt} />
                  <button onClick={() => setShowConceptPromptModal(false)} className="text-gray-mid hover:text-white">
                    <X size={15} />
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={conceptPrompt}
                rows={5}
                className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none mb-3"
              />
              <p className="text-xs text-gray-mid mb-2">
                Pegá la respuesta JSON de Claude aquí:
              </p>
              <textarea
                value={pastePlanRaw}
                onChange={(e) => setPastePlanRaw(e.target.value)}
                placeholder='[{ "concept_index": 1, "avatar_id": "...", ... }]'
                rows={5}
                className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none focus:outline-none focus:border-electric/50 mb-3"
              />
              <button
                onClick={handleParsePlan}
                disabled={loadingParsePlan || !pastePlanRaw.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-sm transition-colors disabled:opacity-40"
              >
                {loadingParsePlan ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Parsear plan de Claude
              </button>
              {planError && <p className="mt-2 text-xs text-red-400">{planError}</p>}
            </div>
          )}

          {/* Concept plan preview */}
          {conceptPlan.length > 0 && (
            <div className="bg-carbon-light rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  Plan — {conceptPlan.length} conceptos
                </h3>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    generating
                      ? 'bg-carbon text-gray-mid cursor-not-allowed'
                      : 'bg-electric hover:bg-electric/80 text-white'
                  }`}
                >
                  {generating ? (
                    <><Loader2 size={14} className="animate-spin" /> Generando...</>
                  ) : (
                    <><Play size={14} /> Generar imágenes</>
                  )}
                </button>
              </div>

              {genError && (
                <div className="mb-3 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={13} /> {genError}
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {conceptPlan.map((c) => (
                  <ConceptCard
                    key={c.concept_index}
                    concept={c}
                    avatarName={avatarsMap[c.avatar_id]?.name ?? c.avatar_id}
                    formatName={formatsMap[c.format_id]?.name ?? c.format_id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {progressMessages.length > 0 && (
        <div className="bg-carbon-light rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              {generating ? 'Generando...' : 'Run log'}
            </h3>
            <span className="text-xs text-gray-mid">
              {completedCount + errorCount} / {totalConcepts || progressMessages.length}
            </span>
          </div>
          {generating && totalConcepts > 0 && (
            <div className="w-full h-1.5 bg-carbon rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-neon rounded-full transition-all duration-500"
                style={{ width: `${((completedCount + errorCount) / totalConcepts) * 100}%` }}
              />
            </div>
          )}
          <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
            {progressMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                {msg.type === 'concept_done' ? (
                  <CheckCircle size={12} className="text-neon shrink-0 mt-0.5" />
                ) : msg.type === 'concept_error' ? (
                  <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Loader2 size={12} className={`shrink-0 mt-0.5 ${generating ? 'text-electric animate-spin' : 'text-gray-mid'}`} />
                )}
                <span className={msg.type === 'concept_error' ? 'text-red-400' : 'text-gray-mid'}>
                  {(msg.message as string) || `Concept #${msg.concept_index}`}
                  {msg.type === 'concept_done' && ` — ${(msg.time as number)?.toFixed(1)}s`}
                  {msg.type === 'concept_error' && ` — ${msg.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-neon/10 border border-neon/30 rounded-xl p-4 flex items-center gap-3 text-neon text-sm">
          <CheckCircle size={18} />
          Generación completa — {completedCount} conceptos, {generatedImages.length} imágenes
          {errorCount > 0 && `, ${errorCount} errores`}
        </div>
      )}

      {generatedImages.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Imágenes generadas</h2>
          <ImageGrid images={generatedImages} />
        </div>
      )}
    </div>
  );
}

function ConceptCard({
  concept,
  avatarName,
  formatName,
}: {
  concept: ConceptItem;
  avatarName: string;
  formatName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-carbon rounded-lg p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-gray-mid">#{concept.concept_index}</span>
            <span className="text-electric">{formatName}</span>
            <span className="text-gray-mid">×</span>
            <span className="text-neon">{avatarName}</span>
          </div>
          <p className="text-white font-medium line-clamp-1">{concept.hook}</p>
          {expanded && (
            <div className="mt-2 space-y-1 text-gray-mid">
              <p><span className="text-gray-light">Ángulo:</span> {concept.angle}</p>
              <p><span className="text-gray-light">Visual:</span> {concept.prompt_additions}</p>
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-mid hover:text-white shrink-0">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
}

// ─── Remix Mode ───────────────────────────────────────────────────────────────

function detectAspectRatio(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const r = img.naturalWidth / img.naturalHeight;
      if (r < 0.75) resolve('9:16');
      else if (r < 0.95) resolve('4:5');
      else if (r < 1.15) resolve('1:1');
      else resolve('16:9');
    };
    img.onerror = () => resolve('4:5');
    img.src = src;
  });
}

function RemixMode({ initialRef, onRefConsumed }: { initialRef?: { src: string; path: string; filename: string } | null; onRefConsumed?: () => void }) {
  const [_refFile, setRefFile] = useState<File | null>(null);
  const [refPath, setRefPath] = useState(initialRef?.path ?? '');
  const [refPreview, setRefPreview] = useState(initialRef?.src ?? '');
  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [aspectRatioAuto, setAspectRatioAuto] = useState(false);
  const [resolution, setResolution] = useState('2K');
  const [useBrandModifier, setUseBrandModifier] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialRef) {
      setRefPath(initialRef.path);
      setRefPreview(initialRef.src);
      detectAspectRatio(initialRef.src).then((ar) => {
        setAspectRatio(ar);
        setAspectRatioAuto(true);
      });
      onRefConsumed?.();
    }
  }, [initialRef]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);

  const { messages, status, reset } = useWebSocket(jobId, getConceptWsUrl);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.type === 'concept_done') {
      const folder = last.folder as string;
      const imgs = last.images as string[];
      setGeneratedImages((prev) => [
        ...prev,
        ...imgs.map((f) => ({ src: getConceptImageUrl(folder, f), label: f })),
      ]);
    }
    if (last.type === 'status' && last.status === 'completed') setGenerating(false);
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefFile(file);
    const objectUrl = URL.createObjectURL(file);
    setRefPreview(objectUrl);
    detectAspectRatio(objectUrl).then((ar) => {
      setAspectRatio(ar);
      setAspectRatioAuto(true);
    });
    setUploading(true);
    try {
      const res = await uploadReference(file);
      setRefPath(res.path);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!refPath || !instructions.trim()) return;
    setGenError(null);
    setGeneratedImages([]);
    reset();
    setGenerating(true);
    try {
      const result = await startRemix({
        reference_path: refPath,
        instructions,
        count,
        aspect_ratio: aspectRatio,
        resolution,
        use_brand_modifier: useBrandModifier,
      });
      setJobId(result.job_id);
    } catch (e) {
      setGenError(String(e));
      setGenerating(false);
    }
  };

  const progressMsg = messages.find((m) => m.type === 'progress');

  return (
    <div className="max-w-2xl space-y-5">
      {/* Reference image */}
      <div className="bg-carbon-light rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-3">Imagen de referencia</h2>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-carbon rounded-xl p-8 cursor-pointer hover:border-electric/40 transition-colors">
          {refPreview ? (
            <img src={refPreview} alt="reference" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <Upload size={24} className="text-gray-mid mb-2" />
              <span className="text-sm text-gray-mid">Click para subir imagen</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        {uploading && <p className="text-xs text-electric mt-2">Subiendo...</p>}
        {refPath && !uploading && <p className="text-xs text-neon mt-2">Imagen lista</p>}
      </div>

      {/* Instructions */}
      <div className="bg-carbon-light rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Instrucciones</h2>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe how to remix this image — keep the same composition but change the color palette to neon green highlights..."
          rows={4}
          className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white placeholder-gray-mid focus:outline-none focus:border-electric resize-none"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-mid mb-1">Variaciones</label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs text-gray-mid">Aspect ratio</label>
              {aspectRatioAuto && (
                <span className="text-[10px] bg-electric/15 text-electric px-1.5 py-0.5 rounded font-medium">auto</span>
              )}
            </div>
            <select
              value={aspectRatio}
              onChange={(e) => { setAspectRatio(e.target.value); setAspectRatioAuto(false); }}
              className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              {['1:1', '4:5', '9:16', '16:9'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-mid mb-1">Resolución</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white">
              <option value="0.5K">0.5K</option>
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-light cursor-pointer">
          <input
            type="checkbox"
            checked={useBrandModifier}
            onChange={(e) => setUseBrandModifier(e.target.checked)}
            className="accent-electric"
          />
          Aplicar brand modifier visual
        </label>
        <button
          onClick={handleGenerate}
          disabled={generating || !refPath || !instructions.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-electric text-white text-sm font-medium hover:bg-electric/80 disabled:opacity-40 transition-colors"
        >
          {generating ? <><Loader2 size={15} className="animate-spin" /> Generando...</> : <><Play size={15} /> Generar remix</>}
        </button>
        {genError && <p className="text-xs text-red-400">{genError}</p>}
        {progressMsg && generating && (
          <p className="text-xs text-electric">{progressMsg.message as string}</p>
        )}
      </div>

      {status === 'completed' && (
        <div className="bg-neon/10 border border-neon/30 rounded-xl p-4 flex items-center gap-3 text-neon text-sm">
          <CheckCircle size={18} />
          Remix completo — {generatedImages.length} variaciones generadas
        </div>
      )}

      {generatedImages.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Variaciones</h2>
          <ImageGrid images={generatedImages} />
        </div>
      )}
    </div>
  );
}

// ─── Outputs History ──────────────────────────────────────────────────────────

interface OutputFolder {
  folder: string;
  images: string[];
  meta: {
    concept_index?: number;
    avatar_id?: string;
    avatar_name?: string;
    format_id?: string;
    format_name?: string;
    hook?: string;
    angle?: string;
    prompt?: string;
    type?: string;
    instructions?: string;
    resolution?: string;
  };
}

interface SelectedImage {
  src: string;
  folder: string;
  filename: string;
  meta: OutputFolder['meta'];
}

function AdDetailModal({
  selected,
  onClose,
  onRemixThis,
}: {
  selected: SelectedImage;
  onClose: () => void;
  onRemixThis: (ref: { src: string; path: string; filename: string }) => void;
}) {
  const [loadingRemix, setLoadingRemix] = useState(false);
  const { meta } = selected;
  const isRemix = meta.type === 'remix';

  const handleRemixThis = async () => {
    setLoadingRemix(true);
    try {
      const relativePath = `concept-outputs/${selected.folder}/${selected.filename}`;
      const res = await prepareReference(relativePath);
      onRemixThis({ src: selected.src, path: res.path, filename: res.filename });
      onClose();
    } finally {
      setLoadingRemix(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-carbon-dark border border-carbon-light rounded-2xl overflow-hidden flex flex-col lg:flex-row max-w-5xl w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image panel */}
        <div className="lg:w-1/2 bg-black flex items-center justify-center p-4 min-h-64">
          <img
            src={selected.src}
            alt="Ad"
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Metadata panel */}
        <div className="lg:w-1/2 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-carbon-light">
            <span className="text-xs font-mono text-gray-mid">{selected.folder}</span>
            <button onClick={onClose} className="text-gray-mid hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
            {/* Type badge */}
            <div className="flex flex-wrap gap-2">
              {meta.resolution && (
                <span className="text-xs border border-carbon-light rounded px-2 py-0.5 text-gray-mid">{meta.resolution}</span>
              )}
              {isRemix ? (
                <span className="text-xs border border-electric/30 rounded px-2 py-0.5 text-electric">Remix</span>
              ) : (
                <>
                  {(meta.format_name ?? meta.format_id) && (
                    <span className="text-xs border border-electric/30 rounded px-2 py-0.5 text-electric">{meta.format_name ?? meta.format_id}</span>
                  )}
                  {(meta.avatar_name ?? meta.avatar_id) && (
                    <span className="text-xs border border-neon/30 rounded px-2 py-0.5 text-neon">{meta.avatar_name ?? meta.avatar_id}</span>
                  )}
                </>
              )}
            </div>

            {meta.hook && (
              <div>
                <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1">Hook</p>
                <p className="text-sm text-white font-medium">"{meta.hook}"</p>
              </div>
            )}

            {meta.angle && (
              <div>
                <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1">Ángulo</p>
                <p className="text-sm text-gray-light">{meta.angle}</p>
              </div>
            )}

            {meta.instructions && (
              <div>
                <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1">Instrucciones</p>
                <p className="text-sm text-gray-light">{meta.instructions}</p>
              </div>
            )}

            {meta.prompt && (
              <div>
                <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1">Prompt enviado a FAL</p>
                <p className="text-xs text-gray-mid font-mono bg-carbon rounded-lg p-3 whitespace-pre-wrap wrap-break-word">{meta.prompt}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-carbon-light flex gap-2">
            <a
              href={selected.src}
              download={selected.filename}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-carbon-light text-gray-light text-xs hover:text-white transition-colors"
            >
              <Download size={13} /> Descargar
            </a>
            <button
              onClick={handleRemixThis}
              disabled={loadingRemix}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
            >
              {loadingRemix ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Remix this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputsHistory({ onRemixThis }: { onRemixThis: (ref: { src: string; path: string; filename: string }) => void }) {
  const [folders, setFolders] = useState<OutputFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchConceptOutputs()
      .then((data) => setFolders([...data].reverse()))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(folder: string) {
    if (!confirm(`¿Eliminar "${folder}" y todas sus imágenes?`)) return;
    setDeleting(folder);
    try {
      await deleteConceptOutput(folder);
      setFolders((prev) => prev.filter((f) => f.folder !== folder));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-mid text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Cargando historial...
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-20 text-gray-mid">
        <p className="text-sm">No hay generaciones todavía.</p>
        <p className="text-xs mt-1">Las imágenes generadas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <p className="text-xs text-gray-mid">{folders.length} generacion{folders.length !== 1 ? 'es' : ''}</p>
        {folders.map((f) => {
          const isRemix = f.meta.type === 'remix';
          const title = isRemix
            ? `Remix — ${f.meta.instructions?.slice(0, 60) ?? f.folder}`
            : f.meta.hook ? f.meta.hook.slice(0, 70) : f.folder;
          const subtitle = isRemix
            ? 'Remix Mode'
            : [f.meta.format_name ?? f.meta.format_id, f.meta.avatar_name ?? f.meta.avatar_id]
                .filter(Boolean).join(' × ');

          const images = f.images.map((img) => ({
            src: getConceptImageUrl(f.folder, img),
            label: img,
          }));

          return (
            <div key={f.folder} className="bg-carbon-light rounded-xl p-5">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-gray-mid">{f.folder}</span>
                  {f.meta.resolution && (
                    <span className="text-xs text-gray-mid border border-carbon-light rounded px-1.5 py-0.5">
                      {f.meta.resolution}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(f.folder)}
                    disabled={deleting === f.folder}
                    className="ml-auto text-gray-mid hover:text-red-400 disabled:opacity-40 transition-colors"
                    title="Eliminar generación"
                  >
                    {deleting === f.folder
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
                <p className="text-sm font-medium text-white line-clamp-1">{title}</p>
                {subtitle && <p className="text-xs text-gray-mid mt-0.5">{subtitle}</p>}
              </div>
              <ImageGrid
                images={images}
                onImageClick={(img) => setSelected({
                  src: img.src,
                  folder: f.folder,
                  filename: img.label,
                  meta: f.meta,
                })}
              />
            </div>
          );
        })}
      </div>

      {selected && (
        <AdDetailModal
          selected={selected}
          onClose={() => setSelected(null)}
          onRemixThis={onRemixThis}
        />
      )}
    </>
  );
}

// ─── Inline Upload icon (used in RemixMode) ───────────────────────────────────
function Upload({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
