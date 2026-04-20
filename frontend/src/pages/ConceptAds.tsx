import { useEffect, useRef, useState } from 'react';
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
  Upload as UploadIcon,
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
import { useJob } from '../context/JobContext';
import ImageGrid from '../components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

interface RemixRef {
  src: string;
  path: string;
  filename: string;
}

interface JobCallbacks {
  onJobStarted: (jobId: string) => void;
  onReset: () => void;
  generating: boolean;
}

export default function ConceptAds() {
  const [activeTab, setActiveTab] = useState<'concepts' | 'remix' | 'history'>('concepts');
  const [remixRef, setRemixRef] = useState<RemixRef | null>(null);

  // Job state lives here — survives tab switches and navigation
  const { jobId, messages, generating, generatedImages, setJobId, addMessage, addImages, setGenerating, reset } = useJob('concept_ads');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const lastStatus = [...messages].reverse().find((m) => m.type === 'status');
    if (lastStatus?.status === 'completed' || lastStatus?.status === 'failed') return;
    wsRef.current?.close();
    const ws = new WebSocket(getConceptWsUrl(jobId));
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      addMessage(msg);
      if (msg.type === 'concept_done') {
        const folder = msg.folder as string;
        const imgs = msg.images as string[];
        addImages(imgs.map((f) => ({
          src: getConceptImageUrl(folder, f),
          label: `#${msg.concept_index} ${msg.format_id} × ${msg.avatar_id} — ${f}`,
        })));
      }
      if (msg.type === 'status' && (msg.status === 'completed' || msg.status === 'failed')) {
        setGenerating(false);
        ws.close();
      }
    };
    ws.onerror = () => setGenerating(false);
    return () => { ws.close(); };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dedup messages (backend replays history on reconnect)
  const seenKeys = new Set<string>();
  const dedupedMessages = messages.filter((m) => {
    if (m.type !== 'progress' && m.type !== 'concept_done' && m.type !== 'concept_error') return false;
    const key = `${m.type}-${m.concept_index}-${m.message ?? ''}-${m.error ?? ''}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const completedCount = dedupedMessages.filter((m) => m.type === 'concept_done').length;
  const errorCount = dedupedMessages.filter((m) => m.type === 'concept_error').length;
  const totalConcepts = (dedupedMessages.find((m) => m.type === 'progress')?.total as number) || 0;
  const isCompleted = messages.some((m) => m.type === 'status' && m.status === 'completed');

  const seenImgs = new Set<string>();
  const dedupedImages = generatedImages.filter(({ src }) => {
    if (seenImgs.has(src)) return false;
    seenImgs.add(src);
    return true;
  });

  const handleRemixThis = (ref: RemixRef) => {
    setRemixRef(ref);
    setActiveTab('remix');
  };

  const jobCallbacks: JobCallbacks = {
    onJobStarted: (id: string) => {
      setJobId(id);
      setGenerating(true);
    },
    onReset: () => {
      wsRef.current?.close();
      reset();
    },
    generating,
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Concept Ads</h1>
      <p className="text-muted-foreground mb-6">
        Generate angle-driven creatives by avatar × format. Plan with Claude, generate with FAL.
      </p>

      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)} className="mb-8">
        <TabsList>
          <TabsTrigger value="concepts">Concepts Mode</TabsTrigger>
          <TabsTrigger value="remix">Remix Mode</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="concepts" className="mt-6">
          <ConceptsMode jobCallbacks={jobCallbacks} />
        </TabsContent>
        <TabsContent value="remix" className="mt-6">
          <RemixMode initialRef={remixRef} onRefConsumed={() => setRemixRef(null)} jobCallbacks={jobCallbacks} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <OutputsHistory onRemixThis={handleRemixThis} />
        </TabsContent>
      </Tabs>

      {/* Progress log — persists across all tabs and navigation */}
      {dedupedMessages.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {generating ? 'Generando...' : isCompleted ? 'Completado' : 'Run log'}
              </h3>
              <span className="text-xs text-muted-foreground">
                {completedCount + errorCount} / {totalConcepts || dedupedMessages.length}
              </span>
            </div>
            {generating && totalConcepts > 0 && (
              <Progress value={((completedCount + errorCount) / totalConcepts) * 100} />
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
              {dedupedMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  {msg.type === 'concept_done' ? (
                    <CheckCircle size={12} className="text-accent shrink-0 mt-0.5" />
                  ) : msg.type === 'concept_error' ? (
                    <AlertCircle size={12} className="text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 size={12} className={cn('shrink-0 mt-0.5', generating ? 'text-primary animate-spin' : 'text-muted-foreground')} />
                  )}
                  <span className={msg.type === 'concept_error' ? 'text-destructive' : 'text-muted-foreground'}>
                    {(msg.message as string) || `Concept #${msg.concept_index}`}
                    {msg.type === 'concept_done' && ` — ${(msg.time as number)?.toFixed(1)}s`}
                    {msg.type === 'concept_error' && ` — ${msg.error}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Alert className="border-accent/30 bg-accent/10 text-accent mt-4">
          <CheckCircle />
          <AlertDescription className="text-accent">
            Generación completa — {completedCount} conceptos, {dedupedImages.length} imágenes
            {errorCount > 0 && `, ${errorCount} errores`}
          </AlertDescription>
        </Alert>
      )}

      {dedupedImages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Imágenes generadas</h2>
          <ImageGrid images={dedupedImages} />
        </div>
      )}
    </div>
  );
}

function ConceptsMode({ jobCallbacks }: { jobCallbacks: JobCallbacks }) {
  const { onJobStarted, onReset, generating } = jobCallbacks;

  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [selectedAvatars, setSelectedAvatars] = useState<Set<string>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());

  const [count, setCount] = useState(6);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [resolution, setResolution] = useState('2K');
  const [numImages, setNumImages] = useState(2);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [useProductImages, setUseProductImages] = useState(false);
  const [useBrandDna, setUseBrandDna] = useState(true);
  const [useBrandModifier, setUseBrandModifier] = useState(false);
  const [offerCta, setOfferCta] = useState('');

  const [conceptPrompt, setConceptPrompt] = useState('');
  const [showConceptPromptModal, setShowConceptPromptModal] = useState(false);
  const [pastePlanRaw, setPastePlanRaw] = useState('');
  const [conceptPlan, setConceptPlan] = useState<ConceptItem[]>([]);
  const [planError, setPlanError] = useState('');
  const [loadingBuildPrompt, setLoadingBuildPrompt] = useState(false);
  const [loadingParsePlan, setLoadingParsePlan] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatars().then(setAvatars).catch(console.error);
    fetchFormats().then(setFormats).catch(console.error);
    fetchBrandProducts().then((ps: Product[]) => {
      setProducts(ps);
      if (ps.length > 0) setSelectedProductId(ps[0].id);
    }).catch(console.error);
  }, []);

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
    onReset();
    try {
      const result = await startConceptGeneration({
        concepts: conceptPlan,
        resolution,
        num_images: numImages,
        use_brand_modifier: useBrandModifier,
      });
      if (result.error) {
        setGenError(result.error);
        return;
      }
      onJobStarted(result.job_id);
    } catch (e) {
      setGenError(String(e));
    }
  };

  const avatarsMap = Object.fromEntries(avatars.map((a) => [a.id, a]));
  const formatsMap = Object.fromEntries(formats.map((f) => [f.id, f]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Avatars</h2>
                <span className="text-xs text-muted-foreground">
                  {selectedAvatars.size} seleccionado{selectedAvatars.size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {avatars.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => toggleAvatar(a.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedAvatars.has(a.id)
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-border bg-background hover:border-muted-foreground/40'
                    )}
                  >
                    <Checkbox checked={selectedAvatars.has(a.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</div>
                    </div>
                  </div>
                ))}
                {avatars.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No hay avatares. Creálos en la tool <span className="text-primary">Avatars</span>.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Formatos</h2>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFormat(f.id)}
                    className={cn(
                      'text-left p-3 rounded-lg border transition-all text-xs',
                      selectedFormats.has(f.id)
                        ? 'border-accent/50 bg-accent/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                    )}
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="text-muted-foreground mt-0.5 line-clamp-2">{f.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Configuración</h2>

              {products.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Producto</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Conceptos a generar</Label>
                  <Select value={String(count)} onValueChange={(v: string) => setCount(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[4, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Aspect ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['1:1', '4:5', '9:16', '16:9', '3:4'].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Resolución</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5K">0.5K (rápido)</SelectItem>
                      <SelectItem value="1K">1K (test)</SelectItem>
                      <SelectItem value="2K">2K (producción)</SelectItem>
                      <SelectItem value="4K">4K (hero)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Imágenes por concepto</Label>
                  <Select value={String(numImages)} onValueChange={(v) => setNumImages(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Prompt de planificación (Claude)</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox checked={useBrandDna} onCheckedChange={(c: boolean | 'indeterminate') => setUseBrandDna(!!c)} />
                    Incluir Brand Kit (DNA)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox checked={useProductImages} onCheckedChange={(c: boolean | 'indeterminate') => setUseProductImages(!!c)} />
                    Incluir imágenes del producto
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Generación de imágenes (FAL)</p>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox checked={useBrandModifier} onCheckedChange={(c: boolean | 'indeterminate') => setUseBrandModifier(!!c)} />
                  Aplicar brand modifier visual
                </label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Offer / CTA (opcional)</Label>
                <Input
                  value={offerCta}
                  onChange={(e) => setOfferCta(e.target.value)}
                  placeholder="Shop Now, 20% off first order"
                />
              </div>

              <Button
                onClick={handleBuildConceptPrompt}
                disabled={loadingBuildPrompt || selectedAvatars.size === 0 || selectedFormats.size === 0}
                variant="secondary"
                className="w-full"
              >
                {loadingBuildPrompt ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {selectedAvatars.size === 0 || selectedFormats.size === 0
                  ? 'Seleccioná avatares y formatos primero'
                  : 'Generar prompt para Claude'}
              </Button>

              {planError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{planError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {showConceptPromptModal && (
            <Card className="border-primary/30">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Prompt listo — copialo a claude.ai</h3>
                  <div className="flex items-center gap-2">
                    <CopyButton text={conceptPrompt} />
                    <Button variant="ghost" size="icon" onClick={() => setShowConceptPromptModal(false)} className="h-8 w-8">
                      <X size={15} />
                    </Button>
                  </div>
                </div>
                <Textarea readOnly value={conceptPrompt} rows={5} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground">Pegá la respuesta JSON de Claude aquí:</p>
                <Textarea
                  value={pastePlanRaw}
                  onChange={(e) => setPastePlanRaw(e.target.value)}
                  placeholder='[{ "concept_index": 1, "avatar_id": "...", ... }]'
                  rows={5}
                  className="font-mono text-xs"
                />
                <Button
                  onClick={handleParsePlan}
                  disabled={loadingParsePlan || !pastePlanRaw.trim()}
                  variant="secondary"
                  className="w-full"
                >
                  {loadingParsePlan ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                  Parsear plan de Claude
                </Button>
                {planError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{planError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {conceptPlan.length > 0 && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Plan — {conceptPlan.length} conceptos
                  </h3>
                  <Button onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                      <><Loader2 className="animate-spin" /> Generando...</>
                    ) : (
                      <><Play /> Generar imágenes</>
                    )}
                  </Button>
                </div>

                {genError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{genError}</AlertDescription>
                  </Alert>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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
    <div className="bg-background rounded-lg border border-border p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-muted-foreground">#{concept.concept_index}</span>
            <span className="text-primary">{formatName}</span>
            <span className="text-muted-foreground">×</span>
            <span className="text-accent">{avatarName}</span>
          </div>
          <p className="text-foreground font-medium line-clamp-1">{concept.hook}</p>
          {expanded && (
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p><span className="text-foreground">Ángulo:</span> {concept.angle}</p>
              <p><span className="text-foreground">Visual:</span> {concept.prompt_additions}</p>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-7 w-7 shrink-0">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </Button>
      </div>
    </div>
  );
}

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

function RemixMode({
  initialRef,
  onRefConsumed,
  jobCallbacks,
}: {
  initialRef?: RemixRef | null;
  onRefConsumed?: () => void;
  jobCallbacks: JobCallbacks;
}) {
  const { onJobStarted, onReset, generating } = jobCallbacks;

  const [_refFile, setRefFile] = useState<File | null>(null);
  const [refPath, setRefPath] = useState(initialRef?.path ?? '');
  const [refPreview, setRefPreview] = useState(initialRef?.src ?? '');
  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [aspectRatioAuto, setAspectRatioAuto] = useState(false);
  const [resolution, setResolution] = useState('2K');
  const [useBrandModifier, setUseBrandModifier] = useState(false);
  const [useReferenceAds, setUseReferenceAds] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [remixAvatars, setRemixAvatars] = useState<Avatar[]>([]);
  const [remixProducts, setRemixProducts] = useState<Product[]>([]);
  const [uploading, setUploading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatars().then(setRemixAvatars).catch(console.error);
    fetchBrandProducts().then((ps: Product[]) => setRemixProducts(ps)).catch(console.error);
  }, []);

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
  }, [initialRef]); // eslint-disable-line react-hooks/exhaustive-deps

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
    onReset();
    try {
      const result = await startRemix({
        reference_path: refPath,
        instructions,
        count,
        aspect_ratio: aspectRatio,
        resolution,
        use_brand_modifier: useBrandModifier,
        use_reference_ads: useReferenceAds,
        product_id: selectedProductId || undefined,
        avatar_id: selectedAvatarId || undefined,
      });
      onJobStarted(result.job_id);
    } catch (e) {
      setGenError(String(e));
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Imagen de referencia</h2>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/40 transition-colors">
            {refPreview ? (
              <img src={refPreview} alt="reference" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <UploadIcon size={24} className="text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click para subir imagen</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          {uploading && <p className="text-xs text-primary">Subiendo...</p>}
          {refPath && !uploading && <p className="text-xs text-accent">Imagen lista</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Producto y audiencia</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Producto <span className="text-muted-foreground/60">(opcional)</span></Label>
              <Select value={selectedProductId || '__none'} onValueChange={(v: string) => setSelectedProductId(v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sin producto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin producto</SelectItem>
                  {remixProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Avatar <span className="text-muted-foreground/60">(opcional)</span></Label>
              <Select value={selectedAvatarId || '__none'} onValueChange={(v: string) => setSelectedAvatarId(v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sin avatar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin avatar</SelectItem>
                  {remixAvatars.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedProductId && (
            <p className="text-xs text-primary">Las imágenes del producto se pasarán a FAL como input visual adicional.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Instrucciones</h2>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe how to remix this image — keep the same composition but change the color palette to neon green highlights..."
            rows={4}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Variaciones</Label>
              <Select value={String(count)} onValueChange={(v: string) => setCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Aspect ratio</Label>
                {aspectRatioAuto && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">auto</Badge>}
              </div>
              <Select
                value={aspectRatio}
                onValueChange={(v: string) => { setAspectRatio(v); setAspectRatioAuto(false); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['1:1', '4:5', '9:16', '16:9'].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resolución</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5K">0.5K</SelectItem>
                  <SelectItem value="1K">1K</SelectItem>
                  <SelectItem value="2K">2K</SelectItem>
                  <SelectItem value="4K">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <Checkbox checked={useBrandModifier} onCheckedChange={(c: boolean | 'indeterminate') => setUseBrandModifier(!!c)} />
              Aplicar brand modifier visual
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <Checkbox checked={useReferenceAds} onCheckedChange={(c: boolean | 'indeterminate') => setUseReferenceAds(!!c)} />
              Incluir reference ads como guía de estilo
            </label>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !refPath || !instructions.trim()}
            className="w-full"
          >
            {generating ? <><Loader2 className="animate-spin" /> Generando...</> : <><Play /> Generar remix</>}
          </Button>
          {genError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{genError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
  onRemixThis: (ref: RemixRef) => void;
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
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl! w-full p-0 overflow-hidden sm:rounded-2xl!"
      >
        <div className="flex flex-col lg:flex-row max-h-[90vh]">
          <div className="lg:w-1/2 bg-black flex items-center justify-center p-4 min-h-64">
            <img
              src={selected.src}
              alt="Ad"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>

          <div className="lg:w-1/2 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-xs font-mono text-muted-foreground">{selected.folder}</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X size={18} />
              </Button>
            </div>
            <Separator />

            <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {meta.resolution && (
                  <Badge variant="outline">{meta.resolution}</Badge>
                )}
                {isRemix ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">Remix</Badge>
                ) : (
                  <>
                    {(meta.format_name ?? meta.format_id) && (
                      <Badge variant="outline" className="border-primary/30 text-primary">{meta.format_name ?? meta.format_id}</Badge>
                    )}
                    {(meta.avatar_name ?? meta.avatar_id) && (
                      <Badge variant="outline" className="border-accent/30 text-accent">{meta.avatar_name ?? meta.avatar_id}</Badge>
                    )}
                  </>
                )}
              </div>

              {meta.hook && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Hook</p>
                  <p className="text-sm text-foreground font-medium">"{meta.hook}"</p>
                </div>
              )}

              {meta.angle && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Ángulo</p>
                  <p className="text-sm text-foreground">{meta.angle}</p>
                </div>
              )}

              {meta.instructions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Instrucciones</p>
                  <p className="text-sm text-foreground">{meta.instructions}</p>
                </div>
              )}

              {meta.prompt && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Prompt enviado a FAL</p>
                  <p className="text-xs text-muted-foreground font-mono bg-background border border-border rounded-lg p-3 whitespace-pre-wrap wrap-break-word">{meta.prompt}</p>
                </div>
              )}
            </div>

            <Separator />
            <div className="px-5 py-4 flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <a href={selected.src} download={selected.filename}>
                  <Download size={13} /> Descargar
                </a>
              </Button>
              <Button onClick={handleRemixThis} disabled={loadingRemix} size="sm">
                {loadingRemix ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Remix this
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OutputsHistory({ onRemixThis }: { onRemixThis: (ref: RemixRef) => void }) {
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
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Cargando historial...
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">No hay generaciones todavía.</p>
        <p className="text-xs mt-1">Las imágenes generadas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">{folders.length} generacion{folders.length !== 1 ? 'es' : ''}</p>
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
            <Card key={f.folder}>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{f.folder}</span>
                    {f.meta.resolution && (
                      <Badge variant="outline" className="text-xs">{f.meta.resolution}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(f.folder)}
                      disabled={deleting === f.folder}
                      title="Eliminar generación"
                      className="ml-auto h-7 w-7 hover:text-destructive"
                    >
                      {deleting === f.folder
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
                  {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
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
              </CardContent>
            </Card>
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
