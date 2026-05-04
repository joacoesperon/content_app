import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { CheckoutButton } from '@/components/checkout-button';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(41,121,255,0.18)_0%,rgba(41,121,255,0)_60%)] blur-2xl"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28">
        {/* Eyebrow / live status */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-secondary backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-bright opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
          </span>
          Live on real account · Verified on MyFXBook
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink-primary md:text-6xl lg:text-7xl">
          The bot that trades{' '}
          <span className="text-neon-bright">XAUUSD</span> while you sleep.
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-balance text-lg text-ink-secondary md:text-xl">
          Built on 5 years of verified data.{' '}
          <span className="text-ink-primary">$147 lifetime.</span> Setup in 8 minutes. No coding.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <CheckoutButton size="lg" className="w-full sm:w-auto">
            Get the bot — $147
          </CheckoutButton>
          <Link
            href="#performance"
            className="inline-flex h-14 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-ink-primary transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
          >
            See live performance
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-neon" />
            14-day refund
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-ink-muted/40 sm:inline-block" />
          <span>One-time payment</span>
          <span className="hidden h-1 w-1 rounded-full bg-ink-muted/40 sm:inline-block" />
          <span>Lifetime access</span>
        </div>

        {/* Visual placeholder — video loop del bot ejecutando trades */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-2xl backdrop-blur-sm">
            {/* TODO: replace with <video> autoplay muted loop playsInline of MT5 executing a trade */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-electric/20 backdrop-blur">
                  <div className="h-0 w-0 border-y-8 border-l-[12px] border-y-transparent border-l-white" />
                </div>
                <p className="text-sm text-ink-muted">Loop: bot ejecutando trade XAUUSD en MT5</p>
                <p className="mt-1 text-xs text-ink-muted/60">(reemplazar con video real)</p>
              </div>
            </div>
            {/* Subtle grid overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
