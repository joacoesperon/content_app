import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronLeft as ArrowLeft,
  ChevronRight as ArrowRight,
  Copy,
  Download,
  FileText,
  Film,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteReelOutput,
  fetchDirectorFileReels,
  fetchDirectorFiles,
  fetchReelOutput,
  fetchReelOutputs,
  fetchReelsPricing,
  renderReelFinal,
  setReelFavorite,
} from '../lib/api';
import type {
  ReelBrief,
  ReelOutput,
  ReelsPricing,
  SceneVersion,
} from '../lib/api';
import { useReelJobs } from '../context/ReelJobsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Tab = 'new' | 'history';

const ASPECT_OPTIONS = [
  { value: '9:16', label: '9:16 (reel)' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '16:9', label: '16:9' },
];

function dateFromFilename(filename: string): string {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

interface SceneFormState {
  number: number;
  setting: string;
  expression: string;
  toneId: string;
  dialogue: string;
  animationHint: string;
  aspectRatio: string;
  extraImagePrompt: string;
  // originals (so we can reset)
  originalSetting: string;
  originalExpression: string;
  originalToneId: string;
  originalDialogue: string;
  originalAnimationHint: string;
  // versions
  versions: SceneVersion[];
  currentVersion: number | null;
  favoriteVersion: number | null;
  error: string | null;
}

function initialSceneState(s: ReelBrief['scenes'][number]): SceneFormState {
  return {
    number: s.number,
    setting: s.setting,
    expression: s.expression,
    toneId: s.tone_id,
    dialogue: s.dialogue,
    animationHint: s.animation_hint,
    aspectRatio: '9:16',
    extraImagePrompt: '',
    originalSetting: s.setting,
    originalExpression: s.expression,
    originalToneId: s.tone_id,
    originalDialogue: s.dialogue,
    originalAnimationHint: s.animation_hint,
    versions: [],
    currentVersion: null,
    favoriteVersion: null,
    error: null,
  };
}

// ─── Scene card ──────────────────────────────────────────────────────────────

function SceneCard({
  scene,
  isGenerating,
  onChange,
  onGenerate,
  onToggleFavorite,
}: {
  scene: SceneFormState;
  isGenerating: boolean;
  onChange: (patch: Partial<SceneFormState>) => void;
  onGenerate: () => void;
  onToggleFavorite: (v: number | null) => void;
}) {
  const currentIdx = scene.versions.findIndex((v) => v.version === scene.currentVersion);
  const currentVersion = currentIdx >= 0 ? scene.versions[currentIdx] : null;
  const canPrev = currentIdx > 0;
  const canNext = currentIdx >= 0 && currentIdx < scene.versions.length - 1;
  const isFavorite = currentVersion?.version === scene.favoriteVersion;

  const fieldChanged = (orig: string, current: string) => orig !== current;
  const hasEdits =
    fieldChanged(scene.originalSetting, scene.setting) ||
    fieldChanged(scene.originalExpression, scene.expression) ||
    fieldChanged(scene.originalToneId, scene.toneId) ||
    fieldChanged(scene.originalDialogue, scene.dialogue) ||
    fieldChanged(scene.originalAnimationHint, scene.animationHint);

  const reset = () =>
    onChange({
      setting: scene.originalSetting,
      expression: scene.originalExpression,
      toneId: scene.originalToneId,
      dialogue: scene.originalDialogue,
      animationHint: scene.originalAnimationHint,
    });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Scene {scene.number}</span>
          <span className="text-xs text-muted-foreground">8s</span>
        </div>
        {scene.versions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Check size={12} /> {scene.versions.length} {scene.versions.length === 1 ? 'version' : 'versions'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Setting</Label>
          {hasEdits && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline"
            >
              <RotateCcw size={11} /> Reset to Director
            </button>
          )}
        </div>
        <Textarea
          value={scene.setting}
          onChange={(e) => onChange({ setting: e.target.value })}
          rows={2}
          className="text-xs"
          placeholder="Where the candle is..."
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Expression</Label>
          <Input
            value={scene.expression}
            onChange={(e) => onChange({ expression: e.target.value })}
            className="h-8 text-xs"
            placeholder="smug, panicked, ..."
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tone id</Label>
          <Input
            value={scene.toneId}
            onChange={(e) => onChange({ toneId: e.target.value })}
            className="h-8 text-xs"
            placeholder="deadpan, warm, ..."
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Aspect</Label>
          <Select value={scene.aspectRatio} onValueChange={(v) => onChange({ aspectRatio: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Dialogue (≤16 words)</Label>
        <Input
          value={scene.dialogue}
          onChange={(e) => onChange({ dialogue: e.target.value })}
          className="text-sm"
          placeholder="What JT says..."
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Animation hint</Label>
        <Textarea
          value={scene.animationHint}
          onChange={(e) => onChange({ animationHint: e.target.value })}
          rows={2}
          className="text-xs"
        />
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Extra image prompt (optional)
        </summary>
        <Textarea
          value={scene.extraImagePrompt}
          onChange={(e) => onChange({ extraImagePrompt: e.target.value })}
          rows={2}
          className="text-xs mt-2"
          placeholder="Additional direction for nano-banana-pro/edit"
        />
      </details>

      <Button onClick={onGenerate} disabled={isGenerating} size="sm" className="w-full">
        {isGenerating ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Generating (~2-3 min)...
          </>
        ) : scene.versions.length > 0 ? (
          <>
            <RefreshCw size={14} className="mr-2" /> Regenerate (~$1.30)
          </>
        ) : (
          <>
            <Sparkles size={14} className="mr-2" /> Generate (~$1.30)
          </>
        )}
      </Button>

      {scene.error && <p className="text-xs text-red-500">{scene.error}</p>}

      {currentVersion?.video_url && (
        <div className="space-y-2">
          <video
            src={currentVersion.video_url}
            controls
            playsInline
            className="w-full rounded border border-border bg-black"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => canPrev && onChange({ currentVersion: scene.versions[currentIdx - 1].version })}
                disabled={!canPrev}
              >
                <ArrowLeft size={14} />
              </Button>
              <span className="text-xs font-mono text-muted-foreground min-w-10 text-center">
                {currentIdx + 1} / {scene.versions.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => canNext && onChange({ currentVersion: scene.versions[currentIdx + 1].version })}
                disabled={!canNext}
              >
                <ArrowRight size={14} />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleFavorite(isFavorite ? null : currentVersion.version)}
                title={isFavorite ? 'Unset favorite' : 'Mark as favorite (used in final render)'}
              >
                <Star size={14} className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
              </Button>
              {currentVersion.video_url && (
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <a href={currentVersion.video_url} download={`scene_${scene.number}_v${currentVersion.version}.mp4`}>
                    <Download size={14} />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground font-mono">
            v{currentVersion.version} · {currentVersion.aspect_ratio} · {currentVersion.expression} · {currentVersion.tone_id}
            {scene.favoriteVersion != null && (
              <span className="ml-2 text-yellow-500">★ Favorite v{scene.favoriteVersion}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Reel editor ─────────────────────────────────────────────────────────────

function ReelEditor({
  filename,
  reel,
  pricing,
  onBack,
}: {
  filename: string;
  reel: ReelBrief;
  pricing: ReelsPricing | null;
  onBack: () => void;
}) {
  const jobs = useReelJobs();
  const [scenes, setScenes] = useState<SceneFormState[]>(() =>
    reel.scenes.map(initialSceneState),
  );
  const [hashtags, setHashtags] = useState(reel.hashtags);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const date = dateFromFilename(filename);

  useEffect(() => {
    setScenes(reel.scenes.map(initialSceneState));
    setHashtags(reel.hashtags);
    setFinalUrl(null);
  }, [reel.number, reel.slug, reel.hashtags, reel.scenes]);

  // hydrate saved versions from disk
  useEffect(() => {
    if (!date) return;
    fetchReelOutput(date, reel.slug).then((out) => {
      if (!out) return;
      setFinalUrl(out.final_url);
      setScenes((prev) =>
        prev.map((s) => {
          const saved = out.scenes.find((x) => x.scene_number === s.number);
          if (!saved || saved.versions.length === 0) return s;
          const latest = saved.versions[saved.versions.length - 1];
          return {
            ...s,
            versions: saved.versions,
            currentVersion: latest.version,
            favoriteVersion: saved.favorite_version,
            aspectRatio: latest.aspect_ratio || s.aspectRatio,
          };
        }),
      );
    });
  }, [date, reel.slug]);

  // Watch global jobs context — pick up results that completed while this view was unmounted
  useEffect(() => {
    setScenes((prev) =>
      prev.map((s) => {
        const key = jobs.jobKey(filename, reel.slug, s.number);
        const job = jobs.jobs[key];
        if (!job) return s;
        let next = s;
        if (job.lastError && s.error !== job.lastError) {
          next = { ...next, error: job.lastError };
        }
        const result = job.lastResult;
        if (result) {
          const alreadyHave = s.versions.some((v) => v.version === result.new_version.version);
          if (!alreadyHave) {
            next = {
              ...next,
              versions: result.all_versions,
              currentVersion: result.new_version.version,
              favoriteVersion: result.favorite_version,
              error: null,
            };
          }
        }
        return next;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.jobs, filename, reel.slug]);

  const updateScene = (number: number, patch: Partial<SceneFormState>) => {
    setScenes((prev) => prev.map((s) => (s.number === number ? { ...s, ...patch } : s)));
  };

  const generateScene = async (number: number) => {
    const scene = scenes.find((s) => s.number === number);
    if (!scene) return;
    updateScene(number, { error: null });

    await jobs.startGenerate(
      {
        filename,
        reel_number: reel.number,
        scene_number: number,
        setting: scene.setting,
        expression: scene.expression,
        tone_id: scene.toneId,
        dialogue: scene.dialogue,
        animation_hint: scene.animationHint,
        aspect_ratio: scene.aspectRatio,
        extra_image_prompt: scene.extraImagePrompt || undefined,
        reel_slug: reel.slug,
      },
      (res) => {
        setScenes((prev) =>
          prev.map((s) =>
            s.number === number
              ? {
                  ...s,
                  versions: res.all_versions,
                  currentVersion: res.new_version.version,
                  favoriteVersion: res.favorite_version,
                  error: null,
                }
              : s,
          ),
        );
      },
    );
  };

  const generateAll = async () => {
    const missing = scenes.filter((s) => s.versions.length === 0);
    if (missing.length === 0) {
      toast.info('All scenes already generated. Regenerate individually if you want.');
      return;
    }
    const cost = missing.length * (pricing ? pricing.image_per_scene + pricing.video_per_scene : 1.3);
    if (!confirm(`Generate ${missing.length} scenes for ~${fmtMoney(cost)}? This takes ~2-3 min per scene.`)) return;
    for (const s of missing) {
      await generateScene(s.number);
    }
  };

  const toggleFavorite = async (sceneNumber: number, version: number | null) => {
    if (!date) return;
    try {
      const info = await setReelFavorite(date, reel.slug, sceneNumber, version);
      updateScene(sceneNumber, { favoriteVersion: info.favorite_version });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error setting favorite');
    }
  };

  const renderFinal = async () => {
    if (!date) return;
    setRendering(true);
    try {
      const res = await renderReelFinal(date, reel.slug);
      setFinalUrl(`${res.final_url}?t=${Date.now()}`);
      toast.success('Final video rendered');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Render error');
    } finally {
      setRendering(false);
    }
  };

  const copyCaptionAndHashtags = () => {
    const text = (reel.concept + (hashtags ? `\n\n${hashtags}` : '')).trim();
    navigator.clipboard.writeText(text);
    toast.success('Caption + hashtags copied');
  };

  const allGenerated = scenes.every((s) => s.versions.length > 0);
  const someGenerated = scenes.some((s) => s.versions.length > 0);
  const pendingCost = pricing
    ? scenes.filter((s) => s.versions.length === 0).length * (pricing.image_per_scene + pricing.video_per_scene)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft size={14} className="mr-1" /> Back to reels
        </Button>
        <div className="text-xs text-muted-foreground font-mono">
          Reel {reel.number} · {reel.slug}
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">{reel.category}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{reel.avatar}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{reel.lever}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{reel.total_length}</span>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Concept</Label>
          <p className="text-sm mt-1">{reel.concept}</p>
        </div>

        {reel.voice_direction && (
          <div>
            <Label className="text-xs text-muted-foreground">Voice direction</Label>
            <p className="text-xs text-muted-foreground mt-1 italic">{reel.voice_direction}</p>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">Hashtags</Label>
          <Textarea
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            rows={2}
            className="text-xs font-mono mt-1"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={copyCaptionAndHashtags}>
            <Copy size={14} className="mr-2" />
            Copy concept + hashtags
          </Button>
          {someGenerated && (
            <Button size="sm" variant="outline" onClick={renderFinal} disabled={rendering || !allGenerated}>
              {rendering ? <Loader2 size={14} className="animate-spin mr-2" /> : <Video size={14} className="mr-2" />}
              {rendering ? 'Rendering...' : allGenerated ? 'Render final video' : `Render (${scenes.filter((s) => s.versions.length > 0).length}/${scenes.length})`}
            </Button>
          )}
          {finalUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={finalUrl} download={`${reel.slug}.mp4`}>
                <Download size={14} className="mr-2" />
                Download final.mp4
              </a>
            </Button>
          )}
        </div>

        {finalUrl && (
          <div className="mt-2">
            <video src={finalUrl} controls playsInline className="w-full max-w-sm rounded border border-border bg-black" />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{scenes.length} scenes</span>
        <Button size="sm" onClick={generateAll}>
          <Sparkles size={14} className="mr-2" />
          Generate all missing (~{fmtMoney(pendingCost)})
        </Button>
      </div>

      <div className={`grid gap-4 ${scenes.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {scenes.map((s) => {
          const key = jobs.jobKey(filename, reel.slug, s.number);
          return (
            <SceneCard
              key={s.number}
              scene={s}
              isGenerating={jobs.isGenerating(key)}
              onChange={(patch) => updateScene(s.number, patch)}
              onGenerate={() => generateScene(s.number)}
              onToggleFavorite={(v) => toggleFavorite(s.number, v)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Reels list ──────────────────────────────────────────────────────────────

function ReelsList({
  reels,
  generatedMap,
  onSelect,
}: {
  reels: ReelBrief[];
  generatedMap: Record<string, number>;
  onSelect: (r: ReelBrief) => void;
}) {
  return (
    <div className="space-y-2">
      {reels.map((reel) => {
        const gen = generatedMap[reel.slug] ?? 0;
        return (
          <button
            key={reel.number}
            onClick={() => onSelect(reel)}
            className="w-full text-left p-4 rounded-lg border border-border hover:border-accent/40 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground">Reel {reel.number}</span>
              <span className="text-xs text-muted-foreground">
                {gen > 0 ? (
                  <span className="text-green-500">{gen}/{reel.scenes.length} scenes generated</span>
                ) : (
                  `${reel.scenes.length} scenes · ${reel.total_length}`
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">{reel.category}</span>
              <span className="text-xs text-muted-foreground">{reel.lever}</span>
            </div>
            <p className="text-sm text-foreground/80 line-clamp-2">{reel.concept || '(no concept)'}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [outputs, setOutputs] = useState<ReelOutput[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchReelOutputs().then(setOutputs).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (o: ReelOutput) => {
    if (!confirm(`Delete ${o.folder}?`)) return;
    await deleteReelOutput(o.date, o.reel_slug);
    toast.success('Deleted');
    load();
  };

  const pickVersion = (scene: ReelOutput['scenes'][number]): SceneVersion | null => {
    if (!scene.versions.length) return null;
    if (scene.favorite_version != null) {
      const fav = scene.versions.find((v) => v.version === scene.favorite_version);
      if (fav) return fav;
    }
    return scene.versions[scene.versions.length - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg mb-2">No generated reels yet</p>
        <p className="text-sm">Generate scenes in the "New" tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {outputs.map((o) => (
        <Card key={o.folder} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{o.date}</span>
                <span className="text-xs text-muted-foreground">·</span>
                {o.category && (
                  <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">{o.category}</span>
                )}
                {o.lever && <span className="text-xs text-muted-foreground">{o.lever}</span>}
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{o.scenes.length} scenes</span>
              </div>
              <p className="text-sm text-foreground/80 max-w-xl">{o.concept}</p>
            </div>
            <div className="flex gap-2">
              {o.final_url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={o.final_url} download={`${o.reel_slug}.mp4`}>
                    <Download size={14} className="mr-2" /> final.mp4
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(o)}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {o.scenes.map((s) => {
              const v = pickVersion(s);
              if (!v?.video_url) return null;
              return (
                <video
                  key={s.scene_number}
                  src={v.video_url}
                  controls
                  playsInline
                  className="w-full rounded border border-border bg-black"
                />
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Reels() {
  const [tab, setTab] = useState<Tab>('new');
  const [files, setFiles] = useState<{ filename: string; reels_count: number }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reels, setReels] = useState<ReelBrief[]>([]);
  const [selectedReel, setSelectedReel] = useState<ReelBrief | null>(null);
  const [pricing, setPricing] = useState<ReelsPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedMap, setGeneratedMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDirectorFiles().then((fs) => {
      setFiles(fs);
      if (fs.length > 0) setSelectedFile(fs[0].filename);
    });
    fetchReelsPricing().then(setPricing).catch(() => setPricing(null));
  }, []);

  const refreshGeneratedMap = (filename: string | null) => {
    if (!filename) return;
    fetchReelOutputs().then((all) => {
      const date = dateFromFilename(filename);
      const map: Record<string, number> = {};
      all.filter((o) => o.date === date).forEach((o) => {
        map[o.reel_slug] = o.scenes.filter((s) => s.versions.length > 0).length;
      });
      setGeneratedMap(map);
    });
  };

  useEffect(() => {
    if (!selectedFile) {
      setReels([]);
      return;
    }
    setLoading(true);
    fetchDirectorFileReels(selectedFile)
      .then(setReels)
      .catch(() => {
        toast.error('Error loading reels');
        setReels([]);
      })
      .finally(() => setLoading(false));
    setSelectedReel(null);
    refreshGeneratedMap(selectedFile);
  }, [selectedFile]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reels</h1>
        <p className="text-muted-foreground">
          Turn Director scripts into 9:16 vertical videos with the JT mascot via nano-banana-pro/edit + Veo 3.1 Fast.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="new">
            <FileText size={14} className="mr-2" />
            New from Director
          </TabsTrigger>
          <TabsTrigger value="history">
            <Film size={14} className="mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          {files.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-2">No Director outputs found</p>
              <p className="text-sm">Run Director first to generate reel scripts.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Director output</Label>
                <Select value={selectedFile ?? undefined} onValueChange={setSelectedFile}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Choose a Director file" />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((f) => (
                      <SelectItem key={f.filename} value={f.filename}>
                        {f.filename} ({f.reels_count} reels)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
                  <Loader2 size={16} className="animate-spin" /> Loading reels...
                </div>
              ) : selectedReel ? (
                <ReelEditor
                  filename={selectedFile!}
                  reel={selectedReel}
                  pricing={pricing}
                  onBack={() => {
                    setSelectedReel(null);
                    refreshGeneratedMap(selectedFile);
                  }}
                />
              ) : (
                <ReelsList
                  reels={reels}
                  generatedMap={generatedMap}
                  onSelect={setSelectedReel}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
