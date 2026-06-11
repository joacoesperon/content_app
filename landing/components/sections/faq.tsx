import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Will the bot work if the market changes?',
    a: 'It runs a range breakout strategy — it defines the daily range during set hours and trades the breakout, the same logic in any regime. It was backtested through 2020 (Covid crash), 2022 (rate hikes), and 2024-2026. It risks a fixed 1% of your balance per trade by default, adjustable via the RiskPercent setting.',
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
    a: '$300 minimum. The bot risks 1% of your balance per trade by default — you can adjust that via the RiskPercent setting to match your account size and risk tolerance.',
  },
  {
    q: "What's the drawdown?",
    a: 'Risk is capped at 1% of your balance per trade by default, so drawdown depends on your settings and market conditions. Full backtest figures are in the product description. I\'d rather you not trust a number — that\'s what the 14-day refund is for: try it on a small account and judge for yourself.',
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
    a: 'It works on XAUUSD plus 4 major forex pairs (EURUSD, GBPUSD, USDJPY, EURJPY), each with pre-configured settings. One-time payment vs subscription. Transparent rule-based logic — you can see exactly what it does, no black box. And a 14-day refund if it\'s not for you.',
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
