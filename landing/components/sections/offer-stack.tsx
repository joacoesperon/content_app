import { Check } from 'lucide-react';
import { CheckoutButton } from '@/components/checkout-button';

const INCLUDED = [
  { item: 'Lifetime license — pay once, run forever', value: '$197' },
  { item: 'XAUUSD strategy with 5-year verified backtest', value: 'Included' },
  { item: 'Step-by-step setup guide (PDF + 8-min video)', value: '$49' },
  { item: 'Optimized parameter sets for $1k / $5k / $10k accounts', value: '$79' },
  { item: 'Private Telegram support channel', value: '$120/yr' },
  { item: 'Monthly market update video', value: '$60/yr' },
  { item: '14-day refund window — no questions asked', value: '—' },
];

const BONUSES = [
  { item: 'Bonus 1 — Risk Calibration Sheet (Excel)', value: '$29' },
  { item: 'Bonus 2 — 3-part video course on broker + VPS setup', value: '$49' },
  { item: 'Bonus 3 — Affiliate program (earn $58.80 per referral)', value: 'Recurring' },
];

export function OfferStack() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            Everything you get for{' '}
            <span className="text-neon-bright">$147</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-secondary">
            Launch price. Goes to $197 when the early-access window closes.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-sm">
          {/* Header */}
          <div className="border-b border-white/10 bg-electric/5 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-electric">
                  Jess Trading — XAUUSD Bot
                </div>
                <div className="mt-1 text-lg font-semibold text-ink-primary">
                  Lifetime license
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-ink-muted">Today</div>
                <div className="text-3xl font-bold text-ink-primary">$147</div>
              </div>
            </div>
          </div>

          {/* Included */}
          <div className="px-8 py-8">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Included
            </div>
            <ul className="space-y-3">
              {INCLUDED.map(({ item, value }) => (
                <li
                  key={item}
                  className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-bright" />
                    <span className="text-ink-primary">{item}</span>
                  </div>
                  <span className="flex-shrink-0 text-sm text-ink-muted">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bonuses */}
          <div className="border-t border-white/10 bg-neon/[0.02] px-8 py-8">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-neon-bright">
              Free bonuses
            </div>
            <ul className="space-y-3">
              {BONUSES.map(({ item, value }) => (
                <li
                  key={item}
                  className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-bright" />
                    <span className="text-ink-primary">{item}</span>
                  </div>
                  <span className="flex-shrink-0 text-sm text-ink-muted">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total + CTA */}
          <div className="border-t border-white/10 px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-muted">
                  Declared value
                </div>
                <div className="text-lg font-semibold text-ink-secondary line-through">$497</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-ink-muted">Today</div>
                <div className="text-4xl font-bold text-neon-bright">$147</div>
              </div>
            </div>

            <CheckoutButton size="lg" className="w-full">
              Get the bot — $147
            </CheckoutButton>

            <p className="mt-4 text-center text-xs text-ink-muted">
              One-time payment · Lifetime access · 14-day refund window
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
