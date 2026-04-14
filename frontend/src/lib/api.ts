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
  return `${BASE}/files/outputs/${folder}/${filename}`;
}

export function getConceptImageUrl(folder: string, filename: string) {
  return `${BASE}/files/concept-outputs/${folder}/${filename}`;
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
}) {
  const res = await fetch(`${BASE}/api/tools/concept_ads/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── Concept Ads — Remix ─────────────────────────────────────────────────────

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
