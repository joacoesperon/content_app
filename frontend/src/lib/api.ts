const BASE = '';

export async function fetchTools() {
  const res = await fetch(`${BASE}/api/tools`);
  return res.json();
}

export async function fetchTemplates() {
  const res = await fetch(`${BASE}/api/tools/static_ads/templates`);
  return res.json();
}

export async function fetchPrompts() {
  const res = await fetch(`${BASE}/api/tools/static_ads/prompts`);
  return res.json();
}

export async function fetchOutputs() {
  const res = await fetch(`${BASE}/api/tools/static_ads/outputs`);
  return res.json();
}

export async function startGeneration(opts: {
  templates?: number[];
  resolution?: string;
  num_images?: number;
  output_format?: string;
}) {
  const res = await fetch(`${BASE}/api/tools/static_ads/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export async function fetchJobStatus(jobId: string) {
  const res = await fetch(`${BASE}/api/tools/static_ads/jobs/${jobId}`);
  return res.json();
}

export function getWebSocketUrl(jobId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/tools/static_ads/ws/${jobId}`;
}

export function getImageUrl(folder: string, filename: string) {
  return `${BASE}/outputs/static_ads/${folder}/${filename}`;
}

export function getConceptImageUrl(folder: string, filename: string) {
  return `${BASE}/outputs/concept_ads/${folder}/${filename}`;
}

export function getConceptWsUrl(jobId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/tools/concept_ads/ws/${jobId}`;
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export async function fetchBrandDna() {
  const res = await fetch(`${BASE}/api/tools/brand/dna`);
  return res.json();
}

export async function updateBrandSection(section: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/tools/brand/dna/${section}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Update error');
  }
  return res.json();
}

export async function fetchBrandMedia(type: string, productId = '') {
  const params = new URLSearchParams({ type });
  if (productId) params.set('product_id', productId);
  const res = await fetch(`${BASE}/api/tools/brand/media?${params}`);
  return res.json();
}

export async function uploadBrandMedia(type: string, file: File, productId = '') {
  const params = new URLSearchParams({ type });
  if (productId) params.set('product_id', productId);
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/tools/brand/media?${params}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Upload error');
  }
  return res.json();
}

export async function deleteBrandMedia(type: string, filename: string, productId = '') {
  const params = new URLSearchParams();
  if (productId) params.set('product_id', productId);
  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(`${BASE}/api/tools/brand/media/${type}/${filename}${qs}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Delete error');
  }
  return res.json();
}

// ─── Brand — Reference Ads Library ───────────────────────────────────────────

export async function fetchReferenceAds() {
  const res = await fetch(`${BASE}/api/tools/brand/reference-ads`);
  return res.json();
}

export async function uploadReferenceAd(file: File, label = '') {
  const params = new URLSearchParams();
  if (label) params.set('label', label);
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/tools/brand/reference-ads?${params}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Upload error');
  }
  return res.json();
}

export async function updateReferenceAdLabel(filename: string, label: string) {
  const res = await fetch(`${BASE}/api/tools/brand/reference-ads/${filename}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Update error');
  }
  return res.json();
}

export async function deleteReferenceAd(filename: string) {
  const res = await fetch(`${BASE}/api/tools/brand/reference-ads/${filename}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Delete error');
  }
  return res.json();
}

// ─── Brand DNA — Raw JSON ─────────────────────────────────────────────────────

export async function fetchBrandDnaRaw() {
  const res = await fetch(`${BASE}/api/tools/brand/dna/raw`);
  return res.json();
}

export async function updateBrandDnaRaw(jsonStr: string) {
  const res = await fetch(`${BASE}/api/tools/brand/dna/raw`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json_str: jsonStr }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Save error');
  }
  return res.json();
}

export async function fetchContentMix() {
  const res = await fetch(`${BASE}/api/tools/brand/content-mix`);
  return res.json() as Promise<{ content: string }>;
}

export async function updateContentMix(content: string) {
  const res = await fetch(`${BASE}/api/tools/brand/content-mix`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Save error');
  }
  return res.json();
}


