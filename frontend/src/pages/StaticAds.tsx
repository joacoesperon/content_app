import { useEffect, useState } from 'react';
import { fetchTemplates, startGeneration, getImageUrl } from '../lib/api';
import { useWebSocket, WsMessage } from '../hooks/useWebSocket';
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { messages, status, reset } = useWebSocket(jobId);

  // Load templates
  useEffect(() => {
    fetchTemplates().then(setTemplates).catch(console.error);
  }, []);

  // Process WebSocket messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    if (lastMsg.type === 'template_done') {
      const folder = lastMsg.folder as string;
      const imgs = lastMsg.images as string[];
      const newImages = imgs.map((filename) => ({
        src: getImageUrl(folder, filename),
        label: `#${lastMsg.template_number} ${lastMsg.template_name} — ${filename}`,
      }));
      setGeneratedImages((prev) => [...prev, ...newImages]);
    }

    if (lastMsg.type === 'status' && lastMsg.status === 'completed') {
      setGenerating(false);
    }
  }, [messages]);

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
    setGeneratedImages([]);
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

  // Progress info from messages
  const progressMessages = messages.filter((m) => m.type === 'progress' || m.type === 'template_done' || m.type === 'template_error');
  const lastProgress = progressMessages[progressMessages.length - 1];
  const completedCount = messages.filter((m) => m.type === 'template_done').length;
  const errorCount = messages.filter((m) => m.type === 'template_error').length;
  const totalTemplates = lastProgress?.total as number || 0;

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

      {/* Progress */}
      {generating && totalTemplates > 0 && (
        <div className="bg-carbon-light rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Progress</h2>
            <span className="text-sm text-gray-mid">
              {completedCount + errorCount} / {totalTemplates}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-carbon rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-neon rounded-full transition-all duration-500"
              style={{ width: `${((completedCount + errorCount) / totalTemplates) * 100}%` }}
            />
          </div>

          {/* Log */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {progressMessages.map((msg, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {msg.type === 'template_done' ? (
                  <CheckCircle size={14} className="text-neon shrink-0" />
                ) : msg.type === 'template_error' ? (
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                ) : (
                  <Loader2 size={14} className="text-electric animate-spin shrink-0" />
                )}
                <span className="text-gray-mid">
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
      {status === 'completed' && (
        <div className="bg-neon/10 border border-neon/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-neon">
          <CheckCircle size={18} />
          <span className="text-sm">
            Generation complete — {completedCount} templates, {generatedImages.length} images
            {errorCount > 0 && `, ${errorCount} errors`}
          </span>
        </div>
      )}

      {/* Generated images */}
      {generatedImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Generated Images</h2>
          <ImageGrid images={generatedImages} />
        </div>
      )}
    </div>
  );
}
