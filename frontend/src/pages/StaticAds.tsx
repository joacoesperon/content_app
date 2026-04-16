import { useEffect, useRef, useState } from 'react';
import { fetchTemplates, startGeneration, getImageUrl, getWebSocketUrl } from '../lib/api';
import { useJob } from '../context/JobContext';
import ImageGrid from '../components/ImageGrid';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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

  // Load templates
  useEffect(() => {
    fetchTemplates().then(setTemplates).catch(console.error);
  }, []);

  // Connect / reconnect WebSocket whenever jobId changes or component mounts with active job
  useEffect(() => {
    if (!jobId) return;

    // If already completed, no need to reconnect
    const lastStatus = [...messages].reverse().find((m) => m.type === 'status');
    if (lastStatus?.status === 'completed' || lastStatus?.status === 'failed') return;

    // Close any existing connection
    wsRef.current?.close();

    const ws = new WebSocket(getWebSocketUrl(jobId));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      // Avoid duplicating history messages that were replayed by the backend
      // We identify replayed messages by checking if an identical message already exists
      // Backend sends full history on reconnect — deduplicate by (type + template_number + status)
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

  // Derive progress info from messages
  const progressMessages = messages.filter(
    (m) => m.type === 'progress' || m.type === 'template_done' || m.type === 'template_error'
  );
  // Deduplicate by message identity for reconnect replays
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

  // Deduplicate generated images too
  const seenImages = new Set<string>();
  const dedupedImages = generatedImages.filter(({ src }) => {
    if (seenImages.has(src)) return false;
    seenImages.add(src);
    return true;
  });

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-2">Static Ad Generator</h1>
      <p className="text-gray-mid mb-8">
        Generate production-ready static ads using Nano Banana 2.
      </p>

      {/* Configuration */}
      <div className="bg-carbon-light rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Templates</h2>
          <button
            onClick={selectAll}
            className="text-sm text-electric hover:text-neon transition-colors"
          >
            {selected.size === templates.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          {templates.map((t) => (
            <button
              key={t.number}
              onClick={() => toggleTemplate(t.number)}
              className={`text-left p-3 rounded-lg border transition-all text-sm ${
                selected.has(t.number)
                  ? 'border-neon/50 bg-neon/10 text-white'
                  : 'border-carbon bg-carbon text-gray-mid hover:border-carbon-light hover:text-gray-light'
              }`}
            >
              <span className="font-mono text-xs text-gray-mid">#{t.number}</span>
              <div className="font-medium truncate">{t.name}</div>
              <div className="text-xs text-gray-mid mt-1">{t.aspect_ratio}</div>
            </button>
          ))}
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-xs text-gray-mid mb-1">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="0.5K">0.5K (fast)</option>
              <option value="1K">1K (test)</option>
              <option value="2K">2K (production)</option>
              <option value="4K">4K (hero)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-mid mb-1">Images per template</label>
            <select
              value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              className="bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-sm text-white"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-mid">
            <span className="text-neon font-mono">${estimatedCost.toFixed(2)}</span> estimated cost
            {' · '}
            {(selected.size || templates.length) * numImages} images
          </div>

          <div className="ml-auto">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                generating
                  ? 'bg-carbon text-gray-mid cursor-not-allowed'
                  : 'bg-electric hover:bg-electric/80 text-white'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Play size={16} /> Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Progress / Log */}
      {dedupedMessages.length > 0 && (
        <div className="bg-carbon-light rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
              {generating ? 'Generating...' : isCompleted ? 'Completed' : 'Run log'}
            </h2>
            <span className="text-sm text-gray-mid">
              {completedCount + errorCount} / {totalTemplates || dedupedMessages.length}
            </span>
          </div>

          {/* Progress bar — only while running */}
          {generating && totalTemplates > 0 && (
            <div className="w-full h-2 bg-carbon rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-neon rounded-full transition-all duration-500"
                style={{ width: `${((completedCount + errorCount) / totalTemplates) * 100}%` }}
              />
            </div>
          )}

          {/* Log */}
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {dedupedMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                {msg.type === 'template_done' ? (
                  <CheckCircle size={13} className="text-neon shrink-0 mt-0.5" />
                ) : msg.type === 'template_error' ? (
                  <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Loader2 size={13} className={`shrink-0 mt-0.5 ${generating ? 'text-electric animate-spin' : 'text-gray-mid'}`} />
                )}
                <span className={msg.type === 'template_error' ? 'text-red-400' : 'text-gray-mid'}>
                  {msg.message as string || `#${msg.template_number} ${msg.template_name}`}
                  {msg.type === 'template_done' && ` — ${(msg.time as number)?.toFixed(1)}s`}
                  {msg.type === 'template_error' && ` — ${msg.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="bg-neon/10 border border-neon/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-neon">
          <CheckCircle size={18} />
          <span className="text-sm">
            Generation complete — {completedCount} templates, {dedupedImages.length} images
            {errorCount > 0 && `, ${errorCount} errors`}
          </span>
        </div>
      )}

      {/* Generated images */}
      {dedupedImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Generated Images</h2>
          <ImageGrid images={dedupedImages} />
        </div>
      )}
    </div>
  );
}
