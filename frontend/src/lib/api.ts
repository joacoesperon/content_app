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
  thumbnail_path: string;
  meta_ad_id: string;
  meta_creative_id: string;
  status: string;
  error_message: string;
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