// ─── Reels Mix ────────────────────────────────────────────────────────────────

export async function fetchReelsMix() {
  const res = await fetch(`${BASE}/api/tools/brand/reels-mix`);
  return res.json() as Promise<{ content: string }>;
}

export async function updateReelsMix(content: string) {
  const res = await fetch(`${BASE}/api/tools/brand/reels-mix`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Save error');
  }
  return res.json();
}


// ─── Mascot ───────────────────────────────────────────────────────────────────

export interface MascotTone {
  id: string;
  label: string;
  use_when: string;
}

export interface MascotRef {
  filename: string;
  url: string;
  tag: string;
  is_base: boolean;
}

export interface Mascot {
  name: string;
  visual_description: string;
  tones: MascotTone[];
  expressions: string[];
  catchphrases: string[];
  references: { filename: string; tag: string; is_base: boolean }[];
}

export async function fetchMascot(): Promise<Mascot> {
  const res = await fetch(`${BASE}/api/tools/brand/mascot`);
  return res.json();
}

export async function updateMascot(data: Partial<Mascot>): Promise<Mascot> {
  const res = await fetch(`${BASE}/api/tools/brand/mascot`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Save error');
  return res.json();
}

export async function fetchMascotRefs(): Promise<MascotRef[]> {
  const res = await fetch(`${BASE}/api/tools/brand/mascot/refs`);
  return res.json();
}

export async function uploadMascotRef(file: File, tag = '', isBase = false): Promise<MascotRef> {
  const params = new URLSearchParams({ tag, is_base: String(isBase) });
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/api/tools/brand/mascot/refs?${params}`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('Upload error');
  return res.json();
}

export async function patchMascotRef(filename: string, patch: { tag?: string; is_base?: boolean }) {
  const res = await fetch(`${BASE}/api/tools/brand/mascot/refs/${encodeURIComponent(filename)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Update error');
  return res.json();
}

export async function deleteMascotRef(filename: string) {
  const res = await fetch(`${BASE}/api/tools/brand/mascot/refs/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Delete error');
}

export async function generateMascotImage(opts: {
  description?: string;
  filename?: string;
  tag?: string;
  is_base?: boolean;
  aspect_ratio?: string;
}): Promise<MascotRef> {
  const res = await fetch(`${BASE}/api/tools/brand/mascot/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Generation error');
  }
  return res.json();
}

export async function editMascotRef(opts: {
  source_filename: string;
  prompt: string;
  new_filename?: string;
  tag?: string;
  is_base?: boolean;
  aspect_ratio?: string;
}): Promise<MascotRef> {
  const res = await fetch(`${BASE}/api/tools/brand/mascot/edit-ref`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Remix error');
  }
  return res.json();
}


// ─── Brand Products ───────────────────────────────────────────────────────────

export async function fetchBrandProducts() {
  const res = await fetch(`${BASE}/api/tools/brand/dna/products`);
  return res.json();
}

export async function createBrandProduct(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/tools/brand/dna/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Create error');
  }
  return res.json();
}

export async function updateBrandProduct(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/tools/brand/dna/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Update error');
  }
  return res.json();
}

export async function deleteBrandProduct(id: string) {
  const res = await fetch(`${BASE}/api/tools/brand/dna/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Delete error');
  }
  return res.json();
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

export async function fetchAvatars() {
  const res = await fetch(`${BASE}/api/tools/avatars/`);
  return res.json();
}

export async function createAvatar(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/tools/avatars/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Create error');
  }
  return res.json();
}

export async function updateAvatar(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/tools/avatars/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Update error');
  }
  return res.json();
}

export async function deleteAvatar(id: string) {
  const res = await fetch(`${BASE}/api/tools/avatars/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function buildAvatarPrompt(data: { product?: string; context?: string }) {
  const res = await fetch(`${BASE}/api/tools/avatars/build-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function parseAvatars(raw: string) {
  const res = await fetch(`${BASE}/api/tools/avatars/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Parse error');
  }
  return res.json();
}

// ─── Concept Ads — Formats ────────────────────────────────────────────────────

export async function fetchFormats() {
  const res = await fetch(`${BASE}/api/tools/concept_ads/formats`);
  return res.json();
}

// ─── Concept Ads — Manual Planner ────────────────────────────────────────────

export async function buildConceptPrompt(data: {
  avatar_ids: string[];
  format_ids: string[];
  count: number;
  aspect_ratio: string;
  product_id?: string;
  use_product_images?: boolean;
  use_brand_dna?: boolean;
  offer_cta?: string;
}) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/build-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Build prompt error');
  }
  return res.json();
}

