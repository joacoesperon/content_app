import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronLeft as ArrowLeft,
  ChevronRight as ArrowRight,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteCarouselOutput,
  fetchBrandModifier,
  fetchCarouselOutput,
  fetchCarouselOutputs,
  fetchPricing,
  fetchScoutFilePosts,
  fetchScoutFiles,
  getCarouselZipUrl,
  publishCarouselToInstagram,
  setCarouselFavorite,
} from '../lib/api';
import type {
  CarouselOutput,
  PostBrief,
  PricingInfo,
  SlideVersion,
} from '../lib/api';
import { useCarouselJobs } from '../context/CarouselJobsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

type Tab = 'new' | 'publish' | 'history';

const RESOLUTION_OPTIONS: { value: string; label: string }[] = [
  { value: '0.5K', label: '0.5K' },
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const THINKING_OPTIONS: { value: string; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'high', label: 'High' },
];

// IG-relevant aspect ratios first, then the rest from FAL
const ASPECT_RATIO_OPTIONS: { value: string; label: string }[] = [
  { value: '4:5', label: '4:5 (IG carousel)' },
  { value: '1:1', label: '1:1 (square)' },
  { value: '9:16', label: '9:16 (story / reel)' },
  { value: '16:9', label: '16:9 (landscape)' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '4:3', label: '4:3' },
  { value: '5:4', label: '5:4' },
  { value: '3:2', label: '3:2' },
  { value: '21:9', label: '21:9 (ultrawide)' },
  { value: 'auto', label: 'Auto' },
];

