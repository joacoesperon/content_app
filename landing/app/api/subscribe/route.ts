export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { sendCapiEvent } from '@/lib/meta-capi';
import { randomUUID } from 'crypto';

const MAILERLITE_TOKEN = process.env.MAILERLITE_API_TOKEN;
const MAILERLITE_GROUP_ID = '186716004474161095';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jesstrading.xyz';

async function subscribeToMailerLite(email: string, name?: string) {
  if (!MAILERLITE_TOKEN) return;

  const body: Record<string, unknown> = { email };
  if (name) body.fields = { name };

  const res = await fetch(
    `https://connect.mailerlite.com/api/subscribers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MAILERLITE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[mailerlite] subscribe error:', err);
    return;
  }

  const { data } = await res.json();
  const subscriberId = data?.id;
  if (!subscriberId) return;

  await fetch(
    `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${MAILERLITE_GROUP_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MAILERLITE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function POST(req: NextRequest) {
  let email: string;
  let name: string | undefined;

  try {
    const body = await req.json();
    email = (body.email ?? '').trim().toLowerCase();
    name = body.name?.trim();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  await subscribeToMailerLite(email, name);

  const eventId = randomUUID();
  const fbp = req.cookies.get('_fbp')?.value;
  const fbc = req.cookies.get('_fbc')?.value;

  await sendCapiEvent({
    eventName: 'Lead',
    eventId,
    eventSourceUrl: `${SITE_URL}/#lead-magnet`,
    userData: {
      email,
      ...(name ? { firstName: name.split(' ')[0] } : {}),
      fbp,
      fbc,
      clientIpAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined,
      clientUserAgent: req.headers.get('user-agent') ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