export async function parsePlan(raw: string) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/parse-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Parse error');
  }
  return res.json();
}

export async function startConceptGeneration(data: {
  concepts: unknown[];
  resolution: string;
  num_images: number;
  output_format?: string;
  use_brand_modifier?: boolean;
}) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── Concept Ads — Remix ─────────────────────────────────────────────────────

export async function prepareReference(relativePath: string) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/prepare-reference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ relative_path: relativePath }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Error preparing reference');
  }
  return res.json();
}

export async function uploadReference(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/tools/concept_ads/upload-reference`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Upload error');
  }
  return res.json();
}

export async function startRemix(data: {
  reference_path: string;
  instructions: string;
  count: number;
  aspect_ratio: string;
  resolution: string;
  output_format?: string;
  use_brand_modifier?: boolean;
  use_reference_ads?: boolean;
  product_id?: string;
  avatar_id?: string;
}) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/remix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── Concept Ads — Outputs ────────────────────────────────────────────────────

export async function fetchConceptOutputs() {
  const res = await fetch(`${BASE}/api/tools/concept_ads/outputs`);
  return res.json();
}

export async function deleteConceptOutput(folder: string) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/outputs/${folder}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Delete error');
  }
  return res.json();
}

// ─── Scout ────────────────────────────────────────────────────────────────────

export async function runScout(
  prompt: string,
  onEvent: (event: Record<string, unknown>) => void,
): Promise<void> {
  const response = await fetch(`${BASE}/api/tools/scout/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Error ejecutando Scout');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export async function fetchScoutHistory(): Promise<{ filename: string; content: string }[]> {
  const res = await fetch(`${BASE}/api/tools/scout/history`);
  return res.json();
}


// ─── Director ─────────────────────────────────────────────────────────────────

