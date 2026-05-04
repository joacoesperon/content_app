import { Check, X } from 'lucide-react';

const FOR = [
  'You trade XAUUSD manually 4+ hours a day',
  'You have a strategy but break your own rules under pressure',
  'You have capital but no time to chart',
  'You want a system that runs while you sleep',
  'You can verify backtests and live tracking before you trust',
];

const NOT_FOR = [
  "You're looking for get-rich-quick — this isn't it",
  "You won't read the setup guide",
  'Your trading account is under $500',
  "You expect 0% drawdown — that doesn't exist",
  "You're not willing to test on demo first",
];

export function WhoFor() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            Honest filter — <span className="text-neon-bright">is this for you?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-secondary">
            We'd rather lose a sale than create a refund.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* For */}
          <div className="rounded-2xl border border-neon/20 bg-neon/[0.03] p-8">
            <div className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neon-bright">
              <Check className="h-4 w-4" /> Built for you if
            </div>
            <ul className="space-y-4">
              {FOR.map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink-primary">
                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-neon-bright" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not for */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted">
              <X className="h-4 w-4" /> Not for you if
            </div>
            <ul className="space-y-4">
              {NOT_FOR.map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink-secondary">
                  <X className="mt-1 h-4 w-4 flex-shrink-0 text-ink-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
