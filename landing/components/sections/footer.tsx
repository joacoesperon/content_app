import Link from 'next/link';

const LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund-policy', label: 'Refund policy' },
  { href: '/risk-disclosure', label: 'Risk disclosure' },
  { href: 'https://www.instagram.com/jesstrading/', label: 'Instagram', external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-bold text-ink-primary">Jess Trading</div>
            <div className="mt-1 text-sm text-ink-muted">
              The future of trading is automated.
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-secondary">
            {LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener"
                  className="hover:text-ink-primary"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="hover:text-ink-primary">
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        {/* Risk disclosure */}
        <div className="mt-10 border-t border-white/5 pt-8">
          <p className="text-xs leading-relaxed text-ink-muted/80">
            <span className="font-semibold text-ink-secondary">Risk Disclosure.</span> Trading
            foreign exchange and CFDs (including XAUUSD) carries a high level of risk and may not
            be suitable for all investors. Leverage can work against you as well as for you. Past
            performance — including backtest results, demo accounts, and live tracker data — is not
            indicative of future results. The Jess Trading bot is a software tool that executes a
            strategy based on configurable parameters; it does not constitute investment advice.
            You alone are responsible for your trading decisions, capital allocation, and broker
            selection. Before using the bot on a funded account, you should test it on a demo
            account and ensure you understand its behavior. Do not trade with money you cannot
            afford to lose.
          </p>
          <p className="mt-6 text-xs text-ink-muted/60">
            © {new Date().getFullYear()} Jess Trading. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
