import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { sendCapiEvent } from '@/lib/meta-capi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

// Whop event names that mean "the customer paid". Confirm exact names in Whop dashboard
// when you set up the webhook — adjust this list if needed.
const PURCHASE_EVENTS = new Set([
  'payment.succeeded',
  'payment_succeeded',
  'membership.went_valid',
  'membership_went_valid',
]);

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;

  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  // Whop may prefix with "sha256=" — handle both shapes
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;

  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Whop signature header — confirm exact name when you set up the webhook in Whop.
  // We accept the most common conventions.
  const signature =
    req.headers.get('whop-signature') ||
    req.headers.get('x-whop-signature') ||
    req.headers.get('whop-webhook-signature');

  if (!verifySignature(rawBody, signature)) {
    console.warn('[whop-webhook] Invalid signature');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const eventType = String(event.event ?? event.type ?? event.action ?? '');

  if (!PURCHASE_EVENTS.has(eventType)) {
    return NextResponse.json({ ok: true, ignored: true, eventType }, { status: 200 });
  }

  // Whop payload shape varies — we accept several common keys.
  const data = (event.data ?? event) as Record<string, unknown>;
  const user = (data.user ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;

  const email = String(data.user_email ?? data.email ?? user.email ?? '') || undefined;
  const firstName = String(data.first_name ?? user.first_name ?? '') || undefined;
  const lastName = String(data.last_name ?? user.last_name ?? '') || undefined;

  const rawValue = data.amount ?? data.final_price ?? data.total ?? '147';
  const value = parseFloat(String(rawValue));
  const currency = String(data.currency ?? 'USD').toUpperCase();

  const eventId = String(data.id ?? data.payment_id ?? `whop-${Date.now()}`);
  const fbp = (metadata.fbp as string | undefined) ?? undefined;
  const fbc = (metadata.fbc as string | undefined) ?? undefined;

  const result = await sendCapiEvent({
    eventName: 'Purchase',
    eventId,
    eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL,
    userData: {
      email,
      firstName,
      lastName,
      fbp,
      fbc,
      clientIpAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      clientUserAgent: req.headers.get('user-agent') ?? undefined,
    },
    customData: {
      value,
      currency,
      contentIds: ['jess-trading-bot'],
      contentName: 'Jess Trading XAUUSD Bot',
      contentType: 'product',
    },
  });

  if (!result.ok) {
    console.error('[whop-webhook] CAPI delivery failed:', result.body);
    // Still return 200 — we don't want Whop to retry and double-fire.
    // Failure is logged for follow-up.
  }

  return NextResponse.json({ ok: true, eventId }, { status: 200 });
}

// Allow Whop to ping the URL with GET to verify it's reachable
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'whop-webhook' });
}
