import Link from 'next/link';
import { ExternalLink, TrendingUp } from 'lucide-react';

// TODO: replace with real numbers once MyFXBook tracker has 30+ days of data
const STATS = [
  { label: 'YTD return', value: '+34.7%', accent: true },
  { label: 'Max drawdown', value: '14.2%' },
  { label: 'Win rate', value: '63%' },
  { label: 'Profit factor', value: '1.84' },
];

const MYFXBOOK_URL = '#'; // TODO: paste public MyFXBook tracker URL

export function LivePerformance() {
  return (
    <section id="performance" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/5 px-3 py-1 text-xs font-medium text-neon-bright">
            <TrendingUp className="h-3.5 w-3.5" />
            Live performance
          </div>
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            Real account. <span className="text-neon-bright">Real money.</span> Verifiable.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-secondary">
            The bot runs on a live MT5 account tracked publicly on MyFXBook. No screenshots, no
            cherry-picked weeks — full equity curve and every trade.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm"
            >
              <div className="text-xs uppercase tracking-wide text-ink-muted">{stat.label}</div>
              <div
                className={`mt-2 text-2xl font-bold md:text-3xl ${
                  stat.accent ? 'text-neon-bright' : 'text-ink-primary'
                }`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Equity curve placeholder */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-ink-primary">Equity curve · YTD</div>
                <div className="text-xs text-ink-muted">Updated daily from MyFXBook</div>
              </div>
              <Link
                href={MYFXBOOK_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-electric hover:underline"
              >
                Verify on MyFXBook
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="relative h-64 md:h-80">
            {/* TODO: replace with MyFXBook iframe widget or chart screenshot */}
            <svg
              viewBox="0 0 800 300"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#A5F28C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#A5F28C" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,260 L60,240 L130,255 L210,210 L290,225 L370,170 L450,185 L520,140 L600,155 L680,90 L760,75 L800,60"
                stroke="#A5F28C"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0,260 L60,240 L130,255 L210,210 L290,225 L370,170 L450,185 L520,140 L600,155 L680,90 L760,75 L800,60 L800,300 L0,300 Z"
                fill="url(#curveFill)"
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_48px]" />
            <div className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-ink-muted/60">
              Demo curve · replace with live data
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted/70">
          Past performance is not indicative of future results. Trading involves substantial risk.
        </p>
      </div>
    </section>
  );
}
