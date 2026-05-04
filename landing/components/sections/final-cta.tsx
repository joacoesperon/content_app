import { Clock } from 'lucide-react';
import { CheckoutButton } from '@/components/checkout-button';

export function FinalCTA() {
  return (
    <section className="relative px-6 py-28">
      {/* Big radial glow behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(41,121,255,0.15)_0%,rgba(41,121,255,0)_60%)] blur-2xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/5 px-3 py-1 text-xs font-medium text-electric">
          <Clock className="h-3.5 w-3.5" />
          Launch price ends soon
        </div>

        <h2 className="text-balance text-4xl font-bold leading-[1.1] text-ink-primary md:text-6xl">
          Stop being the reason your strategy fails.
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-ink-secondary">
          $147 today.{' '}
          <span className="text-ink-primary">$197</span> when launch ends. Lifetime access either way.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <CheckoutButton size="lg" className="w-full sm:w-auto">
            Get the bot — $147
          </CheckoutButton>
        </div>

        <p className="mt-6 text-xs text-ink-muted">
          Secure checkout via Whop · 14-day refund · Instant download
        </p>
      </div>
    </section>
  );
}
