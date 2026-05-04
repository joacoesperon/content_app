import Link from 'next/link';
import { Download, FileText } from 'lucide-react';

// TODO: replace with real backtest numbers from your 5-year XAUUSD test
const METRICS = [
  { label: 'Period tested', value: '2020 — 2026', sub: '5 years, all market regimes' },
  { label: 'Total return', value: '+412%', sub: 'Compounded' },
  { label: 'Max drawdown', value: '14.2%', sub: 'Worst peak-to-trough' },
  { label: 'Profit factor', value: '1.84', sub: 'Gross profit / gross loss' },
  { label: 'Sharpe ratio', value: '1.37', sub: 'Risk-adjusted return' },
  { label: 'Win rate', value: '63%', sub: 'Of closed trades' },
  { label: 'Avg trade duration', value: '4h 12m', sub: 'Position holding time' },
  { label: 'Trades executed', value: '2,184', sub: 'Across full period' },
];

const BACKTEST_PDF_URL = '#'; // TODO: link to /backtest.pdf once generated

export function BacktestProof() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-ink-secondary">
            <FileText className="h-3.5 w-3.5" />
            5-year backtest
          </div>
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            Backtested across <span className="text-neon-bright">every market regime</span> since 2020.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-secondary">
            Covid crash. Rate hike cycle. Gold's $4,000 break. The strategy held its rules through all of it.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {METRICS.map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</div>
              <div className="mt-2 text-2xl font-bold text-ink-primary md:text-3xl">{value}</div>
              <div className="mt-1 text-xs text-ink-muted">{sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={BACKTEST_PDF_URL}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-ink-primary transition hover:border-white/20 hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Download full backtest PDF
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted/70">
          Backtest results are not a guarantee of future performance. Live performance may differ
          due to spreads, slippage, and broker execution.
        </p>
      </div>
    </section>
  );
}
