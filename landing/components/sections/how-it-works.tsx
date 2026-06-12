import { Download, PlugZap, Activity } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Download,
    title: 'Buy & receive',
    description:
      'You get the .ex5 bot file, an 8-min setup video, and the pre-configured settings for all 5 pairs. All in your Whop dashboard, instantly.',
  },
  {
    number: '02',
    icon: PlugZap,
    title: 'Connect to MT5',
    description:
      'Drop the file in your MT5 EA folder. Attach to a chart and load the settings for your pair. The video walks you through each click.',
  },
  {
    number: '03',
    icon: Activity,
    title: 'Bot runs 24/7',
    description:
      'It defines the daily range, places the breakout orders, and manages the exit automatically while the market is open. Your job is just to fund the account and let it run.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            From checkout to first trade in <span className="text-neon-bright">under 10 minutes</span>.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/20"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-widest text-ink-muted">
                  {number}
                </span>
                <Icon className="h-5 w-5 text-neon-bright" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-ink-primary">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
