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

export async function fetchBrandDna() {
  const res = await fetch(`${BASE}/api/tools/static_ads/brand-dna`);
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
