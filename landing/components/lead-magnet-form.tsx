'use client';

import { useState } from 'react';
import { trackEvent, generateEventId } from '@/lib/pixel';
import { cn } from '@/lib/utils';

export function LeadMagnetForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');

    const eventId = generateEventId();
    trackEvent('Lead', { content_name: 'XAUUSD Guide' }, eventId);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={cn('rounded-2xl border border-neon/30 bg-neon/5 px-6 py-8 text-center', className)}>
        <div className="text-2xl">✓</div>
        <p className="mt-2 font-medium text-neon-bright">Your guide is ready</p>
        <a
          href="/guide.pdf"
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-neon px-6 py-3 text-sm font-semibold text-carbon transition hover:bg-neon-bright"
        >
          Download the guide
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-primary placeholder-ink-muted/50 outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/30"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-xl bg-neon px-6 py-3 text-sm font-semibold text-carbon transition hover:bg-neon-bright disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Get the free guide'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400 sm:col-span-2">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
