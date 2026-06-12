import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Risk Disclosure',
  description: 'Risk Disclosure for trading with the Jess Trading XAUUSD bot.',
};

export default function RiskDisclosurePage() {
  return (
    <LegalPage title="Risk Disclosure" updated="June 8, 2026">
      <p>
        Trading foreign exchange and CFDs — including XAUUSD (gold) — carries a high level of risk
        and may not be suitable for all investors. Read this disclosure carefully before using the
        Product.
      </p>

      <h2>1. You can lose money</h2>
      <p>
        Leverage can work against you as well as for you. The high degree of leverage available in
        forex and CFD trading can lead to large losses as well as gains. You should not trade with
        money you cannot afford to lose.
      </p>
      <p>
        Depending on your broker and the leverage you use, your losses may exceed your initial
        deposit. Some brokers offer negative balance protection that caps losses at your deposited
        funds, but this is not guaranteed and varies by broker and jurisdiction. It is your
        responsibility to understand your broker&rsquo;s terms before trading.
      </p>

      <h2>2. Past performance is not a promise</h2>
      <p>
        Past performance — including backtest results, demo accounts, and live tracker data — is not
        indicative of future results. Backtests are run on historical data under assumptions that may
        not match live market conditions (spreads, slippage, execution speed, and broker behavior all
        vary). No representation is made that any account will or is likely to achieve profits or
        losses similar to those shown.
      </p>

      <h2>3. The bot is a tool, not advice</h2>
      <p>
        The Jess Trading bot is a software tool that executes a strategy based on configurable
        parameters. It does not constitute investment advice and does not guarantee any outcome. You
        alone are responsible for your trading decisions, capital allocation, risk settings, and
        choice of broker.
      </p>

      <h2>4. Test before you go live</h2>
      <p>
        Before running the bot on a funded account, you should test it on a demo account and ensure
        you understand its behavior, its settings, and the risk it takes per trade. Market conditions,
        broker execution, and configuration changes can all materially affect results.
      </p>

      <h2>5. No regulatory relationship</h2>
      <p>
        Jess Trading is not a broker, fund manager, or registered investment advisor, and does not
        hold or manage your funds. Your capital remains with your own broker at all times.
      </p>

      <p>
        By using the Product you acknowledge that you have read and understood this Risk Disclosure
        and that you accept full responsibility for your own trading.
      </p>
    </LegalPage>
  );
}