export async function runDirector(
  prompt: string,
  onEvent: (event: Record<string, unknown>) => void,
): Promise<void> {
  const response = await fetch(`${BASE}/api/tools/director/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Error running Director');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export async function fetchDirectorHistory(): Promise<{ filename: string; content: string }[]> {
  const res = await fetch(`${BASE}/api/tools/director/history`);
  return res.json();
}


// ─── Reels ────────────────────────────────────────────────────────────────────

const REELS = `${BASE}/api/tools/reels`;

export interface SceneBriefData {
  number: number;
  setting: string;
  expression: string;
  tone_id: string;
  dialogue: string;
  animation_hint: string;
}

export interface ReelBrief {
  number: number;
  category: string;
  avatar: string;
  lever: string;
  concept: string;
  caption: string;
  total_length: string;
  voice_direction: string;
  scenes: SceneBriefData[];
  hashtags: string;
  rationale: string;
  slug: string;
}

export interface SceneVersion {
  version: number;
  image_filename: string | null;
  image_url: string | null;
  video_filename: string | null;
  video_url: string | null;
  setting: string;
  expression: string;
  tone_id: string;
  dialogue: string;
  animation_hint: string;
  image_prompt_used: string;
  video_prompt_used: string;
  refs_used: string[];
  aspect_ratio: string;
  generated_at: string;
}

export interface SceneInfo {
  scene_number: number;
  versions: SceneVersion[];
  favorite_version: number | null;
}

export interface ReelOutput {
  folder: string;
  date: string;
  reel_slug: string;
  reel_number: number | null;
  category: string;
  avatar: string;
  lever: string;
  concept: string;
  caption: string;
  voice_direction: string;
  hashtags: string;
  scenes: SceneInfo[];
  final_url: string | null;
}

export interface ReelsPricing {
  image_per_scene: number;
  video_per_scene: number;
  estimated_per_reel_3_scenes: number;
  estimated_per_reel_4_scenes: number;
}

export async function fetchDirectorFiles(): Promise<{ filename: string; reels_count: number }[]> {
  const res = await fetch(`${REELS}/director-files`);
  if (!res.ok) throw new Error('Error loading director files');
  return res.json();
}

export async function fetchDirectorFileReels(filename: string): Promise<ReelBrief[]> {
  const res = await fetch(`${REELS}/director-files/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error('Error loading reels');
  return res.json();
}

export async function fetchReelsPricing(): Promise<ReelsPricing> {
  const res = await fetch(`${REELS}/pricing`);
  if (!res.ok) throw new Error('Error loading pricing');
  return res.json();
}

export interface ReelSceneResult {
  scene_number: number;
  new_version: SceneVersion;
  all_versions: SceneVersion[];
  favorite_version: number | null;
}

export async function generateReelSceneImage(payload: {
  filename: string;
  reel_number: number;
  scene_number: number;
  setting: string;
  expression: string;
  aspect_ratio: string;
  extra_image_prompt?: string;
  ref_filename?: string | null;
  prompt_override?: string | null;
}): Promise<ReelSceneResult> {
  const res = await fetch(`${REELS}/generate-scene-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Image generation error');
  }
  return res.json();
}

export async function animateReelScene(payload: {
  filename: string;
  reel_number: number;
  scene_number: number;
  version: number;
  dialogue: string;
  animation_hint: string;
  tone_id: string;
  aspect_ratio: string;
  prompt_override?: string | null;
  auto_fix?: boolean;
}): Promise<ReelSceneResult> {
  const res = await fetch(`${REELS}/animate-scene`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Animation error');
  }
  return res.json();
}

export async function previewReelImagePrompt(payload: {
  setting: string;
  expression: string;
  extra_image_prompt?: string;
}): Promise<{ prompt: string }> {
  const res = await fetch(`${REELS}/preview-image-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Preview error');
  return res.json();
}

export async function previewReelVideoPrompt(payload: {
  dialogue: string;
  animation_hint: string;
  tone_id: string;
}): Promise<{ prompt: string }> {
  const res = await fetch(`${REELS}/preview-video-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Preview error');
  return res.json();
}

export async function fetchReelOutputs(): Promise<ReelOutput[]> {
  const res = await fetch(`${REELS}/outputs`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchReelOutput(date: string, slug: string): Promise<ReelOutput | null> {
  const res = await fetch(`${REELS}/outputs/${encodeURIComponent(date)}/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function setReelFavorite(
  date: string,
  reelSlug: string,
  sceneNumber: number,
  version: number | null,
): Promise<SceneInfo> {
  const res = await fetch(`${REELS}/set-favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, reel_slug: reelSlug, scene_number: sceneNumber, version }),
  });
  if (!res.ok) throw new Error('Set favorite error');
  return res.json();
}

export async function renderReelFinal(date: string, reelSlug: string): Promise<{ final_url: string; final_filename: string }> {
  const res = await fetch(`${REELS}/render-final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, reel_slug: reelSlug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Render error');
  }
  return res.json();
}

export async function deleteReelOutput(date: string, slug: string): Promise<void> {
  const res = await fetch(`${REELS}/outputs/${encodeURIComponent(date)}/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Delete error');
}


// ─── Carousels ────────────────────────────────────────────────────────────────

const CAR = `${BASE}/api/tools/carousels`;

export interface SlideBrief {
  number: number;
  label: string;
  prompt: string;
}

export interface PostBrief {
  number: number;
  category: string;
  avatar: string;
  lever: string;
  caption: string;
  slides: SlideBrief[];
  hashtags: string;
  rationale: string;
  slug: string;
}

export interface SlideVersion {
  version: number;
  filename: string;
  url: string;
  prompt_used: string;
  apply_modifier: boolean;
  resolution: string;
  aspect_ratio: string;
  seed: number | null;
  thinking_level: 'minimal' | 'high' | null;
  generated_at: string;
}

export interface SlideInfo {
  slide_number: number;
  label: string;
  versions: SlideVersion[];
  favorite_version: number | null;
}

export interface GenerateSlideResponse {
  slide_number: number;
  label: string;
  new_version: SlideVersion;
  all_versions: SlideVersion[];
  favorite_version: number | null;
}

export interface CarouselOutput {
  folder: string;
  date: string;
  post_slug: string;
  post_number: number | null;
  category: string;
  avatar: string;
  lever: string;
  caption: string;
  hashtags: string;
  slides: SlideInfo[];
}

export interface PricingInfo {
  base_per_image: number;
  resolution_multipliers: Record<string, number>;
  thinking_high_extra: number;
  thinking_minimal_extra: number;
  web_search_extra: number;
}

export async function fetchScoutFiles(): Promise<{ filename: string; posts_count: number }[]> {
  const res = await fetch(`${CAR}/scout-files`);
  if (!res.ok) throw new Error('Error cargando archivos de Scout');
  return res.json();
}

export async function fetchScoutFilePosts(filename: string): Promise<PostBrief[]> {
  const res = await fetch(`${CAR}/scout-files/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error('Error cargando posts');
  return res.json();
}

export async function fetchBrandModifier(): Promise<string> {
  const res = await fetch(`${CAR}/modifier`);
  if (!res.ok) return '';
  const data = await res.json();
  return data.modifier ?? '';
}

export async function fetchPricing(): Promise<PricingInfo> {
  const res = await fetch(`${CAR}/pricing`);
  if (!res.ok) throw new Error('Error cargando pricing');
  return res.json();
}

export async function generateCarouselSlide(payload: {
  filename: string;
  post_number: number;
  slide_number: number;
  prompt: string;
  apply_modifier: boolean;
  resolution: string;
  aspect_ratio: string;
  seed?: number | null;
  thinking_level?: 'minimal' | 'high' | null;
}): Promise<GenerateSlideResponse> {
  const res = await fetch(`${CAR}/generate-slide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Error generando slide');
  }
  return res.json();
}

export async function fetchCarouselOutputs(): Promise<CarouselOutput[]> {
  const res = await fetch(`${CAR}/outputs`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCarouselOutput(
  date: string,
  slug: string,
): Promise<CarouselOutput | null> {
  const res = await fetch(
    `${CAR}/outputs/${encodeURIComponent(date)}/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

export async function setCarouselFavorite(
  date: string,
  postSlug: string,
  slideNumber: number,
  version: number | null,
): Promise<SlideInfo> {
  const res = await fetch(`${CAR}/set-favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, post_slug: postSlug, slide_number: slideNumber, version }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Error marcando favorita');
  }
  return res.json();
}

export function getCarouselZipUrl(date: string, slug: string): string {
  return `${CAR}/outputs/${encodeURIComponent(date)}/${encodeURIComponent(slug)}/zip`;
}

export async function deleteCarouselOutput(date: string, slug: string): Promise<void> {
  const res = await fetch(
    `${CAR}/outputs/${encodeURIComponent(date)}/${encodeURIComponent(slug)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Error borrando carousel');
}


// ─── Meta Ads ─────────────────────────────────────────────────────────────────

const META = `${BASE}/api/tools/meta_ads`;

async function _json<T>(res: Response, errMsg = 'Request error'): Promise<T> {
  if (!res.ok) {
    let detail = errMsg;
    try {
      const err = await res.json();
      detail = err.detail ?? errMsg;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

export interface MetaSettings {
  access_token: string;
  access_token_masked: string;
  ad_account_id: string;
  ad_account_name: string;
  page_id: string;
  page_name: string;
  configured: boolean;
}

export interface MetaAdAccount {
  id: string;
  account_id?: string;
  name: string;
  currency?: string;
  account_status?: number;
}

export interface MetaPage {
  id: string;
  name: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
}

export interface MetaBatch {
  id: string;
  name: string;
  created_at: string;
  campaign_id: string;
  campaign_name: string;
  ad_set_id: string;
  ad_set_name: string;
  primary_texts: string[];
  headlines: string[];
  descriptions: string[];
  cta_type: string;
  url: string;
  display_link: string;
  launch_as_paused: boolean;
  enhancements_enabled: boolean;
  status: string;
  ads_created: number;
  ads_errored: number;
  error_log: string[];
}

export interface MetaCreative {
  id: string;
  batch_id: string;
  filename: string;
  ad_name: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_path: string;
  file_size: number;
  thumbnail_path: string;
  meta_ad_id: string;
  meta_creative_id: string;
  status: string;
  error_message: string;
  created_at: string;
}

export async function fetchMetaSettings(): Promise<MetaSettings> {
  return _json(await fetch(`${META}/settings`), 'Error loading settings');
}

export async function saveMetaSettings(data: Partial<MetaSettings> & { access_token?: string }): Promise<MetaSettings> {
  const res = await fetch(`${META}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return _json(res, 'Error saving settings');
}

export async function fetchMetaAccounts(): Promise<MetaAdAccount[]> {
  return _json(await fetch(`${META}/accounts`), 'Error loading accounts');
}

export async function fetchMetaPages(): Promise<MetaPage[]> {
  return _json(await fetch(`${META}/pages`), 'Error loading pages');
}

export async function fetchMetaCampaigns(): Promise<MetaCampaign[]> {
  return _json(await fetch(`${META}/campaigns`), 'Error loading campaigns');
}

export async function fetchMetaAdSets(campaignId: string): Promise<MetaAdSet[]> {
  const qs = new URLSearchParams({ campaign_id: campaignId });
  return _json(await fetch(`${META}/adsets?${qs}`), 'Error loading ad sets');
}

export async function createMetaAdSet(data: {
  campaign_id: string;
  source_ad_set_id: string;
  name: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${META}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return _json(res, 'Error creating ad set');
}

export async function createMetaBatch(name: string): Promise<MetaBatch> {
  const res = await fetch(`${META}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return _json(res, 'Error creating batch');
}

export async function fetchMetaBatches(): Promise<MetaBatch[]> {
  return _json(await fetch(`${META}/batches`), 'Error loading batches');
}

export async function fetchMetaBatch(id: string): Promise<{ batch: MetaBatch; creatives: MetaCreative[] }> {
  return _json(await fetch(`${META}/batches/${id}`), 'Error loading batch');
}

export async function updateMetaBatch(id: string, updates: Partial<MetaBatch>): Promise<MetaBatch> {
  const res = await fetch(`${META}/batches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return _json(res, 'Error updating batch');
}

export async function uploadMetaCreatives(batchId: string, files: File[]): Promise<{ creatives: MetaCreative[] }> {
  const form = new FormData();
  form.append('batch_id', batchId);
  files.forEach((f) => form.append('files', f));
  const res = await fetch(`${META}/upload`, { method: 'POST', body: form });
  return _json(res, 'Error uploading files');
}

export async function renameMetaCreative(creativeId: string, adName: string): Promise<MetaCreative> {
  const res = await fetch(`${META}/creatives/${creativeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ad_name: adName }),
  });
  return _json(res, 'Error renaming creative');
}

export async function uploadMetaCreativeThumbnail(creativeId: string, file: File): Promise<MetaCreative> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${META}/creatives/${creativeId}/thumbnail`, {
    method: 'POST',
    body: form,
  });
  return _json(res, 'Error uploading thumbnail');
}

export async function launchMetaBatch(batchId: string): Promise<{
  batch_id: string;
  status: string;
  ads_created: number;
  ads_errored: number;
  error_log: string[];
}> {
  const res = await fetch(`${META}/launch/${batchId}`, { method: 'POST' });
  return _json(res, 'Error launching batch');
}
