import { useEffect, useRef, useState } from 'react';
import { fetchTemplates, startGeneration, getImageUrl, getWebSocketUrl } from '../lib/api';
import { useJob } from '../context/JobContext';
import ImageGrid from '../components/ImageGrid';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Template {
  number: number;
  name: string;
  description: string;
  aspect_ratio: string;
}

export default function StaticAds() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [resolution, setResolution] = useState('1K');
  const [numImages, setNumImages] = useState(4);
  const [error, setError] = useState<string | null>(null);

  const { jobId, messages, generating, generatedImages, setJobId, addMessage, addImages, setGenerating, reset } = useJob();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchTemplates().then(setTemplates).catch(console.error);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const lastStatus = [...messages].reverse().find((m) => m.type === 'status');
    if (lastStatus?.status === 'completed' || lastStatus?.status === 'failed') return;

    wsRef.current?.close();

    const ws = new WebSocket(getWebSocketUrl(jobId));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      addMessage(msg);

      if (msg.type === 'template_done') {
        const folder = msg.folder as string;
        const imgs = msg.images as string[];
        addImages(imgs.map((filename) => ({
          src: getImageUrl(folder, filename),
          label: `#${msg.template_number} ${msg.template_name} — ${filename}`,
        })));
      }

      if (msg.type === 'status' && (msg.status === 'completed' || msg.status === 'failed')) {
        setGenerating(false);
        ws.close();
      }
    };

    ws.onerror = () => setGenerating(false);

    return () => {
      ws.close();
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTemplate = (num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === templates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(templates.map((t) => t.number)));
    }
  };

  const costPerImage: Record<string, number> = { '0.5K': 0.06, '1K': 0.08, '2K': 0.12, '4K': 0.16 };
  const estimatedCost = (selected.size || templates.length) * numImages * (costPerImage[resolution] || 0.08);

  const handleGenerate = async () => {
    setError(null);
    reset();
    setGenerating(true);

    try {
      const result = await startGeneration({
        templates: selected.size > 0 ? Array.from(selected) : undefined,
        resolution,
        num_images: numImages,
        output_format: 'png',
      });

      if (result.error) {
        setError(result.error);
        setGenerating(false);
        return;
      }

      setJobId(result.job_id);
    } catch (e) {
      setError(String(e));
      setGenerating(false);
    }
  };

  const progressMessages = messages.filter(
    (m) => m.type === 'progress' || m.type === 'template_done' || m.type === 'template_error'
  );
  const seenKeys = new Set<string>();
  const dedupedMessages = progressMessages.filter((m) => {
    const key = `${m.type}-${m.template_number}-${m.message ?? ''}-${m.error ?? ''}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const completedCount = dedupedMessages.filter((m) => m.type === 'template_done').length;
  const errorCount = dedupedMessages.filter((m) => m.type === 'template_error').length;
  const lastProgress = dedupedMessages[dedupedMessages.length - 1];
  const totalTemplates = (lastProgress?.total as number) || 0;

  const isCompleted = messages.some((m) => m.type === 'status' && m.status === 'completed');

  const seenImages = new Set<string>();
  const dedupedImages = generatedImages.filter(({ src }) => {
    if (seenImages.has(src)) return false;
    seenImages.add(src);
    return true;
  });

  const progressPct = totalTemplates > 0 ? ((completedCount + errorCount) / totalTemplates) * 100 : 0;

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Static Ad Generator</h1>
      <p className="text-muted-foreground mb-8">
        Generate production-ready static ads using Nano Banana 2.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Templates</CardTitle>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selected.size === templates.length ? 'Deselect all' : 'Select all'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
            {templates.map((t) => (
              <button
                key={t.number}
                onClick={() => toggleTemplate(t.number)}
                className={cn(
                  'text-left p-3 rounded-lg border transition-all text-sm',
                  selected.has(t.number)
                    ? 'border-accent/50 bg-accent/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">#{t.number}</span>
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.aspect_ratio}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-1.5">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5K">0.5K (fast)</SelectItem>
                  <SelectItem value="1K">1K (test)</SelectItem>
                  <SelectItem value="2K">2K (production)</SelectItem>
                  <SelectItem value="4K">4K (hero)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Images per template</Label>
              <Select value={String(numImages)} onValueChange={(v) => setNumImages(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="text-accent font-mono">${estimatedCost.toFixed(2)}</span> estimated cost
              {' · '}
              {(selected.size || templates.length) * numImages} images
            </div>

            <Button onClick={handleGenerate} disabled={generating} className="ml-auto">
              {generating ? (
                <><Loader2 className="animate-spin" /> Generating...</>
              ) : (
                <><Play /> Generate</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {dedupedMessages.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {generating ? 'Generating...' : isCompleted ? 'Completed' : 'Run log'}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedCount + errorCount} / {totalTemplates || dedupedMessages.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {generating && totalTemplates > 0 && (
              <Progress value={progressPct} className="mb-4" />
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {dedupedMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  {msg.type === 'template_done' ? (
                    <CheckCircle size={13} className="text-accent shrink-0 mt-0.5" />
                  ) : msg.type === 'template_error' ? (
                    <AlertCircle size={13} className="text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 size={13} className={cn('shrink-0 mt-0.5', generating ? 'text-primary animate-spin' : 'text-muted-foreground')} />
                  )}
                  <span className={msg.type === 'template_error' ? 'text-destructive' : 'text-muted-foreground'}>
                    {msg.message as string || `#${msg.template_number} ${msg.template_name}`}
                    {msg.type === 'template_done' && ` — ${(msg.time as number)?.toFixed(1)}s`}
                    {msg.type === 'template_error' && ` — ${msg.error}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Alert className="mb-6 border-accent/30 bg-accent/10 text-accent">
          <CheckCircle />
          <AlertDescription className="text-accent">
            Generation complete — {completedCount} templates, {dedupedImages.length} images
            {errorCount > 0 && `, ${errorCount} errors`}
          </AlertDescription>
        </Alert>
      )}

      {dedupedImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Generated Images</h2>
          <ImageGrid images={dedupedImages} />
        </div>
      )}
    </div>
  );
}
