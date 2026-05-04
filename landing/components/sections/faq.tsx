import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Will the bot work if the market changes?',
    a: 'The strategy was backtested across 2020 (Covid crash), 2022 (rate hikes), and 2024-2026 (XAUUSD record highs). It uses adaptive position sizing, not fixed levels. The 5-year backtest is downloadable above.',
  },
  {
    q: 'Do I need coding knowledge?',
    a: 'No. Drop the .ex5 file in your MT5 folder, attach to a XAUUSD chart. The 8-minute video walks you through every click.',
  },
  {
    q: 'What broker do I need?',
    a: 'Any broker that allows MT5 + Expert Advisors and offers XAUUSD (gold) with reasonable spreads. A recommended brokers list is included inside the buyer area.',
  },
  {
    q: 'What is the minimum capital?',
    a: '$500 minimum. Optimal is $2,000+. The Risk Calibration Sheet bonus shows you exactly which parameter set to use for your account size.',
  },
  {
    q: "What's the drawdown?",
    a: 'Max historical drawdown over 5 years of backtest is 14.2%. Live performance is published on MyFXBook (linked above) — verify it yourself before you buy.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes — 14 days, no questions asked. Refund button inside Whop. We\'d rather lose a sale than create a bad customer.',
  },
  {
    q: 'Is this signals or a bot?',
    a: 'It\'s a bot. It executes trades automatically on your account. No signals to copy manually, no group chats to watch.',
  },
  {
    q: 'What if I have multiple accounts?',
    a: 'One license = one MT5 instance. If you need additional licenses, contact support — extras are 50% off.',
  },
  {
    q: 'How is this different from other bots out there?',
    a: 'Built specifically for XAUUSD (most bots are forex-generic). Lifetime payment vs subscription. Live MyFXBook tracker (vs cherry-picked screenshots). 40% affiliate commission means real users are incentivized to share real results.',
  },
  {
    q: 'Will Jess Trading still be around in 5 years?',
    a: 'I\'m a solo founder. The product is the .ex5 file you download — it\'s yours forever even if the company doesn\'t exist. Updates are pushed via the private Telegram channel.',
  },
];

export function FAQ() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            Frequently asked questions.
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] transition-colors open:border-white/20 open:bg-white/[0.04]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 list-none">
                <span className="font-semibold text-ink-primary">{faq.q}</span>
                <Plus className="h-5 w-5 flex-shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-5 text-ink-secondary">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
