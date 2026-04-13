import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  buildAvatarPrompt,
  buildConceptPrompt,
  createAvatar,
  deleteAvatar,
  fetchAvatars,
  fetchFormats,
  getConceptImageUrl,
  getConceptWsUrl,
  parseAvatars,
  parsePlan,
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
  motivations: string[];
  objections: string[];
  language_sample: string;
}

interface Format {
  id: string;
  name: string;
  description: string;
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

export default function ConceptAds() {
  const [activeTab, setActiveTab] = useState<'concepts' | 'remix'>('concepts');

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-2">Concept Ads</h1>
      <p className="text-gray-mid mb-6">
        Generate angle-driven creatives by avatar × format. Plan with Claude, generate with FAL.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-carbon-light rounded-xl p-1 mb-8 w-fit">
        {(['concepts', 'remix'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-carbon text-white'
                : 'text-gray-mid hover:text-gray-light'
            }`}
          >
            {tab === 'concepts' ? 'Concepts Mode' : 'Remix Mode'}
          </button>
        ))}
      </div>

      {activeTab === 'concepts' ? <ConceptsMode /> : <RemixMode />}
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

  // Manual Planner — Avatar Research
  const [showAvatarPlanner, setShowAvatarPlanner] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarPasteRaw, setAvatarPasteRaw] = useState('');
  const [parsedAvatarDraft, setParsedAvatarDraft] = useState<Avatar[]>([]);
  const [avatarPlannerError, setAvatarPlannerError] = useState('');
  const [loadingAvatarPrompt, setLoadingAvatarPrompt] = useState(false);
  const [loadingParseAvatars, setLoadingParseAvatars] = useState(false);

  // Manual Planner — Concept Plan
  const [conceptPrompt, setConceptPrompt] = useState('');
  const [showConceptPromptModal, setShowConceptPromptModal] = useState(false);
  const [pastePlanRaw, setPastePlanRaw] = useState('');
  const [conceptPlan, setConceptPlan] = useState<ConceptItem[]>([]);
  const [planError, setPlanError] = useState('');
  const [loadingBuildPrompt, setLoadingBuildPrompt] = useState(false);
  const [loadingParsePlan, setLoadingParsePlan] = useState(false);

  // New avatar form
  const [showNewAvatarForm, setShowNewAvatarForm] = useState(false);
  const [newAvatarId, setNewAvatarId] = useState('');
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarDesc, setNewAvatarDesc] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Generation
  const [jobId, setJobId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);

  const { messages, status, reset } = useWebSocket(jobId, getConceptWsUrl);

  useEffect(() => {
    fetchAvatars().then(setAvatars).catch(console.error);
    fetchFormats().then(setFormats).catch(console.error);
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

  const handleDeleteAvatar = async (id: string) => {
    await deleteAvatar(id);
    setAvatars((prev) => prev.filter((a) => a.id !== id));
    setSelectedAvatars((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCreateAvatar = async () => {
    if (!newAvatarId || !newAvatarName) return;
    setSavingAvatar(true);
    try {
      const saved = await createAvatar({
        id: newAvatarId,
        name: newAvatarName,
        description: newAvatarDesc,
        pain_points: [],
        motivations: [],
        objections: [],
        language_sample: '',
      });
      setAvatars((prev) => [...prev, saved]);
      setNewAvatarId('');
      setNewAvatarName('');
      setNewAvatarDesc('');
      setShowNewAvatarForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleBuildAvatarPrompt = async () => {
    setLoadingAvatarPrompt(true);
    setAvatarPlannerError('');
    try {
      const res = await buildAvatarPrompt({});
      setAvatarPrompt(res.prompt);
    } catch (e) {
      setAvatarPlannerError(String(e));
    } finally {
      setLoadingAvatarPrompt(false);
    }
  };

  const handleParseAvatars = async () => {
    setLoadingParseAvatars(true);
    setAvatarPlannerError('');
    try {
      const res = await parseAvatars(avatarPasteRaw);
      setParsedAvatarDraft(res.avatars);
    } catch (e) {
      setAvatarPlannerError(String(e));
    } finally {
      setLoadingParseAvatars(false);
    }
  };

  const handleSaveParsedAvatars = async () => {
    for (const a of parsedAvatarDraft) {
      try {
        const saved = await createAvatar(a as unknown as Record<string, unknown>);
        setAvatars((prev) => {
          if (prev.some((x) => x.id === saved.id)) return prev;
          return [...prev, saved];
        });
      } catch {
        // skip duplicates
      }
    }
    setParsedAvatarDraft([]);
    setAvatarPasteRaw('');
    setShowAvatarPlanner(false);
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
          {/* Avatars */}
          <div className="bg-carbon-light rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Avatars</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAvatarPlanner(!showAvatarPlanner); setAvatarPrompt(''); setParsedAvatarDraft([]); setAvatarPasteRaw(''); setAvatarPlannerError(''); }}
                  className="flex items-center gap-1.5 text-xs text-electric hover:text-neon transition-colors"
                >
                  <Sparkles size={13} />
                  Generar con IA
                </button>
                <button
                  onClick={() => setShowNewAvatarForm(!showNewAvatarForm)}
                  className="flex items-center gap-1.5 text-xs text-gray-mid hover:text-white transition-colors"
                >
                  <Plus size={13} />
                  Nuevo
                </button>
              </div>
            </div>

            {/* Avatar AI Planner */}
            {showAvatarPlanner && (
              <div className="mb-4 bg-carbon rounded-xl p-4 border border-electric/20 space-y-3">
                <p className="text-xs text-gray-mid">
                  Generá perfiles de cliente con Claude. Copiá el prompt → pegalo en{' '}
                  <span className="text-electric">claude.ai</span> → pegá la respuesta JSON abajo.
                </p>
                {!avatarPrompt ? (
                  <button
                    onClick={handleBuildAvatarPrompt}
                    disabled={loadingAvatarPrompt}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
                  >
                    {loadingAvatarPrompt ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Construir prompt de investigación
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-mid">Prompt listo — copialo a claude.ai</span>
                      <CopyButton text={avatarPrompt} />
                    </div>
                    <textarea
                      readOnly
                      value={avatarPrompt}
                      rows={4}
                      className="w-full bg-carbon-dark border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none"
                    />
                    <textarea
                      value={avatarPasteRaw}
                      onChange={(e) => setAvatarPasteRaw(e.target.value)}
                      placeholder="Pegá aquí el JSON que te devolvió Claude..."
                      rows={4}
                      className="w-full bg-carbon-dark border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none focus:outline-none focus:border-electric/50"
                    />
                    {avatarPlannerError && (
                      <p className="text-xs text-red-400">{avatarPlannerError}</p>
                    )}
                    {parsedAvatarDraft.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-neon">{parsedAvatarDraft.length} avatares parseados — revisalos y guardalos</p>
                        {parsedAvatarDraft.map((a) => (
                          <div key={a.id} className="bg-carbon-dark rounded-lg p-3 text-xs">
                            <span className="font-medium text-white">{a.name}</span>
                            <span className="text-gray-mid ml-2">({a.id})</span>
                            <p className="text-gray-mid mt-1">{a.description}</p>
                          </div>
                        ))}
                        <button
                          onClick={handleSaveParsedAvatars}
                          className="w-full py-2 rounded-lg bg-neon/20 hover:bg-neon/30 text-neon text-xs transition-colors"
                        >
                          Guardar avatares
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleParseAvatars}
                        disabled={loadingParseAvatars || !avatarPasteRaw.trim()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
                      >
                        {loadingParseAvatars ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Parsear respuesta de Claude
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* New avatar inline form */}
            {showNewAvatarForm && (
              <div className="mb-4 bg-carbon rounded-xl p-4 space-y-2">
                <input
                  type="text"
                  placeholder="id (sin espacios, ej: trader_agotado)"
                  value={newAvatarId}
                  onChange={(e) => setNewAvatarId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full bg-carbon-dark border border-carbon-light rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric/50"
                />
                <input
                  type="text"
                  placeholder="Nombre del avatar"
                  value={newAvatarName}
                  onChange={(e) => setNewAvatarName(e.target.value)}
                  className="w-full bg-carbon-dark border border-carbon-light rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric/50"
                />
                <input
                  type="text"
                  placeholder="Descripción breve"
                  value={newAvatarDesc}
                  onChange={(e) => setNewAvatarDesc(e.target.value)}
                  className="w-full bg-carbon-dark border border-carbon-light rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAvatar}
                    disabled={savingAvatar || !newAvatarId || !newAvatarName}
                    className="flex-1 py-1.5 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
                  >
                    {savingAvatar ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setShowNewAvatarForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-carbon-light text-gray-mid text-xs hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Avatar list */}
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
                    className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                      selectedAvatars.has(a.id) ? 'bg-neon border-neon' : 'border-gray-mid'
                    }`}
                  >
                    {selectedAvatars.has(a.id) && <CheckCircle size={10} className="text-carbon" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{a.name}</div>
                    <div className="text-xs text-gray-mid mt-0.5 line-clamp-1">{a.description}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(a.id); }}
                    className="text-gray-mid hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {avatars.length === 0 && (
                <p className="text-xs text-gray-mid text-center py-4">
                  No hay avatares. Creá uno o generá con IA.
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
        <button onClick={() => setExpanded(!expanded)} className="text-gray-mid hover:text-white flex-shrink-0">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
}

// ─── Remix Mode ───────────────────────────────────────────────────────────────

function RemixMode() {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referencePath, setReferencePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [resolution, setResolution] = useState('2K');

  const [jobId, setJobId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, status, reset } = useWebSocket(jobId, getConceptWsUrl);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.type === 'concept_done') {
      const folder = last.folder as string;
      const imgs = last.images as string[];
      setGeneratedImages((prev) => [
        ...prev,
        ...imgs.map((f) => ({
          src: getConceptImageUrl(folder, f),
          label: `Remix — ${f}`,
        })),
      ]);
    }
    if (last.type === 'status' && last.status === 'completed') {
      setGenerating(false);
    }
  }, [messages]);

  const handleFileDrop = async (file: File) => {
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    setUploading(true);
    setUploadError('');
    try {
      const res = await uploadReference(file);
      setReferencePath(res.path);
    } catch (e) {
      setUploadError(String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileDrop(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileDrop(file);
  };

  const handleGenerate = async () => {
    if (!referencePath) return;
    setGenError(null);
    setGeneratedImages([]);
    reset();
    setGenerating(true);
    try {
      const result = await startRemix({
        reference_path: referencePath,
        instructions,
        count,
        aspect_ratio: aspectRatio,
        resolution,
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

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-carbon-light rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Imagen de referencia</h2>

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-carbon rounded-xl p-8 text-center cursor-pointer hover:border-electric/50 transition-colors"
        >
          {referencePreview ? (
            <div className="flex flex-col items-center gap-3">
              <img src={referencePreview} alt="reference" className="max-h-48 rounded-lg object-contain" />
              {uploading ? (
                <span className="text-xs text-electric flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> Subiendo...
                </span>
              ) : referencePath ? (
                <span className="text-xs text-neon flex items-center gap-1.5">
                  <CheckCircle size={13} /> Imagen lista
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-mid">
              <Upload size={32} />
              <div>
                <p className="text-sm">Arrastrá una imagen aquí o hacé click</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP</p>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
        {referenceFile && (
          <button
            onClick={() => { setReferenceFile(null); setReferencePreview(null); setReferencePath(null); }}
            className="mt-2 text-xs text-gray-mid hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Quitar imagen
          </button>
        )}
      </div>

      <div className="bg-carbon-light rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-mid mb-1">Instrucciones (opcional)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ej: Mantené el layout pero hacelo más oscuro y con estética fintech..."
            rows={3}
            className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-electric/50"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-mid mb-1">Imágenes</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-mid mb-1">Aspect ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              {['1:1', '4:5', '9:16', '16:9'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-mid mb-1">Resolución</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>

        {genError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle size={13} /> {genError}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !referencePath}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
            generating || !referencePath
              ? 'bg-carbon text-gray-mid cursor-not-allowed'
              : 'bg-electric hover:bg-electric/80 text-white'
          }`}
        >
          {generating ? (
            <><Loader2 size={15} className="animate-spin" /> Generando...</>
          ) : (
            <><Play size={15} /> Generar remix</>
          )}
        </button>
      </div>

      {/* Progress */}
      {progressMessages.length > 0 && (
        <div className="bg-carbon-light rounded-xl p-4">
          <div className="space-y-1 font-mono text-xs">
            {progressMessages.map((msg, i) => (
              <div key={i} className="flex items-center gap-2">
                {msg.type === 'concept_done' ? (
                  <CheckCircle size={12} className="text-neon" />
                ) : msg.type === 'concept_error' ? (
                  <AlertCircle size={12} className="text-red-400" />
                ) : (
                  <Loader2 size={12} className={generating ? 'text-electric animate-spin' : 'text-gray-mid'} />
                )}
                <span className={msg.type === 'concept_error' ? 'text-red-400' : 'text-gray-mid'}>
                  {(msg.message as string) || 'Procesando...'}
                  {msg.type === 'concept_done' && ` — ${(msg.time as number)?.toFixed(1)}s`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-neon/10 border border-neon/30 rounded-xl p-4 flex items-center gap-3 text-neon text-sm">
          <CheckCircle size={18} />
          Remix completo — {generatedImages.length} imágenes generadas
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
