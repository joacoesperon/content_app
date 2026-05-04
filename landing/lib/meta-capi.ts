import { createHash } from 'crypto';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;
const API_VERSION = 'v18.0';

function hashSha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface CapiUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface CapiCustomData {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentType?: string;
}

export interface CapiEventInput {
  eventName: 'Purchase' | 'Lead' | 'InitiateCheckout' | 'ViewContent';
  eventId?: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
}

export interface CapiResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export async function sendCapiEvent(input: CapiEventInput): Promise<CapiResult> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[meta-capi] Missing NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN — skipping');
    return { ok: false, status: 0, body: { error: 'missing_config' } };
  }

  const userData: Record<string, unknown> = {};
  if (input.userData.email) userData.em = [hashSha256(input.userData.email)];
  if (input.userData.firstName) userData.fn = [hashSha256(input.userData.firstName)];
  if (input.userData.lastName) userData.ln = [hashSha256(input.userData.lastName)];
  if (input.userData.phone) userData.ph = [hashSha256(input.userData.phone.replace(/\D/g, ''))];
  if (input.userData.fbp) userData.fbp = input.userData.fbp;
  if (input.userData.fbc) userData.fbc = input.userData.fbc;
  if (input.userData.clientIpAddress) userData.client_ip_address = input.userData.clientIpAddress;
  if (input.userData.clientUserAgent) userData.client_user_agent = input.userData.clientUserAgent;

  const customData: Record<string, unknown> = {};
  if (input.customData?.value !== undefined) customData.value = input.customData.value;
  if (input.customData?.currency) customData.currency = input.customData.currency;
  if (input.customData?.contentIds) customData.content_ids = input.customData.contentIds;
  if (input.customData?.contentName) customData.content_name = input.customData.contentName;
  if (input.customData?.contentType) customData.content_type = input.customData.contentType;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error('[meta-capi] Error response:', JSON.stringify(body));
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error('[meta-capi] Request failed:', err);
    return { ok: false, status: 0, body: { error: String(err) } };
  }
}