function dateFromFilename(filename: string): string {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function costPerImage(pricing: PricingInfo | null, resolution: string, thinking: string): number {
  if (!pricing) return 0;
  const mult = pricing.resolution_multipliers[resolution] ?? 1;
  let price = pricing.base_per_image * mult;
  if (thinking === 'high') price += pricing.thinking_high_extra;
  if (thinking === 'minimal') price += pricing.thinking_minimal_extra;
  return price;
}

function fmtMoney(n: number): string {
  return `$${n.toFixed(3)}`;
}

// ─── Slide state ─────────────────────────────────────────────────────────────

interface SlideFormState {
  number: number;
  label: string;
  prompt: string;
  originalPrompt: string;  // Scout's untouched prompt — never mutated
  applyModifier: boolean;
  resolution: string;
  aspectRatio: string;
  seed: string;  // keep as string for empty-friendly input
  thinking: string;  // "off" | "minimal" | "high"
  versions: SlideVersion[];
  currentVersion: number | null; // version currently shown in UI
  favoriteVersion: number | null;
  error: string | null;
}

function initialSlideState(
  number: number,
  label: string,
  prompt: string,
): SlideFormState {
  return {
    number,
    label,
    prompt,
    originalPrompt: prompt,
    applyModifier: true,
    resolution: '2K',
    aspectRatio: '4:5',
    seed: '',
    thinking: 'off',
    versions: [],
    currentVersion: null,
    favoriteVersion: null,
    error: null,
  };
}

// ─── Slide card ──────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  modifier,
  pricing,
  isGenerating,
  filename,
  postSlug,
  onChange,
  onGenerate,
  onToggleFavorite,
}: {
  slide: SlideFormState;
  modifier: string;
  pricing: PricingInfo | null;
  isGenerating: boolean;
  filename: string;
  postSlug: string;
  onChange: (patch: Partial<SlideFormState>) => void;
  onGenerate: () => void;
  onToggleFavorite: (version: number | null) => void;
}) {
  const [showFinal, setShowFinal] = useState(false);

  const finalPrompt = slide.applyModifier && modifier
    ? `${modifier} ${slide.prompt}`
    : slide.prompt;

  const cost = costPerImage(pricing, slide.resolution, slide.thinking);

  const currentIdx = slide.versions.findIndex((v) => v.version === slide.currentVersion);
  const currentVersion = currentIdx >= 0 ? slide.versions[currentIdx] : null;
  const canPrev = currentIdx > 0;
  const canNext = currentIdx >= 0 && currentIdx < slide.versions.length - 1;

  const goPrev = () => {
    if (canPrev) onChange({ currentVersion: slide.versions[currentIdx - 1].version });
  };
  const goNext = () => {
    if (canNext) onChange({ currentVersion: slide.versions[currentIdx + 1].version });
  };

  const isFavorite = currentVersion?.version === slide.favoriteVersion;

  const date = dateFromFilename(filename);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            Slide {slide.number}
          </span>
          <span className="text-sm font-medium">{slide.label}</span>
        </div>
        {slide.versions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Check size={12} /> {slide.versions.length} {slide.versions.length === 1 ? 'version' : 'versions'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Scene prompt</Label>
          {slide.prompt !== slide.originalPrompt && (
            <button
              type="button"
              onClick={() => onChange({ prompt: slide.originalPrompt })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline"
              title="Restore Scout's original prompt"
            >
              <RotateCcw size={11} /> Reset to Scout original
            </button>
          )}
        </div>
        <Textarea
          value={slide.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={5}
          className="text-xs font-mono"
          placeholder="Describe the scene..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Resolution</Label>
          <Select
            value={slide.resolution}
            onValueChange={(v) => onChange({ resolution: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Aspect ratio</Label>
          <Select
            value={slide.aspectRatio}
            onValueChange={(v) => onChange({ aspectRatio: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Thinking</Label>
          <Select
            value={slide.thinking}
            onValueChange={(v) => onChange({ thinking: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THINKING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Seed</Label>
          <Input
            type="number"
            value={slide.seed}
            onChange={(e) => onChange({ seed: e.target.value })}
            placeholder="random"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`mod-${slide.number}`}
          checked={slide.applyModifier}
          onCheckedChange={(v) => onChange({ applyModifier: !!v })}
        />
        <Label htmlFor={`mod-${slide.number}`} className="text-xs cursor-pointer">
          Apply brand modifier
        </Label>
        <button
          type="button"
          onClick={() => setShowFinal((v) => !v)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
        >
          {showFinal ? 'Hide' : 'Show'} final prompt
        </button>
      </div>

      {showFinal && (
        <div className="rounded border border-border bg-muted/40 p-2 text-[11px] font-mono text-muted-foreground max-h-32 overflow-auto whitespace-pre-wrap">
          {finalPrompt}
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="sm"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Generating...
          </>
        ) : slide.versions.length > 0 ? (
          <>
            <RefreshCw size={14} className="mr-2" />
            Regenerate ({fmtMoney(cost)})
          </>
        ) : (
          <>
            <ImageIcon size={14} className="mr-2" />
            Generate ({fmtMoney(cost)})
          </>
        )}
      </Button>

      {slide.error && (
        <p className="text-xs text-red-500">{slide.error}</p>
      )}

      {currentVersion && (
        <div className="space-y-2">
          <a
            href={currentVersion.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded overflow-hidden border border-border bg-black hover:border-accent/40 transition-colors"
            title="Click to open full size in new tab"
          >
            <img
              src={currentVersion.url}
              alt={`Slide ${slide.number} v${currentVersion.version}`}
              className="w-full h-auto block"
            />
          </a>

          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goPrev}
                disabled={!canPrev}
              >
                <ArrowLeft size={14} />
              </Button>
              <span className="text-xs font-mono text-muted-foreground min-w-10 text-center">
                {currentIdx + 1} / {slide.versions.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goNext}
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
                title={isFavorite ? 'Unset favorite' : 'Mark as favorite (used in ZIP)'}
                onClick={() => onToggleFavorite(isFavorite ? null : currentVersion.version)}
              >
                <Star
                  size={14}
                  className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                asChild
                title="Download this version"
              >
                <a href={currentVersion.url} download={`slide_${slide.number}_v${currentVersion.version}.png`}>
                  <Download size={14} />
                </a>
              </Button>
            </div>
          </div>

          {slide.versions.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {slide.versions.map((v) => (
                <button
                  key={v.version}
                  onClick={() => onChange({ currentVersion: v.version })}
                  className={`shrink-0 rounded border overflow-hidden ${
                    v.version === slide.currentVersion
                      ? 'border-accent'
                      : 'border-border hover:border-accent/60'
                  }`}
                  title={`v${v.version} · ${v.resolution} · ${v.apply_modifier ? 'w/ modifier' : 'no modifier'}`}
                >
                  <img src={v.url} alt={`v${v.version}`} className="w-12 h-15 object-cover block" />
                </button>
              ))}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
            <div>
              v{currentVersion.version} · {currentVersion.resolution} · {currentVersion.aspect_ratio} ·
              {currentVersion.apply_modifier ? ' modifier ON' : ' modifier OFF'}
              {currentVersion.thinking_level ? ` · thinking ${currentVersion.thinking_level}` : ''}
              {currentVersion.seed != null ? ` · seed ${currentVersion.seed}` : ''}
            </div>
            {slide.favoriteVersion != null && (
              <div className="text-yellow-500">
                ★ Favorite: v{slide.favoriteVersion} (used in ZIP)
              </div>
            )}
          </div>

          {/* anchor for unused warnings */}
          <span style={{ display: 'none' }}>{date}{postSlug}</span>
        </div>
      )}
    </Card>
  );
}

// ─── Post editor ─────────────────────────────────────────────────────────────

function PostEditor({
  filename,
  post,
  modifier,
  pricing,
  onBack,
}: {
  filename: string;
  post: PostBrief;
  modifier: string;
  pricing: PricingInfo | null;
  onBack: () => void;
}) {
  const jobs = useCarouselJobs();
  const [slides, setSlides] = useState<SlideFormState[]>(() =>
    post.slides.map((s) => initialSlideState(s.number, s.label, s.prompt)),
  );
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags);

  const date = dateFromFilename(filename);

  // reset when switching post
  useEffect(() => {
    setSlides(post.slides.map((s) => initialSlideState(s.number, s.label, s.prompt)));
    setCaption(post.caption);
    setHashtags(post.hashtags);
  }, [post.number, post.slug, post.caption, post.hashtags, post.slides]);

  // hydrate saved versions from backend on mount / post switch
  useEffect(() => {
    if (!date) return;
    fetchCarouselOutput(date, post.slug).then((out) => {
      if (!out) return;
      setSlides((prev) =>
        prev.map((s) => {
          const saved = out.slides.find((x) => x.slide_number === s.number);
          if (!saved || saved.versions.length === 0) return s;
          const latest = saved.versions[saved.versions.length - 1];
          return {
            ...s,
            versions: saved.versions,
            currentVersion: latest.version,
            favoriteVersion: saved.favorite_version,
            applyModifier: latest.apply_modifier,
            resolution: latest.resolution,
            aspectRatio: latest.aspect_ratio ?? '4:5',
            seed: latest.seed != null ? String(latest.seed) : '',
            thinking: latest.thinking_level ?? 'off',
          };
        }),
      );
    });
  }, [date, post.slug]);

  const updateSlide = (number: number, patch: Partial<SlideFormState>) => {
    setSlides((prev) => prev.map((s) => (s.number === number ? { ...s, ...patch } : s)));
  };

  const setAllModifier = (applied: boolean) => {
    setSlides((prev) => prev.map((s) => ({ ...s, applyModifier: applied })));
  };

  const setAllResolution = (res: string) => {
    setSlides((prev) => prev.map((s) => ({ ...s, resolution: res })));
  };

  const setAllAspectRatio = (ar: string) => {
    setSlides((prev) => prev.map((s) => ({ ...s, aspectRatio: ar })));
  };

  const setAllThinking = (t: string) => {
    setSlides((prev) => prev.map((s) => ({ ...s, thinking: t })));
  };

  const generateSlide = async (number: number) => {
    const slide = slides.find((s) => s.number === number);
    if (!slide) return;

    updateSlide(number, { error: null });

    const seedNum = slide.seed.trim() === '' ? null : Number(slide.seed);
    if (seedNum != null && (!Number.isFinite(seedNum) || seedNum < 0)) {
      updateSlide(number, { error: 'Invalid seed' });
      return;
    }

    const result = await jobs.startGenerate(
      {
        filename,
        post_number: post.number,
        slide_number: number,
        prompt: slide.prompt,
        apply_modifier: slide.applyModifier,
        resolution: slide.resolution,
        aspect_ratio: slide.aspectRatio,
        seed: seedNum,
        thinking_level: slide.thinking === 'off' ? null : (slide.thinking as 'minimal' | 'high'),
        post_slug: post.slug,
      },
      (res) => {
        setSlides((prev) =>
          prev.map((s) =>
            s.number === number
              ? {
                  ...s,
                  versions: res.all_versions,
                  currentVersion: res.new_version.version,
                  favoriteVersion: res.favorite_version,
                }
              : s,
          ),
        );
      },
    );
    // Errors handled via job state below via useEffect watcher
    if (!result) {
      // handled
    }
  };

  // Watch the global job context — pick up any results/errors that were
  // produced while this component was unmounted (user navigated away mid-generation).
  useEffect(() => {
    setSlides((prev) =>
      prev.map((s) => {
        const key = jobs.jobKey(filename, post.slug, s.number);
        const job = jobs.jobs[key];
        if (!job) return s;

        let next = s;
        if (job.lastError && s.error !== job.lastError) {
          next = { ...next, error: job.lastError };
        }
        const result = job.lastResult;
        if (result) {
          const alreadyHave = s.versions.some(
            (v) => v.version === result.new_version.version,
          );
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
  }, [jobs.jobs, filename, post.slug]);

  const toggleFavorite = async (slideNumber: number, version: number | null) => {
    if (!date) return;
    try {
      const info = await setCarouselFavorite(date, post.slug, slideNumber, version);
      updateSlide(slideNumber, { favoriteVersion: info.favorite_version });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error setting favorite');
    }
  };

  const generateAll = async () => {
    const missing = slides.filter((s) => s.versions.length === 0);
    const total = missing.reduce(
      (sum, s) => sum + costPerImage(pricing, s.resolution, s.thinking),
      0,
    );
    if (missing.length === 0) {
      toast.info('All slides already generated. Regenerate individually if you want.');
      return;
    }
    if (!confirm(`Generate ${missing.length} slides for ${fmtMoney(total)}?`)) return;
    for (const s of missing) {
      await generateSlide(s.number);
    }
  };

  const copyCaption = () => {
    const text = (caption + (hashtags ? `\n\n${hashtags}` : '')).trim();
    navigator.clipboard.writeText(text);
    toast.success('Caption copied');
  };

  const someGenerated = slides.some((s) => s.versions.length > 0);
  const allGenerated = slides.every((s) => s.versions.length > 0);
  const zipUrl = someGenerated && date ? getCarouselZipUrl(date, post.slug) : null;

  // Cost preview for "Generate all" (only missing slides)
  const pendingCost = slides
    .filter((s) => s.versions.length === 0)
    .reduce((sum, s) => sum + costPerImage(pricing, s.resolution, s.thinking), 0);

  const allApplied = slides.every((s) => s.applyModifier);
  const noneApplied = slides.every((s) => !s.applyModifier);

  const commonRes = slides.every((s) => s.resolution === slides[0].resolution)
    ? slides[0].resolution
    : 'mixed';
  const commonAspect = slides.every((s) => s.aspectRatio === slides[0].aspectRatio)
    ? slides[0].aspectRatio
    : 'mixed';
  const commonThinking = slides.every((s) => s.thinking === slides[0].thinking)
    ? slides[0].thinking
    : 'mixed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft size={14} className="mr-1" /> Back to posts
        </Button>
        <div className="text-xs text-muted-foreground font-mono">
          Post {post.number} · {post.slug}
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">
              {post.category}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{post.avatar}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{post.lever}</span>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Caption</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="text-sm mt-1"
            />
          </div>

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
            <Button size="sm" variant="outline" onClick={copyCaption}>
              <Copy size={14} className="mr-2" />
              Copy caption + hashtags
            </Button>
            {zipUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={zipUrl}>
                  <Download size={14} className="mr-2" />
                  Download ZIP {!allGenerated && `(${slides.filter((s) => s.versions.length > 0).length}/${slides.length})`}
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm font-medium">
            {slides.length} {slides.length === 1 ? 'slide' : 'slides'} · master controls (apply to all)
          </span>
          <Button size="sm" onClick={generateAll}>
            <Sparkles size={14} className="mr-2" />
            Generate all missing ({fmtMoney(pendingCost)})
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              id="apply-all"
              checked={allApplied}
              onCheckedChange={(v) => setAllModifier(!!v)}
              data-partial={!allApplied && !noneApplied}
            />
            <Label htmlFor="apply-all" className="text-xs cursor-pointer">
              Modifier
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Resolution:</Label>
            <Select value={commonRes === 'mixed' ? undefined : commonRes} onValueChange={setAllResolution}>
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue placeholder="mixed" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Aspect:</Label>
            <Select value={commonAspect === 'mixed' ? undefined : commonAspect} onValueChange={setAllAspectRatio}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="mixed" />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Thinking:</Label>
            <Select value={commonThinking === 'mixed' ? undefined : commonThinking} onValueChange={setAllThinking}>
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue placeholder="mixed" />
              </SelectTrigger>
              <SelectContent>
                {THINKING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className={`grid gap-4 ${slides.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {slides.map((s) => {
          const key = jobs.jobKey(filename, post.slug, s.number);
          return (
            <SlideCard
              key={s.number}
              slide={s}
              modifier={modifier}
              pricing={pricing}
              isGenerating={jobs.isGenerating(key)}
              filename={filename}
              postSlug={post.slug}
              onChange={(patch) => updateSlide(s.number, patch)}
              onGenerate={() => generateSlide(s.number)}
              onToggleFavorite={(ver) => toggleFavorite(s.number, ver)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Posts list ──────────────────────────────────────────────────────────────

function PostsList({
  posts,
  onSelect,
  generatedMap,
}: {
  posts: PostBrief[];
  onSelect: (post: PostBrief) => void;
  generatedMap: Record<string, number>; // slug → # slides generated
}) {
  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const gen = generatedMap[post.slug] ?? 0;
        return (
          <button
            key={post.number}
            onClick={() => onSelect(post)}
            className="w-full text-left p-4 rounded-lg border border-border hover:border-accent/40 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground">Post {post.number}</span>
              <span className="text-xs text-muted-foreground">
                {gen > 0 ? (
                  <span className="text-green-500">
                    {gen}/{post.slides.length} generated
                  </span>
                ) : (
                  `${post.slides.length} ${post.slides.length === 1 ? 'slide' : 'slides'}`
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground">{post.lever}</span>
            </div>
            <p className="text-sm text-foreground/80 line-clamp-2">
              {post.caption || '(no caption)'}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [outputs, setOutputs] = useState<CarouselOutput[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchCarouselOutputs()
      .then(setOutputs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (o: CarouselOutput) => {
    if (!confirm(`Delete ${o.folder}?`)) return;
    await deleteCarouselOutput(o.date, o.post_slug);
    toast.success('Deleted');
    load();
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
        <p className="text-lg mb-2">No generated carousels yet</p>
        <p className="text-sm">Generate slides in the "New" tab.</p>
      </div>
    );
  }

  const pickVersion = (slide: CarouselOutput['slides'][number]): SlideVersion | null => {
    if (!slide.versions.length) return null;
    if (slide.favorite_version != null) {
      const fav = slide.versions.find((v) => v.version === slide.favorite_version);
      if (fav) return fav;
    }
    return slide.versions[slide.versions.length - 1];
  };

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
                  <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">
                    {o.category}
                  </span>
                )}
                {o.lever && <span className="text-xs text-muted-foreground">{o.lever}</span>}
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {o.slides.length} slides, {o.slides.reduce((n, s) => n + s.versions.length, 0)} versions
                </span>
              </div>
              <p className="text-sm text-foreground/80 line-clamp-2 max-w-xl">{o.caption}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={getCarouselZipUrl(o.date, o.post_slug)}>
                  <Download size={14} className="mr-2" />
                  ZIP
                </a>
              </Button>
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
            {o.slides.map((s) => {
              const v = pickVersion(s);
              if (!v) return null;
              const isFav = s.favorite_version === v.version;
              return (
                <a
                  key={s.slide_number}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded overflow-hidden border border-border bg-black hover:border-accent/40 relative"
                >
                  <img src={v.url} alt={s.label} className="w-full h-auto block" />
                  <div className="text-[10px] text-muted-foreground px-1 py-0.5 text-center">
                    {s.label}
                    {s.versions.length > 1 && ` · v${v.version} of ${s.versions.length}`}
                  </div>
                  {isFav && (
                    <Star
                      size={12}
                      className="absolute top-1 right-1 fill-yellow-400 text-yellow-400"
                    />
                  )}
                </a>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Publish ─────────────────────────────────────────────────────────────────

function PublishTab() {
  const [files, setFiles] = useState<{ filename: string; posts_count: number }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostBrief[]>([]);
  const [outputs, setOutputs] = useState<CarouselOutput[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<{ brief: PostBrief; output: CarouselOutput } | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishCaption, setPublishCaption] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    fetchScoutFiles().then((fs) => {
      setFiles(fs);
      if (fs.length > 0) setSelectedFile(fs[0].filename);
    });
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    setLoading(true);
    setSelectedEntry(null);
    const date = dateFromFilename(selectedFile);
    Promise.all([fetchScoutFilePosts(selectedFile), fetchCarouselOutputs()])
      .then(([briefs, allOutputs]) => {
        setPosts(briefs);
        setOutputs(allOutputs.filter((o) => o.date === date));
      })
      .finally(() => setLoading(false));
  }, [selectedFile]);

  const entries = useMemo(() => {
    return posts
      .map((brief) => {
        const output = outputs.find((o) => o.post_slug === brief.slug);
        return output ? { brief, output } : null;
      })
      .filter((e): e is { brief: PostBrief; output: CarouselOutput } => e !== null);
  }, [posts, outputs]);

  const openPost = (entry: { brief: PostBrief; output: CarouselOutput }) => {
    const caption = [entry.output.caption, entry.output.hashtags].filter(Boolean).join('\n\n');
    setPublishCaption(caption);
    setSelectedEntry(entry);
  };

  const handlePublish = async () => {
    if (!selectedEntry) return;
    setPublishLoading(true);
    try {
      await publishCarouselToInstagram(
        selectedEntry.output.date,
        selectedEntry.output.post_slug,
        publishCaption || undefined,
      );
      toast.success('Publicado en Instagram');
      setSelectedEntry(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error publicando');
    } finally {
      setPublishLoading(false);
    }
  };

  const pickVersion = (slide: CarouselOutput['slides'][number]): SlideVersion | null => {
    if (!slide.versions.length) return null;
    if (slide.favorite_version != null) {
      const fav = slide.versions.find((v) => v.version === slide.favorite_version);
      if (fav) return fav;
    }
    return slide.versions[slide.versions.length - 1];
  };

  const date = selectedFile ? dateFromFilename(selectedFile) : '';

  if (selectedEntry) {
    const { brief, output } = selectedEntry;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
            <ChevronLeft size={14} className="mr-1" /> Back to posts
          </Button>
          <div className="text-xs text-muted-foreground font-mono">
            Post #{brief.number} · {brief.slug}
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-foreground">Post #{brief.number}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-mono text-muted-foreground">{date}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">{brief.category}</span>
            <span className="text-xs text-muted-foreground">{brief.lever}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {output.slides.map((s) => {
              const v = pickVersion(s);
              if (!v) return null;
              const isFav = s.favorite_version === v.version;
              return (
                <a
                  key={s.slide_number}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded overflow-hidden border border-border bg-black hover:border-accent/40 relative"
                >
                  <img src={v.url} alt={s.label} className="w-full h-auto block" />
                  <div className="text-[10px] text-muted-foreground px-1 py-0.5 text-center">{s.label}</div>
                  {isFav && (
                    <Star size={12} className="absolute top-1 right-1 fill-yellow-400 text-yellow-400" />
                  )}
                </a>
              );
            })}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Caption</Label>
            <Textarea
              value={publishCaption}
              onChange={(e) => setPublishCaption(e.target.value)}
              rows={5}
              className="text-sm mt-1"
              placeholder="Caption e hashtags..."
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handlePublish}
              disabled={publishLoading}
              className="bg-pink-500 hover:bg-pink-400 text-white"
            >
              {publishLoading ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Send size={14} className="mr-2" />
              )}
              {publishLoading ? 'Publicando…' : 'Publicar ahora'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Label className="text-xs text-muted-foreground mb-1 block">Scout output</Label>
        <Select value={selectedFile ?? undefined} onValueChange={setSelectedFile}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a Scout file" />
          </SelectTrigger>
          <SelectContent>
            {files.map((f) => (
              <SelectItem key={f.filename} value={f.filename}>
                {f.filename} ({f.posts_count} posts)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">No hay carousels generados para este archivo</p>
          <p className="text-sm">Generá slides en "New from Scout" primero.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(({ brief, output }) => {
            const slideCount = output.slides.filter((s) => s.versions.length > 0).length;
            return (
              <button
                key={brief.number}
                onClick={() => openPost({ brief, output })}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-pink-400/40 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-foreground">Post #{brief.number}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-mono text-muted-foreground">{date}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-accent/40 text-accent">
                      {brief.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{brief.lever}</span>
                  </div>
                  <span className="text-xs text-green-500 shrink-0">
                    {slideCount}/{brief.slides.length} slides
                  </span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2">{brief.caption || '(no caption)'}</p>
                <div className="flex gap-1 mt-2 overflow-hidden">
                  {output.slides.slice(0, 4).map((s) => {
                    const v = pickVersion(s);
                    if (!v) return null;
                    return (
                      <img
                        key={s.slide_number}
                        src={v.url}
                        alt={s.label}
                        className="w-12 h-15 object-cover rounded border border-border"
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Bulk generate (all posts of a Scout file, one config) ────────────────────

function BulkGenerate({
  filename,
  posts,
  pricing,
  onDone,
}: {
  filename: string;
  posts: PostBrief[];
  pricing: PricingInfo | null;
  onDone: () => void;
}) {
  const jobs = useCarouselJobs();
  const date = dateFromFilename(filename);
  const [resolution, setResolution] = useState('2K');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [thinking, setThinking] = useState('off');
  const [applyModifier, setApplyModifier] = useState(true);
  const [generatedBySlug, setGeneratedBySlug] = useState<Record<string, Set<number>>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  const loadGenerated = useCallback(() => {
    fetchCarouselOutputs().then((all) => {
      const map: Record<string, Set<number>> = {};
      all
        .filter((o) => o.date === date)
        .forEach((o) => {
          map[o.post_slug] = new Set(
            o.slides.filter((s) => s.versions.length > 0).map((s) => s.slide_number),
          );
        });
      setGeneratedBySlug(map);
    });
  }, [date]);

  useEffect(() => {
    loadGenerated();
  }, [loadGenerated]);

  const missing = useMemo(() => {
    const list: { post: PostBrief; slide: PostBrief['slides'][number] }[] = [];
    for (const post of posts) {
      const gen = generatedBySlug[post.slug] ?? new Set<number>();
      for (const slide of post.slides) {
        if (!gen.has(slide.number)) list.push({ post, slide });
      }
    }
    return list;
  }, [posts, generatedBySlug]);

  const totalCost = missing.length * costPerImage(pricing, resolution, thinking);

  const run = async () => {
    if (missing.length === 0) {
      toast.info('Ya está todo generado en este archivo.');
      return;
    }
    if (!confirm(`Generar ${missing.length} imágenes de ${posts.length} posts por ${fmtMoney(totalCost)}?`)) return;
    setRunning(true);
    setProgress({ done: 0, total: missing.length, errors: 0 });
    for (const { post, slide } of missing) {
      const res = await jobs.startGenerate({
        filename,
        post_number: post.number,
        slide_number: slide.number,
        prompt: slide.prompt,
        apply_modifier: applyModifier,
        resolution,
        aspect_ratio: aspectRatio,
        seed: null,
        thinking_level: thinking === 'off' ? null : (thinking as 'minimal' | 'high'),
        post_slug: post.slug,
      });
      setProgress((p) => ({ ...p, done: p.done + 1, errors: p.errors + (res ? 0 : 1) }));
    }
    setRunning(false);
    loadGenerated();
    onDone();
    toast.success('Generación masiva terminada.');
  };

  if (posts.length === 0) return null;

  const pct = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <Card className="p-4 space-y-3 border-accent/30">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-sm font-medium">Generar todo el archivo de una</span>
          <p className="text-xs text-muted-foreground">
            {missing.length > 0
              ? `Faltan ${missing.length} imágenes en ${posts.length} posts · misma config para todas`
              : `Todo generado (${posts.length} posts)`}
          </p>
        </div>
        <Button onClick={run} disabled={running || missing.length === 0}>
          {running ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Generando {progress.done}/{progress.total}…
            </>
          ) : (
            <>
              <Sparkles size={14} className="mr-2" />
              Generar todo lo que falta — {missing.length} ({fmtMoney(totalCost)})
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Checkbox id="bulk-mod" checked={applyModifier} onCheckedChange={(v) => setApplyModifier(!!v)} />
          <Label htmlFor="bulk-mod" className="text-xs cursor-pointer">Modifier</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Resolution:</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Aspect:</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASPECT_RATIO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Thinking:</Label>
          <Select value={thinking} onValueChange={setThinking}>
            <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {THINKING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {running && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {progress.done}/{progress.total} generadas{progress.errors > 0 ? ` · ${progress.errors} con error` : ''} · no cierres esta pestaña
          </p>
        </div>
      )}
    </Card>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Carousels() {
  const [tab, setTab] = useState<Tab>('new');
  const [files, setFiles] = useState<{ filename: string; posts_count: number }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostBrief[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostBrief | null>(null);
  const [modifier, setModifier] = useState('');
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedMap, setGeneratedMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchScoutFiles().then((fs) => {
      setFiles(fs);
      if (fs.length > 0) setSelectedFile(fs[0].filename);
    });
    fetchBrandModifier().then(setModifier);
    fetchPricing().then(setPricing).catch(() => setPricing(null));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPosts([]);
      return;
    }
    setLoading(true);
    fetchScoutFilePosts(selectedFile)
      .then(setPosts)
      .catch(() => {
        toast.error('Error loading posts');
        setPosts([]);
      })
      .finally(() => setLoading(false));
    setSelectedPost(null);
    refreshGeneratedMap(selectedFile);
  }, [selectedFile]);

  const refreshGeneratedMap = (filename: string | null) => {
    if (!filename) return;
    fetchCarouselOutputs().then((all) => {
      const date = dateFromFilename(filename);
      const map: Record<string, number> = {};
      all.filter((o) => o.date === date).forEach((o) => {
        map[o.post_slug] = o.slides.filter((s) => s.versions.length > 0).length;
      });
      setGeneratedMap(map);
    });
  };

  const modifierPreview = useMemo(() => {
    if (!modifier) return '';
    return modifier.length > 120 ? modifier.slice(0, 120) + '...' : modifier;
  }, [modifier]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Carousels</h1>
        <p className="text-muted-foreground">
          Turn Scout briefs into Instagram-ready carousel slides via nano-banana-2.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="new">
            <FileText size={14} className="mr-2" />
            New from Scout
          </TabsTrigger>
          <TabsTrigger value="publish">
            <Send size={14} className="mr-2" />
            Publish
          </TabsTrigger>
          <TabsTrigger value="history">
            <ImageIcon size={14} className="mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          {files.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-2">No Scout outputs found</p>
              <p className="text-sm">Run Scout first to generate content briefs.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-55">
                  <Label className="text-xs text-muted-foreground mb-1 block">Scout output</Label>
                  <Select value={selectedFile ?? undefined} onValueChange={setSelectedFile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a Scout file" />
                    </SelectTrigger>
                    <SelectContent>
                      {files.map((f) => (
                        <SelectItem key={f.filename} value={f.filename}>
                          {f.filename} ({f.posts_count} posts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {modifierPreview && (
                  <div className="flex-1 min-w-75">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Brand modifier (prepended when enabled)
                    </Label>
                    <div className="text-[11px] font-mono text-muted-foreground bg-muted/40 rounded border border-border p-2">
                      {modifierPreview}
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
                  <Loader2 size={16} className="animate-spin" /> Loading posts...
                </div>
              ) : selectedPost ? (
                <PostEditor
                  filename={selectedFile!}
                  post={selectedPost}
                  modifier={modifier}
                  pricing={pricing}
                  onBack={() => {
                    setSelectedPost(null);
                    refreshGeneratedMap(selectedFile);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <BulkGenerate
                    key={selectedFile}
                    filename={selectedFile!}
                    posts={posts}
                    pricing={pricing}
                    onDone={() => refreshGeneratedMap(selectedFile)}
                  />
                  <PostsList
                    posts={posts}
                    onSelect={setSelectedPost}
                    generatedMap={generatedMap}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="publish" className="mt-6">
          <PublishTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
